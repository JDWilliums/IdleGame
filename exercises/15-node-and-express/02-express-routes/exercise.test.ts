import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, createInMemoryPlayerRepo } from './exercise';

function setup() {
  let time = new Date('2026-01-01T00:00:00.000Z').getTime();
  const app = createApp({
    players: createInMemoryPlayerRepo(),
    now: () => {
      time += 1000; // each call is one second later
      return new Date(time);
    },
  });
  const create = (name: string) => request(app).post('/api/players').send({ name });
  return { app, create };
}

describe('players API', () => {
  it('creates a player with 201, a Location header and an ISO date', async () => {
    const { create } = setup();
    const res = await create('Ava');
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('/api/players/1');
    expect(res.body).toEqual({ id: 1, name: 'Ava', createdAt: '2026-01-01T00:00:01.000Z' });
  });

  it('trims names and validates their length', async () => {
    const { create } = setup();
    expect((await create('  Bo b  ')).body.name).toBe('Bo b');
    for (const bad of ['ab', '   ab   ', 'x'.repeat(21)]) {
      const res = await create(bad);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: { code: 'VALIDATION_ERROR', message: 'name must be 3–20 characters' } });
    }
    const { app } = setup();
    const missing = await request(app).post('/api/players').send({});
    expect(missing.status).toBe(400);
  });

  it('rejects duplicate names case-insensitively', async () => {
    const { create } = setup();
    await create('Ava');
    const res = await create('ava');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: { code: 'NAME_TAKEN', message: 'That name is taken' } });
  });

  it('gets one player or 404s', async () => {
    const { app, create } = setup();
    await create('Ava');
    expect((await request(app).get('/api/players/1')).body.name).toBe('Ava');
    const res = await request(app).get('/api/players/42');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Player not found' } });
    expect((await request(app).get('/api/players/abc')).status).toBe(404);
  });

  it('lists players with total, sorting and a limit', async () => {
    const { app, create } = setup();
    await create('Cara');
    await create('Ava');
    await create('Bo b');
    const byDate = await request(app).get('/api/players');
    expect(byDate.body.total).toBe(3);
    expect(byDate.body.items.map((p: { name: string }) => p.name)).toEqual(['Cara', 'Ava', 'Bo b']);
    const byName = await request(app).get('/api/players?sort=name&limit=2');
    expect(byName.body.items.map((p: { name: string }) => p.name)).toEqual(['Ava', 'Bo b']);
    expect(byName.body.total).toBe(3);
    const invalid = await request(app).get('/api/players?limit=banana&sort=hp');
    expect(invalid.status).toBe(200);
    expect(invalid.body.items).toHaveLength(3);
  });

  it('caps the limit at 100', async () => {
    const { app, create } = setup();
    for (let i = 0; i < 105; i++) await create(`player${i}`);
    const res = await request(app).get('/api/players?limit=1000');
    expect(res.body.items).toHaveLength(100);
    expect(res.body.total).toBe(105);
  });

  it('renames with PATCH, applying the same rules', async () => {
    const { app, create } = setup();
    await create('Ava');
    await create('Bo b');
    const ok = await request(app).patch('/api/players/1').send({ name: 'Ava the Great' });
    expect(ok.status).toBe(200);
    expect(ok.body.name).toBe('Ava the Great');
    expect((await request(app).patch('/api/players/1').send({ name: 'ava the great' })).status).toBe(200); // own name
    expect((await request(app).patch('/api/players/2').send({ name: 'AVA THE GREAT' })).status).toBe(409);
    expect((await request(app).patch('/api/players/2').send({ name: 'no' })).status).toBe(400);
    expect((await request(app).patch('/api/players/9').send({ name: 'Nobody' })).status).toBe(404);
  });

  it('deletes with 204 and no body', async () => {
    const { app, create } = setup();
    await create('Ava');
    const res = await request(app).delete('/api/players/1');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect((await request(app).get('/api/players/1')).status).toBe(404);
    expect((await request(app).delete('/api/players/1')).status).toBe(404);
  });

  it('404s unknown routes with the error shape', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
});
