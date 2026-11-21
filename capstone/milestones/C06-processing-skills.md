# C06 · Processing skills

> ⏱ ~10 hours · Lessons: 13.2, 13.5, 13.7 · Course exercises to reuse: 13-04, 13-05, P2

## Why
Processing skills (Smithing and Cooking) turn gathering into a production chain: ore → bars, raw fish → food. They're where batching gets harder, because inputs run out, and where the game gains its first real decisions: "do I sell this ore, or smelt it?"

## User stories

### US-1 · Recipes as data
*As a designer, I want processing actions to declare their inputs.*

**Acceptance criteria**
- [ ] The Smithing bars and Cooking recipes from [GAME-DESIGN §4.4–4.5](../GAME-DESIGN.md#44-smithing-processing) as data, with `inputs: { itemId, qty }[]`. (The weapon recipes wait for C11.)
- [ ] Data integrity tests cover inputs too: every input item exists, and quantities are positive integers.

### US-2 · Starting needs materials
*As a player, I want to know whether I can make something, and how many.*

**Acceptance criteria**
- [ ] `startAction` refuses a recipe you have no inputs for, with the reason `'missingInputs'`.
- [ ] A selector gives "how many can I make?" (the minimum over inputs of `floor(have / need)`).
- [ ] The recipe UI shows each input as have/need ("Copper Ore 12 / 1"), the outputs, and "Can make 12". A missing input is shown with text, not just colour.

### US-3 · Processing over time
*As a player, I want recipes to consume inputs and stop when I run out.*

**Acceptance criteria**
- [ ] Each completion removes the inputs and adds the outputs and XP.
- [ ] When inputs run out, the action stops with `actionStopped` (`reason: 'noInputs'`), and the UI explains it.
- [ ] **Batched ticks** limit completions to `min(completions that fit in dtMs, completions the inputs allow, completions the bank allows)`. Still O(1).
- [ ] Using up an item's last unit frees its bank slot, so a recipe can complete even when the bank was full, if it uses up an item.

### US-4 · A complete chain
*As a player, I want the full loop to work: mine copper and tin, smelt bronze, sell bars.*

**Acceptance criteria**
- [ ] A test plays the chain through the engine API only: mine both ores, smelt until out, check the final bank and XP exactly.
- [ ] The invariant from C02 (one big tick equals many small ticks) still holds for processing actions, including when inputs run out partway.

## Tests to write
- Starting with and without inputs; "can make N".
- A batched tick that runs out of inputs halfway through `dtMs`: the exact completions, leftover progress and stop event.
- The bank-slot edge cases above.
- The full-chain test.

## Hints (directions, not code)
- You did a simpler version of this in P2 ("smelting stops when you run out of ore"). Compare that React-state version with your pure engine function: that's the point of Module 13.
- Write "how many completions can the inputs afford?" as its own small, tested function. Then the batched tick takes a `Math.min` of three such numbers.
- Think carefully about the order within one completion: inputs out, then outputs in. It matters when the bank is full.

## Lessons to revisit
13.2 (data) · 13.5 (batching) · 07.5 (derived values) · P2

## Stretch goals
- **Burn chance** for Cooking (GAME-DESIGN §4.5), using the seeded RNG with its state in `GameState`. For batched ticks, use the expected value (13.8) or a binomial draw. Explain your choice in an ADR.
- "Make N" targets: stop after N completions.

## Demo
A screenshot of a recipe card showing have/need, and a line in the README explaining how batching handles inputs.

---
[← C05](C05-bank-and-items.md) · [Capstone overview](../README.md) · [Next: C07 · Local saves, offline progress & migrations →](C07-local-saves-and-offline.md)
