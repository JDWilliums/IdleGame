import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createDemoApp } from './exercise';

type Detail = { path: string; message: string };
const paths = (body: { error: { details: Detail[] } }) => body.error.details.map((d) => d.path);

describe('validate: body', () => {
  it('passes parsed data to the handler (trimmed, with defaults)', async () => {
    const res = await request(createDemoApp()).post('/api/saves').send({ playerName: '  Ava  ', gold: 10 });
    expect(res.status).toBe(201);
    expect(res.body.received).toEqual({ playerName: 'Ava', gold: 10, skills: {} });
  });

  it('rejects invalid bodies with the error shape', async () => {
    const res = await request(createDemoApp()).post('/api/saves').send({ playerName: 'A', gold: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Invalid request');
    expect(paths(res.body).sort()).toEqual(['body.gold', 'body.playerName']);
    for (const detail of res.body.error.details as Detail[]) expect(detail.message.length).toBeGreaterThan(0);
  });

  it('reports nested paths', async () => {
    const res = await request(createDemoApp())
      .post('/api/saves')
      .send({ playerName: 'Ava', gold: 1, skills: { fishing: { xp: 'lots' } } });
    expect(paths(res.body)).toEqual(['body.skills.fishing.xp']);
  });
});

describe('validate: query', () => {
  it('coerces and defaults query values into res.locals.query', async () => {
    const res = await request(createDemoApp()).get('/api/leaderboard?skill=fishing');
    expect(res.status).toBe(200);
    expect(res.body.query).toEqual({ skill: 'fishing', limit: 10 });
    const withLimit = await request(createDemoApp()).get('/api/leaderboard?skill=mining&limit=25');
    expect(withLimit.body.query).toEqual({ skill: 'mining', limit: 25 });
  });

  it('rejects invalid query values', async () => {
    const res = await request(createDemoApp()).get('/api/leaderboard?skill=cooking&limit=500');
    expect(res.status).toBe(400);
    expect(paths(res.body).sort()).toEqual(['query.limit', 'query.skill']);
  });
});

describe('validate: params + body together', () => {
  it('validates both and stores params in res.locals.params', async () => {
    const res = await request(createDemoApp()).put('/api/players/7/save').send({ playerName: 'Ava', gold: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ params: { id: 7 }, body: { playerName: 'Ava', gold: 0, skills: {} } });
  });

  it('collects issues from every part', async () => {
    const res = await request(createDemoApp()).put('/api/players/abc/save').send({ gold: 'x' });
    expect(res.status).toBe(400);
    expect(paths(res.body).sort()).toEqual(['body.gold', 'body.playerName', 'params.id']);
  });
});
