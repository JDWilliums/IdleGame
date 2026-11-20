import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createSaveApp } from './exercise';
import { createInMemorySaveRepo, type Save } from './provided';

function setup() {
  let time = new Date('2026-03-01T12:00:00.000Z');
  const saves = createInMemorySaveRepo({ now: () => time });
  const app = createSaveApp({ saves });
  const as = (userId: number) => ({
    get: (path: string) => request(app).get(path).set('x-test-user', String(userId)),
    put: (body: unknown) => request(app).put('/api/save').set('x-test-user', String(userId)).send(body as object),
  });
  return {
    app,
    as,
    tick: (ms: number) => {
      time = new Date(time.getTime() + ms);
    },
  };
}

const save = (overrides: Partial<Save> = {}): Save => ({
  version: 3,
  gold: 100,
  skills: { fishing: { xp: 500 } },
  bank: { raw_trout: 12 },
  lastSavedAt: 1_772_366_400_000,
  createdAt: 1_772_000_000_000,
  settings: { sound: true, notifications: false },
  ...overrides,
});

describe('auth', () => {
  it('requires a user for every route', async () => {
    const { app } = setup();
    await request(app).get('/api/save').expect(401);
    await request(app).get('/api/save/meta').expect(401);
    await request(app).put('/api/save').send({ baseRevision: 0, data: save() }).expect(401);
  });
});

describe('before the first save', () => {
  it('GET returns { save: null } and is never cached', async () => {
    const res = await setup().as(1).get('/api/save');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ save: null });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('meta returns revision 0', async () => {
    const res = await setup().as(1).get('/api/save/meta');
    expect(res.body).toEqual({ revision: 0, updatedAt: null });
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('saving', () => {
  it('creates the first save at revision 1, then increments', async () => {
    const { as, tick } = setup();
    const first = await as(1).put({ baseRevision: 0, data: save() });
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ revision: 1, updatedAt: '2026-03-01T12:00:00.000Z' });
    expect(first.headers['cache-control']).toBe('no-store');

    tick(30_000);
    const second = await as(1).put({ baseRevision: 1, data: save({ gold: 150 }) });
    expect(second.body).toEqual({ revision: 2, updatedAt: '2026-03-01T12:00:30.000Z' });

    const loaded = await as(1).get('/api/save');
    expect(loaded.body).toEqual({ save: { data: save({ gold: 150 }), revision: 2, updatedAt: '2026-03-01T12:00:30.000Z' } });
    expect((await as(1).get('/api/save/meta')).body).toEqual({ revision: 2, updatedAt: '2026-03-01T12:00:30.000Z' });
  });

  it('keeps users separate', async () => {
    const { as } = setup();
    await as(1).put({ baseRevision: 0, data: save({ gold: 1 }) });
    expect((await as(2).get('/api/save')).body).toEqual({ save: null });
    expect((await as(2).put({ baseRevision: 0, data: save({ gold: 2 }) })).body.revision).toBe(1);
    expect((await as(1).get('/api/save')).body.save.data.gold).toBe(1);
  });
});

describe('conflicts', () => {
  it('rejects a stale write from a second device, returning the current save', async () => {
    const { as } = setup();
    await as(1).put({ baseRevision: 0, data: save() });
    // phone and laptop both have revision 1
    await as(1).put({ baseRevision: 1, data: save({ gold: 999 }) }).expect(200); // phone
    const laptop = await as(1).put({ baseRevision: 1, data: save({ gold: 5 }) });
    expect(laptop.status).toBe(409);
    expect(laptop.headers['cache-control']).toBe('no-store');
    expect(laptop.body).toEqual({
      error: {
        code: 'SAVE_CONFLICT',
        message: 'Your save is out of date',
        details: { current: { data: save({ gold: 999 }), revision: 2, updatedAt: '2026-03-01T12:00:00.000Z' } },
      },
    });
    expect((await as(1).get('/api/save')).body.save.data.gold).toBe(999); // not overwritten
  });

  it('treats a second "first save" as a conflict', async () => {
    const { as } = setup();
    await as(1).put({ baseRevision: 0, data: save() });
    const res = await as(1).put({ baseRevision: 0, data: save({ gold: 1 }) });
    expect(res.status).toBe(409);
    expect(res.body.error.details.current.revision).toBe(1);
  });

  it('reports current: null when there is no save to update', async () => {
    const res = await setup().as(1).put({ baseRevision: 4, data: save() });
    expect(res.status).toBe(409);
    expect(res.body.error.details).toEqual({ current: null });
  });
});

describe('validation and limits', () => {
  it('rejects bad bodies with 400 and stores nothing', async () => {
    const { as } = setup();
    const bad = [
      { data: save() },
      { baseRevision: -1, data: save() },
      { baseRevision: 1.5, data: save() },
      { baseRevision: '0', data: save() },
      { baseRevision: 0 },
      { baseRevision: 0, data: { ...save(), version: 2 } },
      { baseRevision: 0, data: save({ gold: -5 }) },
      { baseRevision: 0, data: { ...save(), skills: { fishing: { xp: 'lots' } } } },
    ];
    for (const body of bad) {
      const res = await as(1).put(body);
      expect(res.status, JSON.stringify(body).slice(0, 80)).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.headers['cache-control']).toBe('no-store');
    }
    expect((await as(1).get('/api/save')).body).toEqual({ save: null });
  });

  it('accepts a large-but-reasonable save (about 50 KB)', async () => {
    const bank = Object.fromEntries(Array.from({ length: 2_000 }, (_, i) => [`item_number_${i}`, i + 1]));
    const body = { baseRevision: 0, data: save({ bank }) };
    expect(JSON.stringify(body).length).toBeGreaterThan(45_000);
    expect(JSON.stringify(body).length).toBeLessThan(60_000);
    await setup().as(1).put(body).expect(200);
  });

  it('rejects bodies over 64 KB with 413', async () => {
    const bank = Object.fromEntries(Array.from({ length: 3_500 }, (_, i) => [`item_number_${i}`, i + 1]));
    const body = { baseRevision: 0, data: save({ bank }) };
    expect(JSON.stringify(body).length).toBeGreaterThan(70_000);
    const res = await setup().as(1).put(body);
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
