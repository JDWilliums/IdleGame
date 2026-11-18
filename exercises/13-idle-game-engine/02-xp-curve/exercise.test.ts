import { describe, expect, it } from 'vitest';
import { levelFromXp, levelProgress, MAX_LEVEL, timeToLevel, XP_TABLE, xpForLevel, xpToNextLevel } from './exercise';

describe('XP_TABLE', () => {
  it('has an entry for every level', () => {
    expect(XP_TABLE).toHaveLength(MAX_LEVEL + 1);
    expect(XP_TABLE[0]).toBe(0);
    expect(XP_TABLE[1]).toBe(0);
  });

  it('matches known values of the classic curve', () => {
    expect(XP_TABLE[2]).toBe(83);
    expect(XP_TABLE[3]).toBe(174);
    expect(XP_TABLE[10]).toBe(1154);
    expect(XP_TABLE[50]).toBe(101_333);
    expect(XP_TABLE[92]).toBe(6_517_253);
    expect(XP_TABLE[99]).toBe(13_034_431);
  });

  it('strictly increases and holds only safe integers', () => {
    for (let level = 2; level <= MAX_LEVEL; level++) {
      expect(XP_TABLE[level]!).toBeGreaterThan(XP_TABLE[level - 1]!);
      expect(Number.isSafeInteger(XP_TABLE[level])).toBe(true);
    }
  });
});

describe('xpForLevel', () => {
  it('looks up the table', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(83);
    expect(xpForLevel(99)).toBe(13_034_431);
  });

  it('clamps and floors', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-5)).toBe(0);
    expect(xpForLevel(150)).toBe(13_034_431);
    expect(xpForLevel(2.9)).toBe(83);
  });
});

describe('levelFromXp', () => {
  it.each([
    [0, 1],
    [82, 1],
    [83, 2],
    [173, 2],
    [174, 3],
    [1153, 9],
    [1154, 10],
    [13_034_430, 98],
    [13_034_431, 99],
    [999_999_999, 99],
  ])('levelFromXp(%i) = %i', (xp, level) => {
    expect(levelFromXp(xp)).toBe(level);
  });

  it('treats negative XP as level 1', () => {
    expect(levelFromXp(-10)).toBe(1);
  });

  it('is the inverse of xpForLevel at every level', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      expect(levelFromXp(xpForLevel(level))).toBe(level);
      if (level > 1) expect(levelFromXp(xpForLevel(level) - 1)).toBe(level - 1);
    }
  });

  it('is fast enough to call constantly', () => {
    const start = performance.now();
    for (let i = 0; i < 200_000; i++) levelFromXp(i * 61);
    expect(performance.now() - start).toBeLessThan(500);
  });
});

describe('levelProgress', () => {
  it('reports progress within a level', () => {
    expect(levelProgress(100)).toEqual({ level: 2, xpIntoLevel: 17, xpForNext: 91, fraction: 17 / 91 });
  });

  it('is 0 exactly at a level boundary', () => {
    expect(levelProgress(83)).toMatchObject({ level: 2, xpIntoLevel: 0, fraction: 0 });
  });

  it('is full at max level', () => {
    expect(levelProgress(20_000_000)).toEqual({ level: 99, xpIntoLevel: 0, xpForNext: 0, fraction: 1 });
  });
});

describe('xpToNextLevel', () => {
  it('returns the XP still needed', () => {
    expect(xpToNextLevel(0)).toBe(83);
    expect(xpToNextLevel(100)).toBe(74);
    expect(xpToNextLevel(13_034_431)).toBe(0);
  });
});

describe('timeToLevel', () => {
  it('counts whole actions', () => {
    // 83 XP needed at 10 XP per action → 9 actions × 3000ms
    expect(timeToLevel(0, 2, 10, 3000)).toBe(27_000);
  });

  it('is 0 when already at or past the target', () => {
    expect(timeToLevel(200, 3, 10, 3000)).toBe(0);
    expect(timeToLevel(83, 2, 10, 3000)).toBe(0);
  });

  it('works for long journeys', () => {
    // 101,333 XP at 10 XP per 3s → 10,134 actions → 30,402,000 ms (about 8.4 hours)
    expect(timeToLevel(0, 50, 10, 3000)).toBe(30_402_000);
  });
});
