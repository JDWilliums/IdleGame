// Reference solution for 08-03. Read it only AFTER your own version passes.
import { useRef, useSyncExternalStore } from 'react';

export type Listener = () => void;

export type Store<T> = {
  getState: () => T;
  setState: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener>(); // a Set ignores duplicate subscriptions

  return {
    getState: () => state,
    setState(next) {
      // `typeof next === 'function'` can't fully narrow a generic T (T itself
      // could be a function type), so we cast. This is the same trade-off Zustand makes.
      const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  // React re-renders only when the snapshot (the selected value) changes by Object.is.
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!isObject(a) || !isObject(b)) return false;
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((key) => Object.hasOwn(b, key) && Object.is(a[key], b[key]));
}

export function useStoreShallow<T, S>(store: Store<T>, selector: (state: T) => S): S {
  // Remember the last result so getSnapshot can return the SAME reference when
  // the new result is shallow-equal. That satisfies useSyncExternalStore's rule.
  const cache = useRef<{ value: S } | null>(null);

  const getSnapshot = () => {
    const next = selector(store.getState());
    if (cache.current !== null && shallowEqual(cache.current.value, next)) {
      return cache.current.value;
    }
    cache.current = { value: next };
    return next;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot);
}
