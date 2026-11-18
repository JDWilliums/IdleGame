// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BankPanel, bankReducer, initialBankState, type BankState } from './exercise';

function freeze(state: BankState): BankState {
  Object.freeze(state.items);
  Object.freeze(state.log);
  return Object.freeze(state);
}

const make = (items: Record<string, number>, gold = 0, log: string[] = []) =>
  freeze({ items: { ...items }, gold, log: [...log] });

describe('bankReducer', () => {
  it('deposits items and logs it', () => {
    const next = bankReducer(make({ trout: 1 }), { type: 'deposited', itemId: 'trout', quantity: 3 });
    expect(next.items).toEqual({ trout: 4 });
    expect(next.log).toEqual(['Deposited 3 × trout']);
  });

  it('withdraws items, deleting empty stacks', () => {
    const next = bankReducer(make({ trout: 2, oak_log: 1 }), { type: 'withdrawn', itemId: 'trout', quantity: 2 });
    expect(next.items).toEqual({ oak_log: 1 });
    expect(next.log[0]).toBe('Withdrew 2 × trout');
  });

  it('returns the same state when withdrawing too much', () => {
    const state = make({ trout: 1 });
    expect(bankReducer(state, { type: 'withdrawn', itemId: 'trout', quantity: 2 })).toBe(state);
    expect(bankReducer(state, { type: 'withdrawn', itemId: 'gem', quantity: 1 })).toBe(state);
  });

  it('sells items for gold', () => {
    const next = bankReducer(make({ trout: 5 }, 10), { type: 'sold', itemId: 'trout', quantity: 2, price: 20 });
    expect(next.items).toEqual({ trout: 3 });
    expect(next.gold).toBe(50);
    expect(next.log[0]).toBe('Sold 2 × trout for 40 gold');
  });

  it('returns the same state when selling too much', () => {
    const state = make({ trout: 1 });
    expect(bankReducer(state, { type: 'sold', itemId: 'trout', quantity: 9, price: 20 })).toBe(state);
  });

  it('sells everything that has a price', () => {
    const next = bankReducer(make({ trout: 2, oak_log: 10, quest_item: 1 }, 0), {
      type: 'soldAll',
      prices: { trout: 20, oak_log: 5 },
    });
    expect(next.items).toEqual({ quest_item: 1 });
    expect(next.gold).toBe(90);
    expect(next.log[0]).toBe('Sold everything for 90 gold');
  });

  it('returns the same state when nothing can be sold', () => {
    const state = make({ quest_item: 1 });
    expect(bankReducer(state, { type: 'soldAll', prices: { trout: 20 } })).toBe(state);
  });

  it('keeps the newest 5 log entries, newest first', () => {
    let state: BankState = make({});
    for (let i = 1; i <= 7; i++) {
      state = bankReducer(state, { type: 'deposited', itemId: `item${i}`, quantity: 1 });
    }
    expect(state.log).toEqual([
      'Deposited 1 × item7',
      'Deposited 1 × item6',
      'Deposited 1 × item5',
      'Deposited 1 × item4',
      'Deposited 1 × item3',
    ]);
  });

  it('clears the log, returning the same state if it is already empty', () => {
    const cleared = bankReducer(make({}, 0, ['a']), { type: 'logCleared' });
    expect(cleared.log).toEqual([]);
    expect(bankReducer(cleared, { type: 'logCleared' })).toBe(cleared);
  });

  it('shares untouched branches', () => {
    const state = make({ trout: 1 }, 0, ['old']);
    const next = bankReducer(state, { type: 'logCleared' });
    expect(next.items).toBe(state.items);
  });
});

describe('BankPanel', () => {
  const prices = { trout: 20, oak_log: 5 };
  const initial: BankState = { items: { trout: 2, oak_log: 3, quest_item: 1 }, gold: 0, log: [] };

  it('renders the bank sorted by id', () => {
    render(<BankPanel initial={initial} prices={prices} />);
    const rows = within(screen.getByRole('list', { name: 'Bank' })).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('oak_log ×3'),
      expect.stringContaining('quest_item ×1'),
      expect.stringContaining('trout ×2'),
    ]);
    expect(screen.getByRole('button', { name: 'Sell 1 quest_item' })).toBeDisabled();
  });

  it('sells one item, updating gold and the log', async () => {
    render(<BankPanel initial={initial} prices={prices} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell 1 trout' }));
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('20');
    expect(screen.getByText(/trout ×1/)).toBeInTheDocument();
    const log = within(screen.getByRole('list', { name: 'Log' })).getAllByRole('listitem');
    expect(log[0]).toHaveTextContent('Sold 1 × trout for 20 gold');
  });

  it('sells all and clears the log', async () => {
    render(<BankPanel initial={initial} prices={prices} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sell all' }));
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('55');
    expect(within(screen.getByRole('list', { name: 'Bank' })).getAllByRole('listitem')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Clear log' }));
    expect(within(screen.getByRole('list', { name: 'Log' })).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('defaults to an empty bank', () => {
    render(<BankPanel prices={prices} />);
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('0');
    expect(initialBankState).toEqual({ items: {}, gold: 0, log: [] });
  });
});
