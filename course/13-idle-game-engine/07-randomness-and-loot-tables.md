# 13.7 · Randomness & loot tables

> ⏱ 2 hours · Module 13 · The Idle Game Engine

## What you'll learn
- Why `Math.random()` is a problem for games
- Seeded pseudo-random number generators (PRNGs), with mulberry32 as an example
- Weighted loot tables, chance drops and quantity ranges
- Expected value, which you need for offline progress
- Testing randomness: determinism, distributions and edge cases

---

## The problem with `Math.random()`

- **Untestable**: you can't assert what a roll produced.
- **Unreproducible**: a player reports "I got 3 gems in a row". You can't replay it.
- **Not seedable**: there's no way to get the same sequence twice.

## Seeded PRNGs

A **pseudo-random number generator** is a deterministic function that, starting from a **seed**, produces a sequence of numbers that *look* random. The same seed always gives the same sequence.

**mulberry32** is a tiny, fast, good-enough PRNG for games:

```ts
export type Rng = () => number;   // returns a float in [0, 1)

export function createRng(seed: number): Rng {
  let a = seed >>> 0;                         // force to an unsigned 32-bit integer
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;   // 2^32
  };
}

const rng = createRng(42);
rng(); rng(); rng();        // the same three numbers, every time, on every machine
```

You don't need to understand the bit-twiddling (it mixes bits with multiplications and XOR shifts). Know what a PRNG *is*, why it's seeded, and its limits:
- ✅ great for gameplay randomness, tests and replays
- ❌ **never for security** (passwords, tokens, session ids). Use `crypto.getRandomValues` / `crypto.randomUUID()` for those (lesson 17.5).

### Where the RNG lives
The engine receives it as a parameter, which keeps `tick` pure:

```ts
tick(state, dtMs, rng)
```

In the shell, you create one per session (`createRng(Date.now())`), or store the seed in the save so a reload reproduces the same drops.

## Helpers you'll need

```ts
/** integer in [min, max], inclusive */
export function randomInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** true with probability p (0..1) */
export function chance(p: number, rng: Rng): boolean {
  return rng() < p;
}
```

> Off-by-one alert: `Math.floor(rng() * (max - min + 1))`. Without the `+ 1`, `max` can never be rolled.

## Weighted tables

"Pick exactly one" with relative weights:

```ts
export type WeightedEntry<T> = { value: T; weight: number };

export function rollWeighted<T>(table: readonly WeightedEntry<T>[], rng: Rng): T {
  const total = table.reduce((sum, e) => sum + e.weight, 0);
  if (total <= 0) throw new Error('Weighted table has no positive weights');
  let roll = rng() * total;             // a point on the "number line" of weights
  for (const entry of table) {
    roll -= entry.weight;
    if (roll < 0) return entry.value;
  }
  return table[table.length - 1]!.value;   // floating point safety net
}
```

```
weights:   shrimp 70 | sardine 25 | treasure 5     (total 100)
roll × 100: |----------70----------|-----25-----|-5-|
```

## Loot tables

A loot table for fishing might combine:
- **guaranteed drops**: always 1 raw fish
- **chance drops**: 2% chance of a "message in a bottle"
- **quantity ranges**: 1–3 seaweed

```ts
export type LootTable = {
  always?: readonly { item: ItemId; min: number; max: number }[];
  chance?: readonly { item: ItemId; probability: number; min: number; max: number }[];
  oneOf?: readonly WeightedEntry<{ item: ItemId; qty: number }>[];
};

export function rollLoot(table: LootTable, rng: Rng): Partial<Record<ItemId, number>> {
  const drops: Partial<Record<ItemId, number>> = {};
  const add = (item: ItemId, qty: number) => { if (qty > 0) drops[item] = (drops[item] ?? 0) + qty; };

  for (const d of table.always ?? []) add(d.item, randomInt(d.min, d.max, rng));
  for (const d of table.chance ?? []) if (chance(d.probability, rng)) add(d.item, randomInt(d.min, d.max, rng));
  if (table.oneOf?.length) { const pick = rollWeighted(table.oneOf, rng); add(pick.item, pick.qty); }
  return drops;
}
```

You'll build these in exercise 13-05. The capstone's fishing and combat use them.

## Expected value: randomness in bulk

When a player returns after 8 hours and 10,000 fishing actions completed, you **don't** roll 10,000 times on the main thread. Instead:
- **Expected value**: a 2% drop over 10,000 completions gives an expected 200. Award `Math.floor(200)`, or use the fractional part as one final chance roll. It's fast and fair.
- Or roll in a Web Worker (14.5), or roll in chunks.

```
expected = completions × probability × average(min, max)
```

For guaranteed drops with a range, the expected total is `completions × (min + max) / 2`.

Many idle games use expected values for offline progress and real rolls for online play. That's a reasonable design: players rarely notice, and nobody gets an unlucky 8 hours.

## Testing randomness

1. **Determinism**: the same seed gives the same sequence:
   ```ts
   expect(take(createRng(1), 5)).toEqual(take(createRng(1), 5));
   expect(take(createRng(1), 5)).not.toEqual(take(createRng(2), 5));
   ```
2. **A controlled RNG** for exact outcomes: `() => 0` always picks the first entry, and `() => 0.9999` the last.
3. **Distribution sanity**: roll 10,000 times and check the proportions are within a tolerance:
   ```ts
   const counts = countRolls(10_000, () => rollWeighted(table, rng));
   expect(counts.shrimp / 10_000).toBeCloseTo(0.7, 1);   // within about ±0.05
   ```
   With a **seeded** RNG this test is deterministic, so it can never flake.
4. **Edge cases**: zero weights, empty tables (they should throw), `min === max`, probability 0 and 1.

## Check your understanding

1. Why is a seeded PRNG better than `Math.random()` for a game?
2. Should you use mulberry32 to generate session tokens? Why not?
3. What's wrong with `min + Math.floor(rng() * (max - min))`?
4. A 5% drop and 3,000 offline completions: what's the expected number of drops?
5. Why do distribution tests with a seeded RNG never flake?

<details><summary>Answers</summary>

1. Results are reproducible (the same seed gives the same sequence), which makes randomness testable, replays possible and bug reports debuggable.
2. No. It's predictable: anyone who learns the state can predict the outputs. Security needs a cryptographically secure generator (`crypto.getRandomValues`).
3. It can never return `max` (an off-by-one). It needs `+ 1` inside the multiplication.
4. 3,000 × 0.05 = 150.
5. The "random" sequence is identical on every run, so the measured proportions are identical too.
</details>

## Further reading
- Wikipedia: [Pseudorandom number generator](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
- MDN: [`Crypto.getRandomValues()`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues) (for security-sensitive randomness)

**Practice:** exercise `13-05` seeded-rng-and-loot → `npm run watch 13-05`

---
[← XP curves & levelling](06-xp-curves-and-levelling.md) · [Module overview](README.md) · [Next: Offline progress →](08-offline-progress.md)
