import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { typeErrors } from '../../_support/typecheck';
import {
  assertNever,
  describeAction,
  gameReducer,
  loadStateLabel,
  type GameState,
} from './exercise';

function makeState(): GameState {
  const state: GameState = {
    active: null,
    xp: { woodcutting: 100, fishing: 0, mining: 0 },
    bank: { trout: 5, oak_log: 2 },
    gold: 10,
  };
  Object.values(state).forEach((v) => v && typeof v === 'object' && Object.freeze(v));
  return Object.freeze(state);
}

describe('types (checked by the TypeScript compiler)', () => {
  it('types.check.ts compiles with no errors', () => {
    expect(typeErrors(path.join(import.meta.dirname, 'types.check.ts'))).toEqual([]);
  });
});

describe('assertNever', () => {
  it('throws, mentioning the unexpected value', () => {
    expect(() => assertNever({ type: 'mystery' } as never)).toThrow(/mystery/);
  });
});

describe('gameReducer', () => {
  it('starts an action', () => {
    const next = gameReducer(makeState(), {
      type: 'startAction',
      skillId: 'woodcutting',
      actionId: 'oak_tree',
    });
    expect(next.active).toEqual({ skillId: 'woodcutting', actionId: 'oak_tree' });
  });

  it('stops an action', () => {
    const started = gameReducer(makeState(), {
      type: 'startAction',
      skillId: 'fishing',
      actionId: 'shrimp_spot',
    });
    expect(gameReducer(started, { type: 'stopAction' }).active).toBeNull();
  });

  it('returns the same state when stopping while already idle', () => {
    const state = makeState();
    expect(gameReducer(state, { type: 'stopAction' })).toBe(state);
  });

  it('gains xp without touching other skills', () => {
    const state = makeState();
    const next = gameReducer(state, { type: 'gainXp', skillId: 'woodcutting', amount: 25 });
    expect(next.xp).toEqual({ woodcutting: 125, fishing: 0, mining: 0 });
    expect(next.bank).toBe(state.bank);
  });

  it('adds items, creating new stacks', () => {
    const next = gameReducer(makeState(), { type: 'addItem', itemId: 'gem', quantity: 1 });
    expect(next.bank).toEqual({ trout: 5, oak_log: 2, gem: 1 });
    const more = gameReducer(next, { type: 'addItem', itemId: 'trout', quantity: 3 });
    expect(more.bank.trout).toBe(8);
  });

  it('sells items for gold', () => {
    const next = gameReducer(makeState(), {
      type: 'sellItem',
      itemId: 'trout',
      quantity: 3,
      pricePerItem: 20,
    });
    expect(next.bank).toEqual({ trout: 2, oak_log: 2 });
    expect(next.gold).toBe(70);
  });

  it('removes the stack when selling everything', () => {
    const next = gameReducer(makeState(), {
      type: 'sellItem',
      itemId: 'oak_log',
      quantity: 2,
      pricePerItem: 5,
    });
    expect(next.bank).toEqual({ trout: 5 });
    expect(next.gold).toBe(20);
  });

  it('returns the same state when there are not enough items to sell', () => {
    const state = makeState();
    expect(
      gameReducer(state, { type: 'sellItem', itemId: 'trout', quantity: 6, pricePerItem: 20 }),
    ).toBe(state);
    expect(
      gameReducer(state, { type: 'sellItem', itemId: 'gem', quantity: 1, pricePerItem: 100 }),
    ).toBe(state);
  });
});

describe('describeAction', () => {
  it('describes every action type', () => {
    expect(
      describeAction({ type: 'startAction', skillId: 'woodcutting', actionId: 'oak_tree' }),
    ).toBe('Started woodcutting: oak_tree');
    expect(describeAction({ type: 'stopAction' })).toBe('Stopped');
    expect(describeAction({ type: 'gainXp', skillId: 'fishing', amount: 25 })).toBe(
      '+25 fishing XP',
    );
    expect(describeAction({ type: 'addItem', itemId: 'trout', quantity: 3 })).toBe('+3 trout');
    expect(
      describeAction({ type: 'sellItem', itemId: 'trout', quantity: 3, pricePerItem: 20 }),
    ).toBe('Sold 3 trout for 60 gold');
  });
});

describe('loadStateLabel', () => {
  it('labels every state', () => {
    expect(loadStateLabel({ status: 'idle' })).toBe('Not loaded');
    expect(loadStateLabel({ status: 'loading' })).toBe('Loading…');
    expect(loadStateLabel({ status: 'success', data: ['a'] })).toBe('1 save found');
    expect(loadStateLabel({ status: 'success', data: ['a', 'b', 'c'] })).toBe('3 saves found');
    expect(loadStateLabel({ status: 'success', data: [] })).toBe('0 saves found');
    expect(loadStateLabel({ status: 'error', error: 'offline' })).toBe('Error: offline');
  });
});
