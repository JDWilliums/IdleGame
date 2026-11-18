/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 10-02 · use-fetch
 * Lesson:  10.3 Fetching data the hard way
 * Run:     npm run watch 10-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Write a correct, race-condition-free data-fetching hook. (After this you'll
 * appreciate TanStack Query a lot more.)
 *
 *   const state = useFetch('/api/leaderboard?skill=fishing', RowsSchema);
 *   if (state.status === 'success') state.data   // typed from the schema
 *
 * Returns an AsyncState<T> plus a `refetch()` function.
 *
 * Requirements:
 *   1. url === null → { status: 'idle' }, no request.
 *   2. Otherwise: { status: 'loading' } → then { status: 'success', data } with
 *      the JSON body parsed by `schema`.
 *   3. Response not ok      → { status: 'error', error: `HTTP ${status}` }
 *   4. Bad JSON / schema    → { status: 'error', error: 'Invalid response' }
 *   5. Network failure      → { status: 'error', error: 'Network error' }
 *   6. Pass an AbortSignal to fetchFn. ABORT the in-flight request when the url
 *      changes and when the component unmounts. An abort is NOT an error:
 *      never show it.
 *   7. Race safety: a stale response (from an old url) must NEVER overwrite
 *      newer state, even if fetchFn ignores the abort signal.
 *   8. refetch() requests the same url again (loading → success/error).
 *
 * `schema` and `fetchFn` are stable in the tests (defined at module level).
 */
import type { z } from 'zod';

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export type UseFetchResult<T> = AsyncState<T> & { refetch: () => void };

export function useFetch<T>(
  url: string | null,
  schema: z.ZodType<T>,
  fetchFn: typeof fetch = fetch,
): UseFetchResult<T> {
  throw new Error('Not implemented yet');
}
