import { describe, expect, it } from 'vitest';
import { formatCompact, formatGrouped, formatPercent, formatPerSecond, roundTo } from './exercise';

describe('formatCompact', () => {
  it.each([
    [0, '0'],
    [3, '3'],
    [12.5, '12.5'],
    [0.125, '0.13'],
    [7.1, '7.1'],
    [999, '999'],
    [999.4, '999.4'],
  ])('small numbers: %s → %s', (n, expected) => {
    expect(formatCompact(n)).toBe(expected);
  });

  it.each([
    [1_000, '1.00K'],
    [1_234, '1.23K'],
    [12_345, '12.3K'],
    [120_000, '120K'],
    [123_456, '123K'],
    [1_000_000, '1.00M'],
    [1_500_000, '1.50M'],
    [2_500_000_000, '2.50B'],
    [2.5e12, '2.50T'],
    [7.77e15, '7.77Qa'],
    [4.2e18, '4.20Qi'],
  ])('suffixes: %s → %s', (n, expected) => {
    expect(formatCompact(n)).toBe(expected);
  });

  it.each([
    [999.996, '1.00K'],
    [99_999, '100K'],
    [999_999, '1.00M'],
    [999_500_000, '1.00B'],
  ])('rolls over to the next unit: %s → %s', (n, expected) => {
    expect(formatCompact(n)).toBe(expected);
  });

  it('switches to scientific notation beyond the suffixes', () => {
    expect(formatCompact(1e21)).toBe('1.00e21');
    expect(formatCompact(3.456e30)).toBe('3.46e30');
  });

  it('handles negatives and special values', () => {
    expect(formatCompact(-1_234)).toBe('-1.23K');
    expect(formatCompact(-5)).toBe('-5');
    expect(formatCompact(Number.NaN)).toBe('NaN');
    expect(formatCompact(Number.POSITIVE_INFINITY)).toBe('∞');
    expect(formatCompact(Number.NEGATIVE_INFINITY)).toBe('-∞');
  });
});

describe('formatGrouped', () => {
  it('rounds and groups with commas', () => {
    expect(formatGrouped(1_234_567.6)).toBe('1,234,568');
    expect(formatGrouped(999)).toBe('999');
    expect(formatGrouped(-1_000)).toBe('-1,000');
  });
});

describe('formatPercent', () => {
  it('formats fractions as percentages', () => {
    expect(formatPercent(0.4567)).toBe('45.7%');
    expect(formatPercent(1, 0)).toBe('100%');
    expect(formatPercent(0.0005, 2)).toBe('0.05%');
  });
});

describe('formatPerSecond', () => {
  it('converts per-ms rates to per second', () => {
    expect(formatPerSecond(0.0125, 'XP')).toBe('12.5 XP/s');
    expect(formatPerSecond(2, 'gold')).toBe('2.00K gold/s');
    expect(formatPerSecond(0, 'logs')).toBe('0 logs/s');
  });
});

describe('roundTo', () => {
  it('rounds correctly despite floating point', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(1.004, 2)).toBe(1);
    expect(roundTo(-1.005, 2)).toBe(-1.01);
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(-2.5, 0)).toBe(-3);
    expect(roundTo(123.456, 1)).toBe(123.5);
  });
});
