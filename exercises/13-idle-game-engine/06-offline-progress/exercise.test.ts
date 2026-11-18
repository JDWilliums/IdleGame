import { describe, expect, it } from 'vitest';
import { calculateOfflineProgress, catchUp, type GameState } from './exercise';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const CAP = 12 * HOUR;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return deepFreeze({
    skills: { woodcutting: { xp: 0 }, smithing: { xp: 0 }, fishing: { xp: 0 } },
    bank: {},
    activeAction: null,
    stats: { actionsCompleted: 0, itemsGained: 0 },
    lastUpdatedAt: 1_000_000,
    ...overrides,
  });
}

describe('calculateOfflineProgress', () => {
  it('applies the elapsed time and summarises it', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 1_000 } });
    const { state: next, summary } = calculateOfflineProgress(state, 3_600_000, CAP);
    expect(next.bank.oak_log).toBe(1_200); // (1,000 + 3,600,000) / 3,000 = 1,200.33
    expect(next.activeAction?.progressMs).toBe(1_000);
    expect(summary).toEqual({
      elapsedMs: 3_600_000,
      appliedMs: 3_600_000,
      capped: false,
      actionId: 'chop_oak',
      completions: 1_200,
      itemsGained: { oak_log: 1_200 },
      itemsUsed: {},
      xpGained: 12_000,
      levelsGained: 27, // 0 XP (level 1) → 12,000 XP (level 28)
      stoppedReason: null,
    });
  });

  it('caps long absences', () => {
    const state = makeState({ activeAction: { id: 'fish_shrimp', progressMs: 0 } });
    const { state: next, summary } = calculateOfflineProgress(state, 3 * DAY, CAP);
    expect(summary).toMatchObject({ elapsedMs: 3 * DAY, appliedMs: CAP, capped: true });
    expect(next.bank.raw_shrimp).toBe((CAP / 1_000) * 2);
  });

  it('treats negative elapsed time as zero', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 500 } });
    const { state: next, summary } = calculateOfflineProgress(state, -5_000, CAP);
    expect(next.activeAction?.progressMs).toBe(500);
    expect(summary).toMatchObject({ elapsedMs: 0, appliedMs: 0, completions: 0, capped: false });
  });

  it('reports inputs used and stopping when they run out', () => {
    const state = makeState({
      activeAction: { id: 'smelt_bronze', progressMs: 0 },
      bank: { copper_ore: 50, tin_ore: 30 },
    });
    const { state: next, summary } = calculateOfflineProgress(state, HOUR, CAP);
    expect(summary).toMatchObject({
      completions: 30,
      itemsUsed: { copper_ore: 30, tin_ore: 30 },
      itemsGained: { bronze_bar: 30 },
      stoppedReason: 'outOfInputs',
    });
    expect(next.activeAction).toBeNull();
    expect(next.bank).toEqual({ copper_ore: 20, bronze_bar: 30 });
  });

  it('does nothing (but still summarises) with no active action', () => {
    const state = makeState();
    const { state: next, summary } = calculateOfflineProgress(state, HOUR, CAP);
    expect(next.bank).toEqual({});
    expect(summary).toMatchObject({ actionId: null, completions: 0, levelsGained: 0, appliedMs: HOUR });
  });

  it('does not change lastUpdatedAt', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 0 } });
    expect(calculateOfflineProgress(state, HOUR, CAP).state.lastUpdatedAt).toBe(state.lastUpdatedAt);
  });

  it('computes a 30-day absence in milliseconds', () => {
    const state = makeState({ activeAction: { id: 'fish_shrimp', progressMs: 0 } });
    const start = performance.now();
    const { summary } = calculateOfflineProgress(state, 30 * DAY, 30 * DAY);
    expect(performance.now() - start).toBeLessThan(50);
    expect(summary.completions).toBe(2_592_000);
  });
});

describe('catchUp', () => {
  it('uses lastUpdatedAt to find the elapsed time, then moves it forward', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 0 }, lastUpdatedAt: 10_000 });
    const { state: next, summary } = catchUp(state, 10_000 + 30_000, CAP);
    expect(summary.completions).toBe(10);
    expect(next.lastUpdatedAt).toBe(40_000);
  });

  it('updates lastUpdatedAt even with no active action', () => {
    const state = makeState({ lastUpdatedAt: 5_000 });
    expect(catchUp(state, 9_000, CAP).state.lastUpdatedAt).toBe(9_000);
  });

  it('never moves lastUpdatedAt backwards when the clock goes back', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 0 }, lastUpdatedAt: 50_000 });
    const { state: next, summary } = catchUp(state, 20_000, CAP);
    expect(summary.appliedMs).toBe(0);
    expect(next.lastUpdatedAt).toBe(50_000);
  });
});
