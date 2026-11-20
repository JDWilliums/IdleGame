// Reference solution for 16-01. Read it only AFTER your own version passes.
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

// One place that knows the column list and the snake_case → camelCase mapping.
type PlayerRow = { id: number; name: string; gold: number; created_at: Date };
const PLAYER_COLUMNS = 'id, name, gold, created_at';
const toPlayer = (row: PlayerRow): Player => ({ id: row.id, name: row.name, gold: row.gold, createdAt: row.created_at });

export async function createPlayer(db: Db, name: string): Promise<Player> {
  const { rows } = await db.query<PlayerRow>(
    `INSERT INTO players (name) VALUES ($1) RETURNING ${PLAYER_COLUMNS}`,
    [name],
  );
  const row = rows[0];
  if (!row) throw new Error('INSERT … RETURNING returned no row');
  return toPlayer(row);
}

export async function getPlayer(db: Db, id: number): Promise<Player | undefined> {
  const { rows } = await db.query<PlayerRow>(`SELECT ${PLAYER_COLUMNS} FROM players WHERE id = $1`, [id]);
  return rows[0] ? toPlayer(rows[0]) : undefined;
}

export async function findPlayerByName(db: Db, name: string): Promise<Player | undefined> {
  const { rows } = await db.query<PlayerRow>(
    `SELECT ${PLAYER_COLUMNS} FROM players WHERE lower(name) = lower($1)`,
    [name],
  );
  return rows[0] ? toPlayer(rows[0]) : undefined;
}

export async function listPlayers(db: Db, page: { limit: number; offset: number }): Promise<Player[]> {
  const { rows } = await db.query<PlayerRow>(
    `SELECT ${PLAYER_COLUMNS} FROM players ORDER BY created_at, id LIMIT $1 OFFSET $2`,
    [page.limit, page.offset],
  );
  return rows.map(toPlayer);
}

export async function renamePlayer(db: Db, id: number, newName: string): Promise<boolean> {
  const result = await db.query('UPDATE players SET name = $1 WHERE id = $2', [newName, id]);
  return (result.affectedRows ?? 0) > 0;
}

export async function deletePlayer(db: Db, id: number): Promise<boolean> {
  // ON DELETE CASCADE on inventory.player_id removes the player's items too.
  const result = await db.query('DELETE FROM players WHERE id = $1', [id]);
  return (result.affectedRows ?? 0) > 0;
}

export async function addItem(db: Db, playerId: number, itemId: string, qty: number): Promise<number> {
  const { rows } = await db.query<{ qty: number }>(
    `INSERT INTO inventory (player_id, item_id, qty)
     VALUES ($1, $2, $3)
     ON CONFLICT (player_id, item_id) DO UPDATE SET qty = inventory.qty + EXCLUDED.qty
     RETURNING qty`,
    [playerId, itemId, qty],
  );
  const row = rows[0];
  if (!row) throw new Error('upsert returned no row');
  return row.qty;
}

export async function getInventory(db: Db, playerId: number): Promise<Record<string, number>> {
  const { rows } = await db.query<{ item_id: string; qty: number }>(
    'SELECT item_id, qty FROM inventory WHERE player_id = $1 ORDER BY item_id',
    [playerId],
  );
  return Object.fromEntries(rows.map((row) => [row.item_id, row.qty]));
}
