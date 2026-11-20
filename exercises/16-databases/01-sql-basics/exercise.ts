/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 16-01 · sql-basics
 * Lesson:  16.2 SQL fundamentals
 * Run:     npm run watch 16-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Write the data-access functions for players and their inventory in raw SQL.
 * Every function takes `db` first: anything with PGlite's `query(sql, params)`.
 * The tables are defined in SCHEMA below (read it first; the tests create it
 * for you before every test).
 *
 * RULE: every value goes in as a PARAMETER ($1, $2, …). Never build SQL by
 * gluing strings together. One test tries SQL injection on you.
 *
 * Rows come back in snake_case (created_at); the Player type is camelCase.
 *
 * TASK 1 · createPlayer(db, name) → Player
 *          One INSERT … RETURNING. gold and created_at come from the defaults.
 * TASK 2 · getPlayer(db, id) → Player | undefined
 * TASK 3 · findPlayerByName(db, name) → Player | undefined
 *          Case-insensitive: 'AVA' finds 'Ava'.
 * TASK 4 · listPlayers(db, { limit, offset }) → Player[]
 *          Oldest first (created_at), ties broken by id. Use LIMIT/OFFSET.
 * TASK 5 · renamePlayer(db, id, newName) → boolean
 *          true if a player was renamed, false if no player has that id.
 * TASK 6 · deletePlayer(db, id) → boolean
 *          true if a player was deleted. Their inventory goes too (see SCHEMA: why?).
 * TASK 7 · addItem(db, playerId, itemId, qty) → number
 *          Adds qty to the player's stack, creating it if needed, and returns
 *          the new quantity. ONE statement (an upsert).
 * TASK 8 · getInventory(db, playerId) → Record<string, number>
 *          e.g. { oak_log: 45, raw_trout: 3 }, with keys in item_id order.
 *          {} if the player has nothing.
 */
import type { PGlite } from '@electric-sql/pglite';

export type Db = Pick<PGlite, 'query'>;

export const SCHEMA = /* sql */ `
  CREATE TABLE players (
    id         serial PRIMARY KEY,
    name       text NOT NULL UNIQUE,
    gold       integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE inventory (
    player_id integer NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id   text    NOT NULL,
    qty       integer NOT NULL CHECK (qty > 0),
    PRIMARY KEY (player_id, item_id)
  );
`;

export type Player = { id: number; name: string; gold: number; createdAt: Date };

export async function createPlayer(db: Db, name: string): Promise<Player> {
  throw new Error('Not implemented yet');
}

export async function getPlayer(db: Db, id: number): Promise<Player | undefined> {
  throw new Error('Not implemented yet');
}

export async function findPlayerByName(db: Db, name: string): Promise<Player | undefined> {
  throw new Error('Not implemented yet');
}

export async function listPlayers(db: Db, page: { limit: number; offset: number }): Promise<Player[]> {
  throw new Error('Not implemented yet');
}

export async function renamePlayer(db: Db, id: number, newName: string): Promise<boolean> {
  throw new Error('Not implemented yet');
}

export async function deletePlayer(db: Db, id: number): Promise<boolean> {
  throw new Error('Not implemented yet');
}

export async function addItem(db: Db, playerId: number, itemId: string, qty: number): Promise<number> {
  throw new Error('Not implemented yet');
}

export async function getInventory(db: Db, playerId: number): Promise<Record<string, number>> {
  throw new Error('Not implemented yet');
}
