import { describe, expect, it } from 'vitest';
import {
  addItem,
  addSkillXp,
  removeItem,
  sortedInventory,
  spendGold,
  type GameState,
} from './exercise';

/** Recursively freeze an object so any mutation throws a TypeError. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function makeState(): GameState {
  return deepFreeze({
    gold: 100,
    inventory: { oak_log: 5, copper_ore: 2 },
    skills: {
      woodcutting: { xp: 50, level: 2 },
      fishing: { xp: 0, level: 1 },
    },
  });
}

describe('addItem', () => {
  it('adds to an existing stack', () => {
    const inv = deepFreeze({ oak_log: 5 });
    expect(addItem(inv, 'oak_log', 3)).toEqual({ oak_log: 8 });
  });

  it('creates a new stack', () => {
    const inv = deepFreeze({ oak_log: 5 });
    expect(addItem(inv, 'trout', 1)).toEqual({ oak_log: 5, trout: 1 });
  });

  it('does not mutate the original (returns a new object)', () => {
    const inv = deepFreeze({ oak_log: 5 });
    const result = addItem(inv, 'oak_log', 1);
    expect(result).not.toBe(inv);
    expect(inv).toEqual({ oak_log: 5 });
  });

  it('throws a RangeError for zero, negative or fractional quantities', () => {
    const inv = deepFreeze({});
    expect(() => addItem(inv, 'oak_log', 0)).toThrow(RangeError);
    expect(() => addItem(inv, 'oak_log', -2)).toThrow(RangeError);
    expect(() => addItem(inv, 'oak_log', 1.5)).toThrow(RangeError);
  });
});

describe('removeItem', () => {
  it('subtracts from a stack', () => {
    const inv = deepFreeze({ oak_log: 5, trout: 1 });
    expect(removeItem(inv, 'oak_log', 2)).toEqual({ oak_log: 3, trout: 1 });
  });

  it('removes the key entirely when the stack reaches 0', () => {
    const inv = deepFreeze({ oak_log: 5, trout: 1 });
    const result = removeItem(inv, 'trout', 1);
    expect(result).toEqual({ oak_log: 5 });
    expect('trout' in result).toBe(false);
  });

  it('throws when there are not enough items', () => {
    const inv = deepFreeze({ oak_log: 5 });
    expect(() => removeItem(inv, 'oak_log', 6)).toThrow();
    expect(() => removeItem(inv, 'gem', 1)).toThrow();
  });
});

describe('addSkillXp', () => {
  it('adds xp to an existing skill', () => {
    const state = makeState();
    const next = addSkillXp(state, 'woodcutting', 25);
    expect(next.skills.woodcutting).toEqual({ xp: 75, level: 2 });
  });

  it('creates a missing skill at level 1', () => {
    const state = makeState();
    const next = addSkillXp(state, 'mining', 10);
    expect(next.skills.mining).toEqual({ xp: 10, level: 1 });
  });

  it('returns new objects along the changed path', () => {
    const state = makeState();
    const next = addSkillXp(state, 'woodcutting', 25);
    expect(next).not.toBe(state);
    expect(next.skills).not.toBe(state.skills);
    expect(next.skills.woodcutting).not.toBe(state.skills.woodcutting);
  });

  it('keeps unchanged branches as the SAME reference (structural sharing)', () => {
    const state = makeState();
    const next = addSkillXp(state, 'woodcutting', 25);
    expect(next.inventory).toBe(state.inventory);
    expect(next.skills.fishing).toBe(state.skills.fishing);
    expect(next.gold).toBe(100);
  });
});

describe('spendGold', () => {
  it('subtracts gold', () => {
    const state = makeState();
    expect(spendGold(state, 30).gold).toBe(70);
  });

  it('shares unchanged branches', () => {
    const state = makeState();
    const next = spendGold(state, 30);
    expect(next.inventory).toBe(state.inventory);
    expect(next.skills).toBe(state.skills);
  });

  it('throws if you cannot afford it', () => {
    expect(() => spendGold(makeState(), 101)).toThrow();
  });

  it('returns the exact same state object when spending 0', () => {
    const state = makeState();
    expect(spendGold(state, 0)).toBe(state);
  });
});

describe('sortedInventory', () => {
  it('sorts by quantity descending, then id ascending', () => {
    const inv = deepFreeze({ trout: 2, oak_log: 9, copper_ore: 2, gem: 1 });
    expect(sortedInventory(inv)).toEqual([
      ['oak_log', 9],
      ['copper_ore', 2],
      ['trout', 2],
      ['gem', 1],
    ]);
  });

  it('returns an empty array for an empty inventory', () => {
    expect(sortedInventory(deepFreeze({}))).toEqual([]);
  });
});
