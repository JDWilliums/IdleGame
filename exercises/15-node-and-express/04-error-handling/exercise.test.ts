import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createDemoApp, HttpError } from './exercise';

function setup(exposeStack = false) {
  const logger = { error: vi.fn() };
  return { app: createDemoApp({ exposeStack, logger }), logger };
}

describe('HttpError', () => {
  it('carries status, code and details', () => {
    const err = new HttpError(403, 'FORBIDDEN', 'Not yours', { id: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('HttpError');
    expect(err.message).toBe('Not yours');
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.details).toEqual({ id: 1 });
  });
});

describe('errorHandler', () => {
  it('maps HttpError from an async handler (no details)', async () => {
    const { app, logger } = setup();
    const res = await request(app).get('/api/players/42');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'PLAYER_NOT_FOUND', message: 'Player 42 not found' } });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('includes details when present', async () => {
    const { app } = setup();
    const res = await request(app).put('/api/save');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'SAVE_CONFLICT', message: 'Your save is out of date', details: { currentRevision: 7 } },
    });
  });

  it('maps ZodError to a 400 with details', async () => {
    const { app, logger } = setup();
    const res = await request(app).post('/api/echo').send({ name: 1, stats: { hp: 'x' } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Invalid request');
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual(['name', 'stats.hp']);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('maps malformed JSON to INVALID_JSON', async () => {
    const { app, logger } = setup();
    const res = await request(app).post('/api/echo').set('Content-Type', 'application/json').send('{"name":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('maps oversized bodies to 413', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/echo').send({ name: 'x'.repeat(2_000), stats: { hp: 1 } });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
  });

  it('hides unknown errors and logs them', async () => {
    const { app, logger } = setup();
    const res = await request(app).get('/api/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(String(logger.error.mock.calls[0]?.[0])).toContain('hunter2'); // the log keeps full detail
  });

  it('exposes the stack only when configured', async () => {
    const { app } = setup(true);
    const res = await request(app).get('/api/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.stack).toContain('Error');
    expect(res.body.error.message).toBe('Something went wrong');
  });
});

describe('notFound', () => {
  it('404s unmatched routes', async () => {
    const { app } = setup();
    const res = await request(app).delete('/api/whatever');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'No route for DELETE /api/whatever' } });
  });
});
