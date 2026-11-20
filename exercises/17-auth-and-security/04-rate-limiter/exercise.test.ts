import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createDemoApp, createRateLimiter, rateLimit } from './exercise';

function clock(start = 1_000_000) {
  let time = start;
  return { now: () => time, advance: (ms: number) => void (time += ms) };
}

describe('createRateLimiter', () => {
  it('allows max hits per window, counting down remaining', () => {
    const c = clock();
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3, now: c.now });
    expect(limiter.hit('a')).toEqual({ allowed: true, remaining: 2, retryAfterMs: 0 });
    expect(limiter.hit('a')).toEqual({ allowed: true, remaining: 1, retryAfterMs: 0 });
    expect(limiter.hit('a')).toEqual({ allowed: true, remaining: 0, retryAfterMs: 0 });
  });

  it('blocks after max, reporting how long until the window ends', () => {
    const c = clock();
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2, now: c.now });
    limiter.hit('a');
    c.advance(10_000);
    limiter.hit('a');
    c.advance(5_000);
    expect(limiter.hit('a')).toEqual({ allowed: false, remaining: 0, retryAfterMs: 45_000 });
    c.advance(30_000);
    expect(limiter.hit('a')).toEqual({ allowed: false, remaining: 0, retryAfterMs: 15_000 }); // blocked hits don't extend it
  });

  it('starts a fresh window once the old one has ended', () => {
    const c = clock();
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1, now: c.now });
    limiter.hit('a');
    expect(limiter.hit('a').allowed).toBe(false);
    c.advance(59_999);
    expect(limiter.hit('a').allowed).toBe(false);
    c.advance(1); // exactly at the end of the window
    expect(limiter.hit('a')).toEqual({ allowed: true, remaining: 0, retryAfterMs: 0 });
    expect(limiter.hit('a')).toEqual({ allowed: false, remaining: 0, retryAfterMs: 60_000 });
  });

  it('tracks keys independently', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1, now: clock().now });
    expect(limiter.hit('a').allowed).toBe(true);
    expect(limiter.hit('b').allowed).toBe(true);
    expect(limiter.hit('a').allowed).toBe(false);
  });

  it('reset forgets a key', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1, now: clock().now });
    limiter.hit('a');
    limiter.reset('a');
    expect(limiter.hit('a').allowed).toBe(true);
    expect(() => limiter.reset('never-seen')).not.toThrow();
  });

  it('prune removes only finished windows', () => {
    const c = clock();
    const limiter = createRateLimiter({ windowMs: 60_000, max: 5, now: c.now });
    limiter.hit('old');
    c.advance(30_000);
    limiter.hit('new');
    expect(limiter.size()).toBe(2);
    c.advance(30_000); // 'old' window has ended, 'new' has 30s left
    limiter.prune();
    expect(limiter.size()).toBe(1);
    c.advance(30_000);
    limiter.prune();
    expect(limiter.size()).toBe(0);
  });
});

describe('rateLimit middleware', () => {
  function app(max: number, c = clock()) {
    const limiter = createRateLimiter({ windowMs: 60_000, max, now: c.now });
    const server = express();
    server.get('/ping', rateLimit(limiter, (req) => (req.query.skip ? undefined : 'everyone')), (_req, res) => {
      res.json({ pong: true });
    });
    return { server, c };
  }

  it('passes allowed requests through, then answers 429 with Retry-After', async () => {
    const { server, c } = app(2);
    await request(server).get('/ping').expect(200, { pong: true });
    await request(server).get('/ping').expect(200);
    c.advance(1_500);
    const blocked = await request(server).get('/ping');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' } });
    expect(blocked.headers['retry-after']).toBe('59'); // 58.5 s rounded up
  });

  it('skips limiting when the key is undefined', async () => {
    const { server } = app(1);
    for (let i = 0; i < 3; i++) await request(server).get('/ping?skip=1').expect(200);
    await request(server).get('/ping').expect(200); // skipped requests didn't use up the limit…
    await request(server).get('/ping').expect(429); // …but keyed ones are still limited
  });
});

describe('the demo login route', () => {
  function setup() {
    const c = clock();
    const limiter = createRateLimiter({ windowMs: 15 * 60_000, max: 5, now: c.now });
    const demo = createDemoApp({ limiter, checkPassword: (u, p) => u.toLowerCase() === 'ava' && p === 'right' });
    const login = (username: string, password: string) =>
      request(demo).post('/api/auth/login').send({ username, password });
    return { c, login };
  }

  it('locks an account out after 5 failures, for 15 minutes', async () => {
    const { c, login } = setup();
    for (let i = 0; i < 5; i++) await login('ava', 'wrong').expect(401);
    const locked = await login('ava', 'right'); // even the right password is blocked now
    expect(locked.status).toBe(429);
    expect(locked.headers['retry-after']).toBe('900');
    await login('AVA', 'wrong').expect(429); // same account, different capitalisation
    await login('bram', 'wrong').expect(401); // other accounts are unaffected
    c.advance(15 * 60_000);
    await login('ava', 'right').expect(200);
  });

  it('a successful login clears earlier failures', async () => {
    const { login } = setup();
    for (let i = 0; i < 4; i++) await login('ava', 'wrong').expect(401);
    await login('ava', 'right').expect(200);
    for (let i = 0; i < 5; i++) await login('ava', 'wrong').expect(401);
    await login('ava', 'wrong').expect(429);
  });
});
