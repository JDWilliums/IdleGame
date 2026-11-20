# 18.5 · The sync engine

> ⏱ 3.5 hours · Module 18 · Cloud Saves & Sync

## What you'll learn
- Modelling sync as a state machine with a pure reducer
- Separating decisions (pure) from effects (timers, `fetch`, storage)
- Retrying with exponential backoff and jitter
- Wiring the engine to the game store and showing its status in the UI
- Testing it end to end with fake timers and MSW

---

## Why a state machine?

Sync has a lot of moving parts: local changes arrive constantly, uploads take time and can fail, the network comes and goes, a conflict pauses everything until the player decides, and the page can close at any moment. Written as scattered `if`s and flags (`isSyncing`, `hasError`, `needsRetry`…), it quickly reaches states that shouldn't be possible: "syncing *and* in conflict", or a retry timer firing during an upload.

A **state machine** names the states and lists exactly which events move between them. Everything else is ignored, so impossible states can't occur.

```
                 localChanged
        ┌──────┐ ───────────► ┌───────┐  syncStarted  ┌─────────┐
        │ idle │              │ dirty │ ────────────► │ syncing │
        └──────┘ ◄─────────── └───────┘ ◄──────────── └─────────┘
            ▲    syncSucceeded    ▲   syncSucceeded    │   │   │
            │    (no changes      │   (changes arrived │   │   │ syncConflict
            │    during upload)   │   during upload)   │   │   ▼
            │                     │                    │   │ ┌──────────┐
            │                     │  conflictResolved  │   │ │ conflict │
            │  conflictResolved   └──── (keepLocal) ───┼───┼─┤          │
            └──────── (useRemote) ─────────────────────┼───┼─┤          │
                                                       │   │ └──────────┘
                              syncStarted (retry)      │   │ syncFailed
                         ┌─────────────────────────────┘   ▼
                         │                          ┌───────┐
                         └───────────────────────── │ error │  (attempt, retryAt)
                                                    └───────┘
```

Being online or offline is tracked **alongside** the phase rather than as a phase of its own. You can be dirty and offline, or in error and offline. While offline, nothing is attempted.

## The reducer

You've written reducers since 08.1: `(state, event) => newState`, pure, with no side effects. The sync reducer is exactly that.

```ts
type SyncState = {
  phase: 'idle' | 'dirty' | 'syncing' | 'conflict' | 'error';
  online: boolean;
  baseRevision: number;
  dirtySince: number | null;
  changedWhileSyncing: boolean;
  attempt: number;
  retryAt: number | null;
  conflict: RemoteSave | null;
  lastSyncedAt: number | null;
};

type SyncEvent =
  | { type: 'localChanged'; at: number }
  | { type: 'syncStarted'; at: number }
  | { type: 'syncSucceeded'; revision: number; at: number }
  | { type: 'syncConflict'; remote: RemoteSave }
  | { type: 'syncFailed'; at: number }
  | { type: 'wentOffline' }
  | { type: 'cameOnline'; at: number }
  | { type: 'conflictResolved'; choice: 'keepLocal' | 'useRemote'; at: number };
```

A few rules deserve explaining:

- **`localChanged` fires on every tick**, so it must be cheap. When it changes nothing (already dirty), return the **same state object**, so nothing downstream re-renders (14.3).
- **Changes during an upload**: the upload carries the save *as it was when it started*. If more changes arrive meanwhile, the save is still dirty after success. That's what `changedWhileSyncing` is for.
- **Events that don't apply in the current phase are ignored**: a late `syncSucceeded` after the user resolved a conflict, say. Return the state unchanged.

Exercise 18-03 implements the full reducer, plus `shouldSyncNow`.

## Deciding *when*: `shouldSyncNow`

A second pure function answers "should an upload start right now?":

- Not while offline, syncing or in conflict, or when idle.
- **Dirty**: yes, once it has been dirty for the sync interval (30 seconds; see 18.2 for why it's an interval and not a debounce).
- **Error**: yes, once `retryAt` has passed.
- **Forced** (page hidden, "Save now" button): yes, if there's anything to send, ignoring the timers.

## Backoff with jitter

When an upload fails, retrying immediately in a tight loop hammers a server that's probably already struggling. **Exponential backoff** doubles the wait after each consecutive failure, up to a cap:

```
attempt 1 → 1 s,  2 → 2 s,  3 → 4 s,  4 → 8 s,  … capped at 60 s
delay = min(1000 × 2^(attempt − 1), 60_000)
```

In production, add **jitter**, a random amount of the delay, so a thousand clients that all failed at the same moment (the server restarting) don't all retry at the same moment too:

```ts
const delay = Math.min(1000 * 2 ** (attempt - 1), 60_000);
const withJitter = delay / 2 + Math.random() * (delay / 2);   // somewhere between 50% and 100%
```

Exercise 18-03 uses the deterministic version so the tests can predict `retryAt`. Adding jitter afterwards is one line, if `random` is injected like `now` so tests can control it.

What counts as a failure worth retrying? Network errors and `5xx` responses. A `409` isn't a failure: it's a conflict, a different event. A `400` or `413` won't fix itself on retry: log it and show the player a problem, rather than retrying forever.

## The engine: effects around the reducer

The reducer decides. A small engine object performs effects and feeds the results back in as events:

```ts
export function createSyncEngine(deps: {
  api: SaveApi;                         // putSave / getSave, built on 17.8's api()
  storage: LocalStore;                  // 18.2: one record with save + sync metadata
  getSave: () => SaveV3;                // read the current game state from the store (14.2)
  now: () => number;
  intervalMs?: number;
}) {
  let state = initialSyncState(deps.storage.load()?.sync.baseRevision ?? 0);
  const listeners = new Set<(s: SyncState) => void>();

  function dispatch(event: SyncEvent) {
    const next = syncReducer(state, event);
    if (next === state) return;                            // nothing changed: no work
    state = next;
    listeners.forEach((l) => l(state));
  }

  async function syncIfDue(force = false) {
    if (!shouldSyncNow(state, deps.now(), { intervalMs: deps.intervalMs, force })) return;
    const save = deps.getSave();
    dispatch({ type: 'syncStarted', at: deps.now() });
    try {
      const result = await deps.api.putSave(save, state.baseRevision);
      if (result.ok) dispatch({ type: 'syncSucceeded', revision: result.revision, at: deps.now() });
      else dispatch({ type: 'syncConflict', remote: result.current });
    } catch {
      dispatch({ type: 'syncFailed', at: deps.now() });
    }
  }

  const timer = setInterval(() => void syncIfDue(), 1000);  // cheap: usually returns immediately

  return {
    getState: () => state,
    subscribe: (l: (s: SyncState) => void) => (listeners.add(l), () => listeners.delete(l)),
    localChanged: () => dispatch({ type: 'localChanged', at: deps.now() }),
    flush: () => syncIfDue(true),
    resolveConflict: (choice: 'keepLocal' | 'useRemote') => dispatch({ type: 'conflictResolved', choice, at: deps.now() }),
    setOnline: (online: boolean) => dispatch(online ? { type: 'cameOnline', at: deps.now() } : { type: 'wentOffline' }),
    stop: () => clearInterval(timer),
  };
}
```

The shape should look familiar. It's the same as the game store (14.2): a closure owning state, `subscribe` for React, and plain methods for commands. The engine is started once, outside React (14.1), and connected:

- the game store's `subscribe` → `engine.localChanged()`
- `online`/`offline` window events → `engine.setOnline(…)`
- `visibilitychange` to hidden → save locally, then `engine.flush()` (with `keepalive`, 18.2)
- `visibilitychange` to visible → check `/api/save/meta` (18.3)

**Persist the sync metadata** whenever `baseRevision` changes, in the same write as the save (18.2). Otherwise a reload forgets which revision the save is based on.

## Showing sync status

Players should never wonder whether their progress is safe. A small, unobtrusive indicator in the header covers it:

| Phase (+ online) | Indicator | Text for screen readers / tooltip |
|---|---|---|
| idle | ✓ | "All progress saved" |
| dirty / syncing | ↻ (subtle) | "Saving…" |
| any, offline | ☁︎ with a slash | "Offline: progress is saved on this device" |
| error | ⚠︎ | "Couldn't reach the server. Retrying in 8 s" |
| conflict | opens the dialog (18.3) | "Your progress differs between devices" |

Read the engine's state with `useSyncExternalStore` (08.5, 14.2) and a selector that returns just the phase, `online` and `retryAt`, so the indicator re-renders only when one of those changes, not on every tick.

## Testing it

- **The reducer and `shouldSyncNow`** are pure: table-style unit tests for every transition (exercise 18-03).
- **The engine**: fake timers (`vi.useFakeTimers`) plus a fake `SaveApi`. Script stories, e.g. "change, wait 30 s, expect one `putSave`; fail it, expect a retry after 1 s, then 2 s".
- **End to end in the app**: MSW (12.4) handlers for `PUT /api/save` returning 200, then 409 with a `current` save. Check that the conflict dialog appears with the right summaries, and that choosing an option sends the right follow-up request.
- And once, **by hand**: two browser profiles logged into the same account, one in airplane mode. Play on both, reconnect, and check that you get exactly the experience you designed.

## Check your understanding

1. What problem does modelling sync as a state machine solve?
2. Why is "online" tracked alongside the phase instead of being a phase?
3. Why must `localChanged` return the same object when nothing changes?
4. Why do you need `changedWhileSyncing`?
5. What's jitter, and what problem does it solve?
6. Which responses should trigger a retry, and which shouldn't?
7. Why does the engine have the same shape as the game store?

<details><summary>Answers</summary>

1. Scattered flags allow impossible combinations (syncing and in conflict at once). A state machine defines the valid states and transitions, and ignores everything else.
2. It's independent of the phase: you can be dirty or in error while offline. Making it a phase would mean duplicating every phase ("dirty-offline", "error-offline", and so on).
3. It fires on every game tick. Returning a new object would trigger every subscriber (and re-render the UI) ten times a second for no reason.
4. An upload sends the save as it was when the upload started. Changes made during the upload aren't on the server yet, so after success the save must still be dirty.
5. Random variation added to retry delays, so many clients that failed at the same moment don't all retry at the same moment and overload the server again.
6. Retry network errors and `5xx`s. Don't retry a `409` (it's a conflict, handled separately) or other `4xx`s such as `400` and `413` (they won't fix themselves).
7. It's the same pattern: state owned by a closure outside React, `subscribe` for `useSyncExternalStore`, and command methods. It's easy to test and keeps React rendering cheap.
</details>

## Further reading
- Statecharts (statecharts.dev): the idea behind state machines in UIs, and the XState library
- AWS Architecture Blog: "Exponential Backoff And Jitter"

---
[← Trusting time & cheating](04-trusting-time-and-cheating.md) · [Module overview](README.md) · [Part 5 · Module 19 · Architecture & Monorepos →](../19-architecture-and-monorepos/README.md)
