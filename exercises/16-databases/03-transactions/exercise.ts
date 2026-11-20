/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 16-03 · transactions
 * Lesson:  16.4 Constraints, transactions & concurrency
 * Run:     npm run watch 16-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Gold and saves: the two places where the game's server must never lose or
 * invent data. Read SCHEMA first, especially the CHECK constraints.
 *
 * Use db.transaction(async (tx) => { … }) and send every statement inside it
 * through `tx`, never `db` (16.4 explains why).
 *
 * TASK 1 · adjustGold(db, playerId, delta, reason) → number (the new gold)
 *   In ONE transaction: change the player's gold by delta (atomically, in SQL)
 *   and insert a ledger row { player_id, delta, reason }.
 *   - unknown player          → throw new PlayerNotFoundError(playerId)
 *   - gold would go below 0   → throw new InsufficientFundsError(playerId, -delta)
 *     Let the CHECK constraint detect this: catch the database error with
 *     code '23514' and throw the domain error instead.
 *   - nothing is written when it throws (no ledger row either).
 *
 * TASK 2 · transferGold(db, fromId, toId, amount) → { fromGold, toGold }
 *   - amount must be a positive integer and fromId !== toId, otherwise throw a
 *     RangeError BEFORE touching the database.
 *   - In ONE transaction: take amount from `fromId`, give it to `toId`, and add
 *     two ledger rows: (fromId, -amount, 'transfer:out') and (toId, amount, 'transfer:in').
 *   - unknown sender or receiver → PlayerNotFoundError (with that player's id)
 *   - sender can't afford it     → InsufficientFundsError(fromId, amount)
 *   - On ANY error, nothing changes: not even the sender's gold.
 *
 * TASK 3 · loadSave(db, playerId) → { data, revision } | undefined
 *
 * TASK 4 · saveWithRevision(db, playerId, data, baseRevision) → SaveResult
 *   Optimistic concurrency. baseRevision is the revision the client last saw.
 *   - baseRevision 0 means "I have never saved". If there's no save yet,
 *     insert one with revision 1. If there already is one, it's a conflict.
 *   - Otherwise, update ONLY IF the stored revision equals baseRevision,
 *     bumping it by 1 and setting updated_at = now(). The check and the
 *     write must be ONE statement.
 *   - Success  → { ok: true, revision: <the new revision> }
 *   - Conflict → { ok: false, currentRevision: <the stored revision, or 0 if none> }
 */
import type { PGlite } from '@electric-sql/pglite';

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

// ─── your code ────────────────────────────────────────────────────────────────
export async function adjustGold(db: PGlite, playerId: number, delta: number, reason: string): Promise<number> {
  throw new Error('Not implemented yet');
}

export async function transferGold(
  db: PGlite,
  fromId: number,
  toId: number,
  amount: number,
): Promise<{ fromGold: number; toGold: number }> {
  throw new Error('Not implemented yet');
}

export async function loadSave(
  db: PGlite,
  playerId: number,
): Promise<{ data: unknown; revision: number } | undefined> {
  throw new Error('Not implemented yet');
}

export async function saveWithRevision(
  db: PGlite,
  playerId: number,
  data: unknown,
  baseRevision: number,
): Promise<SaveResult> {
  throw new Error('Not implemented yet');
}
