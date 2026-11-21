# C02 · Game data & engine core

> ⏱ ~14 hours · Lessons: 13.1–13.7 · Course exercises to reuse: 13-01, 13-02, 13-04, 13-05

## Why
The engine is the game. Everything else displays it, saves it or syncs it. A pure, well-tested engine makes every later milestone easier, and it's the part of your code an interviewer is most likely to ask you to walk through.

## User stories

### US-1 · Content as data
*As a designer, I want skills, actions and items defined as data, so that adding content never needs new code.*

**Acceptance criteria**
- [ ] Typed data for the five **skills**, the **gathering actions** in [GAME-DESIGN §4.1–4.3](../GAME-DESIGN.md#4-skills), and the **items** they produce (§5), in `packages/engine/src/data/`.
- [ ] Ids are typed (e.g. `type ItemId = keyof typeof ITEMS`), so a typo in data is a compile error (13-01).
- [ ] **Data integrity tests**: every action's skill and output items exist; every level is 1–99; every duration and XP value is positive; item ids are `snake_case` and unique.

### US-2 · XP and levels
*As a player, I want my XP to turn into levels on a satisfying curve.*

**Acceptance criteria**
- [ ] `xpForLevel` and `levelForXp` match 13.6 (level 2 = 83, 10 = 1,154, 99 = 13,034,431), capped at 99.
- [ ] Selectors: the level of a skill, progress to the next level (0–1), and total level.

### US-3 · Choosing an action
*As a player, I want to start and stop actions, and be told why I can't start one.*

**Acceptance criteria**
- [ ] `startAction(state, actionId)` returns the new state with that action active and progress at 0, **or** the unchanged state plus a reason (`'levelTooLow'`, `'unknownAction'`).
- [ ] Only one action is active. Starting another replaces it.
- [ ] `stopAction(state)` clears the active action.

### US-4 · Time passes
*As a player, I want actions to complete over time and give me items and XP.*

**Acceptance criteria**
- [ ] `tick(state, dtMs)` returns `{ state, events }` and never mutates its input.
- [ ] Partial progress carries over between ticks (13.5).
- [ ] **Batching**: a large `dtMs` (e.g. 12 hours) completes the right number of actions in **O(1)**, not in a loop over every completion (13-04).
- [ ] Events: `itemGained` (summed per item per tick), `xpGained`, `levelUp` (one per level crossed), and `actionUnlocked` when a level-up reaches a new action's requirement.
- [ ] **Invariant test**: `tick(s, 10_000)` gives the same state as ten calls of `tick(s, 1_000)` (the same items, XP and progress).

### US-5 · A full bank stops you
*As a player, I want my action to stop when the bank has no room, instead of losing items silently.*

**Acceptance criteria**
- [ ] The bank has `slots` (40 to start). Each distinct item uses one slot.
- [ ] If completing an action would add a **new** item to a full bank, the action stops **before** that completion, with an `actionStopped` event (`reason: 'bankFull'`). Completions before it still count, even in a batched tick.

### US-6 · Pure and deterministic
*As the developer, I want the engine to be trivially testable.*

**Acceptance criteria**
- [ ] No `Date.now()`, `Math.random()`, timers, DOM or I/O anywhere in `packages/engine`. Lint for it if you can (`no-restricted-globals` / `no-restricted-properties`).
- [ ] The seeded RNG from 13-05 is in the package, with its tests, ready for C06/C11 (its state will live in `GameState`).
- [ ] Coverage for `packages/engine` is above 90% (`vitest --coverage`).

## Hints (directions, not code)
- Start from your 13-01 and 13-04 solutions. They're most of this milestone. Adapt them to the full data rather than starting over.
- For bank-full in a batched tick: work out how many completions fit before the problem, the same way you'd work out how many fit in `dtMs`, and take the smaller number.
- Events are data, not callbacks. The engine returns them, and the runtime decides what to do with them (C04).
- Write the invariant test early. It catches off-by-one errors in batching immediately.

## Lessons to revisit
13.2 (data-driven design) · 13.3 (state shape) · 13.5 (ticks and batching) · 13.6 (XP curve) · 12.2 (Vitest)

## Stretch goals
- Property-based tests with `fast-check`: for random states and random tick splits, the batched result equals the stepwise one.
- A `simulate` script that prints "time to level N" for each skill. Your first balancing tool.

## Demo
`npm test -w packages/engine` output with coverage, and a short README section explaining the engine's public API.

---
[← C01](C01-project-setup.md) · [Capstone overview](../README.md) · [Next: C03 · App shell & navigation →](C03-app-shell.md)
