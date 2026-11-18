# 08.3 · Reducer + context

> ⏱ 1.5 hours · Module 08 · Managing Complex State

## What you'll learn
- Combining `useReducer` and context into a scalable state pattern
- Separate state and dispatch contexts
- Organising the files
- The limits of the pattern, and when to move to a store

---

## The pattern

Reducers centralise **how** state changes. Context makes state available **anywhere**. Together they give you a small, dependency-free state management system:

```
            GameProvider
            ├─ useReducer(gameReducer, initialState) → [state, dispatch]
            ├─ <GameStateContext value={state}>
            └─ <GameDispatchContext value={dispatch}>
                   │
     ┌─────────────┼────────────────────┐
 SkillCard     BankGrid           SellButton
 useGameState() useGameState()    useGameDispatch()  ← never re-renders on state changes
```

## Implementation

```tsx
// features/game/GameProvider.tsx
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { gameReducer, initialGameState, type GameAction, type GameState } from './gameReducer';

const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

export function GameProvider({ children, initial = initialGameState }: { children: ReactNode; initial?: GameState }) {
  const [state, dispatch] = useReducer(gameReducer, initial);
  return (
    <GameDispatchContext value={dispatch}>
      <GameStateContext value={state}>{children}</GameStateContext>
    </GameDispatchContext>
  );
}

export function useGameState(): GameState {
  const state = useContext(GameStateContext);
  if (state === null) throw new Error('useGameState must be used within a GameProvider');
  return state;
}

export function useGameDispatch(): Dispatch<GameAction> {
  const dispatch = useContext(GameDispatchContext);
  if (dispatch === null) throw new Error('useGameDispatch must be used within a GameProvider');
  return dispatch;
}
```

Notice that `dispatch` needs no `useMemo`: React already guarantees it's stable.

```tsx
// features/game/gameReducer.ts: pure, framework-free, unit-tested
export type GameState = { gold: number; bank: Record<string, number>; activeAction: ActiveAction | null };
export type GameAction =
  | { type: 'actionStarted'; skillId: SkillId; actionId: string }
  | { type: 'actionStopped' }
  | { type: 'itemsSold'; itemId: string; quantity: number; price: number };
export const initialGameState: GameState = { gold: 0, bank: {}, activeAction: null };
export function gameReducer(state: GameState, action: GameAction): GameState { … }
```

Using it:

```tsx
// main.tsx
<GameProvider>
  <App />
</GameProvider>

// anywhere below
function SellButton({ itemId }: { itemId: string }) {
  const dispatch = useGameDispatch();
  return (
    <button onClick={() => dispatch({ type: 'itemsSold', itemId, quantity: 1, price: 20 })}>
      Sell
    </button>
  );
}

function GoldDisplay() {
  const { gold } = useGameState();
  return <span>{gold} gold</span>;
}
```

## Domain-specific hooks

Hide the raw dispatch behind intention-revealing hooks:

```tsx
export function useGameActions() {
  const dispatch = useGameDispatch();
  return useMemo(() => ({
    startAction: (skillId: SkillId, actionId: string) => dispatch({ type: 'actionStarted', skillId, actionId }),
    stopAction: () => dispatch({ type: 'actionStopped' }),
    sell: (itemId: string, quantity: number, price: number) => dispatch({ type: 'itemsSold', itemId, quantity, price }),
  }), [dispatch]);
}

const { sell } = useGameActions();
sell('trout', 1, 20);
```

Components no longer know action shapes. You can change the action design without touching them.

## Organising files

```
features/game/
  gameReducer.ts         ← pure state logic + types
  gameReducer.test.ts    ← fast unit tests
  GameProvider.tsx       ← contexts + provider + hooks
  selectors.ts           ← derived data: selectTotalBankValue(state), selectLevel(state, skillId)
```

**Selectors** are pure functions that derive data from state. They keep derivation logic in one place and reusable:

```ts
export const selectBankValue = (s: GameState) =>
  Object.entries(s.bank).reduce((sum, [id, qty]) => sum + qty * (ITEMS[id]?.sellPrice ?? 0), 0);
```

## The limits

Reducer + context is excellent for **moderate** apps and for state that changes on user actions. Its weakness is the one from 08.2: **every `useGameState()` consumer re-renders on every state change**. You can split contexts further, but there's a ceiling.

For your idle game the state changes on **every tick** (progress, XP, items, several times a second). With reducer + context, every component that reads any game state would re-render ten times a second: the bank grid, the skill list, the header.

That's why the next lesson introduces Immer (for readable updates), and the one after introduces **external stores**, where components subscribe to exactly the slice they need. Your game in Module 14 will use a store. Knowing reducer + context is still essential: it's very common in codebases and in interviews, and the reducer you write is reusable inside a store.

## Check your understanding

1. Why provide `state` and `dispatch` in separate contexts?
2. Does the dispatch context value need `useMemo`?
3. What's a selector, and why put selectors in their own file?
4. What's the main performance limitation of reducer + context?

<details><summary>Answers</summary>

1. Components that only dispatch (buttons) then don't re-render when state changes, because the dispatch context value never changes.
2. No. React guarantees `dispatch` is a stable reference.
3. A pure function that derives data from state. Keeping them together makes derivations reusable, testable and consistent across components.
4. Every consumer of the state context re-renders on every state change, whatever part of the state it actually uses.
</details>

## Further reading
- react.dev: [Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)

---
[← Context](02-context.md) · [Module overview](README.md) · [Next: Immer →](04-immer.md)
