# C11 · Combat

> ⏱ ~12 hours · Lessons: 13.5, 13.7, 13.8, 21.4 · Course exercises to reuse: 13-04, 13-05, 13-06

## Why
Combat ties every system together: Smithing makes weapons, Cooking makes food, Fishing feeds Cooking, loot feeds the bank and the shop. It's also a great engineering exercise: two independent timers, deterministic randomness, and offline progress that has to account for resources running out.

## The rules
These complete [GAME-DESIGN §8](../GAME-DESIGN.md#8-combat-c11). Put the numbers in data, so you can rebalance them.

| Rule | Formula |
|---|---|
| Player max HP | `10 + combatLevel` |
| Player attack speed | 2.4 s (weapons may change it) |
| Player max hit | `1 + floor(weaponPower × (1 + combatLevel / 40))`. Fists have power 1; Bronze Dagger 3, Iron Sword 6, Steel Sword 10 |
| Player hit chance | `clamp(0.6 + 0.02 × (combatLevel − monsterLevel), 0.2, 0.95)` |
| Monster hit chance | `clamp(0.5 + 0.02 × (monsterLevel − combatLevel), 0.1, 0.9)` |
| Damage on a hit | a uniform whole number from 1 to max hit (seeded RNG) |
| Combat XP | the monster's XP on each kill |
| Eating | when HP < 50% of max and food is selected, eat one (instantly) and heal its amount, up to max |
| Out of food | if HP < 50% and there's no food left, the fight stops (`outOfFood`) |
| Defeat | at 0 HP the fight stops (`defeated`), HP refills, nothing is lost |
| Between kills | the next monster appears after 1 s; HP doesn't regenerate during a fight |

## User stories

### US-1 · Weapons and food
*As a player, I want to make and equip a weapon and choose my food.*

**Acceptance criteria**
- [ ] The weapon recipes from GAME-DESIGN §4.4 are added to Smithing.
- [ ] An equipment panel: equip a weapon from the bank (equipped items leave the bank and free the slot; unequipping returns them), and select a food stack.

### US-2 · Fighting
*As a player, I want to pick a monster and fight it automatically.*

**Acceptance criteria**
- [ ] Areas and monsters (§8) as data, each monster with a **loot table** (13-05: weighted drops plus a gold range).
- [ ] Fighting is an action: starting it replaces any skill action, and it repeats kill after kill.
- [ ] The engine resolves player and monster attacks on **their own timers** within `tick`, using the seeded RNG stored in the state, so the same seed and inputs always give the same fight.
- [ ] Loot goes to the bank and respects bank-full (C02). If loot doesn't fit, it's lost **and** the player is told (or, if you prefer, the fight stops; record your choice).

### US-3 · Seeing the fight
*As a player, I want to follow what's happening.*

**Acceptance criteria**
- [ ] Both HP bars (accessible progress bars), both attack timers, the monster's name and level.
- [ ] A short combat log (the last ~5 events: hits, misses, eats, loot) in a `role="log"` region. Only kills, eats and defeats are announced, throttled (21.4).
- [ ] Clear stop reasons for `outOfFood` and `defeated`, with a "Fight again" button.

### US-4 · Offline combat
*As a player, I want fighting to continue while I'm away, fairly.*

**Acceptance criteria**
- [ ] Offline combat uses **expected values** (13.8): expected kills per hour, damage taken per hour, food eaten per hour and expected loot. No simulating hours of individual hits.
- [ ] If the food would run out (or HP would be expected to hit zero), the fight stops at that point in the offline period, and the summary says so.
- [ ] Expected loot quantities are rounded sensibly (13.8: floor plus a seeded draw for the remainder, or a rule you document).

## Tests to write
- The formulas, as pure functions with table tests (including the clamps).
- A deterministic fight: a fixed seed and state give exactly the expected kills, loot and HP after N seconds.
- Eating at the threshold, running out of food, defeat, and HP refill.
- Offline: expected kills and food over 1 hour and 12 hours. The stop time when food runs out. Compare a long simulated fight (many seeds, averaged) with the expected-value result, within a tolerance.

## Hints (directions, not code)
- Model the fight as state: `{ monsterId, monsterHp, playerAttackMs, monsterAttackMs, respawnMs }`. A `tick` then advances both timers, processing whichever attack is due first, in order. It's the same idea as a fixed timestep (13.4), but with two clocks.
- Get the online simulation right and tested before attempting offline. The offline maths is easier once you trust the per-attack rules.
- The expected damage per player attack is `hitChance × (1 + maxHit) / 2`. You'll need several numbers like this; write each as its own tested function.

## Lessons to revisit
13.4 (time steps) · 13.5 (ticks) · 13.7 (seeded RNG, loot tables) · 13.8 (expected values) · 21.4 (logs and announcements)

## Stretch goals
- Armour (reduces monster hit chance or damage), made by Smithing.
- A boss at the end of each area, with a rare drop.
- A "safe mode" setting: stop fighting automatically when food drops below N.

## Demo
A GIF of a fight, with the log, eating and a loot drop.

---
[← C10](C10-shop-and-equipment.md) · [Capstone overview](../README.md) · [Next: C12 · PWA, polish & launch →](C12-launch.md)
