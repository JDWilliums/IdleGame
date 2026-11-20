/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 18-03 · sync-state-machine
 * Lesson:  18.5 The sync engine
 * Run:     npm run watch 18-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The brain of the sync engine: a pure reducer, plus a pure "should we upload
 * now?" check. The engine around it (timers, fetch) is in lesson 18.5.
 *
 * TASK 1 · backoffMs(attempt) → number
 *   1 → 1000, 2 → 2000, 3 → 4000 … doubling, capped at 60_000.
 *
 * TASK 2 · syncReducer(state, event) → SyncState
 *   Transitions (anything not listed returns the SAME state object, unchanged):
 *
 *   localChanged { at }
 *     idle     → dirty, dirtySince = at
 *     syncing  → changedWhileSyncing = true
 *     error, conflict → dirtySince = dirtySince ?? at   (the phase doesn't change)
 *     (dirty: nothing to do)
 *   syncStarted { at }            from dirty or error
 *     → syncing, changedWhileSyncing = false, retryAt = null
 *   syncSucceeded { revision, at } from syncing
 *     → baseRevision = revision, attempt = 0, retryAt = null, lastSyncedAt = at,
 *       changedWhileSyncing = false, and then:
 *       if changes arrived during the upload → dirty, dirtySince = at
 *       otherwise                              → idle,  dirtySince = null
 *   syncConflict { remote }       from syncing
 *     → conflict, conflict = remote, attempt = 0, retryAt = null, changedWhileSyncing = false
 *   syncFailed { at }             from syncing
 *     → error, attempt + 1, retryAt = at + backoffMs(new attempt), changedWhileSyncing = false
 *   wentOffline                   → online = false
 *   cameOnline { at }             → online = true; if in error, retryAt = at (retry promptly)
 *   conflictResolved { choice, at } from conflict
 *     → conflict = null, baseRevision = the conflict's remote revision, and:
 *       keepLocal → dirty, dirtySince = at
 *       useRemote → idle,  dirtySince = null, lastSyncedAt = at
 *
 *   "Unchanged" means returning the very same object, so the engine can skip
 *   notifying subscribers. That matters: localChanged fires on every game tick.
 *   It applies to no-op online/offline events too.
 *
 * TASK 3 · shouldSyncNow(state, now, { intervalMs = 30_000, force = false }) → boolean
 *   - never while offline, and never when idle, syncing or in conflict
 *   - dirty: once it has been dirty for at least intervalMs (or immediately if force)
 *   - error: once now has reached retryAt (or immediately if force)
 */

// ─── provided ─────────────────────────────────────────────────────────────────
export type RemoteSave = { data: unknown; revision: number; updatedAt: string };

export type SyncState = {
  phase: 'idle' | 'dirty' | 'syncing' | 'conflict' | 'error';
  online: boolean;
  /** The server revision the local save is based on. */
  baseRevision: number;
  /** When the oldest not-yet-uploaded change happened (null when everything is uploaded). */
  dirtySince: number | null;
  /** Local changes arrived while an upload was in flight. */
  changedWhileSyncing: boolean;
  /** Consecutive failed uploads. */
  attempt: number;
  /** When the next retry may start (in the error phase). */
  retryAt: number | null;
  /** The server's save, while in the conflict phase. */
  conflict: RemoteSave | null;
  lastSyncedAt: number | null;
};

export type SyncEvent =
  | { type: 'localChanged'; at: number }
  | { type: 'syncStarted'; at: number }
  | { type: 'syncSucceeded'; revision: number; at: number }
  | { type: 'syncConflict'; remote: RemoteSave }
  | { type: 'syncFailed'; at: number }
  | { type: 'wentOffline' }
  | { type: 'cameOnline'; at: number }
  | { type: 'conflictResolved'; choice: 'keepLocal' | 'useRemote'; at: number };

export function initialSyncState(options: {
  baseRevision: number;
  dirtySince?: number | null;
  online?: boolean;
}): SyncState {
  const dirtySince = options.dirtySince ?? null;
  return {
    phase: dirtySince === null ? 'idle' : 'dirty',
    online: options.online ?? true,
    baseRevision: options.baseRevision,
    dirtySince,
    changedWhileSyncing: false,
    attempt: 0,
    retryAt: null,
    conflict: null,
    lastSyncedAt: null,
  };
}

// ─── your code ────────────────────────────────────────────────────────────────
export function backoffMs(attempt: number): number {
  throw new Error('Not implemented yet');
}

export function syncReducer(state: SyncState, event: SyncEvent): SyncState {
  throw new Error('Not implemented yet');
}

export function shouldSyncNow(
  state: SyncState,
  now: number,
  options: { intervalMs?: number; force?: boolean } = {},
): boolean {
  throw new Error('Not implemented yet');
}
