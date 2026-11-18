import { describe, expect, it } from 'vitest';
import { startAction, stopAction, tick, type GameState } from './exercise';

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
    ...overrides,
  });
}

describe('startAction', () => {
  it('starts an unlocked action with zero progress', () => {
    const next = startAction(makeState(), 'chop_oak');
    expect(next.activeAction).toEqual({ id: 'chop_oak', progressMs: 0 });
  });

  it('refuses locked actions (returns the same state)', () => {
    const state = makeState();
    expect(startAction(state, 'chop_willow')).toBe(state); // needs Woodcutting 10
    const skilled = makeState({ skills: { woodcutting: { xp: 1154 }, smithing: { xp: 0 }, fishing: { xp: 0 } } });
    expect(startAction(skilled, 'chop_willow').activeAction?.id).toBe('chop_willow'); // 1154 XP = level 10
  });

  it('keeps progress when restarting the same action', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 1200 } });
    expect(startAction(state, 'chop_oak')).toBe(state);
  });

  it('resets progress when switching actions', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 1200 } });
    expect(startAction(state, 'fish_shrimp').activeAction).toEqual({ id: 'fish_shrimp', progressMs: 0 });
  });
});

describe('stopAction', () => {
  it('stops the active action', () => {
    expect(stopAction(makeState({ activeAction: { id: 'chop_oak', progressMs: 5 } })).activeAction).toBeNull();
  });
  it('returns the same state when idle', () => {
    const state = makeState();
    expect(stopAction(state)).toBe(state);
  });
});

describe('tick: basics', () => {
  it('does nothing when idle or with no elapsed time', () => {
    const idle = makeState();
    expect(tick(idle, 1000)).toEqual({ state: idle, events: [] });
    expect(tick(idle, 1000).state).toBe(idle);
    const active = makeState({ activeAction: { id: 'chop_oak', progressMs: 100 } });
    expect(tick(active, 0).state).toBe(active);
    expect(tick(active, -50).state).toBe(active);
  });

  it('only accumulates progress before a completion', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 1000 } });
    const { state: next, events } = tick(state, 500);
    expect(next.activeAction).toEqual({ id: 'chop_oak', progressMs: 1500 });
    expect(events).toEqual([]);
    expect(next.bank).toBe(state.bank);
    expect(next.skills).toBe(state.skills);
  });

  it('completes once and carries the remainder over', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 2500 } });
    const { state: next } = tick(state, 1000);
    expect(next.activeAction).toEqual({ id: 'chop_oak', progressMs: 500 });
    expect(next.bank).toEqual({ oak_log: 1 });
    expect(next.skills.woodcutting.xp).toBe(10);
    expect(next.stats).toEqual({ actionsCompleted: 1, itemsGained: 1 });
  });

  it('handles several completions in one tick, multiplying quantities', () => {
    const state = makeState({ activeAction: { id: 'fish_shrimp', progressMs: 200 }, bank: { raw_shrimp: 10 } });
    const { state: next } = tick(state, 3_900); // 4,100 → 4 completions, 100 left
    expect(next.bank).toEqual({ raw_shrimp: 18 });
    expect(next.skills.fishing.xp).toBe(20);
    expect(next.activeAction?.progressMs).toBe(100);
    expect(next.stats).toEqual({ actionsCompleted: 4, itemsGained: 8 });
  });

  it('shares untouched skills', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 2999 } });
    const { state: next } = tick(state, 1);
    expect(next.skills.smithing).toBe(state.skills.smithing);
    expect(next.skills.fishing).toBe(state.skills.fishing);
  });
});

describe('tick: inputs', () => {
  it('consumes inputs and removes empty stacks', () => {
    const state = makeState({
      activeAction: { id: 'smelt_bronze', progressMs: 0 },
      bank: { copper_ore: 3, tin_ore: 2, oak_log: 7 },
    });
    const { state: next } = tick(state, 4_000); // 2 completions
    expect(next.bank).toEqual({ copper_ore: 1, bronze_bar: 2, oak_log: 7 });
    expect(next.activeAction).toEqual({ id: 'smelt_bronze', progressMs: 0 });
  });

  it('stops when inputs run out partway', () => {
    const state = makeState({ activeAction: { id: 'smelt_bronze', progressMs: 0 }, bank: { copper_ore: 5, tin_ore: 2 } });
    const { state: next, events } = tick(state, 10_000); // time for 5, ore for 2
    expect(next.bank).toEqual({ copper_ore: 3, bronze_bar: 2 });
    expect(next.activeAction).toBeNull();
    expect(events.at(-1)).toEqual({ type: 'actionStopped', actionId: 'smelt_bronze', reason: 'outOfInputs' });
    expect(next.stats.actionsCompleted).toBe(2);
  });

  it('respects input quantities greater than 1', () => {
    const state = makeState({
      skills: { woodcutting: { xp: 0 }, smithing: { xp: 2_411 }, fishing: { xp: 0 } }, // level 15
      activeAction: { id: 'smelt_iron', progressMs: 0 },
      bank: { iron_ore: 5 },
    });
    const { state: next } = tick(state, 9_000); // time for 3, ore for 2
    expect(next.bank).toEqual({ iron_ore: 1, iron_bar: 2 });
    expect(next.activeAction).toBeNull();
  });

  it('stops immediately if not even one repetition is affordable', () => {
    const state = makeState({ activeAction: { id: 'smelt_bronze', progressMs: 1_900 }, bank: { copper_ore: 1 } });
    const { state: next, events } = tick(state, 200);
    expect(next.bank).toEqual({ copper_ore: 1 });
    expect(next.activeAction).toBeNull();
    expect(events).toEqual([{ type: 'actionStopped', actionId: 'smelt_bronze', reason: 'outOfInputs' }]);
  });
});

describe('tick: XP and events', () => {
  it('emits events in the documented order', () => {
    const state = makeState({ activeAction: { id: 'smelt_bronze', progressMs: 0 }, bank: { copper_ore: 1, tin_ore: 1 } });
    const { events } = tick(state, 4_000); // 1 affordable of 2 possible
    expect(events).toEqual([
      { type: 'actionCompleted', actionId: 'smelt_bronze', count: 1 },
      { type: 'itemsUsed', itemId: 'copper_ore', qty: 1 },
      { type: 'itemsUsed', itemId: 'tin_ore', qty: 1 },
      { type: 'itemsGained', itemId: 'bronze_bar', qty: 1 },
      { type: 'xpGained', skill: 'smithing', xp: 15 },
      { type: 'actionStopped', actionId: 'smelt_bronze', reason: 'outOfInputs' },
    ]);
  });

  it('emits levelUp when XP crosses a threshold', () => {
    const state = makeState({
      skills: { woodcutting: { xp: 80 }, smithing: { xp: 0 }, fishing: { xp: 0 } },
      activeAction: { id: 'chop_oak', progressMs: 0 },
    });
    const { events } = tick(state, 3_000); // 80 → 90 XP crosses 83
    expect(events).toContainEqual({ type: 'levelUp', skill: 'woodcutting', level: 2 });
  });

  it('emits a single levelUp with the final level for big jumps', () => {
    const state = makeState({ activeAction: { id: 'chop_oak', progressMs: 0 } });
    const { state: next, events } = tick(state, 3_000 * 116); // 1,160 XP → level 10
    expect(next.skills.woodcutting.xp).toBe(1_160);
    expect(events.filter((e) => e.type === 'levelUp')).toEqual([{ type: 'levelUp', skill: 'woodcutting', level: 10 }]);
  });

  it('handles huge dt instantly (no per-completion loop)', () => {
    const state = makeState({ activeAction: { id: 'fish_shrimp', progressMs: 0 } });
    const start = performance.now();
    const { state: next } = tick(state, 1000 * 60 * 60 * 24 * 365); // a year: 31.5M completions
    expect(performance.now() - start).toBeLessThan(50);
    expect(next.bank.raw_shrimp).toBe(63_072_000);
  });
});
