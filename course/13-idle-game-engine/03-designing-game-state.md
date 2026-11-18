# 13.3 · Designing game state

> ⏱ 1.5 hours · Module 13 · The Idle Game Engine

## What you'll learn
- The rules for game state: minimal, serialisable, normalised
- A concrete `GameState` type for your idle RPG
- Creating a fresh state
- What doesn't belong in game state
- Thinking about size and growth

---

## The rules

Game state is everything that differs between players and must survive a reload. It's the thing you **save**, so every rule follows from that.

### 1. Minimal: store facts, derive the rest
From lesson 07.2, applied ruthlessly:
- Store **XP**, derive **level** (13.6).
- Store **quantities**, derive **total bank value**.
- Store the **active action id + progress**, and derive the **progress percentage** from the action's duration in the static data.

### 2. Serialisable: it must survive `JSON.stringify`
Only plain objects, arrays, strings, finite numbers, booleans and `null`:
- ❌ `Map`/`Set` (they become `{}`), class instances (they lose their methods), functions, `Date` (it becomes a string), `undefined` values (dropped), `NaN`/`Infinity` (they become `null`), `BigInt` (throws).
- ✅ Timestamps as **numbers** (ms since 1970).
- ✅ `Record<Id, …>` instead of `Map`.

### 3. Normalised: keyed by id, referencing static data by id
- `bank: { oak_log: 312, copper_ore: 40 }`, not an array you have to search.
- `activeAction: { id: 'chop_oak', … }`, not a copy of the action definition.

### 4. Immutable: updated by pure functions
Every change goes through engine functions that return new state (01.1, 08.1).

## A `GameState` for your idle RPG

```ts
export type SkillState = { xp: number };

export type ActiveAction = {
  id: ActionId;
  /** ms of progress into the CURRENT repetition (0 ≤ progressMs < duration) */
  progressMs: number;
};

export type GameState = {
  /** save format version, for migrations (13.10) */
  version: number;
  skills: Record<SkillId, SkillState>;
  bank: Partial<Record<ItemId, number>>;
  gold: number;
  activeAction: ActiveAction | null;
  /** lifetime statistics, nice for a stats screen */
  stats: {
    actionsCompleted: number;
    itemsGained: number;
  };
  /** when this state was last advanced/saved, wall-clock ms (for offline progress) */
  lastUpdatedAt: number;
};
```

Notes:
- `skills` is a `Record<SkillId, …>` with **every** skill present, so the engine never has to handle "missing skill". `createInitialState` fills them all in.
- `bank` is `Partial`, because most items aren't owned. Remove keys at 0 (or keep them, but be consistent).
- `progressMs` is *within the current repetition*. Carry-over between repetitions is handled by the tick (13.5).
- `lastUpdatedAt` is wall-clock time (`Date.now()`), because it has to survive across sessions (01.4).

## Creating a fresh state

```ts
export function createInitialState(now: number): GameState {
  const skills = Object.fromEntries(
    (Object.keys(SKILLS) as SkillId[]).map((id) => [id, { xp: 0 }]),
  ) as Record<SkillId, SkillState>;

  return {
    version: CURRENT_SAVE_VERSION,
    skills,
    bank: {},
    gold: 0,
    activeAction: null,
    stats: { actionsCompleted: 0, itemsGained: 0 },
    lastUpdatedAt: now,
  };
}
```

Note that `now` is passed **in** (12.4), with no hidden `Date.now()`.

Adding a skill later? `createInitialState` picks it up automatically, and a migration adds `{ xp: 0 }` to existing saves (13.10).

## What does NOT belong in game state

| Kind | Example | Where it lives |
|---|---|---|
| static content | action durations, item names | game data modules (13.2) |
| derived values | levels, percentages, totals | computed on read (selectors) |
| **UI state** | which tab is open, a modal, a filter | React state / URL (07, 10) |
| **settings** | volume, theme, reduced motion | a separate settings store and save |
| **session state** | is the user logged in, sync status | auth/sync stores (17, 18) |
| **transient events** | "just levelled up!" | events returned from `tick` (13.5), not stored |

Keeping these separate means the save file contains only what it must, and a theme change doesn't mark the game as "unsaved".

## Size and growth

Saves are synced over mobile networks and stored in `localStorage` (about 5 MB) and in your database:
- A few hundred items plus skills plus stats comes to **kilobytes**. Fine.
- Be careful with **unbounded** structures: a full history log of every action ever taken would grow forever. Store **aggregates** (stats counters) instead, or cap logs (the last 50 entries).
- Lesson 18.1 sets a server-side save size limit, and that's good protection against bugs and abuse.

## Check your understanding

1. Why store `lastUpdatedAt` as a number rather than a `Date`?
2. Why should `skills` contain an entry for every skill, even untrained ones?
3. Where do these live: (a) the player's Mining XP, (b) the Bank tab's sort order, (c) the "Level up!" toast, (d) Copper Ore's sell price?
4. Why avoid storing a full history of actions in the save?

<details><summary>Answers</summary>

1. `JSON.stringify` turns a `Date` into a string, and `JSON.parse` doesn't turn it back. A number survives the round trip unchanged and is easy to do maths with.
2. So the engine and UI never have to handle a missing skill: no `?.` and no `?? 0` everywhere, and fewer bugs.
3. (a) game state, (b) UI state (or the URL), (c) a transient event returned by the tick that triggers UI, (d) static game data.
4. It grows without bound, making saves slow to sync and eventually too big for storage. Store aggregate counters or a capped recent log instead.
</details>

---
[← Data-driven design](02-data-driven-design.md) · [Module overview](README.md) · [Next: The game loop →](04-the-game-loop.md)
