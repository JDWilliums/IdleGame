// Reference solution for 13-05. Read it only AFTER your own version passes.

export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(min: number, max: number, rng: Rng): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RangeError(`Invalid range ${min}..${max}`);
  }
  return min + Math.floor(rng() * (max - min + 1)); // +1 so `max` is reachable
}

export function chance(probability: number, rng: Rng): boolean {
  return rng() < probability; // p = 0 never, p = 1 always (rng() < 1 always holds)
}

export type WeightedEntry<T> = { value: T; weight: number };

export function rollWeighted<T>(table: readonly WeightedEntry<T>[], rng: Rng): T {
  const total = table.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) throw new Error('Weighted table has no positive weights');
  let roll = rng() * total;
  let fallback: T | undefined;
  for (const entry of table) {
    if (entry.weight <= 0) continue;
    fallback = entry.value;
    roll -= entry.weight;
    if (roll < 0) return entry.value;
  }
  return fallback as T; // floating-point safety net: the last positive entry
}

export type Drops = Record<string, number>;

export type LootTable = {
  always?: readonly { item: string; min: number; max: number }[];
  chance?: readonly { item: string; probability: number; min: number; max: number }[];
  oneOf?: readonly WeightedEntry<{ item: string; qty: number }>[];
};

export function rollLoot(table: LootTable, rng: Rng): Drops {
  const drops: Drops = {};
  const add = (item: string, qty: number) => {
    if (qty > 0) drops[item] = (drops[item] ?? 0) + qty;
  };
  for (const d of table.always ?? []) add(d.item, randomInt(d.min, d.max, rng));
  for (const d of table.chance ?? []) {
    if (chance(d.probability, rng)) add(d.item, randomInt(d.min, d.max, rng));
  }
  if (table.oneOf && table.oneOf.length > 0) {
    const pick = rollWeighted(table.oneOf, rng);
    add(pick.item, pick.qty);
  }
  return drops;
}

export function expectedLoot(table: LootTable, completions: number): Drops {
  const totals: Drops = {};
  const add = (item: string, amount: number) => {
    totals[item] = (totals[item] ?? 0) + amount;
  };
  for (const d of table.always ?? []) add(d.item, completions * ((d.min + d.max) / 2));
  for (const d of table.chance ?? []) add(d.item, completions * d.probability * ((d.min + d.max) / 2));
  const oneOf = table.oneOf ?? [];
  const totalWeight = oneOf.reduce((sum, e) => sum + Math.max(0, e.weight), 0);
  if (totalWeight > 0) {
    for (const e of oneOf) add(e.value.item, completions * (Math.max(0, e.weight) / totalWeight) * e.value.qty);
  }
  // Floor at the end (not per entry) so fractions from several sources add up first.
  const result: Drops = {};
  for (const [item, amount] of Object.entries(totals)) {
    const whole = Math.floor(amount + 1e-9); // tiny epsilon guards against 199.99999999 → 199
    if (whole > 0) result[item] = whole;
  }
  return result;
}
