/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 13-05 · seeded-rng-and-loot
 * Lesson:  13.7 Randomness & loot tables
 * Run:     npm run watch 13-05
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · createRng(seed): implement mulberry32 exactly as shown in lesson
 *   13.7. The tests check its first outputs for known seeds.
 *
 * TASK 2 · randomInt(min, max, rng): an integer in [min, max] INCLUSIVE.
 *   Throw a RangeError if min/max aren't integers or max < min.
 *
 * TASK 3 · chance(probability, rng): true with the given probability (0..1).
 *
 * TASK 4 · rollWeighted(table, rng): pick one entry's `value`, with probability
 *   proportional to its weight. Entries with weight ≤ 0 can never be picked.
 *   Throw an Error if no entry has a positive weight (including an empty table).
 *
 * TASK 5 · rollLoot(table, rng): returns { [item]: qty } for one roll:
 *     always: every entry drops randomInt(min, max)
 *     chance: each entry drops randomInt(min, max) with its probability
 *     oneOf:  one weighted pick drops its qty
 *   Roll in that order (always, chance, oneOf), each in array order. Leave out
 *   items whose total is 0, and add up repeated items.
 *
 * TASK 6 · expectedLoot(table, completions): the EXPECTED drops over many
 *   completions, for offline progress (no rng involved):
 *     always: completions × (min + max) / 2
 *     chance: completions × probability × (min + max) / 2
 *     oneOf:  completions × (weight / totalWeight) × qty
 *   Sum per item, then floor each total. Leave out items that floor to 0.
 */

export type Rng = () => number;

export function createRng(seed: number): Rng {
  throw new Error('Not implemented yet');
}

export function randomInt(min: number, max: number, rng: Rng): number {
  throw new Error('Not implemented yet');
}

export function chance(probability: number, rng: Rng): boolean {
  throw new Error('Not implemented yet');
}

export type WeightedEntry<T> = { value: T; weight: number };

export function rollWeighted<T>(table: readonly WeightedEntry<T>[], rng: Rng): T {
  throw new Error('Not implemented yet');
}

export type Drops = Record<string, number>;

export type LootTable = {
  always?: readonly { item: string; min: number; max: number }[];
  chance?: readonly { item: string; probability: number; min: number; max: number }[];
  oneOf?: readonly WeightedEntry<{ item: string; qty: number }>[];
};

export function rollLoot(table: LootTable, rng: Rng): Drops {
  throw new Error('Not implemented yet');
}

export function expectedLoot(table: LootTable, completions: number): Drops {
  throw new Error('Not implemented yet');
}
