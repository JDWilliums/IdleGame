// Reference solution for 16-02. Read it only AFTER your own version passes.
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
  // rank() returns bigint, so cast it: real `pg` would return it as a string.
  const { rows } = await db.query<LeaderboardRow>(
    `SELECT (rank() OVER (ORDER BY s.xp DESC))::integer AS rank, p.name, s.xp
     FROM skill_xp s
     JOIN players p ON p.id = s.player_id
     WHERE s.skill = $1
     ORDER BY rank, p.name
     LIMIT $2`,
    [skill, limit],
  );
  return rows;
}

export async function playersWithoutSkill(db: Db, skill: string): Promise<string[]> {
  const { rows } = await db.query<{ name: string }>(
    `SELECT p.name
     FROM players p
     WHERE NOT EXISTS (SELECT 1 FROM skill_xp s WHERE s.player_id = p.id AND s.skill = $1)
     ORDER BY p.name`,
    [skill],
  );
  return rows.map((row) => row.name);
}

export async function skillStats(db: Db): Promise<SkillStats[]> {
  const { rows } = await db.query<SkillStats>(
    `SELECT skill,
            count(*)::integer           AS "players",
            sum(xp)::integer            AS "totalXp",
            round(avg(xp))::integer     AS "avgXp",
            max(xp)                     AS "maxXp"
     FROM skill_xp
     GROUP BY skill
     ORDER BY skill`,
  );
  // Double-quoted aliases keep their capital letters, so rows already match the type.
  return rows;
}

export async function inventoryValue(db: Db, playerId: number): Promise<number> {
  const { rows } = await db.query<{ value: number }>(
    `SELECT coalesce(sum(inv.qty * it.sell_price), 0)::integer AS value
     FROM inventory inv
     JOIN items it ON it.id = inv.item_id
     WHERE inv.player_id = $1`,
    [playerId],
  );
  return rows[0]?.value ?? 0;
}

export async function wealthiestPlayers(db: Db, minValue: number): Promise<{ name: string; value: number }[]> {
  const { rows } = await db.query<{ name: string; value: number }>(
    `SELECT p.name, sum(inv.qty * it.sell_price)::integer AS value
     FROM players p
     JOIN inventory inv ON inv.player_id = p.id
     JOIN items it      ON it.id = inv.item_id
     GROUP BY p.id, p.name
     HAVING sum(inv.qty * it.sell_price) >= $1
     ORDER BY value DESC, p.name`,
    [minValue],
  );
  return rows;
}

export async function rankOf(
  db: Db,
  playerId: number,
  skill: string,
): Promise<{ rank: number; outOf: number } | undefined> {
  // Window functions are computed after WHERE, so rank everyone first, then pick one row.
  const { rows } = await db.query<{ rank: number; outOf: number }>(
    `WITH ranked AS (
       SELECT player_id,
              rank()   OVER (ORDER BY xp DESC) AS rank,
              count(*) OVER ()                 AS out_of
       FROM skill_xp
       WHERE skill = $2
     )
     SELECT rank::integer AS "rank", out_of::integer AS "outOf"
     FROM ranked
     WHERE player_id = $1`,
    [playerId, skill],
  );
  return rows[0];
}

// Equality column first, then the sort column, so "WHERE skill = $1 ORDER BY xp DESC LIMIT n"
// can walk the index in order and stop after n entries.
export const LEADERBOARD_INDEX = /* sql */ `
  CREATE INDEX skill_xp_leaderboard_idx ON skill_xp (skill, xp DESC);
`;
