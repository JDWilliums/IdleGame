import { describe, expect, it } from 'vitest';
import {
  backoffMs,
  initialSyncState,
  shouldSyncNow,
  syncReducer,
  type RemoteSave,
  type SyncEvent,
  type SyncState,
} from './exercise';

const T = 1_000_000; // an arbitrary "now"
const remote: RemoteSave = { data: { gold: 1 }, revision: 9, updatedAt: '2026-03-01T12:00:00.000Z' };

const run = (state: SyncState, ...events: SyncEvent[]) => events.reduce(syncReducer, state);
const idle = () => initialSyncState({ baseRevision: 3 });
const dirty = () => run(idle(), { type: 'localChanged', at: T });
const syncing = () => run(dirty(), { type: 'syncStarted', at: T + 30_000 });
const failed = () => run(syncing(), { type: 'syncFailed', at: T + 31_000 });
const conflicted = () => run(syncing(), { type: 'syncConflict', remote });

describe('backoffMs', () => {
  it('doubles from 1s and caps at 60s', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 20].map(backoffMs)).toEqual([
      1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000,
    ]);
  });
});

describe('localChanged', () => {
  it('idle → dirty, remembering when', () => {
    expect(dirty()).toMatchObject({ phase: 'dirty', dirtySince: T });
  });

  it('returns the SAME object when already dirty (it fires every tick)', () => {
    const state = dirty();
    expect(syncReducer(state, { type: 'localChanged', at: T + 100 })).toBe(state);
  });

  it('during an upload, records that more changes arrived', () => {
    const state = run(syncing(), { type: 'localChanged', at: T + 30_100 });
    expect(state).toMatchObject({ phase: 'syncing', changedWhileSyncing: true });
    expect(syncReducer(state, { type: 'localChanged', at: T + 30_200 })).toBe(state);
  });

  it('keeps the phase in error and conflict', () => {
    const e = failed();
    expect(syncReducer(e, { type: 'localChanged', at: T + 40_000 })).toBe(e); // dirtySince already set
    const c = conflicted();
    expect(syncReducer(c, { type: 'localChanged', at: T + 40_000 })).toBe(c);
    const cleanConflict: SyncState = { ...c, dirtySince: null };
    expect(syncReducer(cleanConflict, { type: 'localChanged', at: T + 40_000 })).toMatchObject({
      phase: 'conflict',
      dirtySince: T + 40_000,
    });
  });
});

describe('an upload', () => {
  it('starts from dirty', () => {
    expect(syncing()).toMatchObject({ phase: 'syncing', changedWhileSyncing: false, dirtySince: T });
  });

  it('succeeds back to idle with the new revision', () => {
    expect(run(syncing(), { type: 'syncSucceeded', revision: 4, at: T + 30_500 })).toEqual({
      phase: 'idle',
      online: true,
      baseRevision: 4,
      dirtySince: null,
      changedWhileSyncing: false,
      attempt: 0,
      retryAt: null,
      conflict: null,
      lastSyncedAt: T + 30_500,
    });
  });

  it('succeeds back to DIRTY if changes arrived meanwhile', () => {
    const state = run(
      syncing(),
      { type: 'localChanged', at: T + 30_100 },
      { type: 'syncSucceeded', revision: 4, at: T + 30_500 },
    );
    expect(state).toMatchObject({ phase: 'dirty', baseRevision: 4, dirtySince: T + 30_500, changedWhileSyncing: false });
  });

  it('can end in a conflict', () => {
    expect(conflicted()).toMatchObject({ phase: 'conflict', conflict: remote, baseRevision: 3 });
  });

  it('fails into error with backoff, growing with each failure', () => {
    const first = failed();
    expect(first).toMatchObject({ phase: 'error', attempt: 1, retryAt: T + 31_000 + 1000, dirtySince: T });
    const second = run(first, { type: 'syncStarted', at: T + 32_000 }, { type: 'syncFailed', at: T + 32_500 });
    expect(second).toMatchObject({ phase: 'error', attempt: 2, retryAt: T + 32_500 + 2000 });
    const recovered = run(second, { type: 'syncStarted', at: T + 35_000 }, { type: 'syncSucceeded', revision: 4, at: T + 35_100 });
    expect(recovered).toMatchObject({ phase: 'idle', attempt: 0, retryAt: null });
  });

  it('clears retryAt when a retry starts', () => {
    expect(run(failed(), { type: 'syncStarted', at: T + 33_000 })).toMatchObject({ phase: 'syncing', retryAt: null, attempt: 1 });
  });
});

describe('online / offline', () => {
  it('tracks connectivity alongside the phase', () => {
    const offline = run(dirty(), { type: 'wentOffline' });
    expect(offline).toMatchObject({ phase: 'dirty', online: false });
    expect(syncReducer(offline, { type: 'wentOffline' })).toBe(offline);
    expect(run(offline, { type: 'cameOnline', at: T + 5 })).toMatchObject({ phase: 'dirty', online: true });
  });

  it('coming back online makes an error retry promptly', () => {
    const state = run(failed(), { type: 'wentOffline' }, { type: 'cameOnline', at: T + 31_200 });
    expect(state).toMatchObject({ phase: 'error', online: true, retryAt: T + 31_200 });
  });

  it('cameOnline while already online changes nothing', () => {
    const state = dirty();
    expect(syncReducer(state, { type: 'cameOnline', at: T + 1 })).toBe(state);
  });
});

describe('resolving a conflict', () => {
  it('keepLocal: rebased on the server revision and dirty again', () => {
    const state = run(conflicted(), { type: 'conflictResolved', choice: 'keepLocal', at: T + 50_000 });
    expect(state).toMatchObject({ phase: 'dirty', baseRevision: 9, conflict: null, dirtySince: T + 50_000 });
  });

  it('useRemote: in sync with the server', () => {
    const state = run(conflicted(), { type: 'conflictResolved', choice: 'useRemote', at: T + 50_000 });
    expect(state).toMatchObject({ phase: 'idle', baseRevision: 9, conflict: null, dirtySince: null, lastSyncedAt: T + 50_000 });
  });
});

describe('events that do not apply are ignored', () => {
  const cases: [string, () => SyncState, SyncEvent][] = [
    ['syncStarted while idle', idle, { type: 'syncStarted', at: T }],
    ['syncStarted while syncing', syncing, { type: 'syncStarted', at: T }],
    ['syncStarted during a conflict', conflicted, { type: 'syncStarted', at: T }],
    ['syncSucceeded while idle', idle, { type: 'syncSucceeded', revision: 99, at: T }],
    ['syncSucceeded while dirty', dirty, { type: 'syncSucceeded', revision: 99, at: T }],
    ['syncFailed while dirty', dirty, { type: 'syncFailed', at: T }],
    ['syncConflict while idle', idle, { type: 'syncConflict', remote }],
    ['conflictResolved without a conflict', dirty, { type: 'conflictResolved', choice: 'useRemote', at: T }],
  ];
  for (const [name, make, event] of cases) {
    it(name, () => {
      const state = make();
      expect(syncReducer(state, event)).toBe(state);
    });
  }

  it('never mutates the state it was given', () => {
    const state = syncing();
    const copy = structuredClone(state);
    run(state, { type: 'localChanged', at: T + 1 }, { type: 'syncFailed', at: T + 2 }, { type: 'wentOffline' });
    expect(state).toEqual(copy);
  });
});

describe('shouldSyncNow', () => {
  it('waits for the interval while dirty', () => {
    const state = dirty();
    expect(shouldSyncNow(state, T + 29_999)).toBe(false);
    expect(shouldSyncNow(state, T + 30_000)).toBe(true);
    expect(shouldSyncNow(state, T + 5_000, { intervalMs: 5_000 })).toBe(true);
  });

  it('waits for retryAt after an error', () => {
    const state = failed(); // retryAt = T + 32_000
    expect(shouldSyncNow(state, T + 31_999)).toBe(false);
    expect(shouldSyncNow(state, T + 32_000)).toBe(true);
  });

  it('force skips the timers, but only when there is something to send', () => {
    expect(shouldSyncNow(dirty(), T + 1, { force: true })).toBe(true);
    expect(shouldSyncNow(failed(), T + 31_001, { force: true })).toBe(true);
    expect(shouldSyncNow(idle(), T + 1, { force: true })).toBe(false);
  });

  it('never syncs while idle, syncing, in conflict or offline', () => {
    const far = T + 10 * 60_000;
    expect(shouldSyncNow(idle(), far)).toBe(false);
    expect(shouldSyncNow(syncing(), far, { force: true })).toBe(false);
    expect(shouldSyncNow(conflicted(), far, { force: true })).toBe(false);
    expect(shouldSyncNow(run(dirty(), { type: 'wentOffline' }), far, { force: true })).toBe(false);
  });
});

describe('a full story', () => {
  it('play, upload, fail offline, recover, conflict, resolve', () => {
    let s = initialSyncState({ baseRevision: 0 });
    const step = (event: SyncEvent) => (s = syncReducer(s, event));

    step({ type: 'localChanged', at: 0 });
    expect(shouldSyncNow(s, 30_000)).toBe(true);
    step({ type: 'syncStarted', at: 30_000 });
    step({ type: 'syncSucceeded', revision: 1, at: 30_200 });
    expect(s.phase).toBe('idle');

    step({ type: 'localChanged', at: 31_000 });
    step({ type: 'wentOffline' });
    expect(shouldSyncNow(s, 90_000)).toBe(false);
    step({ type: 'cameOnline', at: 90_000 });
    expect(shouldSyncNow(s, 90_000)).toBe(true);
    step({ type: 'syncStarted', at: 90_000 });
    step({ type: 'syncFailed', at: 90_100 });
    expect(shouldSyncNow(s, 91_099)).toBe(false);
    expect(shouldSyncNow(s, 91_100)).toBe(true);
    step({ type: 'syncStarted', at: 91_100 });
    step({ type: 'syncConflict', remote: { ...remote, revision: 2 } });
    expect(shouldSyncNow(s, 999_999, { force: true })).toBe(false);
    step({ type: 'conflictResolved', choice: 'keepLocal', at: 100_000 });
    expect(shouldSyncNow(s, 100_000, { force: true })).toBe(true);
    step({ type: 'syncStarted', at: 100_000 });
    step({ type: 'syncSucceeded', revision: 3, at: 100_300 });
    expect(s).toMatchObject({ phase: 'idle', baseRevision: 3, attempt: 0, lastSyncedAt: 100_300 });
  });
});
