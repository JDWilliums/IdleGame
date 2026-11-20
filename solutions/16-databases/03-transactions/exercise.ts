// Reference solution for 16-03. Read it only AFTER your own version passes.
import type { PGlite, Transaction } from '@electric-sql/pglite';

export const SCHEMA = /* sql */ `
  CREATE TABLE players (
    id   serial  PRIMARY KEY,
    name text    NOT NULL UNIQUE,
    gold integer NOT NULL DEFAULT 0 CHECK (gold >= 0)
  );

  CREATE TABLE ledger (
    id         serial  PRIMARY KEY,
    player_id  integer NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    delta      integer NOT NULL,
    reason     text    NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE saves (
    player_id  integer PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    data       jsonb   NOT NULL,
    revision   integer NOT NULL CHECK (revision > 0),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
`;

// ─── provided: domain errors ──────────────────────────────────────────────────
export class PlayerNotFoundError extends Error {
  readonly playerId: number;
  constructor(playerId: number) {
    super(`Player ${playerId} not found`);
    this.name = 'PlayerNotFoundError';
    this.playerId = playerId;
  }
}

export class InsufficientFundsError extends Error {
  readonly playerId: number;
  readonly needed: number;
  constructor(playerId: number, needed: number) {
    super(`Player ${playerId} cannot afford ${needed} gold`);
    this.name = 'InsufficientFundsError';
    this.playerId = playerId;
    this.needed = needed;
  }
}

export type SaveResult = { ok: true; revision: number } | { ok: false; currentRevision: number };

// ─── helpers ──────────────────────────────────────────────────────────────────
const CHECK_VIOLATION = '23514';

function pgCode(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string'
    ? err.code
    : undefined;
}

/**
 * Applies a gold change and its ledger row inside an existing transaction.
 * The database enforces gold >= 0 (the CHECK constraint); we translate its error.
 */
async function applyDelta(
  tx: Transaction,
  playerId: number,
  delta: number,
  reason: string,
): Promise<number> {
  let newGold: number | undefined;
  try {
    const { rows } = await tx.query<{ gold: number }>(
      'UPDATE players SET gold = gold + $1 WHERE id = $2 RETURNING gold',
      [delta, playerId],
    );
    newGold = rows[0]?.gold;
  } catch (err) {
    if (pgCode(err) === CHECK_VIOLATION) throw new InsufficientFundsError(playerId, -delta);
    throw err;
  }
  if (newGold === undefined) throw new PlayerNotFoundError(playerId);
  await tx.query('INSERT INTO ledger (player_id, delta, reason) VALUES ($1, $2, $3)', [playerId, delta, reason]);
  return newGold;
}

// ─── tasks ────────────────────────────────────────────────────────────────────
export async function adjustGold(db: PGlite, playerId: number, delta: number, reason: string): Promise<number> {
  return db.transaction((tx) => applyDelta(tx, playerId, delta, reason));
}

export async function transferGold(
  db: PGlite,
  fromId: number,
  toId: number,
  amount: number,
): Promise<{ fromGold: number; toGold: number }> {
  if (!Number.isInteger(amount) || amount <= 0) throw new RangeError('amount must be a positive integer');
  if (fromId === toId) throw new RangeError('cannot transfer to yourself');

  // If any step throws, db.transaction rolls back every earlier step and rethrows.
  return db.transaction(async (tx) => {
    const fromGold = await applyDelta(tx, fromId, -amount, 'transfer:out');
    const toGold = await applyDelta(tx, toId, amount, 'transfer:in');
    return { fromGold, toGold };
  });
}

export async function loadSave(
  db: PGlite,
  playerId: number,
): Promise<{ data: unknown; revision: number } | undefined> {
  const { rows } = await db.query<{ data: unknown; revision: number }>(
    'SELECT data, revision FROM saves WHERE player_id = $1',
    [playerId],
  );
  return rows[0];
}

export async function saveWithRevision(
  db: PGlite,
  playerId: number,
  data: unknown,
  baseRevision: number,
): Promise<SaveResult> {
  // Stringify jsonb parameters yourself: `pg` would turn a top-level JS array into a Postgres array.
  const json = JSON.stringify(data);
  // Each branch checks AND writes in a single statement, so two writers can't both pass the check.
  const { rows } =
    baseRevision === 0
      ? await db.query<{ revision: number }>(
          `INSERT INTO saves (player_id, data, revision) VALUES ($1, $2, 1)
           ON CONFLICT (player_id) DO NOTHING
           RETURNING revision`,
          [playerId, json],
        )
      : await db.query<{ revision: number }>(
          `UPDATE saves SET data = $2, revision = revision + 1, updated_at = now()
           WHERE player_id = $1 AND revision = $3
           RETURNING revision`,
          [playerId, json, baseRevision],
        );

  const written = rows[0];
  if (written) return { ok: true, revision: written.revision };

  // Nothing was written: report what's actually stored so the client can resolve the conflict.
  const current = await loadSave(db, playerId);
  return { ok: false, currentRevision: current?.revision ?? 0 };
}
