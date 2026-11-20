# 18.1 · Designing the save API

> ⏱ 3 hours · Module 18 · Cloud Saves & Sync

## What you'll learn
- The requirements behind "pick up where you left off on any device"
- The endpoints: `GET /api/save`, `GET /api/save/meta` and `PUT /api/save`
- The revision protocol, and what a conflict response should contain
- Validating saves on the server with the same schema the client uses
- Size limits, caching headers, rate limits and backups
- Updating the leaderboard in the same transaction as the save

---

## What we need

From the game design: *the game saves progress and can be picked up on mobile or desktop from wherever it was left.* Broken down:

1. A player's progress is stored on the server, attached to their account.
2. Any device they log in on can download it.
3. Devices upload changes regularly without the player thinking about it.
4. **No device may silently overwrite progress made on another one.** This is the hard requirement, and the rest of the module is mostly about it.
5. The game keeps working offline. Syncing catches up later (18.2).
6. A tampered save can't put someone at the top of the leaderboard (18.4).

## The resource

Each account has exactly **one save**: "my save". So the URL doesn't contain a user id at all:

```
GET  /api/save        → the full save (or null if there isn't one yet)
GET  /api/save/meta   → just { revision, updatedAt }: cheap to poll
PUT  /api/save        → replace it, based on a revision
```

The server always uses the **session's user id** (`res.locals.user.id`, 17.5). There's no `userId` parameter to tamper with, so a whole class of authorisation bugs (17.1) simply can't happen. If you add save slots later, they'd be `/api/saves/:slot`, still scoped to the session's user.

## The revision protocol

You've already built the core of this in 16.4 and exercise 16-03.

- Every stored save has a `revision`: 1 for the first, then +1 on every write.
- The client remembers the revision its local save is **based on** (`baseRevision`). A device that has never synced uses `0`.
- `PUT` sends `{ data, baseRevision }`. The server writes **only if** the stored revision still equals `baseRevision`, in one atomic statement.

```
PUT /api/save   { "baseRevision": 7, "data": { … } }

200 OK          { "revision": 8, "updatedAt": "2026-03-01T12:00:00.000Z" }
                → the client sets baseRevision = 8

409 Conflict    {
                  "error": {
                    "code": "SAVE_CONFLICT",
                    "message": "Your save is out of date",
                    "details": { "current": { "revision": 9, "updatedAt": "…", "data": { … } } }
                  }
                }
                → another device saved first. Nothing was overwritten.
```

Including the **current save** in the conflict response saves a round-trip: the client has everything it needs to resolve the conflict (18.3) without another `GET`.

### Why not `ETag` and `If-Match`?
HTTP has this exact mechanism built in. The server sends `ETag: "7"`, the client sends `If-Match: "7"` with its `PUT`, and the server answers `412 Precondition Failed` on a mismatch. It's elegant and a good thing to mention in interviews. We put `baseRevision` in the body instead because it's explicit, easy to log, and easy to test. Either is a reasonable choice. Pick one and document it.

## GET and meta

```
GET /api/save
200 { "save": { "data": { … }, "revision": 8, "updatedAt": "…" } }
200 { "save": null }                         ← no save yet: a normal state, not an error

GET /api/save/meta
200 { "revision": 8, "updatedAt": "…" }
200 { "revision": 0, "updatedAt": null }
```

Why have `meta` at all? The full save might be tens of kilobytes. A device that wants to know "has anything changed on the server since I last synced?" (when the tab regains focus, say) only needs the revision. If it's higher than the device's `baseRevision`, the device fetches the full save. That's how device B notices you played on device A (18.3).

### Never cache saves
Add `Cache-Control: no-store` to these responses. Without it, a browser or proxy could serve an old copy of the save, and the client would base its next write on stale data.

## Validate on the server

The client is untrusted (17.1). Anyone can `PUT` anything with curl. Before storing a save, the server validates it with the **same Zod schema the client uses** for its saves (13.10). In Module 19 you'll move that schema into a shared package so both sides import one definition and can never disagree.

```ts
const PutSaveBody = z.object({
  baseRevision: z.number().int().nonnegative(),
  data: SaveSchema,            // the current save version's schema
});
```

What about a client running an **older** version of the game, sending an older save version? Two good options:

- Accept only the current version, and have the client migrate before uploading. Its own migrations (13.10) already do this.
- Accept any known version and migrate on the server with the same shared migration code.

Either way, **deploy the server first** when the save format changes (Module 20). A server that doesn't recognise a newer client's save version must reject it (400) without destroying anything, and the client keeps its local copy until the server catches up.

## Limits

- **Size**: `express.json({ limit: '64kb' })`. A Hearthwild save is a few kilobytes, so 64 KB leaves plenty of room while stopping someone uploading 50 MB. Too large → `413` with `PAYLOAD_TOO_LARGE` (exercise 15-04). (64 KB also happens to be the limit for `fetch(…, { keepalive: true })`, which 18.2 uses when the page is closing.)
- **Rate**: a player's device syncs every 30 seconds or so. A per-user limit of, say, 10 `PUT`s per minute (exercise 17-04) leaves room for retries while stopping a runaway loop.
- **Gzip**: browsers don't compress request bodies by default. At these sizes it doesn't matter.

## Storage

The `saves` table from 16.6, with one row per user:

```sql
CREATE TABLE saves (
  user_id    integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       jsonb   NOT NULL,
  revision   integer NOT NULL CHECK (revision > 0),
  updated_at timestamptz NOT NULL
);
```

### History: the undo button you'll be glad you built
Bugs happen: a migration with a mistake, a player who resolves a conflict the wrong way. Keep the last few revisions in a `save_history (user_id, revision, data, created_at)` table, written in the **same transaction** as each successful `PUT`, and prune old rows. Then "restore yesterday's save" is a support request you can answer in two minutes, not "sorry, it's gone".

### The leaderboard, in the same transaction
The leaderboard reads `skill_xp` (16.1, 16.3), not the JSON. When a `PUT` succeeds, update that player's `skill_xp` rows from the new save **inside the same transaction**. The save and the leaderboard can then never disagree, and a save that fails the plausibility checks (18.4) can be stored while being kept off the leaderboard.

```ts
await db.transaction(async (tx) => {
  const result = await saveRepo.put(tx, userId, data, baseRevision);   // the optimistic write
  if (!result.ok) return result;                                       // conflict: nothing else changes
  await leaderboardRepo.upsertSkills(tx, userId, extractSkillXp(data));
  await historyRepo.append(tx, userId, result.record);
  return result;
});
```

## The route, in outline

```ts
router.put('/', requireAuth, async (req, res) => {
  const { data, baseRevision } = PutSaveBody.parse(req.body);
  const result = await saves.put(currentUser(res).id, data, baseRevision);
  res.set('Cache-Control', 'no-store');
  if (!result.ok) {
    throw new HttpError(409, 'SAVE_CONFLICT', 'Your save is out of date', { current: toJson(result.current) });
  }
  res.json({ revision: result.record.revision, updatedAt: result.record.updatedAt.toISOString() });
});
```

Exercise 18-01 has you build this API, with tests for every case above.

## Check your understanding

1. Why doesn't the save URL contain a user id?
2. What does the client send as `baseRevision` the very first time it uploads?
3. Why does the 409 response include the current save?
4. What is `GET /api/save/meta` for?
5. Why `Cache-Control: no-store`?
6. Why validate saves on the server with the client's own schema?
7. Why update `skill_xp` in the same transaction as the save?

<details><summary>Answers</summary>

1. The server takes the user from the session. With no id in the URL or body, a client can't ask for, or overwrite, someone else's save.
2. `0`, meaning "I've never synced".
3. So the client can resolve the conflict immediately, without another round-trip to fetch it.
4. A cheap check for "has the server got a newer revision than mine?", without downloading the whole save.
5. So no browser or proxy cache ever returns an old copy, which would make the client base its next write on stale data.
6. The client is untrusted, so anything can arrive. Sharing one schema means the server's idea of a valid save is exactly the client's, with no drift.
7. So the leaderboard can never disagree with the stored save, even if the server crashes halfway.
</details>

## Further reading
- MDN: `ETag`, `If-Match` and `412 Precondition Failed`
- MDN: `Cache-Control` (`no-store` vs `no-cache`)

---
[← Module overview](README.md) · [Next: Local-first saving →](02-local-first-saving.md)
