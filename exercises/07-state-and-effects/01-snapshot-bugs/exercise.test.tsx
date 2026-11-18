// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActivityLog, DelayedCollect, PlayerHealth, TripleXpButton, type Player } from './exercise';

const output = (name: string) => screen.getByRole('status', { name });

describe('TripleXpButton', () => {
  it('adds exactly 3 XP per click', async () => {
    render(<TripleXpButton />);
    await userEvent.click(screen.getByRole('button', { name: '+3 XP' }));
    expect(output('XP')).toHaveTextContent('3');
    await userEvent.click(screen.getByRole('button', { name: '+3 XP' }));
    expect(output('XP')).toHaveTextContent('6');
  });
});

describe('DelayedCollect', () => {
  afterEach(() => vi.useRealTimers());

  it('adds 10 gold one second after each click, even for quick clicks', () => {
    vi.useFakeTimers();
    render(<DelayedCollect />);
    const button = screen.getByRole('button', { name: 'Collect' });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(output('Gold')).toHaveTextContent('0');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(output('Gold')).toHaveTextContent('30');
  });
});

describe('ActivityLog', () => {
  it('shows each new entry', async () => {
    render(<ActivityLog />);
    const add = screen.getByRole('button', { name: 'Add entry' });
    await userEvent.click(add);
    await userEvent.click(add);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['Entry 1', 'Entry 2']);
  });
});

describe('PlayerHealth', () => {
  const makePlayer = (): Player => {
    const player = { name: 'Ava', stats: { hp: 10, maxHp: 10 } };
    Object.freeze(player.stats);
    return Object.freeze(player);
  };

  it('takes damage without mutating the prop', async () => {
    const player = makePlayer();
    render(<PlayerHealth initialPlayer={player} />);
    await userEvent.click(screen.getByRole('button', { name: 'Take 3 damage' }));
    expect(output('HP')).toHaveTextContent('7 / 10');
    expect(player.stats.hp).toBe(10);
  });

  it('never goes below 0', async () => {
    render(<PlayerHealth initialPlayer={makePlayer()} />);
    const button = screen.getByRole('button', { name: 'Take 3 damage' });
    for (let i = 0; i < 5; i++) await userEvent.click(button);
    expect(output('HP')).toHaveTextContent('0 / 10');
  });
});
