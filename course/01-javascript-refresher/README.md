# Module 01 · JavaScript You'll Use Every Day

**Time:** ~12 hours · **Prerequisites:** Module 00, a completed JavaScript course

## Why this module matters
You already know JavaScript syntax. This module is about the **behaviour** underneath it. Most React bugs juniors write trace back to a handful of JavaScript concepts: references vs values, closures, and the event loop. Interviewers ask about exactly these for the same reason. Learn them properly now and Modules 07 and 13 become much easier.

## Learning objectives
By the end of this module you can:
- explain the difference between a value and a reference, and update nested data immutably
- explain what a closure captures, and use closures to build counters, `once`, `memoize` and `debounce`
- transform data fluently with `map`/`filter`/`reduce`, `Object.entries`, `Map` and `Set`
- predict the output order of code mixing synchronous code, timers and promises
- write robust async code with `async`/`await`, error handling, timeouts and retries
- organise code into ES modules

## Lessons
| # | Lesson | Time |
|---|---|---|
| 01.1 | [Values, references & immutability](01-values-references-and-immutability.md) | 90 min |
| 01.2 | [Functions & closures](02-functions-and-closures.md) | 90 min |
| 01.3 | [Array & object power tools](03-arrays-and-objects-power-tools.md) | 75 min |
| 01.4 | [The event loop, timers & promises](04-the-event-loop-timers-and-promises.md) | 90 min |
| 01.5 | [async/await & error handling](05-async-await-and-errors.md) | 75 min |
| 01.6 | [Modules](06-modules.md) | 45 min |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `01-01` | [immutable-updates](../../exercises/01-javascript-refresher/01-immutable-updates/exercise.ts) | 01.1 |
| `01-02` | [closures](../../exercises/01-javascript-refresher/02-closures/exercise.ts) | 01.2 |
| `01-03` | [data-transforms](../../exercises/01-javascript-refresher/03-data-transforms/exercise.ts) | 01.3 |
| `01-04` | [async-control-flow](../../exercises/01-javascript-refresher/04-async-control-flow/exercise.ts) | 01.5 |

Hints: [`exercises/01-javascript-refresher/HINTS.md`](../../exercises/01-javascript-refresher/HINTS.md)

## Checkpoint quiz
1. `const a = { hp: 10 }; const b = a; b.hp = 5;` What is `a.hp`, and why?
2. What does a closure "remember": the *value* of a variable, or the variable itself?
3. In what order do these log? `console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); console.log(4);`
4. Why might `setInterval(tick, 1000)` run far fewer than 60 times in a minute if the tab is in the background?
5. What's wrong with `items.forEach(async (item) => await save(item))` if you want to know when all saves have finished?
6. Why does `[...state.items].sort()` avoid a bug that `state.items.sort()` causes?

<details><summary>Answers</summary>

1. `5`. `b = a` copies the *reference*, so both names point to the same object.
2. The variable itself (the binding). If the variable changes later, the closure sees the new value. In React each render creates *new* variables, which is why closures can look "stale" there.
3. `1, 4, 3, 2`. First the synchronous code, then microtasks (promise callbacks), then tasks (timers).
4. Browsers throttle timers in background tabs: Chrome limits them to roughly once per second and, after a while, once per minute. That's why idle games measure elapsed time with timestamps instead of counting ticks.
5. `forEach` ignores the promises the callback returns, so nothing waits for them. Use `await Promise.all(items.map(save))`, or a `for...of` loop with `await` to run them one at a time.
6. `.sort()` sorts *in place*, mutating the original array (and React state). Copying first, or using `.toSorted()`, leaves the original untouched.
</details>

## Extra practice
1. **Deep freeze.** Write `deepFreeze(obj)` that recursively `Object.freeze`s every nested object and array. Use it on test inputs to catch accidental mutation.
2. **Event loop puzzles.** Write five snippets mixing `setTimeout`, `Promise.then`, `queueMicrotask` and `async` functions. Predict the order, then run them. Explain any surprises in your journal.
3. **Throttle.** You built `debounce` in exercise 01-02. Now write `throttle(fn, ms)`, which calls at most once per `ms`. Explain in a comment when you'd use each one.
4. **Promise pool.** Write `mapWithConcurrency(items, limit, fn)`, which runs at most `limit` async calls at a time and keeps results in order. (This comes up in interviews.)

**Next:** [Module 02 · TypeScript in Depth →](../02-typescript/README.md)
