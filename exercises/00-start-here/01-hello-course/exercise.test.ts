import { describe, expect, it } from 'vitest';
import { totalHours, weeksToFinish, welcomeMessage } from './exercise';

describe('welcomeMessage', () => {
  it('greets the learner by name', () => {
    expect(welcomeMessage('Sam')).toBe('Welcome to Idle Game Academy, Sam!');
  });

  it('trims whitespace around the name', () => {
    expect(welcomeMessage('  Sam  ')).toBe('Welcome to Idle Game Academy, Sam!');
  });

  it('falls back to "adventurer" for an empty or blank name', () => {
    expect(welcomeMessage('')).toBe('Welcome to Idle Game Academy, adventurer!');
    expect(welcomeMessage('   ')).toBe('Welcome to Idle Game Academy, adventurer!');
  });
});

describe('totalHours', () => {
  it('returns 0 for no modules', () => {
    expect(totalHours([])).toBe(0);
  });

  it('adds up the hours of every module', () => {
    expect(
      totalHours([
        { title: 'JavaScript', hours: 12 },
        { title: 'TypeScript', hours: 20 },
        { title: 'Web', hours: 10 },
      ]),
    ).toBe(42);
  });
});

describe('weeksToFinish', () => {
  it('divides evenly', () => {
    expect(weeksToFinish(100, 20)).toBe(5);
  });

  it('rounds partial weeks up', () => {
    expect(weeksToFinish(500, 15)).toBe(34);
    expect(weeksToFinish(1, 10)).toBe(1);
  });

  it('needs 0 weeks for 0 hours', () => {
    expect(weeksToFinish(0, 10)).toBe(0);
  });

  it('throws when hoursPerWeek is not positive', () => {
    expect(() => weeksToFinish(100, 0)).toThrow();
    expect(() => weeksToFinish(100, -5)).toThrow();
  });
});
