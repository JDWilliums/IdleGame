# 08.1 · useReducer

> ⏱ 2 hours · Module 08 · Managing Complex State

## What you'll learn
- What a reducer is, and why the pattern is so common
- `useReducer` with a TypeScript discriminated union of actions
- Purity and immutability in reducers
- Testing reducers as plain functions
- When to choose `useReducer` over `useState`

---

## The problem: update logic scattered everywhere

As components grow, their event handlers grow too:

```tsx
function Bank() {
  const [items, setItems] = useState<Record<string, number>>({});
  const [gold, setGold] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  function handleSell(id: string, qty: number, price: number) {
    const have = items[id] ?? 0;
    if (have < qty) return;
    setItems((prev) => { /* … */ });
    setGold((g) => g + qty * price);
    setLog((l) => [`Sold ${qty} ${id}`, ...l].slice(0, 5));
  }
  function handleDeposit(/* … */) { /* three more setters */ }
  function handleSellAll(/* … */) { /* … */ }
  …
}
```

The rules for how the bank changes are spread across many handlers, each juggling several setters. It's hard to see every possible transition, and hard to test them without rendering the component.

## The reducer pattern

A **reducer** is a pure function that takes the current state and an **action** (a description of what happened) and returns the **next** state:

```ts
(state, action) => newState
```

The name comes from `Array.prototype.reduce`: replaying a list of actions through a reducer "reduces" them to the final state. Redux, Zustand, XState and your game engine all use this idea.

```ts
type BankState = {
  items: Record<string, number>;
  gold: number;
};

type BankAction =
  | { type: 'deposit'; itemId: string; quantity: number }
  | { type: 'sell'; itemId: string; quantity: number; price: number }
  | { type: 'reset' };

function bankReducer(state: BankState, action: BankAction): BankState {
  switch (action.type) {
    case 'deposit':
      return {
        ...state,
        items: { ...state.items, [action.itemId]: (state.items[action.itemId] ?? 0) + action.quantity },
      };
    case 'sell': {
      const have = state.items[action.itemId] ?? 0;
      if (have < action.quantity) return state;           // no change → same reference
      return {
        items: { ...state.items, [action.itemId]: have - action.quantity },
        gold: state.gold + action.quantity * action.price,
      };
    }
    case 'reset':
      return initialBank;
    default:
      return assertNever(action);                         // compile error if a case is missed (02.4)
  }
}
```

That's exactly what you built in exercise 02-03. Now it gets wired into React.

## `useReducer`

```tsx
import { useReducer } from 'react';

const initialBank: BankState = { items: {}, gold: 0 };

function Bank() {
  const [state, dispatch] = useReducer(bankReducer, initialBank);

  return (
    <>
      <p>{state.gold} gold</p>
      <button onClick={() => dispatch({ type: 'deposit', itemId: 'trout', quantity: 1 })}>
        Deposit trout
      </button>
      <button onClick={() => dispatch({ type: 'sell', itemId: 'trout', quantity: 1, price: 20 })}>
        Sell trout
      </button>
    </>
  );
}
```

- `dispatch(action)` tells React "this happened". React calls your reducer with the current state and the action, stores the result, and re-renders if it changed.
- Event handlers now describe **what happened** ("the user sold 1 trout"), not **how state changes**. The how lives in one place.
- `dispatch` is **stable** (the same function every render), so it's safe in dependency arrays and easy to pass down.
- TypeScript checks every dispatch: `dispatch({ type: 'sell', itemId: 'trout' })` is a compile error because `quantity` and `price` are missing.

### Lazy initialisation
The third argument computes the initial state once, which is useful when loading from storage:

```tsx
const [state, dispatch] = useReducer(bankReducer, undefined, () => loadBank() ?? initialBank);
```

## Reducer rules

### 1. Pure: same input, same output, no side effects
```ts
case 'sell':
  fetch('/api/sell', …);           // ❌ side effect
  localStorage.setItem(…);         // ❌ side effect
  const bonus = Math.random();     // ❌ not deterministic
  const at = Date.now();           // ❌ not deterministic
```

React may call your reducer twice in StrictMode, so side effects would run twice. Randomness or time inside it makes behaviour impossible to test or replay.

**So where do random numbers and timestamps go?** Compute them in the event handler (or the game loop) and put them **in the action**:

```ts
dispatch({ type: 'rollLoot', roll: Math.random(), at: Date.now() });
```

The reducer stays pure and deterministic, so the same actions always produce the same state. That's a superpower for testing and debugging your game, and you'll use it in Module 13.

### 2. Never mutate the state
Return new objects (01.1), or use Immer (08.4).

### 3. Return the same state when nothing changes
Returning `state` itself (not a copy) lets React skip the re-render.

### 4. Actions describe *what happened*, not *what to set*
```ts
dispatch({ type: 'setGold', gold: 150 });        // ❌ "setter" actions move the logic back into the component
dispatch({ type: 'itemSold', itemId, quantity }); // ✅ the reducer decides what that means
```

## Testing reducers

Reducers are plain functions, so you can test them without rendering anything:

```ts
import { describe, expect, it } from 'vitest';

describe('bankReducer', () => {
  it('sells items for gold', () => {
    const state = { items: { trout: 3 }, gold: 0 };
    const next = bankReducer(state, { type: 'sell', itemId: 'trout', quantity: 2, price: 20 });
    expect(next).toEqual({ items: { trout: 1 }, gold: 40 });
  });

  it('ignores selling more than you have', () => {
    const state = { items: { trout: 1 }, gold: 0 };
    expect(bankReducer(state, { type: 'sell', itemId: 'trout', quantity: 5, price: 20 })).toBe(state);
  });
});
```

This is why game engines love reducers: you can test every rule of your game in milliseconds.

## `useState` or `useReducer`?

| Prefer `useState` | Prefer `useReducer` |
|---|---|
| independent, simple values (`isOpen`, `searchText`) | several values that change together |
| few kinds of updates | many kinds of updates or complex transitions |
| | the next state depends on complex logic or rules |
| | you want the logic in a testable pure function |
| | you'll share `dispatch` down the tree (08.3) |

They're interchangeable. `useState` is really a reducer whose action is "the new value". It's fine to start with `useState` and convert later.

## Check your understanding

1. What's the signature of a reducer?
2. Why should a reducer return `state` itself when an action changes nothing?
3. Your "rollLoot" reducer case needs a random number. Where should it come from?
4. Is `{ type: 'setInventory', inventory }` a good action? Why not?
5. Why is `dispatch` safe to leave out of dependency arrays?

<details><summary>Answers</summary>

1. `(state: State, action: Action) => State`.
2. Returning the same reference lets React (and memoised selectors) detect that nothing changed and skip re-rendering.
3. Generate it in the event handler or game loop and pass it in the action payload, so the reducer stays pure and deterministic.
4. Not really. It's a "setter" that moves the update logic back into the components. Prefer actions that describe events (`itemsSold`, `itemDeposited`) and let the reducer apply the rules.
5. React guarantees `dispatch` is the same function on every render.
</details>

## Further reading
- react.dev: [Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- react.dev: [`useReducer` reference](https://react.dev/reference/react/useReducer)

**Practice:** exercise `08-01` inventory-reducer → `npm run watch 08-01`

---
[Module overview](README.md) · [Next: Context →](02-context.md)
