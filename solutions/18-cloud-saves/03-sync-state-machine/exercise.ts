// Reference solution for 18-03. Read it only AFTER your own version passes.

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

// ─── solution ─────────────────────────────────────────────────────────────────
export function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** (attempt - 1), 60_000);
}

export function syncReducer(state: SyncState, event: SyncEvent): SyncState {
  switch (event.type) {
    case 'localChanged':
      switch (state.phase) {
        case 'idle':
          return { ...state, phase: 'dirty', dirtySince: event.at };
        case 'syncing':
          return state.changedWhileSyncing ? state : { ...state, changedWhileSyncing: true };
        case 'error':
        case 'conflict':
          return state.dirtySince !== null ? state : { ...state, dirtySince: event.at };
        case 'dirty':
          return state;
      }
      return state;

    case 'syncStarted':
      if (state.phase !== 'dirty' && state.phase !== 'error') return state;
      return { ...state, phase: 'syncing', changedWhileSyncing: false, retryAt: null };

    case 'syncSucceeded': {
      if (state.phase !== 'syncing') return state;
      const base = {
        ...state,
        baseRevision: event.revision,
        attempt: 0,
        retryAt: null,
        lastSyncedAt: event.at,
        changedWhileSyncing: false,
      };
      return state.changedWhileSyncing
        ? { ...base, phase: 'dirty', dirtySince: event.at }
        : { ...base, phase: 'idle', dirtySince: null };
    }

    case 'syncConflict':
      if (state.phase !== 'syncing') return state;
      return { ...state, phase: 'conflict', conflict: event.remote, attempt: 0, retryAt: null, changedWhileSyncing: false };

    case 'syncFailed': {
      if (state.phase !== 'syncing') return state;
      const attempt = state.attempt + 1;
      return { ...state, phase: 'error', attempt, retryAt: event.at + backoffMs(attempt), changedWhileSyncing: false };
    }

    case 'wentOffline':
      return state.online ? { ...state, online: false } : state;

    case 'cameOnline':
      if (state.online) return state;
      return { ...state, online: true, ...(state.phase === 'error' ? { retryAt: event.at } : {}) };

    case 'conflictResolved': {
      if (state.phase !== 'conflict' || !state.conflict) return state;
      const base = { ...state, conflict: null, baseRevision: state.conflict.revision };
      return event.choice === 'keepLocal'
        ? { ...base, phase: 'dirty', dirtySince: event.at }
        : { ...base, phase: 'idle', dirtySince: null, lastSyncedAt: event.at };
    }
  }
}

export function shouldSyncNow(
  state: SyncState,
  now: number,
  options: { intervalMs?: number; force?: boolean } = {},
): boolean {
  const { intervalMs = 30_000, force = false } = options;
  if (!state.online) return false;
  switch (state.phase) {
    case 'dirty':
      return force || (state.dirtySince !== null && now - state.dirtySince >= intervalMs);
    case 'error':
      return force || (state.retryAt !== null && now >= state.retryAt);
    default:
      return false; // idle: nothing to send; syncing: already busy; conflict: waiting for the player
  }
}
