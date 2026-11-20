import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './exercise';
import { createFakePasswordHasher, createInMemoryNoteRepo, createInMemorySessions, createInMemoryUserRepo } from './provided';

const DAY = 24 * 60 * 60 * 1000;

function setup({ cookieSecure = false } = {}) {
  let time = new Date('2026-03-01T00:00:00Z');
  const users = createInMemoryUserRepo();
  const sessions = createInMemorySessions({ now: () => time, ttlMs: 30 * DAY });
  const passwords = createFakePasswordHasher();
  const notes = createInMemoryNoteRepo();
  const app = createApp({ users, sessions, passwords, notes, cookieSecure });
  return {
    app,
    users,
    passwords,
    notes,
    advance: (ms: number) => {
      time = new Date(time.getTime() + ms);
    },
  };
}

type Res = { headers: Record<string, unknown> };
const setCookies = (res: Res) => (res.headers['set-cookie'] as string[] | undefined) ?? [];
const sessionCookie = (res: Res) => setCookies(res).find((c) => c.startsWith('session='));
const tokenFrom = (res: Res) => sessionCookie(res)?.split(';')[0]?.slice('session='.length);
const attributes = (cookie: string | undefined) => (cookie ?? '').split(';').map((part) => part.trim().toLowerCase());

const ava = { username: 'Ava', password: 'correct horse' };

describe('register', () => {
  it('creates the user, logs them in, and never returns the hash', async () => {
    const { app, users, passwords } = setup();
    const res = await request(app).post('/api/auth/register').send(ava);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ user: { id: 1, username: 'Ava' } });
    expect(JSON.stringify(res.body)).not.toContain('fake$');

    const stored = users.all()[0];
    expect(stored?.passwordHash).not.toBe('correct horse');
    expect(await passwords.verify('correct horse', stored?.passwordHash ?? '')).toBe(true);

    const cookie = sessionCookie(res);
    expect(cookie, 'no session cookie was set').toBeDefined();
    expect(tokenFrom(res)).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    const attrs = attributes(cookie);
    expect(attrs).toContain('httponly');
    expect(attrs).toContain('samesite=lax');
    expect(attrs).toContain('path=/');
    expect(attrs).toContain('max-age=2592000');
    expect(attrs).not.toContain('secure');
  });

  it('adds Secure when cookieSecure is true', async () => {
    const { app } = setup({ cookieSecure: true });
    const res = await request(app).post('/api/auth/register').send(ava);
    expect(attributes(sessionCookie(res))).toContain('secure');
  });

  it('trims the username and validates both fields', async () => {
    const { app, users } = setup();
    const trimmed = await request(app).post('/api/auth/register').send({ username: '  Bram_2  ', password: 'long enough' });
    expect(trimmed.body.user.username).toBe('Bram_2');

    const bad = [
      { username: 'ab', password: 'long enough' },
      { username: 'has space', password: 'long enough' },
      { username: 'x'.repeat(21), password: 'long enough' },
      { username: 'cleo', password: 'short' },
      { username: 'cleo', password: 'x'.repeat(129) },
      { username: 'cleo' },
      {},
    ];
    for (const body of bad) {
      const res = await request(app).post('/api/auth/register').send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(users.all()).toHaveLength(1);
  });

  it('rejects a taken username (case-insensitively) without logging in', async () => {
    const { app } = setup();
    await request(app).post('/api/auth/register').send(ava);
    const res = await request(app).post('/api/auth/register').send({ username: 'AVA', password: 'another one' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
    expect(sessionCookie(res)).toBeUndefined();
  });
});

describe('me', () => {
  it('is 401 when logged out', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHENTICATED', message: 'Log in to continue' } });
  });

  it('returns the user for a logged-in agent', async () => {
    const { app } = setup();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(ava).expect(201);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: 1, username: 'Ava' } });
  });

  it('clears a junk cookie', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/auth/me').set('Cookie', 'session=not-a-real-token');
    expect(res.status).toBe(401);
    expect(sessionCookie(res)).toMatch(/expires=thu, 01 jan 1970/i);
  });

  it('stops working when the session expires', async () => {
    const { app, advance } = setup();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(ava);
    advance(29 * DAY);
    await agent.get('/api/auth/me').expect(200);
    advance(2 * DAY);
    await agent.get('/api/auth/me').expect(401);
  });
});

describe('login', () => {
  it('logs in with a NEW session (no session fixation)', async () => {
    const { app } = setup();
    const registered = await request(app).post('/api/auth/register').send(ava);
    const res = await request(app).post('/api/auth/login').send({ username: 'ava', password: 'correct horse' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: 1, username: 'Ava' } });
    expect(tokenFrom(res)).toBeDefined();
    expect(tokenFrom(res)).not.toBe(tokenFrom(registered));
    const me = await request(app).get('/api/auth/me').set('Cookie', `session=${tokenFrom(res)}`);
    expect(me.status).toBe(200);
  });

  it('gives the same 401 for a wrong password and an unknown user', async () => {
    const { app } = setup();
    await request(app).post('/api/auth/register').send(ava);
    const wrong = await request(app).post('/api/auth/login').send({ username: 'Ava', password: 'wrong password' });
    const unknown = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'wrong password' });
    for (const res of [wrong, unknown]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } });
      expect(sessionCookie(res)).toBeUndefined();
    }
  });

  it('still verifies a password for unknown users (no timing leak)', async () => {
    const { app, passwords } = setup();
    const verify = vi.spyOn(passwords, 'verify');
    await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'whatever123' }).expect(401);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify.mock.calls[0]?.[0]).toBe('whatever123');
  });

  it('validates the body', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/auth/login').send({ username: 'ava' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('logout', () => {
  it('invalidates the session on the server and clears the cookie', async () => {
    const { app } = setup();
    const registered = await request(app).post('/api/auth/register').send(ava);
    const token = tokenFrom(registered);
    const res = await request(app).post('/api/auth/logout').set('Cookie', `session=${token}`);
    expect(res.status).toBe(204);
    const cleared = sessionCookie(res);
    expect(cleared).toMatch(/^session=;/);
    expect(cleared).toMatch(/expires=thu, 01 jan 1970/i);
    expect(attributes(cleared)).toContain('path=/');
    // a copy of the old token must not work any more
    await request(app).get('/api/auth/me').set('Cookie', `session=${token}`).expect(401);
  });

  it('is a harmless 204 when not logged in', async () => {
    const { app } = setup();
    await request(app).post('/api/auth/logout').expect(204);
  });

  it('logout-all ends every session for that user only', async () => {
    const { app } = setup();
    const phone = request.agent(app);
    const laptop = request.agent(app);
    const bram = request.agent(app);
    await phone.post('/api/auth/register').send(ava);
    await laptop.post('/api/auth/login').send(ava).expect(200);
    await bram.post('/api/auth/register').send({ username: 'Bram', password: 'another password' });

    await request(app).post('/api/auth/logout-all').expect(401);
    await phone.post('/api/auth/logout-all').expect(204);
    await phone.get('/api/auth/me').expect(401);
    await laptop.get('/api/auth/me').expect(401);
    await bram.get('/api/auth/me').expect(200);
  });
});

describe('notes: authorisation', () => {
  async function twoUsers() {
    const ctx = setup();
    const a = request.agent(ctx.app);
    const b = request.agent(ctx.app);
    await a.post('/api/auth/register').send(ava);
    await b.post('/api/auth/register').send({ username: 'Bram', password: 'another password' });
    return { ...ctx, a, b };
  }

  it('requires a session', async () => {
    const { app } = setup();
    await request(app).get('/api/notes').expect(401);
    await request(app).post('/api/notes').send({ text: 'hi' }).expect(401);
    await request(app).delete('/api/notes/1').expect(401);
  });

  it('creates and lists only your own notes', async () => {
    const { a, b } = await twoUsers();
    const created = await a.post('/api/notes').send({ text: 'buy oak logs' });
    expect(created.status).toBe(201);
    expect(created.body).toEqual({ id: 1, text: 'buy oak logs' });
    await b.post('/api/notes').send({ text: "bram's secret" }).expect(201);

    expect((await a.get('/api/notes')).body).toEqual({ items: [{ id: 1, text: 'buy oak logs' }] });
    expect((await b.get('/api/notes')).body).toEqual({ items: [{ id: 2, text: "bram's secret" }] });
  });

  it('validates note text', async () => {
    const { a } = await twoUsers();
    for (const body of [{}, { text: '' }, { text: 'x'.repeat(501) }, { text: 42 }]) {
      const res = await a.post('/api/notes').send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
  });

  it("hides other users' notes behind a 404", async () => {
    const { a, b, notes } = await twoUsers();
    await a.post('/api/notes').send({ text: 'mine' });
    const res = await b.delete('/api/notes/1');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(notes.all()).toHaveLength(1); // still there
    await b.delete('/api/notes/999').expect(404);
    await b.delete('/api/notes/abc').expect(404);
    await a.delete('/api/notes/1').expect(204);
    expect(notes.all()).toHaveLength(0);
  });
});
