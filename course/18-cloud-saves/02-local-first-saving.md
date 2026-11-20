# 18.2 · Local-first saving

> ⏱ 3 hours · Module 18 · Cloud Saves & Sync

## What you'll learn
- What "local-first" means, and why it suits an idle game
- What to store on the device, and why the save and its sync metadata live together
- `localStorage` vs IndexedDB
- When to upload, including the moment the page is closing
- What `navigator.onLine` really tells you
- Guests, first login, logout and shared devices

---

## Local-first

A **local-first** app treats the copy of the data **on the device** as the real one. The server is a place to back it up and share it between devices, not something the app needs before it can work.

For Hearthwild that means:

- The game always loads instantly from the device, never waiting for the network.
- Playing on a train with no signal works exactly like playing at home.
- The server being down for an hour is an inconvenience (sync waits), not an outage (nobody can play).

The opposite, "server-first" (every action is an API call), is how many web apps work. It's wrong for a game that ticks ten times a second.

## What lives on the device

Two things:

1. **The save**, the game state, exactly as 13.10 serialises it.
2. **Sync metadata**: what the device knows about the server.

```ts
type LocalRecord = {
  save: SaveV3;
  sync: {
    baseRevision: number;       // the server revision this save is based on (0 = never synced)
    dirty: boolean;             // has the save changed since that revision?
    lastSyncedAt: number | null;
  };
};
```

**Store them together, in one write.** If the save and `baseRevision` were separate keys and the tab closed between the two writes, you could end up with a new save paired with an old revision (a needless conflict next time), or an old save paired with a new revision (the server's newer progress silently overwritten by an old save). One key, one `JSON.stringify`, one `setItem`: either both are written or neither is.

### Namespace by account

```
hearthwild:guest        ← a guest's save
hearthwild:user:42      ← user 42's save on this device
```

Keying by account means that if Ava logs out and Bram logs in on the same tablet, Bram never sees Ava's progress, and Ava's save can never be uploaded to Bram's account. That second bug is easy to write and horrible to explain to players.

### localStorage or IndexedDB?

| | `localStorage` | IndexedDB |
|---|---|---|
| API | synchronous, strings only | asynchronous, structured data |
| Size | about 5 MB per origin | hundreds of MB or more |
| Blocking | blocks the main thread while writing | doesn't block |
| Convenience | trivial | awkward without a wrapper (`idb-keyval`, `idb`) |

A Hearthwild save is a few kilobytes, written every few seconds, so `localStorage` is fine and much simpler. If saves grow past a few hundred KB, or you notice jank on writes, switch to IndexedDB through `idb-keyval`. Keep storage behind a small interface (`load()`, `store(record)`), so the switch touches one file.

Browsers can evict storage under pressure, and Safari deletes script-written storage for sites not visited in a while. `navigator.storage.persist()` asks the browser to keep your data. A PWA added to the home screen (21.1) is much less likely to be evicted. And of course the cloud copy is the real backup, which is the point of this module.

## When to save locally, when to upload

Local saves are cheap. Uploads cost battery, data and server load. So they run on different schedules:

| Moment | Save locally | Upload |
|---|---|---|
| Every few seconds while playing (13.10) | ✅ | — |
| The save has been dirty for 30 s | — | ✅ |
| The page becomes hidden (tab switch, app switch, screen lock) | ✅ | ✅ (best effort) |
| The player presses "Save now" | ✅ | ✅ immediately |
| Coming back online after being offline | — | ✅ if dirty |
| The tab regains focus | — | check `/api/save/meta` for newer progress (18.3) |

An idle game's state changes on **every tick**. "Upload a few seconds after the last change" would never fire, because there's always a newer change. So upload on a **fixed interval while dirty** instead: when the save has been dirty for 30 seconds, upload it. Exercise 18-03's `shouldSyncNow` encodes exactly this rule.

### When the page is closing
On mobile, players rarely "close" the game. They switch apps, and the OS may kill the tab later without warning. The last reliable moment is `visibilitychange` to `hidden` (14.4). An ordinary `fetch` started there may be cancelled when the page unloads. `keepalive: true` asks the browser to finish the request even after the page is gone:

```ts
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'hidden') return;
  storage.store(currentRecord());                     // always: this one is guaranteed
  if (record.sync.dirty) {
    void fetch('/api/save', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: record.save, baseRevision: record.sync.baseRevision }),
      keepalive: true,                                 // body must be under 64 KB
    });
  }
});
```

You may never see the response, so the device can't update `baseRevision` from it. That's fine: next time the game opens, the device's `baseRevision` is behind the server's revision, and the flow in 18.3 notices that the server's copy is the same progress (or newer) and handles it.

## What `navigator.onLine` actually means

`navigator.onLine === false` reliably means "no network at all". `true` only means "connected to *some* network": captive Wi-Fi, a dead router, or a server that's down all count as "online". So:

- Use the `online`/`offline` events as **hints**: pause syncing on `offline`, try promptly on `online`.
- Treat a failed `fetch` (a network error or a 5xx) as the real signal: back off and retry (18.5).
- In the UI, say what you know: "Offline · progress is saved on this device" is honest and reassuring.

## Guests, first login, logout

### Guest → account
A guest plays with the save in `hearthwild:guest`. When they register:

1. Move the record to `hearthwild:user:<id>` (`baseRevision` is still 0).
2. Upload it with `baseRevision: 0`. The server has no save for a brand-new account, so it's stored as revision 1.

### Logging in on a second device
1. `GET /api/save`. If the device has no local save for this account, use the server's (`baseRevision` = its revision).
2. If the device has a **guest** save as well as the account's cloud save, which one is "real"? Don't guess. That's a conflict, and the player chooses (18.3).

### Logging out
1. Try a final upload if dirty.
2. Keep or delete `hearthwild:user:<id>`? Keeping it makes logging back in instant, but on a shared device the next person could see it in DevTools. A good default: keep it, and offer "Remove my data from this device" on the logout screen.
3. Return to the guest save (or a fresh one).

## Check your understanding

1. What does "local-first" mean for Hearthwild, concretely?
2. Why must the save and `baseRevision` be stored in one write?
3. Why namespace local saves by account id?
4. Why upload on a fixed interval while dirty, rather than a few seconds after the last change?
5. What does `keepalive: true` do, and what's its main limitation?
6. `navigator.onLine` is `true`. Does that mean the server is reachable?

<details><summary>Answers</summary>

1. The game loads and plays from the device's copy, online or offline. The server is a backup and a way to move progress between devices, so syncing never blocks play.
2. If they were written separately and the tab died in between, the save and its revision could disagree, causing needless conflicts or an old save overwriting newer server progress.
3. So different people on one device never see, or upload, each other's progress.
4. An idle game's state changes every tick, so "after the last change" never arrives. A fixed interval bounds how much progress could be lost without uploading constantly.
5. It lets the request finish after the page unloads. The body must be under about 64 KB, and you may never see the response.
6. No. It only means the device is connected to some network. Failed requests are the real signal.
</details>

## Further reading
- "Local-first software" by Ink & Switch (inkandswitch.com/local-first)
- MDN: `fetch()` `keepalive`, "Storage quotas and eviction criteria", `StorageManager.persist()`
- web.dev: "Page Lifecycle API"

---
[← Designing the save API](01-designing-the-save-api.md) · [Module overview](README.md) · [Next: Conflicts & concurrency →](03-conflicts-and-concurrency.md)
