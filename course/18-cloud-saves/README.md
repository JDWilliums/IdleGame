# Module 18 · Cloud Saves & Sync

**Time:** ~15 hours · **Prerequisites:** 13.8 and 13.10 (offline progress, saves), 14.4 (page lifecycle), 16.4 (optimistic concurrency), Module 17 (auth)

## Why this module matters
This is the feature that makes Hearthwild what you set out to build: start on your phone on the bus and carry on at your desk, exactly where you left off. It's also the most interesting engineering in the project. Offline-capable sync, concurrent edits from several devices and untrusted clocks are real distributed-systems problems, in miniature. Being able to explain how you designed sync, what could go wrong and how you tested it makes a far better interview story than "I built a to-do app".

## Learning objectives
By the end of this module you can:
- design a save API with optimistic concurrency, clear conflict responses, validation and limits
- build a local-first client that keeps working offline and uploads at sensible moments
- classify sync situations, avoid unsafe merging, and design a fair "which save?" choice
- measure time with the server's clock, estimate clock offset, and check saves for impossible progress
- model sync as a pure state machine with backoff, and wire it to the game and the UI

## Lessons
| # | Lesson | Time |
|---|---|---|
| 18.1 | [Designing the save API](01-designing-the-save-api.md) | 3h |
| 18.2 | [Local-first saving](02-local-first-saving.md) | 3h |
| 18.3 | [Conflicts & concurrency](03-conflicts-and-concurrency.md) | 3h |
| 18.4 | [Trusting time & cheating](04-trusting-time-and-cheating.md) | 2.5h |
| 18.5 | [The sync engine](05-the-sync-engine.md) | 3.5h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `18-01` | [save-endpoint](../../exercises/18-cloud-saves/01-save-endpoint/exercise.ts) | 18.1 |
| `18-02` | [conflict-resolution](../../exercises/18-cloud-saves/02-conflict-resolution/exercise.ts) | 18.3 |
| `18-03` | [sync-state-machine](../../exercises/18-cloud-saves/03-sync-state-machine/exercise.ts) | 18.5 |
| `18-04` | [trusted-offline-time](../../exercises/18-cloud-saves/04-trusted-offline-time/exercise.ts) | 18.4 |

Hints: [`exercises/18-cloud-saves/HINTS.md`](../../exercises/18-cloud-saves/HINTS.md)

All four become parts of your game in milestones C07–C09: the endpoint goes in your API, and the other three go in the client (and, for 18-04's `checkProgress`, the server too).

## Checkpoint quiz
1. Why does `PUT /api/save` send a `baseRevision`, and what does the server do with it?
2. What should a `409` from the save API contain, and why?
3. Why store the save and its sync metadata in a single `localStorage` write?
4. Why does an idle game upload on an interval while dirty, rather than "a few seconds after the last change"?
5. List the four sync situations and the action for each.
6. Why not merge two conflicting saves automatically?
7. Why can't offline progress be calculated with the device clock, and what do you use instead?
8. A save gains 12 hours of fishing XP, but the server's clock says 2 hours passed. What should the server do?
9. Why does the sync reducer return the same object for a `localChanged` event while already dirty?
10. Which failures should the sync engine retry, and how long should it wait?

<details><summary>Answers</summary>

1. It's the revision the client's save is based on. The server writes only if its stored revision still equals it (one atomic statement), so a device can never silently overwrite progress made elsewhere.
2. `SAVE_CONFLICT` plus the server's current save (data, revision, `updatedAt`), so the client can resolve the conflict without another request.
3. So they can never disagree after a crash or a closed tab between two writes. A mismatch causes needless conflicts, or an old save overwriting newer server progress.
4. The state changes on every tick, so there is never "a few seconds after the last change". A fixed interval bounds the progress that could be lost.
5. In sync: nothing. Only we changed: push. Only the server changed: pull. Both changed: ask the player.
6. Merging game state creates impossible states: duplicated items, double-counted XP or lost sessions. Choosing one save, and keeping the other as a backup, is safe.
7. The player controls the device clock and can move it forward. Use the server's timestamps: its time now minus its time for the last accepted save.
8. Store the save (the player loses nothing), keep it off the leaderboard, log the reason, and never ban automatically.
9. It fires on every tick. A new object would wake every subscriber and re-render the UI ten times a second for nothing.
10. Network errors and `5xx`s, with exponential backoff (1 s, 2 s, 4 s… capped), plus jitter in production. Not `409` (that's a conflict) and not other `4xx`s.
</details>

## Extra practice
1. **Wire it up.** Build `createSyncEngine` from 18.5 around your 18-03 reducer, with a fake `SaveApi`, and test it with `vi.useFakeTimers()`: one upload after 30 s, retries at 1 s then 2 s after failures, and nothing while offline.
2. **The conflict dialog.** Build the dialog from 18.3 as a React component using 18-02's `resolveConflict` and `describeSummary`. Test it with Testing Library: both summaries shown, the recommended option pre-selected, and the choice passed to a callback.
3. **Leaderboard eligibility.** Extend your 18-01 app: on each successful `PUT`, run 18-04's `checkProgress` against the previous save, using the server-measured elapsed time, and record `leaderboardEligible` on the record.
4. **ETag version.** Re-implement 18-01's `PUT` using `ETag` / `If-Match` headers and `412 Precondition Failed` instead of `baseRevision`. Which do you prefer, and why?

**Next:** [Part 5 · Module 19 · Architecture & Monorepos →](../19-architecture-and-monorepos/README.md)
