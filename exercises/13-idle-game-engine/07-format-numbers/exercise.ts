/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 13-07 · format-numbers
 * Lesson:  13.9 Numbers & formatting
 * Run:     npm run watch 13-07
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · formatCompact(n)
 *   |n| < 1000 → at most 2 decimal places, trailing zeros removed
 *                (3 → "3", 12.5 → "12.5", 0.125 → "0.13", 999 → "999")
 *   otherwise  → 3 significant digits with a suffix:
 *                K (1e3), M (1e6), B (1e9), T (1e12), Qa (1e15), Qi (1e18)
 *                1,234 → "1.23K"   12,345 → "12.3K"   123,456 → "123K"
 *                Keep trailing zeros here: 1,000,000 → "1.00M", 120,000 → "120K"
 *                ROLLOVER: if rounding reaches 1000 of a unit, move to the next
 *                unit: 999,999 → "1.00M" (not "1000K")
 *   ≥ 1e21     → scientific with 2 decimals and no "+": 1e21 → "1.00e21"
 *   negative   → "-" + the format of |n|  (−1,234 → "-1.23K")
 *   NaN → "NaN"; ±Infinity → "∞" / "-∞"
 *
 * TASK 2 · formatGrouped(n): round to a whole number, then group with commas
 *   (en-US): 1234567.6 → "1,234,568"
 *
 * TASK 3 · formatPercent(fraction, decimals = 1): 0.4567 → "45.7%", (1, 0) → "100%"
 *
 * TASK 4 · formatPerSecond(amountPerMs, unit): convert to per second and format
 *   it compactly: (0.0125, "XP") → "12.5 XP/s", (2, "gold") → "2.00K gold/s"
 *
 * TASK 5 · roundTo(n, decimals): round half away from zero, correctly for
 *   classic float cases: roundTo(1.005, 2) → 1.01 (a naive Math.round(n × 100)
 *   / 100 gives 1). Negative numbers round symmetrically: roundTo(-1.005, 2) → -1.01.
 */

export function formatCompact(n: number): string {
  throw new Error('Not implemented yet');
}

export function formatGrouped(n: number): string {
  throw new Error('Not implemented yet');
}

export function formatPercent(fraction: number, decimals = 1): string {
  throw new Error('Not implemented yet');
}

export function formatPerSecond(amountPerMs: number, unit: string): string {
  throw new Error('Not implemented yet');
}

export function roundTo(n: number, decimals: number): number {
  throw new Error('Not implemented yet');
}
