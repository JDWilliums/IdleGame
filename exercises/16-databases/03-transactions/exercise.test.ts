import type { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';
import { useTestDatabase } from '../../_support/test-database';
import {
  adjustGold,
  InsufficientFundsError,
  loadSave,
  PlayerNotFoundError,
  saveWithRevision,
  SCHEMA,
  transferGold,
} from './exercise';

const SEED = `INSERT INTO players (name, gold) VALUES ('Ava', 100), ('Bram', 20);`; // ids 1 and 2
const getDb = useTestDatabase(SCHEMA, SEED);

async function gold(db: PGlite, id: number) {
  const { rows } = await db.query<{ gold: number }>('SELECT gold FROM players WHERE id = $1', [id]);
  return rows[0]?.gold;
}

async function ledger(db: PGlite) {
  const { rows } = await db.query<{ player_id: number; delta: number; reason: string }>(
    'SELECT player_id, delta, reason FROM ledger ORDER BY id',
  );
  return rows;
}

describe('adjustGold', () => {
  it('changes gold and writes a ledger row', async () => {
    const db = getDb();
    expect(await adjustGold(db, 1, 25, 'quest')).toBe(125);
    expect(await adjustGold(db, 1, -100, 'shop')).toBe(25);
    expect(await gold(db, 1)).toBe(25);
    expect(await ledger(db)).toEqual([
      { player_id: 1, delta: 25, reason: 'quest' },
      { player_id: 1, delta: -100, reason: 'shop' },
    ]);
  });

  it('turns the CHECK violation into InsufficientFundsError and writes nothing', async () => {
    const db = getDb();
    const error = await adjustGold(db, 2, -21, 'shop').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InsufficientFundsError);
    expect(error).toMatchObject({ playerId: 2, needed: 21 });
    expect(await gold(db, 2)).toBe(20);
    expect(await ledger(db)).toEqual([]);
  });

  it('throws PlayerNotFoundError for an unknown player and writes nothing', async () => {
    const db = getDb();
    const error = await adjustGold(db, 99, 10, 'quest').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PlayerNotFoundError);
    expect(error).toMatchObject({ playerId: 99 });
    expect(await ledger(db)).toEqual([]);
  });

  it('can still be used after a failure (the transaction was closed properly)', async () => {
    const db = getDb();
    await adjustGold(db, 2, -500, 'shop').catch(() => {});
    expect(await adjustGold(db, 2, 5, 'quest')).toBe(25);
  });
});

describe('transferGold', () => {
  it('moves gold and records both sides', async () => {
    const db = getDb();
    expect(await transferGold(db, 1, 2, 30)).toEqual({ fromGold: 70, toGold: 50 });
    expect(await gold(db, 1)).toBe(70);
    expect(await gold(db, 2)).toBe(50);
    expect(await ledger(db)).toEqual([
      { player_id: 1, delta: -30, reason: 'transfer:out' },
      { player_id: 2, delta: 30, reason: 'transfer:in' },
    ]);
  });

  it('allows spending exactly everything', async () => {
    const db = getDb();
    expect(await transferGold(db, 2, 1, 20)).toEqual({ fromGold: 0, toGold: 120 });
  });

  it('rejects an unaffordable transfer and changes nothing', async () => {
    const db = getDb();
    const error = await transferGold(db, 2, 1, 21).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InsufficientFundsError);
    expect(error).toMatchObject({ playerId: 2, needed: 21 });
    expect([await gold(db, 1), await gold(db, 2)]).toEqual([100, 20]);
    expect(await ledger(db)).toEqual([]);
  });

  it('rolls back the debit when the receiver does not exist', async () => {
    const db = getDb();
    const error = await transferGold(db, 1, 99, 10).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PlayerNotFoundError);
    expect(error).toMatchObject({ playerId: 99 });
    expect(await gold(db, 1)).toBe(100); // ← the whole point of a transaction
    expect(await ledger(db)).toEqual([]);
  });

  it('reports an unknown sender', async () => {
    const db = getDb();
    const error = await transferGold(db, 99, 1, 10).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PlayerNotFoundError);
    expect(error).toMatchObject({ playerId: 99 });
  });

  it('validates its arguments before touching the database', async () => {
    const db = getDb();
    for (const amount of [0, -5, 1.5, Number.NaN]) {
      await expect(transferGold(db, 1, 2, amount)).rejects.toBeInstanceOf(RangeError);
    }
    await expect(transferGold(db, 1, 1, 10)).rejects.toBeInstanceOf(RangeError);
    expect(await ledger(db)).toEqual([]);
  });

  it('never overspends when two transfers race', async () => {
    const db = getDb();
    const results = await Promise.allSettled([transferGold(db, 1, 2, 60), transferGold(db, 1, 2, 60)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const failure = results.find((r) => r.status === 'rejected');
    expect(failure?.status === 'rejected' && failure.reason).toBeInstanceOf(InsufficientFundsError);
    expect([await gold(db, 1), await gold(db, 2)]).toEqual([40, 80]);
  });
});

describe('saves with optimistic concurrency', () => {
  it('loadSave returns undefined before the first save', async () => {
    expect(await loadSave(getDb(), 1)).toBeUndefined();
  });

  it('creates the first save at revision 1 and bumps it on each write', async () => {
    const db = getDb();
    expect(await saveWithRevision(db, 1, { gold: 1 }, 0)).toEqual({ ok: true, revision: 1 });
    expect(await saveWithRevision(db, 1, { gold: 2 }, 1)).toEqual({ ok: true, revision: 2 });
    expect(await loadSave(db, 1)).toEqual({ data: { gold: 2 }, revision: 2 });
  });

  it('stores structured JSON and round-trips it', async () => {
    const db = getDb();
    const data = { version: 3, skills: { fishing: { xp: 4000 } }, bank: [['oak_log', 40]] };
    await saveWithRevision(db, 1, data, 0);
    expect((await loadSave(db, 1))?.data).toEqual(data);
  });

  it('detects the lost-update race between two devices', async () => {
    const db = getDb();
    await saveWithRevision(db, 1, { device: 'start' }, 0);
    // Both devices loaded revision 1.
    expect(await saveWithRevision(db, 1, { device: 'phone' }, 1)).toEqual({ ok: true, revision: 2 });
    expect(await saveWithRevision(db, 1, { device: 'laptop' }, 1)).toEqual({ ok: false, currentRevision: 2 });
    expect(await loadSave(db, 1)).toEqual({ data: { device: 'phone' }, revision: 2 }); // not overwritten
  });

  it('treats a second "first save" as a conflict', async () => {
    const db = getDb();
    await saveWithRevision(db, 1, { a: 1 }, 0);
    expect(await saveWithRevision(db, 1, { a: 2 }, 0)).toEqual({ ok: false, currentRevision: 1 });
  });

  it('reports currentRevision 0 when updating a save that does not exist', async () => {
    expect(await saveWithRevision(getDb(), 1, { a: 1 }, 5)).toEqual({ ok: false, currentRevision: 0 });
  });

  it('rejects a base revision from the future', async () => {
    const db = getDb();
    await saveWithRevision(db, 1, { a: 1 }, 0);
    expect(await saveWithRevision(db, 1, { a: 2 }, 7)).toEqual({ ok: false, currentRevision: 1 });
  });

  it('keeps players separate', async () => {
    const db = getDb();
    await saveWithRevision(db, 1, { who: 'ava' }, 0);
    expect(await saveWithRevision(db, 2, { who: 'bram' }, 0)).toEqual({ ok: true, revision: 1 });
    expect((await loadSave(db, 1))?.data).toEqual({ who: 'ava' });
  });

  it('sets updated_at on every write', async () => {
    const db = getDb();
    await saveWithRevision(db, 1, { a: 1 }, 0);
    await db.query(`UPDATE saves SET updated_at = '2000-01-01T00:00:00Z'`);
    await saveWithRevision(db, 1, { a: 2 }, 1);
    const { rows } = await db.query<{ updated_at: Date }>('SELECT updated_at FROM saves');
    expect(rows[0]?.updated_at.getUTCFullYear()).toBeGreaterThan(2000);
  });
});
