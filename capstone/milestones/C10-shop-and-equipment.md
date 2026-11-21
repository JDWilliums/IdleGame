# C10 · Shop, equipment & economy

> ⏱ ~10 hours · Lessons: 13.1 (pacing), 13.2, 13.9, 08 · Course exercises to reuse: 08-04, 13-07

## Why
Gold needs something to buy, and the loop needs upgrades that compound (13.1). This milestone adds the shop, tools that speed up skills, bank space, and the Hearth, Hearthwild's signature sink, then has you balance the economy with data rather than guesswork.

## User stories

### US-1 · The shop
*As a player, I want to spend gold on upgrades.*

**Acceptance criteria**
- [ ] A shop page listing tools by skill and tier ([GAME-DESIGN §7.1](../GAME-DESIGN.md#71-tools-c10)) and bank-slot upgrades (§7.2).
- [ ] Each entry shows its cost, requirement and effect ("Iron axe · 600 gold · Woodcutting 20 · 20% faster chopping").
- [ ] Unavailable items explain why, in text ("Need 140 more gold", "Requires Woodcutting 20"), and the buy button is disabled with that reason as its description.
- [ ] Buying asks for confirmation for anything over 1,000 gold, and shows a confirmation message.

### US-2 · Tools make skills faster
*As a player, I want my new axe to make a difference I can see.*

**Acceptance criteria**
- [ ] Buying a tool equips it, replacing the lower tier. Tools never use bank slots.
- [ ] The engine computes **effective action time** from the base time, the tool and any other modifiers in one pure, tested function, used by both `tick` and the UI.
- [ ] Skill pages show the effective time with the bonus explained ("2.4 s (−20% iron axe)").
- [ ] Changing tools mid-action keeps progress as a fraction, so the bar doesn't jump backwards.

### US-3 · More space
*As a player, I want a bigger bank.*

**Acceptance criteria**
- [ ] +10 slots per purchase, with the escalating price from §7.2 computed by a pure, tested function.

### US-4 · The Hearth
*As a player, I want a long-term goal that uses everything I gather.*

**Acceptance criteria**
- [ ] A Hearth page: the current level, the bonus ("+6% XP to all skills"), the next level's donation with have/need for each material, and a Donate button.
- [ ] Donating removes the materials atomically (all or nothing) and raises the level. Tested.
- [ ] The XP bonus applies to all XP gains in the engine, including offline catch-up, and the XP shown on actions includes it.
- [ ] The fire visibly grows with the level (CSS/SVG). Under `prefers-reduced-motion`, no flicker animation.
- [ ] Levels 5 → 10 are designed by you, and documented.

### US-5 · A balanced economy
*As the designer, I want prices that feel fair, based on numbers.*

**Acceptance criteria**
- [ ] A script (`npm run balance`) or spreadsheet computes, from the game data, gold per hour and XP per hour for each action (with and without tools), and the time to afford each purchase at the relevant level.
- [ ] You've adjusted at least one number based on it, and documented the targets and decisions in `docs/balance.md` or an ADR.

## Tests to write
- The engine: buying (not enough gold, level too low, already owned, a tier upgrade), effective action time, the bank-slot price series, Hearth donation (all or nothing) and the XP multiplier, including in batched and offline ticks.
- Components: shop entries show the right disabled reasons; donating updates the Hearth page.

## Hints (directions, not code)
- All modifiers (tools now, the Hearth, maybe equipment and buffs later) should flow through **one** function per stat (`effectiveDurationMs`, `xpMultiplier`), so nothing is computed differently in two places.
- Keep your balance script in `packages/engine` (it imports the same data). That way it's never out of date.
- Prices are data too. Put the shop catalogue in `src/data/`.

## Lessons to revisit
13.1 (pacing, sinks) · 13.2 · 13.5 · 13.9 · 08.4 (Immer, if your updates get deeply nested)

## Stretch goals
- Achievements ("Own every bronze tool") with a small, permanent reward.
- A "market price of the day" for one item: interesting to check, but missing a day costs nothing (GAME-DESIGN §15).

## Demo
A screenshot of the Hearth at a high level, and your balance table in the README.

---
[← C09](C09-cloud-sync.md) · [Capstone overview](../README.md) · [Next: C11 · Combat →](C11-combat.md)
