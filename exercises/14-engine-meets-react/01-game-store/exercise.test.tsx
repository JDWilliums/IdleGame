// @vitest-environment jsdom
import { act, render, renderHook, screen } from '@testing-library/react';
import { Profiler } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialState, type GameEvent, type GameState } from './engine';
import {
  createGameStore,
  GoldDisplay,
  ItemCount,
  selectGold,
  selectItemCount,
  selectLevel,
  selectProgressFraction,
  SkillLevel,
  useGameEvents,
} from './exercise';

function setup(overrides: Partial<GameState> = {}) {
  let now = 50_000;
  const store = createGameStore({ ...createInitialState(1_000), ...overrides }, { now: () => now });
  return { store, setNow: (t: number) => (now = t) };
}

describe('createGameStore', () => {
  it('delegates actions to the engine', () => {
    const { store } = setup({ bank: { oak_log: 5 } });
    store.getState().startAction('chop_oak');
    expect(store.getState().game.activeAction).toEqual({ id: 'chop_oak', progressMs: 0 });
    store.getState().sell('oak_log', 3);
    expect(store.getState().game.gold).toBe(3);
    store.getState().stopAction();
    expect(store.getState().game.activeAction).toBeNull();
  });

  it('advance() runs the engine and stamps lastUpdatedAt', () => {
    const { store, setNow } = setup({ activeAction: { id: 'chop_oak', progressMs: 0 } });
    setNow(77_000);
    store.getState().advance(3_000);
    expect(store.getState().game.bank.oak_log).toBe(1);
    expect(store.getState().game.lastUpdatedAt).toBe(77_000);
  });

  it('does not notify subscribers when nothing changed', () => {
    const { store } = setup(); // idle
    const listener = vi.fn();
    store.subscribe(listener);
    store.getState().advance(1_000);
    store.getState().stopAction();
    store.getState().sell('oak_log', 1); // have none
    expect(listener).not.toHaveBeenCalled();
  });

  it('emits engine events to event subscribers', () => {
    const { store } = setup({ activeAction: { id: 'fish_shrimp', progressMs: 0 } });
    const received: GameEvent[][] = [];
    const unsubscribe = store.getState().subscribeEvents((events) => received.push(events));
    store.getState().advance(500); // no completion → no events → listener not called
    expect(received).toHaveLength(0);
    store.getState().advance(500);
    expect(received).toHaveLength(1);
    expect(received[0]).toContainEqual({ type: 'itemsGained', itemId: 'raw_shrimp', qty: 1 });
    unsubscribe();
    store.getState().advance(1_000);
    expect(received).toHaveLength(1);
  });

  it('does not store events in state', () => {
    const { store } = setup({ activeAction: { id: 'fish_shrimp', progressMs: 0 } });
    store.getState().advance(1_000);
    expect(JSON.stringify(store.getState().game)).not.toContain('itemsGained');
  });

  it('catchUp() applies offline time and returns the summary', () => {
    const { store } = setup({ activeAction: { id: 'fish_shrimp', progressMs: 0 }, lastUpdatedAt: 1_000 });
    const summary = store.getState().catchUp(1_000 + 60_000);
    expect(summary).toMatchObject({ appliedMs: 60_000, completions: 60 });
    expect(store.getState().game.bank.raw_shrimp).toBe(60);
    expect(store.getState().game.lastUpdatedAt).toBe(61_000);
  });

  it('creates independent stores', () => {
    const a = setup({ bank: { oak_log: 1 } }).store;
    const b = setup({ bank: { oak_log: 1 } }).store;
    a.getState().sell('oak_log', 1);
    expect(b.getState().game.gold).toBe(0);
  });
});

describe('selectors', () => {
  it('select primitives', () => {
    const { store } = setup({
      gold: 12,
      bank: { oak_log: 4 },
      skills: { woodcutting: { xp: 174 }, fishing: { xp: 0 }, smithing: { xp: 0 } },
      activeAction: { id: 'chop_oak', progressMs: 750 },
    });
    const s = store.getState();
    expect(selectGold(s)).toBe(12);
    expect(selectItemCount('oak_log')(s)).toBe(4);
    expect(selectItemCount('bronze_bar')(s)).toBe(0);
    expect(selectLevel('woodcutting')(s)).toBe(3);
    expect(selectProgressFraction(s)).toBe(0.25);
  });

  it('progress is 0 when idle', () => {
    expect(selectProgressFraction(setup().store.getState())).toBe(0);
  });
});

describe('useGameEvents', () => {
  it('calls the latest handler and unsubscribes on unmount', () => {
    const { store } = setup({ activeAction: { id: 'fish_shrimp', progressMs: 0 } });
    const first = vi.fn();
    const second = vi.fn();
    const subscribe = vi.spyOn(store.getState(), 'subscribeEvents');
    const { rerender, unmount } = renderHook(({ handler }) => useGameEvents(store, handler), {
      initialProps: { handler: first },
    });
    rerender({ handler: second });
    act(() => store.getState().advance(1_000));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1); // did not resubscribe for the new handler
    unmount();
    act(() => store.getState().advance(1_000));
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('components', () => {
  it('display live values', () => {
    const { store } = setup({ bank: { oak_log: 2 }, activeAction: { id: 'chop_oak', progressMs: 0 } });
    render(
      <>
        <GoldDisplay store={store} />
        <ItemCount store={store} itemId="oak_log" />
        <SkillLevel store={store} skill="woodcutting" />
      </>,
    );
    act(() => store.getState().advance(3_000 * 9)); // 9 logs, 90 XP → level 2
    act(() => store.getState().sell('oak_log', 1));
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('1');
    expect(screen.getByRole('status', { name: 'oak_log count' })).toHaveTextContent('10');
    expect(screen.getByRole('status', { name: 'woodcutting level' })).toHaveTextContent('2');
  });

  it('do not re-render on progress-only ticks', () => {
    const { store } = setup({ activeAction: { id: 'chop_oak', progressMs: 0 } });
    const onRender = vi.fn();
    render(
      <Profiler id="hud" onRender={onRender}>
        <GoldDisplay store={store} />
        <ItemCount store={store} itemId="oak_log" />
        <SkillLevel store={store} skill="woodcutting" />
      </Profiler>,
    );
    const before = onRender.mock.calls.length;
    for (let i = 0; i < 20; i++) act(() => store.getState().advance(100)); // 2 s: no completion
    expect(onRender.mock.calls.length).toBe(before);
  });
});
