/**
 * The code under test for exercise 12-01. It's CORRECT, so don't change it.
 *
 * formatDuration(ms) formats a duration for "while you were away" screens:
 *
 *   ms < 0, NaN or Infinity   → throws a RangeError
 *   under 1 minute            → "45s"        (whole seconds, rounded DOWN)
 *   under 1 hour              → "2m 5s"      ("2m" when the seconds are 0)
 *   under 1 day               → "3h 20m"     ("3h" when the minutes are 0)
 *   1 day or more             → "2d 4h"      ("2d" when the hours are 0)
 *
 * Examples: 0 → "0s", 59_999 → "59s", 60_000 → "1m", 3_661_000 → "1h 1m"
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function pair(big: number, bigUnit: string, small: number, smallUnit: string): string {
  return small === 0 ? `${big}${bigUnit}` : `${big}${bigUnit} ${small}${smallUnit}`;
}

function correct(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) throw new RangeError(`Invalid duration: ${ms}`);
  if (ms < MINUTE) return `${Math.floor(ms / SECOND)}s`;
  if (ms < HOUR) return pair(Math.floor(ms / MINUTE), 'm', Math.floor((ms % MINUTE) / SECOND), 's');
  if (ms < DAY) return pair(Math.floor(ms / HOUR), 'h', Math.floor((ms % HOUR) / MINUTE), 'm');
  return pair(Math.floor(ms / DAY), 'd', Math.floor((ms % DAY) / HOUR), 'h');
}

export function formatDuration(ms: number): string {
  const mutant = MUTANTS[process.env.COURSE_MUTANT ?? ''];
  return mutant ? mutant(ms) : correct(ms);
}

// ════════════════════════════════════════════════════════════════════════════
//  SPOILER ZONE: the buggy "mutants" your tests must catch. Try writing your
//  tests WITHOUT reading below this line, then check what you missed.
// ════════════════════════════════════════════════════════════════════════════

const MUTANTS: Record<string, (ms: number) => string> = {
  // 1. Off-by-one at the minute boundary: 60_000 → "60s"
  boundary: (ms) => (ms <= MINUTE && ms >= 0 ? `${Math.floor(ms / SECOND)}s` : correct(ms)),
  // 2. Rounds instead of flooring: 59_600 → "1m" (and 1_500 → "2s")
  rounding: (ms) => (ms >= 0 && ms < MINUTE ? `${Math.round(ms / SECOND)}s` : correct(ms)),
  // 3. Doesn't drop the zero part: 120_000 → "2m 0s"
  keepsZero: (ms) =>
    ms >= MINUTE && ms < HOUR ? `${Math.floor(ms / MINUTE)}m ${Math.floor((ms % MINUTE) / SECOND)}s` : correct(ms),
  // 4. Accepts negative durations: -5_000 → "-5s"
  noValidation: (ms) => (ms < 0 ? `${Math.ceil(ms / SECOND)}s` : correct(ms)),
  // 5. Never switches to days: 90_000_000 → "25h"
  noDays: (ms) => (ms >= DAY ? pair(Math.floor(ms / HOUR), 'h', Math.floor((ms % HOUR) / MINUTE), 'm') : correct(ms)),
  // 6. Units in the wrong order for hours: 3_661_000 → "1m 1h"
  swapped: (ms) =>
    ms >= HOUR && ms < DAY ? pair(Math.floor((ms % HOUR) / MINUTE), 'm', Math.floor(ms / HOUR), 'h') : correct(ms),
};

export const MUTANT_NAMES = Object.keys(MUTANTS);
