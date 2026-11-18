import { describe, expect, it } from 'vitest';
import { chance, createRng, expectedLoot, randomInt, rollLoot, rollWeighted, type LootTable, type Rng } from './exercise';

const take = (rng: Rng, n: number) => Array.from({ length: n }, () => rng());
const fixed = (...values: number[]): Rng => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe('createRng (mulberry32)', () => {
  it('produces the known sequence for seed 42 and seed 1', () => {
    const rng = createRng(42);
    expect(rng()).toBeCloseTo(0.6011037519201636, 12);
    expect(rng()).toBeCloseTo(0.44829055899754167, 12);
    expect(rng()).toBeCloseTo(0.8524657934904099, 12);
    expect(createRng(1)()).toBeCloseTo(0.6270739405881613, 12);
  });

  it('is deterministic per seed and differs between seeds', () => {
    expect(take(createRng(7), 10)).toEqual(take(createRng(7), 10));
    expect(take(createRng(7), 10)).not.toEqual(take(createRng(8), 10));
  });

  it('stays within [0, 1)', () => {
    for (const x of take(createRng(123), 10_000)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('randomInt', () => {
  it('covers the whole inclusive range', () => {
    expect(randomInt(1, 3, () => 0)).toBe(1);
    expect(randomInt(1, 3, () => 0.9999999)).toBe(3);
    const seen = new Set(take(createRng(5), 2_000).map((x) => randomInt(1, 6, () => x)));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('handles min === max', () => {
    expect(randomInt(4, 4, createRng(1))).toBe(4);
  });

  it('rejects invalid ranges', () => {
    expect(() => randomInt(5, 1, createRng(1))).toThrow(RangeError);
    expect(() => randomInt(1.5, 3, createRng(1))).toThrow(RangeError);
  });
});

describe('chance', () => {
  it('respects the probability', () => {
    expect(chance(0.3, () => 0.29)).toBe(true);
    expect(chance(0.3, () => 0.3)).toBe(false);
    expect(chance(0, () => 0)).toBe(false);
    expect(chance(1, () => 0.9999999)).toBe(true);
  });

  it('hits about the right rate over many rolls', () => {
    const rng = createRng(99);
    const hits = take(rng, 10_000).filter((x) => chance(0.2, () => x)).length;
    expect(hits / 10_000).toBeCloseTo(0.2, 1);
  });
});

describe('rollWeighted', () => {
  const fish = [
    { value: 'shrimp', weight: 70 },
    { value: 'sardine', weight: 25 },
    { value: 'treasure', weight: 5 },
  ];

  it('maps the roll onto the weights', () => {
    expect(rollWeighted(fish, () => 0)).toBe('shrimp');
    expect(rollWeighted(fish, () => 0.69)).toBe('shrimp');
    expect(rollWeighted(fish, () => 0.7)).toBe('sardine');
    expect(rollWeighted(fish, () => 0.96)).toBe('treasure');
    expect(rollWeighted(fish, () => 0.9999999)).toBe('treasure');
  });

  it('never picks zero-weight entries', () => {
    const table = [
      { value: 'never', weight: 0 },
      { value: 'always', weight: 1 },
    ];
    expect(rollWeighted(table, () => 0)).toBe('always');
  });

  it('follows the distribution', () => {
    const rng = createRng(2024);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 20_000; i++) {
      const v = rollWeighted(fish, rng);
      counts[v] = (counts[v] ?? 0) + 1;
    }
    expect(counts.shrimp! / 20_000).toBeCloseTo(0.7, 1);
    expect(counts.sardine! / 20_000).toBeCloseTo(0.25, 1);
    expect(counts.treasure! / 20_000).toBeCloseTo(0.05, 1);
  });

  it('throws without positive weights', () => {
    expect(() => rollWeighted([], createRng(1))).toThrow();
    expect(() => rollWeighted([{ value: 'x', weight: 0 }], createRng(1))).toThrow();
  });
});

describe('rollLoot', () => {
  const table: LootTable = {
    always: [{ item: 'raw_fish', min: 1, max: 1 }],
    chance: [{ item: 'bottle', probability: 0.5, min: 1, max: 1 }],
    oneOf: [
      { value: { item: 'seaweed', qty: 2 }, weight: 1 },
      { value: { item: 'raw_fish', qty: 1 }, weight: 1 },
    ],
  };

  it('rolls always → chance → oneOf, in order, adding repeated items', () => {
    // rolls: always qty (0 → min), chance (0.1 < 0.5 → hit), bottle qty (0), oneOf (0.9 → raw_fish)
    expect(rollLoot(table, fixed(0, 0.1, 0, 0.9))).toEqual({ raw_fish: 2, bottle: 1 });
  });

  it('skips failed chance drops', () => {
    // always (0), chance miss (0.6), oneOf (0.1 → seaweed)
    expect(rollLoot(table, fixed(0, 0.6, 0.1))).toEqual({ raw_fish: 1, seaweed: 2 });
  });

  it('is deterministic with a seeded rng', () => {
    expect(rollLoot(table, createRng(3))).toEqual(rollLoot(table, createRng(3)));
  });

  it('handles an empty table', () => {
    expect(rollLoot({}, createRng(1))).toEqual({});
  });
});

describe('expectedLoot', () => {
  it('computes expected values and floors totals', () => {
    const table: LootTable = {
      always: [{ item: 'raw_fish', min: 1, max: 2 }], // 1.5 each
      chance: [{ item: 'bottle', probability: 0.02, min: 1, max: 1 }],
      oneOf: [
        { value: { item: 'seaweed', qty: 4 }, weight: 1 },
        { value: { item: 'raw_fish', qty: 1 }, weight: 3 },
      ],
    };
    expect(expectedLoot(table, 10_000)).toEqual({
      raw_fish: 15_000 + 7_500, // always + oneOf (3/4 × 1)
      bottle: 200,
      seaweed: 10_000, // 1/4 × 4
    });
  });

  it('omits items that round down to 0', () => {
    expect(expectedLoot({ chance: [{ item: 'gem', probability: 0.001, min: 1, max: 1 }] }, 500)).toEqual({});
  });
});
