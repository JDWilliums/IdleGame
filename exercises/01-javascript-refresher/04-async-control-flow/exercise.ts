/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 01-04 · async-control-flow
 * Lessons: 01.4 The event loop, timers & promises · 01.5 async/await & errors
 * Run:     npm run watch 01-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * These utilities will power your game's cloud-save code in Module 18.
 * The tests use FAKE timers, so they control time precisely: if your code waits
 * the wrong amount of time, a test will tell you.
 *
 * TASK 1 · sleep(ms)
 *   Return a promise that resolves (with no value) after `ms` milliseconds.
 *
 * TASK 2 · TimeoutError + withTimeout(promise, ms)
 *   Complete the TimeoutError class: its `name` must be 'TimeoutError' and its
 *   message must be `Timed out after ${ms}ms`.
 *   withTimeout returns a promise that settles like `promise` does, unless `ms`
 *   passes first, in which case it rejects with a TimeoutError.
 *   IMPORTANT: when `promise` settles first, CLEAR your timer. The tests check
 *   that no timers are left pending, because leaked timers are a real bug.
 *
 * TASK 3 · retry(fn, { retries, baseDelayMs })
 *   Call `fn`. If it rejects, wait and try again, up to `retries` MORE times.
 *   The wait before retry number k (k = 0, 1, 2…) is baseDelayMs × 2^k.
 *     e.g. baseDelayMs 100: fail → wait 100 → fail → wait 200 → fail → wait 400
 *   If every attempt fails, reject with the LAST error.
 *
 * TASK 4 · loadAllInParallel(ids, loader)
 *   Start loading every id at once and resolve with the results IN THE SAME
 *   ORDER as `ids` (not the order they finished).
 *
 * TASK 5 · loadSequentially(ids, loader)
 *   Load one id at a time: don't start the next until the previous finished.
 *   Resolve with the results in order.
 */

export function sleep(ms: number): Promise<void> {
  throw new Error('Not implemented yet');
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super('TODO: write the message');
    // TODO: set the name
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  throw new Error('Not implemented yet');
}

export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
};

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  throw new Error('Not implemented yet');
}

export async function loadAllInParallel<T>(
  ids: string[],
  loader: (id: string) => Promise<T>,
): Promise<T[]> {
  throw new Error('Not implemented yet');
}

export async function loadSequentially<T>(
  ids: string[],
  loader: (id: string) => Promise<T>,
): Promise<T[]> {
  throw new Error('Not implemented yet');
}
