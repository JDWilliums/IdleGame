# C09 · Cloud saves & cross-device sync

> ⏱ ~14 hours · Lessons: 18.1–18.5, 12.5, 16.3 · Course exercises to reuse: 18-01, 18-02, 18-03, 18-04, 16-02, 16-04

## Why
This is the headline feature: start on your phone, carry on at your desk, exactly where you left off, with no lost progress even when both devices were offline. It's the hardest milestone and the best interview story in the project.

## User stories

### US-1 · The save API
*As a logged-in player, I want my progress stored on the server.*

**Acceptance criteria**
- [ ] `GET /api/save`, `GET /api/save/meta` and `PUT /api/save` behave exactly as exercise 18-01 specifies (revisions, `409 SAVE_CONFLICT` with the current save, 64 KB limit, `Cache-Control: no-store`), validated with the **shared** schemas (19.2).
- [ ] A successful `PUT` runs **one transaction**: the optimistic update, a `save_history` row (keep the last 20 per user), the plausibility check (18-04 `checkProgress`, with server-measured elapsed time and limits derived from the game data) setting `leaderboard_eligible`, and the `skill_xp` upsert.
- [ ] `GET /api/time` returns the server time.

### US-2 · Automatic sync
*As a player, I want syncing to just happen.*

**Acceptance criteria**
- [ ] The sync engine (18.5) wraps your 18-03 reducer. It uploads when dirty for 30 s, flushes on hide (with `keepalive`), retries with backoff **and jitter**, and pauses while offline.
- [ ] Sync metadata (`baseRevision` and friends) is saved in the **same record** as the save (18.2, C07).
- [ ] Non-retryable errors (`400`, `413`) are shown to the player and logged, not retried forever.
- [ ] On focus and at startup, `GET /api/save/meta`: if the server is ahead and we're clean, pull silently (18.3).

### US-3 · Guest to account, and second devices
*As a player, I want my guest progress to come with me when I sign up, and my account progress to appear when I log in elsewhere.*

**Acceptance criteria**
- [ ] Registering uploads the guest save as the account's first save (`baseRevision: 0`), and moves the local record to the account's key.
- [ ] Logging in on a device with **no** local save for that account downloads the cloud save.
- [ ] Logging in on a device that has a **guest** save with progress, when the account also has a cloud save, goes through the conflict flow.
- [ ] Logging out does a final upload if dirty, then returns to the guest save. Settings offers "Remove my data from this device".

### US-4 · Conflicts, fairly
*As a player who played on two devices offline, I want to choose which progress to keep, and not lose the other.*

**Acceptance criteria**
- [ ] Conflict detection and classification use your 18-02 `resolveConflict`. Only "both changed" shows a dialog.
- [ ] The dialog (an accessible `<dialog>`) shows both summaries with `describeSummary`, pre-selects the recommendation, and explains that the other save is kept as a backup. The game is paused while it's open.
- [ ] The choice applies via 18-02 `applyChoice`. The loser is stored as a local backup (and exists in server history).
- [ ] Settings → "Restore previous save" lists the local backup and the last few server revisions, with summaries.

### US-5 · Know your save is safe
*As a player, I want to see whether my progress is saved.*

**Acceptance criteria**
- [ ] A sync status indicator with the states and texts from the table in 18.5, readable by screen readers, and updating without re-rendering the game UI.
- [ ] "Save now" in settings forces a sync.

### US-6 · Honest time
*As a player, I want offline progress to be fair, and the leaderboard to be clean.*

**Acceptance criteria**
- [ ] The client estimates the clock offset (18-04) from a few `/api/time` samples. Offline catch-up uses server-measured elapsed time when online (`trustedOfflineTime`), and the device clock (with the cap) when not.
- [ ] Suspicious clock changes are logged on the server, never punished on the client.

### US-7 · Leaderboard
*As a player, I want to see how I rank.*

**Acceptance criteria**
- [ ] `GET /api/leaderboard?skill=&limit=` (and `skill=total`), using `rank()` (16-02) over eligible, opted-in players.
- [ ] A leaderboard page with tabs per skill (tab in the URL), the top 100, and "Your rank: 42 of 1,203" when logged in.
- [ ] A setting to opt out of the leaderboard.

## Tests to write
- API: every save route, including the transaction (a forced failure in the `skill_xp` step rolls back the save), history pruning, the plausibility flag, and the leaderboard query (PGlite).
- The sync engine with fake timers and a fake API: the stories in 18.5's "Testing it" section.
- Components: the conflict dialog with MSW returning a `409`.
- **Playwright two-device test** (12.5): two browser contexts, one account; play on one, sync, see the progress on the other. Then the offline-on-both conflict story.

## Hints (directions, not code)
- Build server first (US-1), test it fully, then the client engine against a fake API, and only then connect them. Debugging all three at once is miserable.
- Write the multi-device stories as test cases **before** implementing. They're your specification.
- Log every sync decision at `debug` level on the client during development ("dirty since…, uploading rev 7…"). You'll need it.

## Lessons to revisit
16.4 (optimistic concurrency) · 18.1–18.5 · 12.5 (multi-context Playwright)

## Stretch goals
- An `ETag` / `If-Match` version of the save API, and an ADR comparing the two.
- A "devices" list in settings (sessions with last-seen times and user agents) with "log out this device".

## Demo
A side-by-side screen recording of a phone and a laptop: progress on one appears on the other. This is the clip to put at the top of your portfolio case study (22.4).

---
[← C08](C08-api-db-and-accounts.md) · [Capstone overview](../README.md) · [Next: C10 · Shop, equipment & economy →](C10-shop-and-equipment.md)
