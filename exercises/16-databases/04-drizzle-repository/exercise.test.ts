import { drizzle } from 'drizzle-orm/pglite';
import { describe, expect, it } from 'vitest';
import { useTestDatabase } from '../../_support/test-database';
import {
  createSaveRepository,
  createUser,
  findUserByUsername,
  MIGRATION,
  UsernameTakenError,
} from './exercise';

const getClient = useTestDatabase(MIGRATION);

/** The Postgres error code on a Drizzle error (Drizzle puts the driver's error on `cause`). */
const causeCode = (err: unknown) => (err instanceof Error ? (err.cause as { code?: string } | undefined)?.code : undefined);

function setup() {
  const client = getClient();
  const db = drizzle(client);
  let time = new Date('2026-03-01T12:00:00Z');
  const clock = {
    now: () => time,
    advance: (ms: number) => {
      time = new Date(time.getTime() + ms);
    },
  };
  return { client, db, clock, repo: createSaveRepository(db, { now: clock.now }) };
}

describe('users', () => {
  it('createUser inserts and returns the row', async () => {
    const { db } = setup();
    const ava = await createUser(db, 'ava');
    expect(ava).toEqual({ id: 1, username: 'ava', createdAt: expect.any(Date) });
    expect((await createUser(db, 'bram')).id).toBe(2);
  });

  it('createUser maps the unique violation to UsernameTakenError', async () => {
    const { db } = setup();
    await createUser(db, 'ava');
    const error = await createUser(db, 'ava').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UsernameTakenError);
    expect(error).toMatchObject({ username: 'ava' });
  });

  it('createUser rethrows other database errors untouched', async () => {
    const { client, db } = setup();
    await client.exec('DROP TABLE saves; DROP TABLE users;');
    const error = await createUser(db, 'ava').catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(UsernameTakenError);
    expect(causeCode(error)).toBe('42P01'); // undefined_table: the original Drizzle error, not a new one
  });

  it('findUserByUsername is case-insensitive', async () => {
    const { db } = setup();
    const ava = await createUser(db, 'Ava');
    expect(await findUserByUsername(db, 'AVA')).toEqual(ava);
    expect(await findUserByUsername(db, 'ava')).toEqual(ava);
    expect(await findUserByUsername(db, 'bram')).toBeUndefined();
  });
});

describe('save repository', () => {
  it('get returns undefined when there is no save', async () => {
    const { db, repo } = setup();
    const ava = await createUser(db, 'ava');
    expect(await repo.get(ava.id)).toBeUndefined();
  });

  it('creates the first save at revision 1, stamped with now()', async () => {
    const { db, repo, clock } = setup();
    const ava = await createUser(db, 'ava');
    const result = await repo.put(ava.id, { gold: 5, skills: { fishing: 40 } }, 0);
    const expected = { userId: ava.id, data: { gold: 5, skills: { fishing: 40 } }, revision: 1, updatedAt: clock.now() };
    expect(result).toEqual({ ok: true, record: expected });
    expect(await repo.get(ava.id)).toEqual(expected);
  });

  it('updates when the base revision matches', async () => {
    const { db, repo, clock } = setup();
    const ava = await createUser(db, 'ava');
    await repo.put(ava.id, { gold: 5 }, 0);
    clock.advance(60_000);
    const result = await repo.put(ava.id, { gold: 9 }, 1);
    expect(result).toEqual({
      ok: true,
      record: { userId: ava.id, data: { gold: 9 }, revision: 2, updatedAt: new Date('2026-03-01T12:01:00Z') },
    });
  });

  it('reports conflicts without overwriting', async () => {
    const { db, repo } = setup();
    const ava = await createUser(db, 'ava');
    await repo.put(ava.id, { device: 'phone' }, 0);
    await repo.put(ava.id, { device: 'phone' }, 1);
    expect(await repo.put(ava.id, { device: 'laptop' }, 1)).toEqual({ ok: false, currentRevision: 2 });
    expect(await repo.put(ava.id, { device: 'laptop' }, 0)).toEqual({ ok: false, currentRevision: 2 });
    expect((await repo.get(ava.id))?.data).toEqual({ device: 'phone' });
  });

  it('reports currentRevision 0 when there is no save to update', async () => {
    const { db, repo } = setup();
    const ava = await createUser(db, 'ava');
    expect(await repo.put(ava.id, {}, 4)).toEqual({ ok: false, currentRevision: 0 });
  });

  it('round-trips arrays and nested data', async () => {
    const { db, repo } = setup();
    const ava = await createUser(db, 'ava');
    await repo.put(ava.id, [['oak_log', 40], ['raw_trout', 3]], 0);
    expect((await repo.get(ava.id))?.data).toEqual([['oak_log', 40], ['raw_trout', 3]]);
  });

  it('fails for a user that does not exist (foreign key)', async () => {
    const { repo } = setup();
    const error = await repo.put(999, {}, 0).catch((e: unknown) => e);
    expect(causeCode(error)).toBe('23503'); // foreign_key_violation
  });

  it('listRecent joins usernames, newest first, ties by username, limited', async () => {
    const { db, repo, clock } = setup();
    const ava = await createUser(db, 'ava');
    const bram = await createUser(db, 'bram');
    const cleo = await createUser(db, 'cleo');
    const dev = await createUser(db, 'dev');
    await repo.put(cleo.id, {}, 0); // 12:00
    clock.advance(1000);
    await repo.put(dev.id, {}, 0); // 12:00:01
    await repo.put(bram.id, {}, 0); // 12:00:01 (tie with dev)
    clock.advance(1000);
    await repo.put(cleo.id, {}, 1); // 12:00:02, revision 2
    // ava never saves, so she isn't listed
    expect(await repo.listRecent(10)).toEqual([
      { username: 'cleo', revision: 2, updatedAt: new Date('2026-03-01T12:00:02Z') },
      { username: 'bram', revision: 1, updatedAt: new Date('2026-03-01T12:00:01Z') },
      { username: 'dev', revision: 1, updatedAt: new Date('2026-03-01T12:00:01Z') },
    ]);
    expect((await repo.listRecent(2)).map((s) => s.username)).toEqual(['cleo', 'bram']);
    expect(ava.id).toBe(1);
  });

  it('remove deletes a save and reports whether it existed', async () => {
    const { db, repo } = setup();
    const ava = await createUser(db, 'ava');
    await repo.put(ava.id, {}, 0);
    expect(await repo.remove(ava.id)).toBe(true);
    expect(await repo.get(ava.id)).toBeUndefined();
    expect(await repo.remove(ava.id)).toBe(false);
    expect(await repo.put(ava.id, { fresh: true }, 0)).toMatchObject({ ok: true, record: { revision: 1 } });
  });
});
