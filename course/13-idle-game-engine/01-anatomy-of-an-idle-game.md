# 13.1 · Anatomy of an idle game

> ⏱ 1.5 hours · Module 13 · The Idle Game Engine

## What you'll learn
- The core loop that makes idle games compelling
- The building blocks of a skill-based idle RPG
- Pacing and progression
- Designing ethically: respecting players' time
- The engine architecture you'll build in this module

---

## The core loop

Every idle game runs on a loop like this:

```
   ┌────────────► choose an action ──────────────┐
   │              (chop oak trees)                │
   │                                              ▼
 upgrade                                   time passes
 (better axe, new tree,                    (even while you're away)
  higher level unlocks)                           │
   ▲                                              ▼
   └──────────── spend / use ◄────────── rewards accumulate
                 (sell logs, craft)      (logs, XP, gold)
```

What makes it satisfying:
- **Visible, constant progress.** Bars fill and numbers go up. Something is always improving.
- **Meaningful choices.** Which skill to train, what to sell, what to craft or buy next.
- **Compounding.** Upgrades make the loop faster, which earns upgrades sooner.
- **Respect for real life.** Progress continues while you're away, so you check in, make decisions, and leave.

## Genres

| Type | Defining feature | Example mechanics |
|---|---|---|
| **Clicker** | active clicking produces resources | click → +1 cookie |
| **Incremental** | numbers grow exponentially, often to astronomical sizes | generators, prestige resets, 1e308 |
| **Idle RPG** | RPG systems (skills, items, gear, combat) that run on timers | train skills, gather, craft, fight |

Your capstone is an **idle RPG**: the genre of games like Melvor Idle, built around parallel progression systems.

## The building blocks of an idle RPG

| Concept | What it is | In your game |
|---|---|---|
| **Skill** | a progression track with XP and levels | Woodcutting, Fishing, Mining, Smithing, Cooking |
| **Action** | something a skill can do repeatedly; it takes time and requires a level | "Chop Oak Tree": 3 s, level 1, +10 XP, +1 Oak Log |
| **Item** | a thing in the bank | Oak Log, Copper Ore, Bronze Bar |
| **Recipe** | an action with **inputs** (consumes items) | Smelt Bronze Bar: 1 Copper + 1 Tin → 1 Bronze Bar |
| **Bank** | your item storage (with a slot limit, perhaps) | |
| **Gold / shop** | a currency, plus upgrades to buy | a better axe, more bank slots |
| **Equipment** | items that change stats or speeds | an axe that chops 10% faster |
| **Mastery** | per-action progression on top of skill levels | chop oaks enough to earn a bonus double-log chance |
| **Combat** | a special loop: your stats vs monster stats, with loot tables | a later milestone (C11) |

These map directly onto **data** (lesson 13.2) and **state** (13.3).

## Pacing

Idle games are long-term experiences. Pacing comes from:
- **The XP curve** (13.6): early levels take minutes, later ones days.
- **Unlocks**: new actions at level 10, 20, 30… give a regular "something new" moment.
- **Resource sinks**: crafting consumes items, and the shop consumes gold, which keeps resources meaningful.
- **Offline caps**: limiting offline progress (say 12 hours) rewards checking in occasionally without punishing busy days.

You'll balance your capstone with a spreadsheet (see the module's extra practice). Professional game designers do exactly this.

## Design ethically

Idle games can manipulate people (endless notifications, loot boxes, pay-to-skip timers, fear-of-missing-out events). Some studios design deliberately for compulsion. You don't have to:
- **No pay-to-win**, and no dark patterns.
- **Notifications are opt-in and rare** ("your bank is full", not "come back!!!").
- **Offline progress is generous**, so players never feel punished for having a life.
- **Saves are safe.** Losing someone's 200 hours of progress is the worst thing your game can do (Modules 18 and 21).

This is also a good interview topic: "how would you design notifications responsibly?" shows maturity.

## The architecture you'll build

```
┌────────────────────────────── the game (Modules 13–18) ─────────────────────────────┐
│                                                                                       │
│   STATIC DATA (13.2)          PURE ENGINE (13.3–13.10)          SHELL (Modules 14+)   │
│   skills, items, actions  ──► state + tick(state, dt, rng)  ◄── loop (timer, clock)   │
│   loot tables, recipes        xp curve, loot, offline,          store (Zustand)        │
│   (typed constants)           migrations  → events            ◄── React UI renders     │
│                               no I/O, no timers, no React        storage + API sync    │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

**Pure core, imperative shell:**
- The **core** is pure functions: `tick(state, dtMs, rng) → { state, events }`, `levelFromXp(xp)`, `calculateOffline(state, elapsed)`, `migrateSave(raw)`. They're deterministic and easy to test, with hundreds of millisecond-fast tests.
- The **shell** is the small amount of code that touches the outside world: reading the clock, scheduling the loop, storing saves, calling the API, rendering React.

This is the same idea as reducers (08.1), applied to a whole game. You already have every skill you need for it.

### A day in the life of a tick
1. A timer fires (the shell, 13.4/14.1).
2. The shell measures the elapsed time and calls `tick(state, dt, rng)` once per fixed step.
3. `tick` advances the active action: progress, completions, items, XP, level-ups. It returns new state plus **events** (`[{ type: 'itemGained', itemId: 'oak_log', qty: 1 }, { type: 'levelUp', skill: 'woodcutting', level: 15 }]`).
4. The shell puts the new state in the store. React re-renders what changed, and events trigger toasts or sounds.
5. Every so often, or when the tab is hidden, the shell saves (13.10, 18.2).

## Check your understanding

1. Name the four steps of the core loop.
2. What's the difference between an action and a recipe in this design?
3. Give two ways an idle game can respect its players.
4. Which parts of the architecture are allowed to read `Date.now()`?

<details><summary>Answers</summary>

1. Choose an action → time passes → rewards accumulate → spend or upgrade (which leads back to choosing).
2. A recipe is an action that also has **inputs** it consumes. Gathering actions only produce outputs.
3. Any two of: generous offline progress, opt-in rare notifications, no pay-to-win or dark patterns, safe saves.
4. Only the shell. The core receives time as a parameter (elapsed `dt`, or `now` for offline calculations).
</details>

## Further reading
- Game design: "The Math of Idle Games" (Anthony Pecorella's articles on Kongregate's blog) is a classic.
- Talk: *"Idle Games: The Mechanics and Monetization of Self-Playing Games"* (GDC). Watch it critically: learn the mechanics and avoid the manipulation.

---
[Module overview](README.md) · [Next: Data-driven design →](02-data-driven-design.md)
