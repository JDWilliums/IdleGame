/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 08-03 · build-your-own-store
 * Lesson:  08.5 External stores & Zustand
 * Run:     npm run watch 08-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a tiny Zustand-like store from scratch, then connect it to React with
 * useSyncExternalStore. Once you've built this, Zustand will hold no mysteries.
 *
 * TASK 1 · createStore(initialState)
 *   getState()          → the current state
 *   setState(next)      → `next` is a value OR an updater (prev) => value.
 *                          If the new state is Object.is-equal to the old,
 *                          do nothing (don't notify). Otherwise store it and
 *                          call every listener.
 *   subscribe(listener) → adds a listener and returns an unsubscribe function.
 *                          The same listener subscribed twice is only called once.
 *
 * TASK 2 · useStore(store, selector)
 *   A hook built on React's useSyncExternalStore that returns
 *   selector(store.getState()). The component re-renders ONLY when the
 *   selected value changes (Object.is).
 *
 * TASK 3 · shallowEqual(a, b)
 *   true if a and b are Object.is-equal, OR both are plain objects with the
 *   same keys whose values are Object.is-equal. (One level deep only.)
 *
 * TASK 4 · useStoreShallow(store, selector)
 *   Like useStore, but for selectors that build a NEW object each time,
 *   e.g. (s) => ({ gold: s.gold, xp: s.xp }). Plain useStore would loop
 *   forever with that (why? lesson 08.5's golden rule). Cache the last result,
 *   and if the new result is shallowEqual to it, return the CACHED one.
 */

export type Listener = () => void;

export type Store<T> = {
  getState: () => T;
  setState: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createStore<T>(initialState: T): Store<T> {
  throw new Error('Not implemented yet');
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  throw new Error('Not implemented yet');
}

export function shallowEqual(a: unknown, b: unknown): boolean {
  throw new Error('Not implemented yet');
}

export function useStoreShallow<T, S>(store: Store<T>, selector: (state: T) => S): S {
  throw new Error('Not implemented yet');
}
