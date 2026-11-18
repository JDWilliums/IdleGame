# 08.5 · External stores & Zustand

> ⏱ 2.5 hours · Module 08 · Managing Complex State

## What you'll learn
- What an "external store" is, and why your game needs one
- `useSyncExternalStore`: React's official way to subscribe to outside state
- Building a tiny store from scratch (you'll do it in exercise 08-03)
- Zustand: stores, actions, selectors, `useShallow`, using the store outside React, middleware
- How this compares with Redux Toolkit, Jotai and others

---

## State outside React

So far all state has lived *inside* React (`useState`, `useReducer`). An **external store** is state that lives in a plain JavaScript object **outside** the component tree, which React components *subscribe* to.

Why would you want that?
1. **Code outside React can update it.** Your game loop runs on a timer, independently of rendering. It should be able to `store.tick(dt)` without being a component.
2. **Selective subscriptions.** A component subscribes to *one slice* (`gold`) and re-renders only when that slice changes, unlike context, where every consumer re-renders on any change.
3. **No provider required.** The store is a module-level singleton (01.6), so you import it and use it.

## The contract: subscribe + getSnapshot

Any store React can use has two operations:

```ts
type Store<T> = {
  getState(): T;                                 // read the current state ("snapshot")
  subscribe(listener: () => void): () => void;   // get notified of changes; returns unsubscribe
};
```

A minimal implementation:

```ts
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState(next: T | ((prev: T) => T)) {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
      if (Object.is(value, state)) return;     // nothing changed, so don't notify
      state = value;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

It's around 15 lines, the **observer pattern** applied to state. Zustand's core works the same way.

## `useSyncExternalStore`

React provides one hook to connect any such store safely:

```tsx
import { useSyncExternalStore } from 'react';

const gameStore = createStore({ gold: 0, xp: 0 });

function GoldDisplay() {
  const gold = useSyncExternalStore(gameStore.subscribe, () => gameStore.getState().gold);
  return <span>{gold} gold</span>;
}
```

- `subscribe` is called by React to listen for changes.
- `getSnapshot` is called during render (and after each notification) to read the current value. If the value changed (by `Object.is`), the component re-renders.
- It's "sync" because it guarantees every component sees the **same** snapshot during a render. Without it, concurrent rendering could show "tearing" (two components showing different versions of the state).

### The golden rule of `getSnapshot`
**It must return the same reference if nothing changed.** This causes an infinite loop:

```tsx
useSyncExternalStore(store.subscribe, () => ({ gold: store.getState().gold }));
// ❌ a NEW object every call, so React thinks it changed every time and re-renders forever
```

Return primitives, or existing objects from the state. If you need derived objects, memoise them (or use Zustand's `useShallow`, below).

### Selectors
Selecting a slice is what makes this efficient: `GoldDisplay` doesn't re-render when only `xp` changes.

```tsx
function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

const gold = useStore(gameStore, (s) => s.gold);
```

You'll build `createStore` and `useStore` yourself in exercise 08-03.

## Zustand

**Zustand** ("state" in German) is a tiny library (about 1 KB) built on exactly these ideas, and one of the most popular React state libraries. It's what you'll use for your game.

### Creating a store
```ts
import { create } from 'zustand';

type ShopState = {
  gold: number;
  owned: string[];
  addGold: (amount: number) => void;
  buy: (itemId: string, price: number) => void;
};

export const useShopStore = create<ShopState>()((set, get) => ({
  gold: 100,
  owned: [],
  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),   // set() MERGES into the state (shallowly)
  buy: (itemId, price) => {
    const { gold, owned } = get();                                // read the current state
    if (gold < price || owned.includes(itemId)) return;
    set({ gold: gold - price, owned: [...owned, itemId] });
  },
}));
```

- State and **actions** live together in one object.
- `set(partial)` or `set((state) => partial)` **shallow-merges** into the state. You don't spread the top level, but nested objects still need immutable updates (or Immer middleware).
- `get()` reads the latest state inside actions.
- (The extra `()` in `create<ShopState>()(...)` is a TypeScript quirk that lets Zustand infer middleware types. Just remember to write it.)

### Using it: always with a selector
```tsx
function GoldDisplay() {
  const gold = useShopStore((s) => s.gold);          // re-renders only when gold changes
  return <span>{gold} gold</span>;
}

function BuyButton({ itemId, price }: { itemId: string; price: number }) {
  const buy = useShopStore((s) => s.buy);            // actions never change → never re-renders for state
  const canAfford = useShopStore((s) => s.gold >= price);   // a derived boolean: re-renders only when it flips!
  return <button disabled={!canAfford} onClick={() => buy(itemId, price)}>Buy</button>;
}
```

> ⚠️ `const state = useShopStore()` with **no selector** subscribes to everything, so the component re-renders on *any* change. Always select.

### Selecting several values: `useShallow`
```tsx
import { useShallow } from 'zustand/react/shallow';

const { gold, owned } = useShopStore(useShallow((s) => ({ gold: s.gold, owned: s.owned })));
```

Without `useShallow`, the selector returns a **new object** every time, so the component re-renders on every store change (the same golden rule as `getSnapshot`). `useShallow` compares the object's properties shallowly instead.

### Outside React
```ts
useShopStore.getState().addGold(10);                 // call an action from anywhere (the game loop!)
useShopStore.getState().gold;                        // read
useShopStore.setState({ gold: 0 });                  // write (handy in tests)
const unsub = useShopStore.subscribe((state, prev) => {
  if (state.gold !== prev.gold) console.log('gold changed');
});
```

This is the key feature for your game. In Module 14 the game loop calls `useGameStore.getState().tick(dt)` on a timer, and React components just subscribe to slices.

### Middleware
```ts
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export const useSettingsStore = create<SettingsState>()(
  devtools(                                      // Redux DevTools browser extension integration
    persist(                                     // saves to localStorage automatically
      immer((set) => ({
        volume: 0.8,
        setVolume: (v) => set((draft) => { draft.volume = v; }),   // Immer-style updates
      })),
      { name: 'settings', version: 1 },          // storage key + version (with a migrate option!)
    ),
  ),
);
```

### Testing stores
For tests, export a **factory** rather than only a singleton, so each test gets a fresh store:

```ts
import { createStore } from 'zustand/vanilla';

export const createShopStore = (initialGold = 100) =>
  createStore<ShopState>()((set, get) => ({ gold: initialGold, /* … */ }));

// in components: useStore(store, selector) from 'zustand'
```

Exercise 08-04 uses this pattern.

## The landscape

| Library | Model | Notes |
|---|---|---|
| **Zustand** | a store with actions + selectors | minimal, flexible, very popular. **This course's choice.** |
| **Redux Toolkit** | a single store, slices, reducers, actions | the long-standing industry standard, common in large or older codebases. Uses Immer internally. |
| **Jotai** | atoms (small independent pieces of state) | bottom-up, fine-grained |
| **MobX** | observable objects, auto-tracking | mutable style, less common in new code |
| **TanStack Query** | *server* state cache | not a replacement for these. It's for API data (10.4) |
| **XState** | state machines | for complex flows. Similar to the sync state machine in 18.5 |

The ideas carry over between them: a store, actions or reducers, selectors and subscriptions. If you can explain this lesson, you can pick up any of them in a day, and that's worth saying in interviews.

## Check your understanding

1. What two functions does `useSyncExternalStore` need?
2. Why does `useSyncExternalStore(sub, () => ({ gold: s.gold }))` loop forever?
3. In Zustand, what's the difference between `useStore((s) => s.gold)` and `useStore()`?
4. A selector returns `s.gold >= 100`. When does the component re-render?
5. How does the game loop (not a React component) update a Zustand store?

<details><summary>Answers</summary>

1. `subscribe(listener) => unsubscribe` and `getSnapshot() => value`.
2. `getSnapshot` returns a new object on every call, so React always sees a "changed" snapshot and re-renders, which calls it again, and so on.
3. With a selector, the component re-renders only when `gold` changes. With no selector, it subscribes to the whole state and re-renders on any change.
4. Only when the boolean flips between `true` and `false`, not on every gold change.
5. `useGameStore.getState().someAction(...)` (or `setState`), from anywhere. Subscribed components re-render based on their selectors.
</details>

## Further reading
- react.dev: [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore)
- Zustand docs: https://zustand.docs.pmnd.rs ("Getting Started", "Updating state", "Prevent rerenders with useShallow", "Testing")
- Redux Toolkit "Quick Start", worth skimming so you recognise it at work

**Practice:** exercises `08-03` build-your-own-store and `08-04` zustand-shop

---
[← Immer](04-immer.md) · [Module overview](README.md) · [Next module: React + TypeScript Patterns & Performance →](../09-react-patterns/README.md)
