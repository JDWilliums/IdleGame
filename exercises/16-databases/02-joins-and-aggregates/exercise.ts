/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 16-02 · joins-and-aggregates
 * Lesson:  16.3 Joins, aggregates & indexes
 * Run:     npm run watch 16-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Read SCHEMA and SEED below: the tests load both before every test. Work out
 * the expected answers by hand from SEED before writing each query.
 *
 * Every function is ONE SQL query (no loops of queries, no sorting or summing
 * in JavaScript). Every number you return must be a JS `number`, not a string:
 * cast in SQL where needed (16.3, "Types that come back from aggregates").
 *
 * TASK 1 · leaderboard(db, skill, limit) → { rank, name, xp }[]
 *          Players with XP in that skill, highest first. Ties share a rank and
 *          the next rank is skipped (1, 2, 2, 4). Order by rank, then name.
 * TASK 2 · playersWithoutSkill(db, skill) → string[]
 *          Names of players with NO row for that skill, alphabetical.
 * TASK 3 · skillStats(db) → { skill, players, totalXp, avgXp, maxXp }[]
 *          One row per skill, alphabetical. avgXp rounded to a whole number.
 * TASK 4 · inventoryValue(db, playerId) → number
 *          Sum of qty × sell_price over the player's inventory. 0 if none.
 * TASK 5 · wealthiestPlayers(db, minValue) → { name, value }[]
 *          Players whose inventory value is at least minValue, richest first
 *          (ties by name).
 * TASK 6 · rankOf(db, playerId, skill) → { rank, outOf } | undefined
 *          The player's rank in that skill (same rules as Task 1) and how many
 *          players have XP in it. undefined if the player has no XP in it.
 * TASK 7 · LEADERBOARD_INDEX: a CREATE INDEX statement on skill_xp that lets
 *          Postgres answer Task 1's query by reading the index in order.
 */
import type { PGlite } from '@electric-sql/pglite';

export type Db = Pick<PGlite, 'query'>;

export const SCHEMA = /* sql */ `
  CREATE TABLE players (
    id   serial PRIMARY KEY,
    name text NOT NULL UNIQUE
  );
  CREATE TABLE items (
    id         text PRIMARY KEY,
    name       text NOT NULL,
    sell_price integer NOT NULL CHECK (sell_price >= 0)
  );
  CREATE TABLE skill_xp (
    player_id integer NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    skill     text    NOT NULL,
    xp        integer NOT NULL CHECK (xp >= 0),
    PRIMARY KEY (player_id, skill)
  );
  CREATE TABLE inventory (
    player_id integer NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id   text    NOT NULL REFERENCES items(id),
    qty       integer NOT NULL CHECK (qty > 0),
    PRIMARY KEY (player_id, item_id)
  );
`;

export const SEED = /* sql */ `
  INSERT INTO players (id, name) VALUES (1, 'Ava'), (2, 'Bram'), (3, 'Cleo'), (4, 'Dev'), (5, 'Esme');

  INSERT INTO items (id, name, sell_price) VALUES
    ('oak_log', 'Oak log', 5), ('raw_trout', 'Raw trout', 12),
    ('iron_ore', 'Iron ore', 20), ('gold_ring', 'Gold ring', 250);

  INSERT INTO skill_xp (player_id, skill, xp) VALUES
    (1, 'fishing', 4000), (2, 'fishing', 9000), (3, 'fishing', 4000), (5, 'fishing', 1500),
    (1, 'woodcutting', 1200), (4, 'woodcutting', 300), (5, 'woodcutting', 2000),
    (2, 'mining', 50);

  INSERT INTO inventory (player_id, item_id, qty) VALUES
    (1, 'oak_log', 40), (1, 'raw_trout', 10),
    (2, 'iron_ore', 3), (2, 'gold_ring', 1),
    (4, 'raw_trout', 5),
    (5, 'gold_ring', 2);
`;

export type LeaderboardRow = { rank: number; name: string; xp: number };
export type SkillStats = { skill: string; players: number; totalXp: number; avgXp: number; maxXp: number };

export async function leaderboard(db: Db, skill: string, limit: number): Promise<LeaderboardRow[]> {
  throw new Error('Not implemented yet');
}

export async function playersWithoutSkill(db: Db, skill: string): Promise<string[]> {
  throw new Error('Not implemented yet');
}

export async function skillStats(db: Db): Promise<SkillStats[]> {
  throw new Error('Not implemented yet');
}

export async function inventoryValue(db: Db, playerId: number): Promise<number> {
  throw new Error('Not implemented yet');
}

export async function wealthiestPlayers(db: Db, minValue: number): Promise<{ name: string; value: number }[]> {
  throw new Error('Not implemented yet');
}

export async function rankOf(
  db: Db,
  playerId: number,
  skill: string,
): Promise<{ rank: number; outOf: number } | undefined> {
  throw new Error('Not implemented yet');
}

export const LEADERBOARD_INDEX = /* sql */ `
  -- TODO (Task 7)
`;
