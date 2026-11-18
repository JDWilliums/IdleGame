// Grades YOUR tests in exercise.test.tsx by mutation testing. Don't edit this file.
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { countTests, runTests } from '../../_support/mutation';

const MUTANT_NAMES = ['noDisable', 'stringQty', 'staleTotal', 'noClamp', 'outOfStockMissing', 'offByOneAfford'];
const yourTests = path.join(import.meta.dirname, 'exercise.test.tsx');

describe('your tests', () => {
  it('include at least 6 test cases', () => {
    expect(countTests(yourTests)).toBeGreaterThanOrEqual(6);
  });

  it('pass against the real ShopItemCard', { timeout: 60_000 }, () => {
    const { passed, output } = runTests(yourTests);
    expect(passed, `Your tests fail against the CORRECT component:\n${output.slice(-1500)}`).toBe(true);
  });

  it.each(MUTANT_NAMES)('catch the "%s" mutant', { timeout: 60_000 }, (mutant) => {
    const { passed } = runTests(yourTests, mutant);
    expect(passed, `The "${mutant}" mutant SURVIVED: all your tests passed against buggy code.`).toBe(false);
  });
});
