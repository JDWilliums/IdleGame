/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 13-02 · xp-curve
 * Lesson:  13.6 XP curves & levelling
 * Run:     npm run watch 13-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Implement the classic exponential XP curve from lesson 13.6:
 *
 *   xpForLevel(L) = floor( (1/4) × Σ_{i=1}^{L−1} floor( i + 300 × 2^(i/7) ) )
 *
 * (Careful: the inner floor is applied to EACH term before summing; the
 *  outer floor of the divided total is applied to the running sum.)
 *
 * TASK 1 · XP_TABLE: a precomputed, readonly array where XP_TABLE[L] is the
 *   total XP needed for level L, for L = 1..MAX_LEVEL. XP_TABLE[0] = 0 (unused)
 *   and XP_TABLE[1] = 0. Its length is MAX_LEVEL + 1. Compute it ONCE, at module load.
 *
 * TASK 2 · xpForLevel(level): XP_TABLE lookup. Floor fractional levels, and
 *   clamp to 1..MAX_LEVEL.
 *
 * TASK 3 · levelFromXp(xp): the highest level whose XP requirement is ≤ xp,
 *   found with BINARY SEARCH over XP_TABLE. Negative XP → level 1.
 *
 * TASK 4 · levelProgress(xp) → { level, xpIntoLevel, xpForNext, fraction }
 *   At max level: xpIntoLevel 0, xpForNext 0, fraction 1.
 *
 * TASK 5 · xpToNextLevel(xp): XP still needed for the next level (0 at max).
 *
 * TASK 6 · timeToLevel(currentXp, targetLevel, xpPerAction, actionMs)
 *   Milliseconds of doing one action repeatedly to reach targetLevel.
 *   Actions are whole: you need Math.ceil(remainingXp / xpPerAction) of them.
 *   Already there (or beyond) → 0.
 */

export const MAX_LEVEL = 99;

export const XP_TABLE: readonly number[] = []; // TODO (Task 1)

export function xpForLevel(level: number): number {
  throw new Error('Not implemented yet');
}

export function levelFromXp(xp: number): number {
  throw new Error('Not implemented yet');
}

export type LevelProgress = {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  fraction: number;
};

export function levelProgress(xp: number): LevelProgress {
  throw new Error('Not implemented yet');
}

export function xpToNextLevel(xp: number): number {
  throw new Error('Not implemented yet');
}

export function timeToLevel(currentXp: number, targetLevel: number, xpPerAction: number, actionMs: number): number {
  throw new Error('Not implemented yet');
}
