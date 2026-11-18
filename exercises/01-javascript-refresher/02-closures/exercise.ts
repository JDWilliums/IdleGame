/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 01-02 · closures
 * Lesson:  01.2 Functions & closures
 * Run:     npm run watch 01-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every function here returns ANOTHER function (or an object of functions) that
 * "remembers" private state through a closure. No module-level variables
 * allowed: each call must create its own independent state.
 *
 * The type signatures are written for you (some use generics, which you'll
 * study properly in 02.5). You only need to write the function bodies.
 *
 * TASK 1 · createIdGenerator(prefix)
 *   Returns a function that produces "<prefix>-1", "<prefix>-2", ... each call.
 *   Two generators must count independently.
 *
 * TASK 2 · createCounter(start = 0)
 *   Returns { increment, decrement, reset, value }.
 *   increment/decrement change the count by 1 and RETURN the new count.
 *   reset() goes back to the ORIGINAL start value. value() returns the count.
 *
 * TASK 3 · once(fn)
 *   Returns a function that calls `fn` the first time only (passing along any
 *   arguments), and on every later call returns the FIRST result again without
 *   calling `fn`.
 *
 * TASK 4 · memoize(fn)
 *   For single-argument functions. Returns a function that caches results by
 *   argument: calling it twice with the same argument calls `fn` only once.
 *   Hint: a Map is a great cache.
 *
 * TASK 5 · debounce(fn, ms)
 *   Returns a function that delays calling `fn` until `ms` milliseconds have
 *   passed WITHOUT another call. If called again during the wait, the timer
 *   restarts. `fn` receives the arguments of the LAST call.
 *   (Tests use fake timers, so no real waiting happens.)
 */

export function createIdGenerator(prefix: string): () => string {
  throw new Error('Not implemented yet');
}

export type Counter = {
  increment: () => number;
  decrement: () => number;
  reset: () => void;
  value: () => number;
};

export function createCounter(start = 0): Counter {
  throw new Error('Not implemented yet');
}

export function once<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  throw new Error('Not implemented yet');
}

export function memoize<Arg, Result>(fn: (arg: Arg) => Result): (arg: Arg) => Result {
  throw new Error('Not implemented yet');
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
): (...args: Args) => void {
  throw new Error('Not implemented yet');
}
