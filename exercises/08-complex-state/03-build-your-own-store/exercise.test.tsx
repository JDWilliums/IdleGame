// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createStore, shallowEqual, useStore, useStoreShallow, type Store } from './exercise';

type Game = { gold: number; xp: number; name: string };
const makeStore = () => createStore<Game>({ gold: 0, xp: 0, name: 'Ava' });

describe('createStore', () => {
  it('reads and replaces state', () => {
    const store = makeStore();
    expect(store.getState()).toEqual({ gold: 0, xp: 0, name: 'Ava' });
    store.setState({ gold: 5, xp: 1, name: 'Ava' });
    expect(store.getState().gold).toBe(5);
  });

  it('supports updater functions', () => {
    const store = makeStore();
    store.setState((s) => ({ ...s, gold: s.gold + 1 }));
    store.setState((s) => ({ ...s, gold: s.gold + 1 }));
    expect(store.getState().gold).toBe(2);
  });

  it('notifies subscribers on change', () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState((s) => ({ ...s, gold: 1 }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not notify when the state is the same reference', () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setState((s) => s);
    store.setState(store.getState());
    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribes', () => {
    const store = makeStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setState((s) => ({ ...s, gold: 1 }));
    expect(listener).not.toHaveBeenCalled();
  });

  it('calls a listener subscribed twice only once', () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.subscribe(listener);
    store.setState((s) => ({ ...s, gold: 1 }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps stores independent', () => {
    const a = makeStore();
    const b = makeStore();
    a.setState((s) => ({ ...s, gold: 9 }));
    expect(b.getState().gold).toBe(0);
  });
});

describe('shallowEqual', () => {
  it('compares one level deep', () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual(NaN, NaN)).toBe(true);
    expect(shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).toBe(true);
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: { n: 1 } }, { a: { n: 1 } })).toBe(false); // different inner objects
    expect(shallowEqual(null, {})).toBe(false);
    expect(shallowEqual({}, null)).toBe(false);
  });
});

function Gold({ store, onRender }: { store: Store<Game>; onRender: () => void }) {
  const gold = useStore(store, (s) => s.gold);
  onRender();
  return <output aria-label="Gold">{gold}</output>;
}

function Stats({ store, onRender }: { store: Store<Game>; onRender: () => void }) {
  const { gold, xp } = useStoreShallow(store, (s) => ({ gold: s.gold, xp: s.xp }));
  onRender();
  return (
    <p>
      {gold} gold · {xp} xp
    </p>
  );
}

describe('useStore', () => {
  it('renders the selected value and updates when the store changes outside React', () => {
    const store = makeStore();
    render(<Gold store={store} onRender={() => {}} />);
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('0');
    act(() => store.setState((s) => ({ ...s, gold: 42 })));
    expect(screen.getByRole('status', { name: 'Gold' })).toHaveTextContent('42');
  });

  it('only re-renders when the selected slice changes', () => {
    const store = makeStore();
    const onRender = vi.fn();
    render(<Gold store={store} onRender={onRender} />);
    const before = onRender.mock.calls.length;
    act(() => store.setState((s) => ({ ...s, xp: s.xp + 1 })));
    act(() => store.setState((s) => ({ ...s, name: 'Bo' })));
    expect(onRender.mock.calls.length).toBe(before);
    act(() => store.setState((s) => ({ ...s, gold: 1 })));
    expect(onRender.mock.calls.length).toBe(before + 1);
  });

  it('unsubscribes on unmount', () => {
    const store = makeStore();
    const subscribe = vi.spyOn(store, 'subscribe');
    const { unmount } = render(<Gold store={store} onRender={() => {}} />);
    const unsubscribers = subscribe.mock.results.map((r) => r.value as () => void);
    expect(unsubscribers.length).toBeGreaterThan(0);
    unmount();
    // After unmount, changing the store must not throw or warn.
    expect(() => store.setState((s) => ({ ...s, gold: 7 }))).not.toThrow();
  });
});

describe('useStoreShallow', () => {
  it('works with selectors that return new objects (no infinite loop)', () => {
    const store = makeStore();
    render(<Stats store={store} onRender={() => {}} />);
    expect(screen.getByText('0 gold · 0 xp')).toBeInTheDocument();
    act(() => store.setState((s) => ({ ...s, gold: 3, xp: 2 })));
    expect(screen.getByText('3 gold · 2 xp')).toBeInTheDocument();
  });

  it('does not re-render when the selected fields are unchanged', () => {
    const store = makeStore();
    const onRender = vi.fn();
    render(<Stats store={store} onRender={onRender} />);
    const before = onRender.mock.calls.length;
    act(() => store.setState((s) => ({ ...s, name: 'Bo' })));
    expect(onRender.mock.calls.length).toBe(before);
  });
});
