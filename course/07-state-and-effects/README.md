# Module 07 · State & Effects

**Time:** ~20 hours · **Prerequisites:** Module 06, and lesson 01.2 (closures) fresh in your mind

## Why this module matters
**This is the most important module in the course.** Nearly every confusing React bug comes from a misunderstanding covered here: state "not updating", effects running in loops, intervals that freeze at one value, data that gets out of sync. Your idle game is built from timers, state that changes many times a second, and storage synchronisation, so it will expose every one of these misunderstandings. Take your time, type out every example, and re-read the lessons that don't click first time.

## Learning objectives
By the end of this module you can:
- explain state as a per-render snapshot, and use updater functions for queued updates
- structure state with no redundant or duplicated data, and lift it to the right place
- use refs for values that shouldn't trigger renders, and for DOM access
- write effects that synchronise with external systems, with correct dependencies and cleanup
- recognise when you *don't* need an effect (most of the time)
- build timers in React without stale closures
- extract reusable logic into custom hooks

## Lessons
| # | Lesson | Time |
|---|---|---|
| 07.1 | [State as a snapshot](01-state-as-a-snapshot.md) | 2h |
| 07.2 | [Structuring & lifting state](02-structuring-and-lifting-state.md) | 2.5h |
| 07.3 | [Refs](03-refs.md) | 1.5h |
| 07.4 | [Effects & synchronization](04-effects-and-synchronization.md) | 3h |
| 07.5 | [You might not need an effect](05-you-might-not-need-an-effect.md) | 2h |
| 07.6 | [Timers & stale closures](06-timers-and-stale-closures.md) | 2.5h |
| 07.7 | [Custom hooks](07-custom-hooks.md) | 2h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `07-01` | [snapshot-bugs](../../exercises/07-state-and-effects/01-snapshot-bugs/exercise.tsx) | 07.1 |
| `07-02` | [lifting-state](../../exercises/07-state-and-effects/02-lifting-state/exercise.tsx) | 07.2 |
| `07-03` | [use-interval](../../exercises/07-state-and-effects/03-use-interval/exercise.ts) | 07.6 |
| `07-04` | [use-local-storage](../../exercises/07-state-and-effects/04-use-local-storage/exercise.ts) | 07.7 |
| `07-05` | [countdown-timer](../../exercises/07-state-and-effects/05-countdown-timer/exercise.tsx) | 07.7 |

Hints: [`exercises/07-state-and-effects/HINTS.md`](../../exercises/07-state-and-effects/HINTS.md)

## Checkpoint quiz
1. `setCount(count + 1)` three times in one handler increases `count` by how much? How do you make it +3?
2. You store `items` and `selectedItem` (a copy of one item) in state. What bug is waiting to happen? What should you store instead?
3. When should a value live in a ref instead of state?
4. What's the difference between `useEffect(fn)`, `useEffect(fn, [])` and `useEffect(fn, [id])`?
5. Why does React run your effect twice in development?
6. A component computes `fullName` from `first` and `last` in an effect that calls `setFullName`. What's wrong with that?
7. Why does `setInterval(() => setTicks(ticks + 1), 1000)` inside `useEffect(..., [])` stop at 1?
8. What makes a function a custom hook, and do two components calling the same custom hook share state?

<details><summary>Answers</summary>

1. By 1. Each call uses the same snapshot value of `count`. Use updater functions: `setCount((c) => c + 1)` three times.
2. When the item is updated in `items`, the copy in `selectedItem` goes stale. Store `selectedId` instead and derive the item: `items.find((i) => i.id === selectedId)`.
3. When the value must persist across renders but changing it shouldn't re-render the component, and it isn't used to compute the rendered output: timer ids, previous values, DOM nodes, "latest callback" storage.
4. With no array it runs after every render. With `[]` it runs after the first render only (plus the StrictMode re-run in development). With `[id]` it runs after the first render and whenever `id` changes.
5. StrictMode mounts, unmounts and re-mounts to check that your cleanup correctly undoes your setup.
6. It causes an extra render with stale data first, and it's more code. Derive it during render: `const fullName = first + ' ' + last`.
7. The interval's callback closed over the first render's `ticks` (0), so it calls `setTicks(0 + 1)` forever. Use the updater form `setTicks((t) => t + 1)`, or a ref holding the latest callback.
8. Its name starts with `use` and it calls other hooks. No: each call gets its own independent state. Custom hooks share *logic*, not state.
</details>

## Extra practice
1. **Refactor hunt.** Go back to your Module 06 exercises. Is there any derived value you stored in state? Any effect you could remove?
2. **`usePrevious(value)`.** Return the value from the previous render. (Hint: a ref plus an effect, or the "store info from previous renders" pattern from react.dev.)
3. **`useDebouncedValue(value, ms)`.** Return a value that only updates after `value` hasn't changed for `ms`. Use it for a search box.
4. **`useOnlineStatus()`.** Subscribe to the `online`/`offline` window events. Your sync code in Module 18 will need it.
5. **Read** the react.dev "Escape Hatches" chapter end to end. It's the best writing on effects anywhere.

**Next:** [Module 08 · Managing Complex State →](../08-complex-state/README.md)
