import { describe, expect, it } from 'vitest';
import { checkProgress, estimateClockOffset, trustedOfflineTime, type ProgressLimits } from './exercise';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

describe('estimateClockOffset', () => {
  it('computes rtt and offset from one sample', () => {
    // device clock is 5 s behind the server; 200 ms round trip
    expect(estimateClockOffset([{ sentAt: 10_000, serverTime: 15_100, receivedAt: 10_200 }])).toEqual({
      offsetMs: 5_000,
      rttMs: 200,
    });
  });

  it('trusts the sample with the shortest round trip', () => {
    const samples = [
      { sentAt: 0, serverTime: 5_900, receivedAt: 1_000 }, // slow: rtt 1000
      { sentAt: 2_000, serverTime: 7_040, receivedAt: 2_080 }, // fast: rtt 80, offset 5000
      { sentAt: 3_000, serverTime: 8_300, receivedAt: 3_400 }, // rtt 400
    ];
    expect(estimateClockOffset(samples)).toEqual({ offsetMs: 5_000, rttMs: 80 });
  });

  it('handles a device clock that is AHEAD (negative offset)', () => {
    expect(estimateClockOffset([{ sentAt: 100_000, serverTime: 40_050, receivedAt: 100_100 }])).toEqual({
      offsetMs: -60_000,
      rttMs: 100,
    });
  });

  it('picks the first of several equally fast samples', () => {
    const samples = [
      { sentAt: 0, serverTime: 1_050, receivedAt: 100 },
      { sentAt: 500, serverTime: 9_999, receivedAt: 600 },
    ];
    expect(estimateClockOffset(samples)?.offsetMs).toBe(1_000);
  });

  it('ignores samples with a negative round trip, and returns null when nothing is usable', () => {
    expect(
      estimateClockOffset([
        { sentAt: 5_000, serverTime: 0, receivedAt: 4_000 }, // the clock jumped back mid-request
        { sentAt: 6_000, serverTime: 6_150, receivedAt: 6_300 },
      ]),
    ).toEqual({ offsetMs: 0, rttMs: 300 });
    expect(estimateClockOffset([])).toBeNull();
    expect(estimateClockOffset([{ sentAt: 5, serverTime: 0, receivedAt: 1 }])).toBeNull();
  });
});

describe('trustedOfflineTime', () => {
  const base = { lastSaveServerTime: 1_000_000, capMs: 12 * HOUR };

  it('uses the server clock for elapsed time', () => {
    expect(trustedOfflineTime({ ...base, serverNow: 1_000_000 + 2 * HOUR, clientElapsedMs: 2 * HOUR })).toEqual({
      elapsedMs: 2 * HOUR,
      capped: false,
      clockTampered: false,
    });
  });

  it('caps long absences', () => {
    expect(trustedOfflineTime({ ...base, serverNow: 1_000_000 + 30 * HOUR, clientElapsedMs: 30 * HOUR })).toEqual({
      elapsedMs: 12 * HOUR,
      capped: true,
      clockTampered: false,
    });
  });

  it('detects a device clock moved forward or back while the game was closed', () => {
    const twoHours = { ...base, serverNow: 1_000_000 + 2 * HOUR };
    expect(trustedOfflineTime({ ...twoHours, clientElapsedMs: 9 * 24 * HOUR }).clockTampered).toBe(true);
    expect(trustedOfflineTime({ ...twoHours, clientElapsedMs: 0 }).clockTampered).toBe(true);
    expect(trustedOfflineTime({ ...twoHours, clientElapsedMs: 2 * HOUR + 4 * MINUTE }).clockTampered).toBe(false);
    expect(trustedOfflineTime({ ...twoHours, clientElapsedMs: 2 * HOUR + 5 * MINUTE }).clockTampered).toBe(false);
    expect(trustedOfflineTime({ ...twoHours, clientElapsedMs: 2 * HOUR + 5 * MINUTE + 1 }).clockTampered).toBe(true);
    expect(trustedOfflineTime({ ...twoHours, clientElapsedMs: 2 * HOUR + 1000, toleranceMs: 500 }).clockTampered).toBe(true);
  });

  it('compares the tamper check against the raw (uncapped) time', () => {
    const result = trustedOfflineTime({ ...base, serverNow: 1_000_000 + 30 * HOUR, clientElapsedMs: 30 * HOUR });
    expect(result.clockTampered).toBe(false);
  });

  it('treats a server time earlier than the last save as zero elapsed', () => {
    expect(trustedOfflineTime({ ...base, serverNow: 999_000, clientElapsedMs: 0 })).toEqual({
      elapsedMs: 0,
      capped: false,
      clockTampered: false,
    });
  });
});

describe('checkProgress', () => {
  const limits: ProgressLimits = {
    maxXpPerSecond: { fishing: 10, woodcutting: 8, mining: 6 },
    maxGoldPerSecond: 5,
    slackMs: 60_000,
  };
  const snap = (gold: number, skills: Record<string, number>) => ({
    gold,
    skills: Object.fromEntries(Object.entries(skills).map(([k, xp]) => [k, { xp }])),
  });

  it('accepts honest progress, including spending gold', () => {
    const before = snap(1_000, { fishing: 5_000, woodcutting: 100 });
    // 10 minutes: fishing may gain floor(10 × 660) = 6600, gold floor(5 × 660) = 3300
    expect(checkProgress(before, snap(200, { fishing: 11_600, woodcutting: 100 }), 10 * MINUTE, limits)).toEqual({ ok: true });
    expect(checkProgress(before, snap(4_300, { fishing: 5_000, woodcutting: 100 }), 10 * MINUTE, limits)).toEqual({ ok: true });
  });

  it('flags XP gained faster than possible, with the numbers', () => {
    const result = checkProgress(snap(0, { fishing: 0 }), snap(0, { fishing: 6_601 }), 10 * MINUTE, limits);
    expect(result).toEqual({
      ok: false,
      violations: [{ kind: 'xp_too_fast', skill: 'fishing', gained: 6_601, allowed: 6_600 }],
    });
  });

  it('includes slack, so a save right after the last one can still gain a little', () => {
    expect(checkProgress(snap(0, { mining: 0 }), snap(0, { mining: 360 }), 0, limits)).toEqual({ ok: true });
    expect(checkProgress(snap(0, { mining: 0 }), snap(0, { mining: 361 }), 0, limits).ok).toBe(false);
  });

  it('flags XP going down, including a skill that disappeared', () => {
    const result = checkProgress(snap(0, { fishing: 900, mining: 50 }), snap(0, { fishing: 400 }), MINUTE, limits);
    expect(result).toEqual({
      ok: false,
      violations: [
        { kind: 'xp_decreased', skill: 'fishing', by: 500 },
        { kind: 'xp_decreased', skill: 'mining', by: 50 },
      ],
    });
  });

  it('flags skills the server has no rate for, unless they have no XP', () => {
    expect(checkProgress(snap(0, {}), snap(0, { flying: 1 }), HOUR, limits)).toEqual({
      ok: false,
      violations: [{ kind: 'unknown_skill', skill: 'flying' }],
    });
    expect(checkProgress(snap(0, {}), snap(0, { flying: 0 }), HOUR, limits)).toEqual({ ok: true });
  });

  it('flags gold gained too fast, after the skills, with skills in alphabetical order', () => {
    const result = checkProgress(
      snap(0, { woodcutting: 0, fishing: 0 }),
      snap(1_000_000, { woodcutting: 999_999, fishing: 999_999 }),
      MINUTE,
      limits,
    );
    expect(result).toEqual({
      ok: false,
      violations: [
        { kind: 'xp_too_fast', skill: 'fishing', gained: 999_999, allowed: 1_200 },
        { kind: 'xp_too_fast', skill: 'woodcutting', gained: 999_999, allowed: 960 },
        { kind: 'gold_too_fast', gained: 1_000_000, allowed: 600 },
      ],
    });
  });

  it('catches the classic cheat: a year of "offline" progress that the server only saw as two hours', () => {
    const offline = trustedOfflineTime({
      lastSaveServerTime: 0,
      serverNow: 2 * HOUR,
      clientElapsedMs: 365 * 24 * HOUR,
      capMs: 12 * HOUR,
    });
    expect(offline.clockTampered).toBe(true);
    // the client granted itself 12 hours (its cap) of fishing; the server allows 2 hours (+ slack)
    const result = checkProgress(snap(0, { fishing: 0 }), snap(0, { fishing: 12 * 3600 * 10 }), offline.elapsedMs, limits);
    expect(result.ok).toBe(false);
  });
});
