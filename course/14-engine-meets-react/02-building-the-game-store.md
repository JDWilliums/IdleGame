# 14.2 · Building the game store

> ⏱ 2.5 hours · Module 14 · Connecting the Engine to React

## What you'll learn
- Wrapping the pure engine in a Zustand (vanilla) store
- Store actions that delegate to engine functions
- An event emitter alongside the store
- Selectors: designing them for render efficiency
- Testing the store without React, then with React

---

## The shape

```ts
import { createStore, type StoreApi } from 'zustand/vanilla';

export type GameStoreState = {
  game: GameState;                                   // the pure engine state
  startAction: (id: ActionId) => void;
  stopAction: () => void;
  sell: (itemId: ItemId, qty: number) => void;
  advance: (dtMs: number) => void;                    // called by the loop
  catchUp: (now: number) => OfflineSummary;           // called on load/visibility/large gaps
  subscribeEvents: (listener: (events: GameEvent[]) => void) => () => void;
};
```

The store holds **one** `game` object (the save-able state) plus **actions**. Actions are thin: they call engine functions and store the result.

```ts
export function createGameStore(initial: GameState, deps: { now: () => number; rng: Rng }): StoreApi<GameStoreState> {
  const listeners = new Set<(events: GameEvent[]) => void>();
  const emit = (events: GameEvent[]) => { if (events.length) listeners.forEach((l) => l(events)); };

  return createStore<GameStoreState>()((set, get) => {
    // Only store a new object when the engine actually changed something.
    const update = (next: GameState) => { if (next !== get().game) set({ game: next }); };

    return {
      game: initial,
      startAction: (id) => update(startAction(get().game, id)),
      stopAction: () => update(stopAction(get().game)),
      sell: (itemId, qty) => update(sellItems(get().game, itemId, qty)),
      advance: (dtMs) => {
        const { state, events } = tick(get().game, dtMs, deps.rng);
        update(state === get().game ? state : { ...state, lastUpdatedAt: deps.now() });
        emit(events);
      },
      catchUp: (now) => {
        const { state, summary } = catchUp(get().game, now, OFFLINE_CAP_MS);
        update(state);
        return summary;
      },
      subscribeEvents: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  });
}
```

Notes:
- **A factory, not a singleton.** Tests create a fresh store, and the app creates one in `runtime.ts` (08.5).
- **Dependencies are injected** (`now`, `rng`), so tests are deterministic (12.4).
- **"No change, no set"**: when the engine returns the same state object, don't call `set`, and no subscriber does any work. Idle players cost nothing.
- **The event emitter** lives in the closure, not in the state, because events aren't state.

### Should `lastUpdatedAt` change every tick?
`lastUpdatedAt` records how far the simulation has advanced in wall-clock terms. If it lags, a reload would re-apply time that was already simulated. So update it whenever the simulation advances, as above. If nothing is active, it's fine to leave it alone and let `catchUp` move it forward on the next load.

## Hooks for React

```ts
import { useStore } from 'zustand';

export function useGame<T>(selector: (s: GameStoreState) => T): T {
  return useStore(gameStore, selector);
}
```

## Selectors: the performance lever

Every subscribed component re-runs its selector after **every** store update (10 per second while active) and re-renders only if the result changed (`Object.is`). So design selectors to return **values that rarely change**:

```ts
// ✅ primitives: re-render only when this number changes
export const selectGold = (s: GameStoreState) => s.game.gold;
export const selectItemCount = (id: ItemId) => (s: GameStoreState) => s.game.bank[id] ?? 0;
export const selectLevel = (skill: SkillId) => (s: GameStoreState) => levelFromXp(s.game.skills[skill].xp);

// ✅ a stable reference: the bank object only changes when items change (structural sharing, 13.5)
export const selectBank = (s: GameStoreState) => s.game.bank;

// ⚠️ changes EVERY tick while active, so keep its subscribers tiny (14.3)
export const selectProgressMs = (s: GameStoreState) => s.game.activeAction?.progressMs ?? 0;

// ❌ a new object every call: an infinite re-render risk, or a re-render on every tick
const bad = (s: GameStoreState) => ({ gold: s.game.gold, level: levelFromXp(s.game.skills.mining.xp) });
// ✅ if you need several values, use useShallow (08.5)
```

Look at what structural sharing buys you here. Your 13-04 tick returns the **same `bank` object** when no completion happens, so a bank grid selecting `s.game.bank` re-renders only when an item actually arrives, about every 3 seconds instead of every 100 ms.

### Derived selectors
`selectLevel` computes `levelFromXp` on every store update. That's cheap (binary search!), and since it returns a primitive, the component only re-renders when the level changes. For expensive derivations (bank value over 500 items), memoise on the input reference:

```ts
let lastBank: Bank | undefined;
let lastValue = 0;
export const selectBankValue = (s: GameStoreState) => {
  if (s.game.bank !== lastBank) { lastBank = s.game.bank; lastValue = computeBankValue(lastBank); }
  return lastValue;
};
```

## Testing

**Without React first**. It's just a store:

```ts
it('advances the engine and emits events', () => {
  const store = createGameStore(stateChopping(), { now: () => 1000, rng: createRng(1) });
  const events: GameEvent[] = [];
  store.getState().subscribeEvents((e) => events.push(...e));
  store.getState().advance(3000);
  expect(store.getState().game.bank.oak_log).toBe(1);
  expect(events).toContainEqual({ type: 'itemsGained', itemId: 'oak_log', qty: 1 });
});
```

**Then with React**, to check the selector wiring and render counts (09-04's techniques):

```tsx
it('the bank count does not re-render on progress-only ticks', () => { … <Profiler> … advance(100) … });
```

You'll do both in exercise 14-01.

## Check your understanding

1. Why does `advance` check `next !== get().game` before calling `set`?
2. Why is the event emitter not part of the Zustand state?
3. A component uses `useGame((s) => s.game.bank)`. How often does it re-render while chopping a 3-second tree with 100 ms ticks?
4. What's wrong with a selector that returns `{ gold, level }`?

<details><summary>Answers</summary>

1. If the engine returned the same object (nothing changed), skipping `set` means no subscriber has to re-check anything and no component re-renders.
2. Events are transient notifications, not state. Storing them would require clearing them, would bloat saves, and would re-trigger handlers on re-subscription.
3. Roughly once per completion (every 3 s), because structural sharing keeps the same `bank` reference on ticks with no completion.
4. It creates a new object on every call, so `Object.is` always sees a change. The component re-renders on every store update (or loops with `useSyncExternalStore`'s check). Select primitives separately, or use `useShallow`.
</details>

## Further reading
- Zustand docs: "Vanilla stores", "Prevent rerenders with useShallow", "Transient updates"

**Practice:** exercise `14-01` game-store → `npm run watch 14-01`

---
[← Architecture](01-architecture-engine-outside-react.md) · [Module overview](README.md) · [Next: Rendering fast updates →](03-rendering-fast-updates.md)
