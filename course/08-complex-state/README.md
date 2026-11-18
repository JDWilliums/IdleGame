# Module 08 · Managing Complex State

**Time:** ~14 hours · **Prerequisites:** Module 07, and lesson 02.4 (discriminated unions)

## Why this module matters
`useState` is perfect for a toggle or a text field. Your game, though, has dozens of interacting values (skills, bank, gold, equipment, the active action) updated by many kinds of events, and needed all over the component tree. This module covers the tools for that: **reducers** to centralise update logic, **context** to share it without prop drilling, **Immer** to keep immutable updates readable, and **external stores** (Zustand) for fast-changing state that lives outside React. These tools are the backbone of your game's architecture in Module 14, and they come up constantly in interviews.

## Learning objectives
By the end of this module you can:
- model state transitions as a typed reducer with a discriminated union of actions
- share state with context, type it safely, and avoid unnecessary re-renders
- combine a reducer and context into a clean, scalable pattern
- write immutable updates with Immer
- explain `useSyncExternalStore`, build a tiny store, and use Zustand with selectors

## Lessons
| # | Lesson | Time |
|---|---|---|
| 08.1 | [useReducer](01-use-reducer.md) | 2h |
| 08.2 | [Context](02-context.md) | 2h |
| 08.3 | [Reducer + context](03-reducer-plus-context.md) | 1.5h |
| 08.4 | [Immer](04-immer.md) | 1h |
| 08.5 | [External stores & Zustand](05-external-stores-and-zustand.md) | 2.5h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `08-01` | [inventory-reducer](../../exercises/08-complex-state/01-inventory-reducer/exercise.tsx) | 08.1 |
| `08-02` | [settings-context](../../exercises/08-complex-state/02-settings-context/exercise.tsx) | 08.2 |
| `08-03` | [build-your-own-store](../../exercises/08-complex-state/03-build-your-own-store/exercise.ts) | 08.5 |
| `08-04` | [zustand-shop](../../exercises/08-complex-state/04-zustand-shop/exercise.tsx) | 08.5 |

Hints: [`exercises/08-complex-state/HINTS.md`](../../exercises/08-complex-state/HINTS.md)

## Checkpoint quiz
1. When would you choose `useReducer` over `useState`?
2. Why must a reducer be pure? Name two things it must never do.
3. What problem does context solve? What problem does it *not* solve?
4. Every component that calls `useContext(GameContext)` re-renders when the value changes. How can you reduce this?
5. Why does the "custom hook that throws outside its provider" pattern help?
6. In Immer, what's the difference between mutating the draft and returning a new value?
7. What two functions must you give `useSyncExternalStore`, and what rule must `getSnapshot` follow?
8. Why is a Zustand store a better home for a ticking game state than context?

<details><summary>Answers</summary>

1. When state has several related values updated by many different events, when the next state depends on complex logic, or when you want the update logic in one testable pure function.
2. React may call it more than once (StrictMode), and it must be predictable and testable. It must never mutate the previous state, cause side effects (fetching, timers, storage, logging to servers), or depend on anything other than `state` and `action` (e.g. `Math.random()` or `Date.now()`).
3. It solves passing data deep through many layers ("prop drilling"). It doesn't solve performance or complex update logic, and it isn't a state manager by itself.
4. Split contexts (state vs dispatch, or by domain), memoise the provided value, keep fast-changing values out of widely used contexts, or move the state to an external store with selectors.
5. It gives a clear error immediately if someone forgets the provider (instead of a confusing `undefined` crash later), and it narrows the type so consumers don't need null checks.
6. Mutating the draft lets Immer produce the new state from your changes. Returning a value replaces the state entirely. Do one or the other, never both in the same recipe.
7. `subscribe(callback)` (which returns an unsubscribe function) and `getSnapshot()`. `getSnapshot` must return the **same reference** when nothing changed, otherwise React re-renders forever.
8. The game loop can update it from outside React, and components subscribe with selectors to only the slices they need, so a tick doesn't re-render every consumer the way a context value change does.
</details>

## Extra practice
1. **Undo/redo.** Wrap any reducer in a higher-order reducer: `undoable(reducer)` keeps `{ past, present, future }` and handles `UNDO` and `REDO` actions.
2. **Context performance lab.** Build a context with `{ gold, theme }`. Add `console.count` to five consumers and measure renders. Then split it into two contexts and measure again.
3. **Zustand persist.** Use Zustand's `persist` middleware to save a store to `localStorage`. Read how it handles versioning and migration (you'll need the same idea in lesson 13.10).

**Next:** [Module 09 · React + TypeScript Patterns & Performance →](../09-react-patterns/README.md)
