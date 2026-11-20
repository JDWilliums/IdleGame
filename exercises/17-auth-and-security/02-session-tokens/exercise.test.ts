import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createInMemorySessionStore,
  createSessionManager,
  generateSessionToken,
  hashSessionToken,
} from './exercise';

const DAY = 24 * 60 * 60 * 1000;
const START = new Date('2026-03-01T00:00:00Z');
const at = (days: number) => new Date(START.getTime() + days * DAY);

function setup(options: { ttlMs?: number; renewWithinMs?: number } = {}) {
  let time = START;
  const store = createInMemorySessionStore();
  const manager = createSessionManager({ store, now: () => time, ...options });
  return {
    store,
    manager,
    goTo: (days: number) => {
      time = at(days);
    },
  };
}

describe('generateSessionToken', () => {
  it('is 43 base64url characters (32 bytes)', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
  });

  it('is different every time', () => {
    const tokens = new Set(Array.from({ length: 200 }, generateSessionToken));
    expect(tokens.size).toBe(200);
  });
});

describe('hashSessionToken', () => {
  it('is the SHA-256 hex digest', () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(createHash('sha256').update(token).digest('hex'));
    expect(hashSessionToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('create', () => {
  it('stores only the hash, with the right expiry', async () => {
    const { manager, store } = setup();
    const { token, session } = await manager.create(7);
    expect(session).toEqual({ idHash: hashSessionToken(token), userId: 7, createdAt: START, expiresAt: at(30) });
    expect(store.all()).toEqual([session]);
    expect(JSON.stringify(store.all())).not.toContain(token);
  });

  it('gives every session its own token', async () => {
    const { manager, store } = setup();
    const a = await manager.create(7);
    const b = await manager.create(7);
    expect(a.token).not.toBe(b.token);
    expect(store.all()).toHaveLength(2);
  });
});

describe('validate', () => {
  it('accepts a fresh session without renewing it', async () => {
    const { manager } = setup();
    const { token, session } = await manager.create(7);
    expect(await manager.validate(token)).toEqual({ session, renewed: false });
  });

  it('rejects unknown, tampered and empty tokens', async () => {
    const { manager } = setup();
    const { token } = await manager.create(7);
    const tampered = (token[0] === 'A' ? 'B' : 'A') + token.slice(1);
    expect(await manager.validate(generateSessionToken())).toBeNull();
    expect(await manager.validate(tampered)).toBeNull();
    expect(await manager.validate('')).toBeNull();
  });

  it('does not renew while 15 or more days remain', async () => {
    const { manager, store, goTo } = setup();
    const { token } = await manager.create(7);
    for (const day of [1, 10, 15]) {
      // day 15 leaves exactly 15 days: that's not "fewer than", so still no renewal
      goTo(day);
      expect(await manager.validate(token), `day ${day}`).toMatchObject({
        renewed: false,
        session: { expiresAt: at(30) },
      });
    }
    expect(store.all()[0]?.expiresAt).toEqual(at(30));
  });

  it('slides the expiry forward when fewer than 15 days remain', async () => {
    const { manager, store, goTo } = setup();
    const { token } = await manager.create(7);
    goTo(16);
    const result = await manager.validate(token);
    expect(result).toMatchObject({ renewed: true, session: { userId: 7, expiresAt: at(46) } });
    expect(store.all()[0]?.expiresAt).toEqual(at(46)); // saved, not just returned
    goTo(20);
    expect(await manager.validate(token)).toMatchObject({ renewed: false, session: { expiresAt: at(46) } });
  });

  it('keeps a weekly player logged in indefinitely', async () => {
    const { manager, goTo } = setup();
    const { token } = await manager.create(7);
    for (let day = 7; day <= 365; day += 7) {
      goTo(day);
      expect(await manager.validate(token), `day ${day}`).not.toBeNull();
    }
  });

  it('rejects and deletes an expired session (including exactly at expiry)', async () => {
    const { manager, store, goTo } = setup();
    const a = await manager.create(7);
    const b = await manager.create(8);
    goTo(30);
    expect(await manager.validate(a.token)).toBeNull();
    expect(store.all().map((s) => s.userId)).toEqual([8]);
    goTo(45);
    expect(await manager.validate(b.token)).toBeNull();
    expect(store.all()).toEqual([]);
  });

  it('respects custom ttl and renewal windows', async () => {
    const { manager, goTo } = setup({ ttlMs: 2 * DAY, renewWithinMs: 1 * DAY });
    const { token } = await manager.create(7);
    expect((await manager.validate(token))?.session.expiresAt).toEqual(at(2));
    goTo(1.5);
    expect((await manager.validate(token))?.session.expiresAt).toEqual(at(3.5));
    goTo(3.5);
    expect(await manager.validate(token)).toBeNull();
  });
});

describe('invalidation', () => {
  it('invalidate logs one session out', async () => {
    const { manager } = setup();
    const a = await manager.create(7);
    const b = await manager.create(7);
    await manager.invalidate(a.token);
    expect(await manager.validate(a.token)).toBeNull();
    expect(await manager.validate(b.token)).not.toBeNull();
    await expect(manager.invalidate('not-a-real-token')).resolves.toBeUndefined();
  });

  it('invalidateAllForUser logs out every device for that user only', async () => {
    const { manager } = setup();
    const phone = await manager.create(7);
    const laptop = await manager.create(7);
    const someoneElse = await manager.create(8);
    expect(await manager.invalidateAllForUser(7)).toBe(2);
    expect(await manager.validate(phone.token)).toBeNull();
    expect(await manager.validate(laptop.token)).toBeNull();
    expect(await manager.validate(someoneElse.token)).not.toBeNull();
    expect(await manager.invalidateAllForUser(7)).toBe(0);
  });
});
