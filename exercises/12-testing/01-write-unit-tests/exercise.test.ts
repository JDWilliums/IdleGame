/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 12-01 · write-unit-tests
 * Lessons: 12.1 Why & what to test · 12.2 Vitest fundamentals
 * Run:     npm run watch 12-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This time YOU write the tests. The code under test, formatDuration in
 * ./subject.ts, is already correct. Read the description at the top of that
 * file (but not the spoiler zone at the bottom!).
 *
 * How you're graded (mutation.test.ts does this automatically):
 *   1. Your tests must PASS against the real formatDuration.
 *   2. The subject contains six hidden buggy versions ("mutants"). Your tests
 *      are run against each one, and they must FAIL for every mutant. A
 *      mutant your tests don't notice has "survived", meaning your tests have
 *      a gap.
 *   3. Write at least 8 tests.
 *
 * Think like a tester:
 *   - boundaries (just below and exactly at 1 minute, 1 hour, 1 day)
 *   - rounding (what happens at 59.9 seconds?)
 *   - the "drop the zero part" rule in each range
 *   - invalid input
 *   - test.each tables keep many cases readable
 *
 * Delete the placeholder test below, then write your own.
 */
import { describe, expect, it } from 'vitest';
import { formatDuration } from './subject';

describe('formatDuration', () => {
  it('placeholder: delete me and write real tests', () => {
    expect.fail('Write your tests, then delete this placeholder');
  });

  // Example of the style (keep it, change it or delete it):
  it('formats zero as 0s', () => {
    expect(formatDuration(0)).toBe('0s');
  });
});
