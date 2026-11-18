import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createItemsServer } from './exercise';

const json = 'application/json; charset=utf-8';

describe('raw http server', () => {
  it('GET /health', async () => {
    const res = await request(createItemsServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe(json);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('starts with no items', async () => {
    const res = await request(createItemsServer()).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('creates items with incrementing ids and a Location header', async () => {
    const server = createItemsServer();
    const a = await request(server).post('/api/items').send({ name: 'Oak Log', qty: 3 });
    expect(a.status).toBe(201);
    expect(a.headers['content-type']).toBe(json);
    expect(a.headers.location).toBe('/api/items/1');
    expect(a.body).toEqual({ id: 1, name: 'Oak Log', qty: 3 });
    const b = await request(server).post('/api/items').send({ name: 'Trout', qty: 10 });
    expect(b.body.id).toBe(2);
    const list = await request(server).get('/api/items');
    expect(list.body).toEqual([
      { id: 1, name: 'Oak Log', qty: 3 },
      { id: 2, name: 'Trout', qty: 10 },
    ]);
  });

  it('keeps servers independent', async () => {
    const first = createItemsServer();
    await request(first).post('/api/items').send({ name: 'Oak Log', qty: 3 });
    const res = await request(createItemsServer()).get('/api/items');
    expect(res.body).toEqual([]);
  });

  it('filters with ?minQty', async () => {
    const server = createItemsServer();
    await request(server).post('/api/items').send({ name: 'Oak Log', qty: 3 });
    await request(server).post('/api/items').send({ name: 'Trout', qty: 10 });
    const res = await request(server).get('/api/items?minQty=5');
    expect(res.body.map((i: { name: string }) => i.name)).toEqual(['Trout']);
  });

  it('gets one item by id, or 404s', async () => {
    const server = createItemsServer();
    await request(server).post('/api/items').send({ name: 'Oak Log', qty: 3 });
    expect((await request(server).get('/api/items/1')).body).toEqual({ id: 1, name: 'Oak Log', qty: 3 });
    const missing = await request(server).get('/api/items/99');
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Not found' });
  });

  it('rejects invalid JSON', async () => {
    const res = await request(createItemsServer())
      .post('/api/items')
      .set('Content-Type', 'application/json')
      .send('{"name": "Oak');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid JSON' });
  });

  it('rejects invalid items', async () => {
    const server = createItemsServer();
    for (const bad of [{}, { name: '', qty: 1 }, { name: 'Oak', qty: 0 }, { name: 'Oak', qty: 1.5 }, { name: 5, qty: 1 }, [1]]) {
      const res = await request(server).post('/api/items').send(bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
      expect(res.body).toEqual({ error: 'Invalid item' });
    }
  });

  it('rejects bodies over 10,000 bytes', async () => {
    const res = await request(createItemsServer())
      .post('/api/items')
      .send({ name: 'x'.repeat(10_001), qty: 1 });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'Payload too large' });
  });

  it('405s unsupported methods on /api/items with an Allow header', async () => {
    const res = await request(createItemsServer()).delete('/api/items');
    expect(res.status).toBe(405);
    expect(res.headers.allow).toBe('GET, POST');
    expect(res.body).toEqual({ error: 'Method not allowed' });
  });

  it('404s unknown routes', async () => {
    const res = await request(createItemsServer()).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
