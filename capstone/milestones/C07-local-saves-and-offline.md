# C07 · Local saves, offline progress & migrations

> ⏱ ~12 hours · Lessons: 13.8, 13.10, 14.4, 18.2 · Course exercises to reuse: 13-06, 13-08, 14-03

## Why
Without saving, there's no game. Without offline progress, there's no *idle* game. This milestone makes progress survive reloads, closed tabs and a week away, and makes sure an update to your save format never destroys anyone's progress. After it, you have a complete, portfolio-worthy frontend-only game.

## User stories

### US-1 · Progress is never lost
*As a player, I want my progress saved without thinking about it.*

**Acceptance criteria**
- [ ] The save (plus sync metadata, ready for C09) is stored as **one record under one key** (18.2), namespaced for a guest (`<game>:guest`) and, later, per account.
- [ ] Saved every ~5 seconds while playing, and immediately when the page is hidden (`visibilitychange`, 14.4).
- [ ] A "Saved" indicator (subtle) shows the last save time.
- [ ] Reloading at any moment loses at most a few seconds of progress.

### US-2 · Loading safely
*As a player, I want a broken or old save handled gracefully.*

**Acceptance criteria**
- [ ] On start, the stored save goes through `loadSave` (validate + migrate, 13-08). Only valid, current-version state reaches the engine.
- [ ] A **corrupt** save is never overwritten silently: the raw text is copied to a backup key, the player is told what happened, and they're offered "Export the broken save" (for a bug report) and "Start a new game".
- [ ] A save from a **newer** version of the game (a player who opened an old cached version) isn't destroyed: show "Please reload to update", and don't save over it.

### US-3 · While you were away
*As a player, I want to come back to progress.*

**Acceptance criteria**
- [ ] On load and when the tab becomes visible again after being hidden for more than a few seconds, the engine's `catchUp` runs for the elapsed time, **capped at 12 hours** (13-06).
- [ ] A "While you were away" dialog shows the time away (and "capped at 12 hours" if it was), XP per skill, items gained and used, and why the action stopped, if it did.
- [ ] Short absences (under a minute) catch up silently, with no dialog.
- [ ] For now, elapsed time uses the device clock. C09 switches to server time when online (18.4).

### US-4 · A real migration
*As the developer, I want to change the save format without breaking anyone.*

**Acceptance criteria**
- [ ] The save has a `version`. You've made at least one **real** format change through a migration (for example adding `settings` or `hearth`, or renaming a field), with the v1 → v2 step tested on fixture saves.
- [ ] Fixture files of every old version live in the repo and are tested forever: they must always load.

### US-5 · Export and import
*As a player, I want a backup I control.*

**Acceptance criteria**
- [ ] Settings → "Export save" gives a text code (13-08's `exportSave`), with a copy button.
- [ ] "Import save" validates the code, shows a summary of what it contains (total level, gold), and asks for confirmation before replacing the current game. A bad code shows an error and changes nothing.

### US-6 · One tab at a time
*As a player, I want two open tabs not to fight over my save.*

**Acceptance criteria**
- [ ] A second tab detects the first (14-03, BroadcastChannel or a lock) and shows "Hearthwild is open in another tab", with a "Play here instead" button that takes over safely: the other tab saves and pauses.

## Tests to write
- The persistence timing (fake timers): a save every 5 s, and on `visibilitychange`.
- Loading: a valid save, an old version, a corrupt save (it's backed up, not overwritten), a newer version.
- Migrations: every fixture loads and validates as the current version.
- **Playwright** with `page.clock` (as in P2): start an action, close the page, fast-forward 2 hours, reopen, and expect the summary with the right XP.

## Hints (directions, not code)
- Persistence, catch-up and the tab guard belong to the **runtime** (ARCHITECTURE §4), not to React components.
- Write storage behind a tiny interface (`load()` / `store(record)`), so tests can pass an in-memory version, and so C09 can add sync metadata without touching the call sites.
- The summary needs a before/after comparison: snapshot the relevant parts of the state before `catchUp`, then diff.

## Lessons to revisit
13.8 (offline progress, caps) · 13.10 (versioning, migrations, export) · 14.4 (lifecycle, tabs) · 18.2 (one record, namespacing)

## Stretch goals
- An IndexedDB storage adapter (via `idb-keyval`), chosen by a feature check.
- `navigator.storage.persist()` after the player's first level-up, with an explanation.

## Demo
A GIF of closing the game, then reopening it to the "While you were away" summary. Put it at the top of your README.

---
[← C06](C06-processing-skills.md) · [Capstone overview](../README.md) · [Next: C08 · API, database & accounts →](C08-api-db-and-accounts.md)
