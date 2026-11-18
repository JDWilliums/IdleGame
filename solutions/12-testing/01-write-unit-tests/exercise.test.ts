// Reference solution for 12-01. Read it only AFTER your own version passes.
import { describe, expect, it } from 'vitest';
import { formatDuration } from './subject';

const s = 1000;
const m = 60 * s;
const h = 60 * m;
const d = 24 * h;

describe('formatDuration', () => {
  describe('seconds (under a minute)', () => {
    it.each([
      [0, '0s'],
      [999, '0s'],
      [1_500, '1s'], // floors, never rounds up
      [45 * s, '45s'],
      [59_999, '59s'], // just below the minute boundary
    ])('%i ms → %s', (ms, expected) => {
      expect(formatDuration(ms)).toBe(expected);
    });
  });

  describe('minutes (under an hour)', () => {
    it('switches to minutes exactly at 60 seconds', () => {
      expect(formatDuration(m)).toBe('1m');
    });

    it('shows minutes and seconds', () => {
      expect(formatDuration(2 * m + 5 * s)).toBe('2m 5s');
    });

    it('drops zero seconds', () => {
      expect(formatDuration(2 * m)).toBe('2m');
    });

    it('stays in minutes just below an hour', () => {
      expect(formatDuration(h - 1)).toBe('59m 59s');
    });
  });

  describe('hours (under a day)', () => {
    it('shows hours then minutes, in that order', () => {
      expect(formatDuration(h + m + s)).toBe('1h 1m');
    });

    it('drops zero minutes', () => {
      expect(formatDuration(3 * h)).toBe('3h');
    });

    it('stays in hours just below a day', () => {
      expect(formatDuration(d - 1)).toBe('23h 59m');
    });
  });

  describe('days', () => {
    it('switches to days at 24 hours', () => {
      expect(formatDuration(d)).toBe('1d');
    });

    it('shows days and hours', () => {
      expect(formatDuration(25 * h)).toBe('1d 1h');
      expect(formatDuration(2 * d + 4 * h + 30 * m)).toBe('2d 4h');
    });
  });

  describe('invalid input', () => {
    it.each([-1, -5_000, Number.NaN, Number.POSITIVE_INFINITY])('throws a RangeError for %s', (ms) => {
      expect(() => formatDuration(ms)).toThrow(RangeError);
    });
  });
});
