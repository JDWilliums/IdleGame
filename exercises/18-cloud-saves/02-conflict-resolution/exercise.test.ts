import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  describeSummary,
  levelForXp,
  resolveConflict,
  summarise,
  type LocalState,
  type RemoteSave,
  type Save,
} from './exercise';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = 1_772_366_400_000;

const save = (overrides: Partial<Save> = {}): Save => ({
  gold: 100,
  skills: { fishing: { xp: 1154 }, woodcutting: { xp: 83 }, mining: { xp: 0 } }, // levels 10 + 2 + 1
  lastSavedAt: NOW - 5 * MINUTE,
  ...overrides,
});

describe('provided levelForXp', () => {
  it('matches the 13.6 curve', () => {
    expect([levelForXp(0), levelForXp(82), levelForXp(83), levelForXp(1154), levelForXp(13_034_431)]).toEqual([
      1, 1, 2, 10, 99,
    ]);
  });
});

describe('summarise', () => {
  it('adds up levels and XP over the skills in the save', () => {
    expect(summarise(save())).toEqual({ totalLevel: 13, totalXp: 1237, gold: 100, lastSavedAt: NOW - 5 * MINUTE });
  });

  it('handles a save with no skills', () => {
    expect(summarise(save({ skills: {} }))).toMatchObject({ totalLevel: 0, totalXp: 0 });
  });
});

describe('resolveConflict', () => {
  const local = (dirty: boolean, baseRevision = 7, s = save()): LocalState => ({ save: s, baseRevision, dirty });
  const remote = (revision: number, s = save()): RemoteSave => ({ save: s, revision });

  it('is in sync when nothing changed anywhere', () => {
    expect(resolveConflict(local(false), remote(7))).toEqual({ kind: 'inSync' });
  });

  it('pushes when only this device changed', () => {
    expect(resolveConflict(local(true), remote(7))).toEqual({ kind: 'pushLocal' });
  });

  it('pushes when the server has no save', () => {
    expect(resolveConflict(local(true, 0), null)).toEqual({ kind: 'pushLocal' });
    expect(resolveConflict(local(false, 3), null)).toEqual({ kind: 'pushLocal' });
  });

  it('pulls when only the server changed', () => {
    expect(resolveConflict(local(false), remote(9))).toEqual({ kind: 'pullRemote' });
  });

  it('treats a LOWER server revision as "the server changed" too (e.g. restored from backup)', () => {
    expect(resolveConflict(local(false, 7), remote(5))).toEqual({ kind: 'pullRemote' });
  });

  it('asks the player when both changed, with summaries', () => {
    const mine = save({ gold: 50, skills: { fishing: { xp: 2000 } }, lastSavedAt: NOW - MINUTE });
    const theirs = save({ gold: 900, skills: { fishing: { xp: 1500 } }, lastSavedAt: NOW - 3 * HOUR });
    expect(resolveConflict(local(true, 7, mine), remote(8, theirs))).toEqual({
      kind: 'askPlayer',
      local: summarise(mine),
      remote: summarise(theirs),
      recommended: 'local',
    });
  });

  it('recommends by total XP first, then recency, then remote', () => {
    const recommend = (mine: Save, theirs: Save) => {
      const result = resolveConflict(local(true, 1, mine), remote(2, theirs));
      return result.kind === 'askPlayer' ? result.recommended : result.kind;
    };
    const xp = (n: number, savedAgo: number) => save({ skills: { fishing: { xp: n } }, lastSavedAt: NOW - savedAgo });
    expect(recommend(xp(100, HOUR), xp(200, DAY))).toBe('remote'); // more XP beats more recent
    expect(recommend(xp(300, DAY), xp(200, MINUTE))).toBe('local');
    expect(recommend(xp(200, MINUTE), xp(200, HOUR))).toBe('local'); // equal XP: more recent
    expect(recommend(xp(200, HOUR), xp(200, MINUTE))).toBe('remote');
    expect(recommend(xp(200, HOUR), xp(200, HOUR))).toBe('remote'); // complete tie
  });
});

describe('describeSummary', () => {
  const summary = (totalLevel: number, gold: number, savedAgo: number) => ({
    totalLevel,
    totalXp: 0,
    gold,
    lastSavedAt: NOW - savedAgo,
  });

  it('formats numbers with thousands separators', () => {
    expect(describeSummary(summary(1520, 48_210, 2 * MINUTE), NOW)).toBe(
      'Total level 1,520 · 48,210 gold · saved 2 minutes ago',
    );
  });

  it('describes the age in whole units, singular for 1', () => {
    const age = (ms: number) => describeSummary(summary(1, 0, ms), NOW).split(' · ')[2];
    expect(age(0)).toBe('saved just now');
    expect(age(59_999)).toBe('saved just now');
    expect(age(-5 * MINUTE)).toBe('saved just now'); // a clock in the future
    expect(age(MINUTE)).toBe('saved 1 minute ago');
    expect(age(59 * MINUTE + 59_999)).toBe('saved 59 minutes ago');
    expect(age(HOUR)).toBe('saved 1 hour ago');
    expect(age(23 * HOUR + 59 * MINUTE)).toBe('saved 23 hours ago');
    expect(age(DAY)).toBe('saved 1 day ago');
    expect(age(40 * DAY)).toBe('saved 40 days ago');
  });
});

describe('applyChoice', () => {
  const mine = save({ gold: 1 });
  const theirs = save({ gold: 2 });
  const local: LocalState = { save: mine, baseRevision: 7, dirty: true };
  const remote: RemoteSave = { save: theirs, revision: 9 };

  it("keeping this device's save rebases it on the server's revision and stays dirty", () => {
    expect(applyChoice('local', local, remote)).toEqual({ save: mine, baseRevision: 9, dirty: true, backup: theirs });
  });

  it("using the cloud save makes the device clean and in sync", () => {
    expect(applyChoice('remote', local, remote)).toEqual({ save: theirs, baseRevision: 9, dirty: false, backup: mine });
  });

  it('does not mutate its inputs', () => {
    const before = structuredClone({ local, remote });
    applyChoice('local', local, remote);
    applyChoice('remote', local, remote);
    expect({ local, remote }).toEqual(before);
  });
});
