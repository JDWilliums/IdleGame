// Reference solution for 13-02. Read it only AFTER your own version passes.

export const MAX_LEVEL = 99;

export const XP_TABLE: readonly number[] = (() => {
  const table = [0, 0]; // index 0 unused; level 1 needs 0 XP
  let points = 0;
  for (let level = 1; level < MAX_LEVEL; level++) {
    points += Math.floor(level + 300 * 2 ** (level / 7));
    table.push(Math.floor(points / 4));
  }
  return Object.freeze(table);
})();

export function xpForLevel(level: number): number {
  const clamped = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  return XP_TABLE[clamped] ?? 0;
}

export function levelFromXp(xp: number): number {
  // Binary search for the highest level L with XP_TABLE[L] <= xp.
  let lo = 1;
  let hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2); // round UP so `lo = mid` always makes progress
    if ((XP_TABLE[mid] ?? Infinity) <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export type LevelProgress = {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  fraction: number;
};

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) return { level, xpIntoLevel: 0, xpForNext: 0, fraction: 1 };
  const start = xpForLevel(level);
  const xpForNext = xpForLevel(level + 1) - start;
  const xpIntoLevel = xp - start;
  return { level, xpIntoLevel, xpForNext, fraction: xpIntoLevel / xpForNext };
}

export function xpToNextLevel(xp: number): number {
  const level = levelFromXp(xp);
  return level >= MAX_LEVEL ? 0 : xpForLevel(level + 1) - xp;
}

export function timeToLevel(currentXp: number, targetLevel: number, xpPerAction: number, actionMs: number): number {
  const remaining = xpForLevel(targetLevel) - currentXp;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / xpPerAction) * actionMs;
}
