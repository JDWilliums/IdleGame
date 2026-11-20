import { describe, expect, it } from 'vitest';
import { useTestDatabase } from '../../_support/test-database';
import {
  addItem,
  createPlayer,
  deletePlayer,
  findPlayerByName,
  getInventory,
  getPlayer,
  listPlayers,
  renamePlayer,
  SCHEMA,
} from './exercise';

const getDb = useTestDatabase(SCHEMA);

describe('players', () => {
  it('createPlayer inserts and returns a camelCase Player', async () => {
    const db = getDb();
    const ava = await createPlayer(db, 'Ava');
    expect(ava).toEqual({ id: 1, name: 'Ava', gold: 0, createdAt: expect.any(Date) });
    const bram = await createPlayer(db, 'Bram');
    expect(bram.id).toBe(2);
    const { rows } = await db.query('SELECT count(*)::integer AS n FROM players');
    expect(rows).toEqual([{ n: 2 }]);
  });

  it('createPlayer lets the UNIQUE constraint reject duplicates', async () => {
    const db = getDb();
    await createPlayer(db, 'Ava');
    await expect(createPlayer(db, 'Ava')).rejects.toThrow();
  });

  it('getPlayer finds by id or returns undefined', async () => {
    const db = getDb();
    const ava = await createPlayer(db, 'Ava');
    expect(await getPlayer(db, ava.id)).toEqual(ava);
    expect(await getPlayer(db, 999)).toBeUndefined();
  });

  it('findPlayerByName is case-insensitive', async () => {
    const db = getDb();
    const ava = await createPlayer(db, 'Ava');
    expect(await findPlayerByName(db, 'AVA')).toEqual(ava);
    expect(await findPlayerByName(db, 'ava')).toEqual(ava);
    expect(await findPlayerByName(db, 'Bram')).toBeUndefined();
  });

  it('listPlayers sorts by created_at, breaks ties by id, and pages', async () => {
    const db = getDb();
    await db.query(`
      INSERT INTO players (name, created_at) VALUES
        ('Newest', '2026-03-03T00:00:00Z'),
        ('Oldest', '2026-03-01T00:00:00Z'),
        ('TieB',   '2026-03-02T00:00:00Z'),
        ('TieA',   '2026-03-02T00:00:00Z')
    `);
    const all = await listPlayers(db, { limit: 10, offset: 0 });
    expect(all.map((p) => p.name)).toEqual(['Oldest', 'TieB', 'TieA', 'Newest']);
    expect(all[0]?.createdAt).toEqual(new Date('2026-03-01T00:00:00Z'));
    const page2 = await listPlayers(db, { limit: 2, offset: 2 });
    expect(page2.map((p) => p.name)).toEqual(['TieA', 'Newest']);
  });

  it('renamePlayer reports whether a row changed', async () => {
    const db = getDb();
    const ava = await createPlayer(db, 'Ava');
    expect(await renamePlayer(db, ava.id, 'Avalon')).toBe(true);
    expect((await getPlayer(db, ava.id))?.name).toBe('Avalon');
    expect(await renamePlayer(db, 999, 'Ghost')).toBe(false);
  });

  it('deletePlayer reports whether a row was deleted, and cascades to inventory', async () => {
    const db = getDb();
    const ava = await createPlayer(db, 'Ava');
    await db.query(`INSERT INTO inventory VALUES ($1, 'oak_log', 3)`, [ava.id]);
    expect(await deletePlayer(db, ava.id)).toBe(true);
    expect(await getPlayer(db, ava.id)).toBeUndefined();
    expect(await deletePlayer(db, ava.id)).toBe(false);
    const { rows } = await db.query('SELECT * FROM inventory');
    expect(rows).toEqual([]);
  });
});

describe('inventory', () => {
  it('addItem creates a stack, then adds to it', async () => {
    const db = getDb();
    const ava = await createPlayer(db, 'Ava');
    expect(await addItem(db, ava.id, 'oak_log', 5)).toBe(5);
    expect(await addItem(db, ava.id, 'oak_log', 40)).toBe(45);
    expect(await addItem(db, ava.id, 'raw_trout', 3)).toBe(3);
    const { rows } = await db.query('SELECT item_id, qty FROM inventory ORDER BY item_id');
    expect(rows).toEqual([
      { item_id: 'oak_log', qty: 45 },
      { item_id: 'raw_trout', qty: 3 },
    ]);
  });

  it('addItem keeps players separate', async () => {
    const db = getDb();
    const ava = await createPlayer(db, 'Ava');
    const bram = await createPlayer(db, 'Bram');
    await addItem(db, ava.id, 'oak_log', 5);
    expect(await addItem(db, bram.id, 'oak_log', 1)).toBe(1);
  });

  it('getInventory returns a record in item_id order, or {}', async () => {
    const db = getDb();
    const ava = await createPlayer(db, 'Ava');
    expect(await getInventory(db, ava.id)).toEqual({});
    await addItem(db, ava.id, 'raw_trout', 3);
    await addItem(db, ava.id, 'iron_ore', 2);
    await addItem(db, ava.id, 'oak_log', 7);
    const inventory = await getInventory(db, ava.id);
    expect(inventory).toEqual({ iron_ore: 2, oak_log: 7, raw_trout: 3 });
    expect(Object.keys(inventory)).toEqual(['iron_ore', 'oak_log', 'raw_trout']);
  });
});

describe('SQL injection', () => {
  it('treats a malicious name as plain data when searching', async () => {
    const db = getDb();
    await createPlayer(db, 'Ava');
    await createPlayer(db, 'Bram');
    await expect(findPlayerByName(db, "x' OR '1'='1")).resolves.toBeUndefined();
  });

  it('stores a malicious name literally, and the table survives', async () => {
    const db = getDb();
    const evil = "Robert'); DROP TABLE players; --";
    const bobby = await createPlayer(db, evil);
    expect(bobby.name).toBe(evil);
    expect(await getPlayer(db, bobby.id)).toEqual(bobby);
    expect(await renamePlayer(db, bobby.id, "'; DELETE FROM players; --")).toBe(true);
    const { rows } = await db.query('SELECT count(*)::integer AS n FROM players');
    expect(rows).toEqual([{ n: 1 }]);
  });
});
