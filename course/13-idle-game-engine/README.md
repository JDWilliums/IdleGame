# Module 13 · The Idle Game Engine

**Time:** ~25 hours · **Prerequisites:** Parts 1–2, especially 01.4 (event loop), 02.4–02.6 (types), 08.1 (reducers) and 12.2 (testing with injected time and randomness)

## Why this module matters
This is the module where you learn how idle games actually *work*. Almost no tutorial covers it properly. You'll design the engine at the heart of your capstone as **plain, framework-free TypeScript**: data-driven content, serialisable state, a fixed-timestep loop, pure tick functions, XP curves, seeded randomness, offline progress computed in microseconds, and save files that survive years of updates.

The skills transfer well beyond games. "Pure core, imperative shell" architecture, deterministic simulations, state machines, schema migrations and performance-conscious maths all come up in fintech, logistics, analytics dashboards and collaborative apps. In interviews, a well-tested game engine is a far better story than another to-do app.

## Learning objectives
By the end of this module you can:
- explain an idle game's core loop and the architecture of its engine
- define game content as typed data, with derived types and integrity checks
- design minimal, serialisable, normalised game state
- implement a fixed-timestep game loop that's robust to throttled background tabs
- write a pure `tick(state, dt)` that handles actions, inputs, outputs, XP and events
- implement XP curves, seeded RNG and loot tables, and test them deterministically
- compute offline progress analytically instead of simulating millions of ticks
- format numbers for players, and handle floating point and very large numbers
- version save files and migrate old saves safely

## Lessons
| # | Lesson | Time |
|---|---|---|
| 13.1 | [Anatomy of an idle game](01-anatomy-of-an-idle-game.md) | 1.5h |
| 13.2 | [Data-driven design](02-data-driven-design.md) | 2h |
| 13.3 | [Designing game state](03-designing-game-state.md) | 1.5h |
| 13.4 | [The game loop](04-the-game-loop.md) | 2.5h |
| 13.5 | [Actions & ticks](05-actions-and-ticks.md) | 3h |
| 13.6 | [XP curves & levelling](06-xp-curves-and-levelling.md) | 2h |
| 13.7 | [Randomness & loot tables](07-randomness-and-loot-tables.md) | 2h |
| 13.8 | [Offline progress](08-offline-progress.md) | 3h |
| 13.9 | [Numbers & formatting](09-numbers-and-formatting.md) | 1.5h |
| 13.10 | [Saving, versioning & migrations](10-saving-versioning-and-migrations.md) | 2.5h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `13-01` | [game-data](../../exercises/13-idle-game-engine/01-game-data/exercise.ts) | 13.2 |
| `13-02` | [xp-curve](../../exercises/13-idle-game-engine/02-xp-curve/exercise.ts) | 13.6 |
| `13-03` | [fixed-timestep-loop](../../exercises/13-idle-game-engine/03-fixed-timestep-loop/exercise.ts) | 13.4 |
| `13-04` | [action-ticks](../../exercises/13-idle-game-engine/04-action-ticks/exercise.ts) | 13.5 |
| `13-05` | [seeded-rng-and-loot](../../exercises/13-idle-game-engine/05-seeded-rng-and-loot/exercise.ts) | 13.7 |
| `13-06` | [offline-progress](../../exercises/13-idle-game-engine/06-offline-progress/exercise.ts) | 13.8 |
| `13-07` | [format-numbers](../../exercises/13-idle-game-engine/07-format-numbers/exercise.ts) | 13.9 |
| `13-08` | [save-migrations](../../exercises/13-idle-game-engine/08-save-migrations/exercise.ts) | 13.10 |

> The exercises follow the lessons' **topics** but are numbered in build order. Do 13-02 (XP) before 13-04 (ticks), because ticks award XP.

Hints: [`exercises/13-idle-game-engine/HINTS.md`](../../exercises/13-idle-game-engine/HINTS.md)

## Checkpoint quiz
1. Describe the "pure core, imperative shell" architecture of the engine.
2. Why store XP and not the level?
3. Why does a fixed timestep make a simulation deterministic, and what's the "spiral of death"?
4. An action takes 3 s and a tick reports 7 s elapsed with 1 s of progress already banked. How many completions, and how much progress carries over?
5. Why shouldn't the tick function call `Math.random()` directly?
6. A player returns after 30 days with a 0.5 s action running. Why must offline progress be calculated, not simulated tick by tick?
7. Why use `Number.isSafeInteger` checks, and at what size do JavaScript numbers stop being exact integers?
8. A save from version 1 is loaded by version 4 of the game. Describe what happens.

<details><summary>Answers</summary>

1. The core (data, state shape, `tick`, XP, loot, offline maths, migrations) is made of pure functions with no I/O, no timers and no React. A thin shell around it handles side effects: the real clock, the loop scheduler, storage, the network and rendering. The core is easy to test, and the shell is small.
2. The level is derived from XP. Storing both risks contradictions, and changing the XP curve later would leave saved levels wrong.
3. Every update advances the simulation by the same `dt`, so the same inputs always produce the same results, regardless of frame timing. The spiral of death: when updates take longer than real time, the backlog grows, so more updates are needed per frame, so it falls further behind. Capping steps per frame prevents it.
4. Total progress = 1 + 7 = 8 s → `Math.floor(8 / 3)` = 2 completions, and 8 − 6 = 2 s carries over.
5. It makes the function non-deterministic and untestable. Pass the RNG in as a parameter (ideally a seeded one), so tests and replays are reproducible.
6. 30 days ÷ 0.5 s is about 5.2 million completions, and running each as a tick would freeze the page for seconds. The number of completions can be computed directly with arithmetic (limited by inputs, caps and so on).
7. Integers above `Number.MAX_SAFE_INTEGER` (2^53 − 1 ≈ 9.007e15) lose precision (for example, `2**53 + 1 === 2**53`). Incremental games with exploding numbers need special libraries. A Melvor-style idle RPG mostly stays well below that, but guarding against it is cheap.
8. The loader reads `version: 1`, then runs migrations v1→v2→v3→v4 in order, each transforming the shape. It validates the result against the current schema, keeps a backup of the original, and only then replaces the in-memory state. A save from a *newer* version is refused rather than corrupted.
</details>

## Extra practice
1. **Balance spreadsheet.** For your capstone's first skill, build a spreadsheet: each action's duration and XP, and the time to reach levels 10, 30, 60 and 99. Adjust until it feels right.
2. **Property-based testing.** Use `fast-check` to test that `levelFromXp(xpForLevel(L)) === L` for all L in 1..99, and that offline progress never gives more items than inputs allow.
3. **Replay.** Record the actions a player takes plus the RNG seed, and replay them to reproduce the exact final state. That's how you'd debug "my items vanished" reports.

**Next:** [Module 14 · Connecting the Engine to React →](../14-engine-meets-react/README.md)
