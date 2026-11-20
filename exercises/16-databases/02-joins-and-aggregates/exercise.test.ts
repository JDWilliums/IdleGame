import { describe, expect, it } from 'vitest';
import { useTestDatabase } from '../../_support/test-database';
import {
  inventoryValue,
  LEADERBOARD_INDEX,
  leaderboard,
  playersWithoutSkill,
  rankOf,
  SCHEMA,
  SEED,
  skillStats,
  wealthiestPlayers,
} from './exercise';

const getDb = useTestDatabase(SCHEMA, SEED);

describe('leaderboard', () => {
  it('ranks with ties sharing a rank and skipping the next', async () => {
    expect(await leaderboard(getDb(), 'fishing', 10)).toEqual([
      { rank: 1, name: 'Bram', xp: 9000 },
      { rank: 2, name: 'Ava', xp: 4000 },
      { rank: 2, name: 'Cleo', xp: 4000 },
      { rank: 4, name: 'Esme', xp: 1500 },
    ]);
  });

  it('applies the limit after ordering', async () => {
    expect(await leaderboard(getDb(), 'fishing', 2)).toEqual([
      { rank: 1, name: 'Bram', xp: 9000 },
      { rank: 2, name: 'Ava', xp: 4000 },
    ]);
  });

  it('only includes the requested skill, and returns [] for an unknown one', async () => {
    expect(await leaderboard(getDb(), 'woodcutting', 10)).toEqual([
      { rank: 1, name: 'Esme', xp: 2000 },
      { rank: 2, name: 'Ava', xp: 1200 },
      { rank: 3, name: 'Dev', xp: 300 },
    ]);
    expect(await leaderboard(getDb(), 'cooking', 10)).toEqual([]);
  });

  it('returns numbers, not strings', async () => {
    const [first] = await leaderboard(getDb(), 'fishing', 1);
    expect(typeof first?.rank).toBe('number');
    expect(typeof first?.xp).toBe('number');
  });
});

describe('playersWithoutSkill', () => {
  it('finds players with no row for the skill (an anti-join)', async () => {
    expect(await playersWithoutSkill(getDb(), 'fishing')).toEqual(['Dev']);
    expect(await playersWithoutSkill(getDb(), 'mining')).toEqual(['Ava', 'Cleo', 'Dev', 'Esme']);
    expect(await playersWithoutSkill(getDb(), 'cooking')).toEqual(['Ava', 'Bram', 'Cleo', 'Dev', 'Esme']);
  });
});

describe('skillStats', () => {
  it('summarises each skill with numeric values', async () => {
    const stats = await skillStats(getDb());
    expect(stats).toEqual([
      { skill: 'fishing', players: 4, totalXp: 18500, avgXp: 4625, maxXp: 9000 },
      { skill: 'mining', players: 1, totalXp: 50, avgXp: 50, maxXp: 50 },
      { skill: 'woodcutting', players: 3, totalXp: 3500, avgXp: 1167, maxXp: 2000 },
    ]);
    for (const row of stats) {
      for (const key of ['players', 'totalXp', 'avgXp', 'maxXp'] as const) expect(typeof row[key]).toBe('number');
    }
  });
});

describe('inventoryValue', () => {
  it('sums qty × sell_price through a join', async () => {
    expect(await inventoryValue(getDb(), 1)).toBe(40 * 5 + 10 * 12);
    expect(await inventoryValue(getDb(), 2)).toBe(3 * 20 + 250);
  });

  it('is 0 for an empty inventory or an unknown player (not null)', async () => {
    expect(await inventoryValue(getDb(), 3)).toBe(0);
    expect(await inventoryValue(getDb(), 999)).toBe(0);
  });
});

describe('wealthiestPlayers', () => {
  it('filters groups with HAVING and sorts richest first', async () => {
    expect(await wealthiestPlayers(getDb(), 300)).toEqual([
      { name: 'Esme', value: 500 },
      { name: 'Ava', value: 320 },
      { name: 'Bram', value: 310 },
    ]);
    expect(await wealthiestPlayers(getDb(), 1000)).toEqual([]);
  });

  it('breaks ties by name', async () => {
    const db = getDb();
    await db.query(`INSERT INTO inventory VALUES (3, 'gold_ring', 2)`); // Cleo now ties with Esme at 500
    expect(await wealthiestPlayers(db, 500)).toEqual([
      { name: 'Cleo', value: 500 },
      { name: 'Esme', value: 500 },
    ]);
  });
});

describe('rankOf', () => {
  it("returns a player's rank and the field size", async () => {
    expect(await rankOf(getDb(), 2, 'fishing')).toEqual({ rank: 1, outOf: 4 });
    expect(await rankOf(getDb(), 3, 'fishing')).toEqual({ rank: 2, outOf: 4 });
    expect(await rankOf(getDb(), 5, 'fishing')).toEqual({ rank: 4, outOf: 4 });
    expect(await rankOf(getDb(), 4, 'woodcutting')).toEqual({ rank: 3, outOf: 3 });
  });

  it('returns undefined when the player has no XP in the skill', async () => {
    expect(await rankOf(getDb(), 4, 'fishing')).toBeUndefined();
    expect(await rankOf(getDb(), 999, 'fishing')).toBeUndefined();
  });
});

describe('LEADERBOARD_INDEX', () => {
  it('creates an index on skill_xp that starts with skill, then xp', async () => {
    const db = getDb();
    await db.exec(LEADERBOARD_INDEX);
    const { rows } = await db.query<{ indexname: string; indexdef: string }>(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'skill_xp' AND indexname <> 'skill_xp_pkey'`,
    );
    expect(rows, 'no extra index found on skill_xp').toHaveLength(1);
    expect(rows[0]?.indexdef).toMatch(/\(skill, xp( DESC)?\)/);
  });
});
