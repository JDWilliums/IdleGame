// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  BuyButton,
  createShopStore,
  GoldBadge,
  OwnedCount,
  selectCanAfford,
  selectOwnedCount,
} from './exercise';

describe('createShopStore', () => {
  it('starts with the given gold and nothing owned', () => {
    expect(createShopStore().getState()).toMatchObject({ gold: 100, owned: [] });
    expect(createShopStore(7).getState().gold).toBe(7);
  });

  it('adds gold, ignoring non-positive amounts', () => {
    const store = createShopStore(0);
    store.getState().addGold(25);
    store.getState().addGold(0);
    store.getState().addGold(-10);
    expect(store.getState().gold).toBe(25);
  });

  it('buys affordable items once', () => {
    const store = createShopStore(130);
    expect(store.getState().buy('fishing_rod')).toBe(true);
    expect(store.getState()).toMatchObject({ gold: 55, owned: ['fishing_rod'] });
    expect(store.getState().buy('fishing_rod')).toBe(false); // already owned
    expect(store.getState().buy('iron_axe')).toBe(false); // too expensive
    expect(store.getState().gold).toBe(55);
  });

  it('sells for half price (rounded down)', () => {
    const store = createShopStore(75);
    store.getState().buy('fishing_rod');
    store.getState().sell('fishing_rod');
    expect(store.getState()).toMatchObject({ gold: 37, owned: [] });
    store.getState().sell('iron_axe'); // not owned → nothing happens
    expect(store.getState().gold).toBe(37);
  });

  it('resets', () => {
    const store = createShopStore(100);
    store.getState().buy('bronze_axe');
    store.getState().reset();
    expect(store.getState()).toMatchObject({ gold: 100, owned: [] });
  });

  it('creates independent stores', () => {
    const a = createShopStore();
    const b = createShopStore();
    a.getState().buy('bronze_axe');
    expect(b.getState().owned).toEqual([]);
  });

  it('does not mutate previous state objects', () => {
    const store = createShopStore(200);
    const before = store.getState();
    const ownedBefore = before.owned;
    store.getState().buy('bronze_axe');
    expect(ownedBefore).toEqual([]);
    expect(store.getState().owned).not.toBe(ownedBefore);
  });
});

describe('selectors', () => {
  it('selectCanAfford checks price and ownership', () => {
    const store = createShopStore(60);
    expect(selectCanAfford('bronze_axe')(store.getState())).toBe(true);
    expect(selectCanAfford('iron_axe')(store.getState())).toBe(false);
    store.getState().buy('bronze_axe');
    expect(selectCanAfford('bronze_axe')(store.getState())).toBe(false);
  });

  it('selectOwnedCount counts owned items', () => {
    const store = createShopStore(500);
    store.getState().buy('bronze_axe');
    store.getState().buy('iron_axe');
    expect(selectOwnedCount(store.getState())).toBe(2);
  });
});

describe('components', () => {
  it('GoldBadge updates when the store changes outside React', () => {
    const store = createShopStore(10);
    render(<GoldBadge store={store} />);
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('10');
    act(() => store.getState().addGold(5));
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('15');
  });

  it('BuyButton buys and disables itself', async () => {
    const store = createShopStore(60);
    render(
      <>
        <GoldBadge store={store} />
        <BuyButton store={store} itemId="bronze_axe" />
        <BuyButton store={store} itemId="iron_axe" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Buy iron_axe' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Buy bronze_axe' }));
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('10');
    expect(screen.getByRole('button', { name: 'Buy bronze_axe' })).toBeDisabled();
  });

  it('OwnedCount does not re-render when only gold changes', () => {
    const store = createShopStore(500);
    const onRender = vi.fn();
    render(
      <Profiler id="owned" onRender={onRender}>
        <OwnedCount store={store} />
      </Profiler>,
    );
    expect(screen.getByText('Owned: 0')).toBeInTheDocument();
    const before = onRender.mock.calls.length;
    act(() => store.getState().addGold(1));
    act(() => store.getState().addGold(1));
    expect(onRender.mock.calls.length).toBe(before);
    act(() => {
      store.getState().buy('bronze_axe');
    });
    expect(screen.getByText('Owned: 1')).toBeInTheDocument();
  });
});
