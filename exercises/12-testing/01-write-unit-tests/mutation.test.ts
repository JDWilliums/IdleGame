// Grades YOUR tests in exercise.test.ts by mutation testing. Don't edit this file.
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { countTests, runTests } from '../../_support/mutation';
import { MUTANT_NAMES } from './subject';

const yourTests = path.join(import.meta.dirname, 'exercise.test.ts');

describe('your tests', () => {
  it('include at least 8 test cases', () => {
    expect(countTests(yourTests)).toBeGreaterThanOrEqual(8);
  });

  it('pass against the real formatDuration', { timeout: 60_000 }, () => {
    const { passed, output } = runTests(yourTests);
    expect(passed, `Your tests fail against the CORRECT code:\n${output.slice(-1500)}`).toBe(true);
  });

  it.each(MUTANT_NAMES)('catch the "%s" mutant', { timeout: 60_000 }, (mutant) => {
    const { passed } = runTests(yourTests, mutant);
    expect(passed, `The "${mutant}" mutant SURVIVED: all your tests passed against buggy code.`).toBe(false);
  });
});
