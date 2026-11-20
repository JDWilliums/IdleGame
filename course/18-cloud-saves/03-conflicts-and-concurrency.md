# 18.3 · Conflicts & concurrency

> ⏱ 3 hours · Module 18 · Cloud Saves & Sync

## What you'll learn
- How conflicts happen in practice
- The four situations a device can be in, and what to do in each
- Why "last write wins" and automatic merging are wrong for game saves
- Designing the "which save do you want to keep?" choice
- Reducing conflicts: noticing the other device's progress early
- Never losing the save that wasn't chosen

---

## How conflicts happen

Revisions (18.1) **detect** that two devices changed the same save. They don't decide what to do about it. Some realistic stories:

- Ava plays on her phone on the train with no signal, then plays on her laptop at home before the phone reconnects.
- The game is left open in a background tab on her work PC while she plays on her phone all evening.
- She plays on the laptop, closes it before the last upload finishes, then plays on her phone.

## Four situations

When a device compares its local save with the server's, there are only four possibilities:

| Local changed since `baseRevision`? | Server changed since `baseRevision`? | Situation | Action |
|---|---|---|---|
| no | no | **in sync** | nothing |
| yes | no | **only we changed** | push our save |
| no | yes | **only they changed** | pull theirs: load it into the game |
| yes | yes | **both changed** | a real conflict: someone has to choose |

"Server changed" means its revision is higher than our `baseRevision`. "Local changed" is the `dirty` flag from 18.2. If there's no server save at all, we push.

The first three are handled **silently**. Only the fourth needs the player, and good sync design makes the fourth rare (see "Reducing conflicts" below). Exercise 18-02's `resolveConflict` is exactly this table.

## What *not* to do

### Last write wins
"Just take whichever was uploaded last." It's simple, and it quietly deletes progress: whichever device happened to reconnect last overwrites hours of play on the other. Players notice, and they don't forgive it.

### Automatic merging
Collaborative editors (Google Docs, Figma) merge concurrent edits, often using CRDTs. For game saves, merging is a trap:

- XP: take the max per skill? Ava spent the morning fishing on her phone and the evening fishing on her laptop. Max discards one session; sum double-counts the shared starting XP.
- Items: union the bank? She sold 500 logs on one device and still has them on the other. Merging **duplicates items** (a "dupe"), the classic exploit in multiplayer games.
- Gold, quests, equipment: every field needs its own rule, and every rule has a case that's wrong.

You could design the game state as a log of events to make merging possible. That's a big architectural change for a rare situation. For a single-player game, **choosing one save** is simpler and safe.

## Asking the player

When both changed, show both saves and let the player pick:

```
┌───────────────────────────────────────────────┐
│  Your progress is different on two devices    │
│                                               │
│  ◉ This device       ★ Recommended            │
│    Total level 152 · 48,210 gold · 2 min ago  │
│                                               │
│  ○ Cloud save                                 │
│    Total level 147 · 51,000 gold · 3 h ago    │
│                                               │
│  The other save will be kept as a backup.     │
│              [ Keep selected save ]           │
└───────────────────────────────────────────────┘
```

- **Summaries, not raw data**: total level, gold and "saved 2 minutes ago" are what a player can actually compare.
- **Recommend one.** The save with more total XP is nearly always the one they want. If it's a tie, recommend the more recently saved one.
- **Say the other is kept.** It removes the fear of choosing wrong, and you really do keep it (below).
- **Don't let the game run on while the dialog is open**, or the "this device" save is changing under the player as they decide. Pause ticking until they choose.

Exercise 18-02 builds the summaries, the recommendation and the text for each choice.

### After the choice
- **Keep this device's save**: set `baseRevision` to the server's current revision, then push. The `PUT` is now based on the latest revision, so it succeeds and becomes the new revision.
- **Use the cloud save**: load the server's save into the engine and set `baseRevision` to its revision. The device is now in sync.

Either way, **back up the loser** first: locally (a `hearthwild:user:42:backup` key) and, through `save_history`, on the server. A "restore previous save" button in settings turns a wrong click into a minor annoyance.

## Reducing conflicts

Most conflicts are avoidable if each device notices the other's progress **before** making its own changes:

- **Check on focus.** When the game becomes visible again (`visibilitychange` → visible), call `GET /api/save/meta`. If the server's revision is higher and we're **not dirty**, pull silently. That's the "only they changed" row, with no dialog.
- **Check at startup**, before the first tick, for the same reason.
- **Pause when hidden.** A backgrounded tab that keeps simulating keeps making local changes. With offline progress (13.8), there's no need to: pause on hidden and catch up when visible again (14.4), after checking the server.
- **One tab at a time** (14.4's single-tab guard), so two tabs on one device can't fight.

With these in place, a real conflict needs two devices to have been **used offline at overlapping times**, which is rare and is exactly when a player expects to be asked.

## Testing concurrency

Concurrency bugs depend on timing, which makes them hard to reproduce. Make the timing explicit instead:

- Keep the decision logic **pure** (`resolveConflict(local, remote)`), so every row of the table is a one-line test.
- Script the multi-device stories as sequences against an in-memory server: "phone reads rev 3; laptop reads rev 3; laptop pushes (→ 4); phone pushes based on 3 → expect conflict".
- Use fake time (`vi.useFakeTimers`, 12.2) for anything interval-based.

## Check your understanding

1. What are the four situations, and which needs the player?
2. Why is "last write wins" unacceptable for saves?
3. Give one concrete way that merging two saves goes wrong.
4. What should the conflict dialog show, and which save should it recommend?
5. After the player chooses "keep this device's save", what does the client do?
6. Name two ways to make conflicts rarer.

<details><summary>Answers</summary>

1. In sync (do nothing), only we changed (push), only they changed (pull), both changed (ask the player).
2. It silently deletes the progress made on whichever device didn't upload last.
3. Any of: unioning the bank duplicates items that were sold or used on one device; summing XP double-counts the shared starting XP; taking the max discards a whole session.
4. A summary of each (total level, gold, how long ago it was saved), a recommendation (more total XP, then most recent), and a note that the other is kept as a backup.
5. Backs up the cloud save, sets `baseRevision` to the server's current revision, and pushes its local save, which now succeeds.
6. Any two of: check `/api/save/meta` on focus and at startup and pull silently if we're clean; pause the simulation when hidden; allow one tab at a time.
</details>

## Further reading
- Martin Kleppmann, *Designing Data-Intensive Applications*, chapter 5 ("Detecting Concurrent Writes")
- crdt.tech, for when you *do* need merging (collaborative apps)

---
[← Local-first saving](02-local-first-saving.md) · [Module overview](README.md) · [Next: Trusting time & cheating →](04-trusting-time-and-cheating.md)
