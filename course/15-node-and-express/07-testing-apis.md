# 15.7 · Testing APIs

> ⏱ 1.5 hours · Module 15 · Node.js & Express

## What you'll learn
- HTTP-level integration tests with supertest
- What to assert: status, headers, body, side effects
- Test data builders
- Unit-testing services
- Integration tests against a real database

---

## supertest

supertest sends real HTTP requests to your Express app **in-process**, without listening on a port:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

function setup() {
  const players = createInMemoryPlayerRepo();
  const app = createApp({ players, now: () => new Date('2026-01-01T00:00:00Z') });
  return { app, players };
}

describe('POST /api/players', () => {
  it('creates a player', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/players')
      .send({ name: 'Ava' });                 // sets Content-Type: application/json

    expect(res.status).toBe(201);
    expect(res.headers.location).toMatch(/^\/api\/players\/\d+$/);
    expect(res.body).toMatchObject({ name: 'Ava', createdAt: '2026-01-01T00:00:00.000Z' });
  });

  it('rejects invalid names', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/players').send({ name: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

Useful supertest calls:

```ts
request(app).get('/api/players?limit=5')
request(app).post('/x').set('Content-Type', 'application/json').send('{bad json')   // send raw text
request(app).get('/api/me').set('Cookie', 'session=abc')
request.agent(app)        // an agent KEEPS cookies between requests: log in, then call /me
```

## What to assert

For each endpoint, test:
1. **The happy path**: status, body shape, and important headers (`Location`, `Set-Cookie`, `Retry-After`).
2. **Validation**: bad input gives 400 with your error shape.
3. **Auth**: no session gives 401, and someone else's resource gives 403 or 404.
4. **Not found**: 404.
5. **Business rules**: duplicates give 409, a stale revision gives 409.
6. **Side effects**: did the repository actually change? Check through the API (`GET` after `POST`) or through the repo.

> Test the **contract** (HTTP in → HTTP out), not internal function calls. You should be able to refactor the routes, services and repos without changing these tests.

## Test data builders

Avoid repeating big object literals. Build defaults with overrides:

```ts
export function buildSave(overrides: Partial<SaveData> = {}): SaveData {
  return {
    version: 3,
    gold: 0,
    skills: { woodcutting: { xp: 0 } },
    bank: {},
    lastSavedAt: 1_700_000_000_000,
    ...overrides,
  };
}

const rich = buildSave({ gold: 10_000 });
```

## Unit-testing services

Services are plain functions with injected repos, so they're easy to test with no HTTP at all:

```ts
it('refuses to overwrite a newer save', async () => {
  const saves = createInMemorySaveRepo();
  await saves.put('u1', buildSave(), null);                     // revision 1
  const result = await putSave({ saves }, 'u1', buildSave(), /* baseRevision */ 0);
  expect(result).toEqual({ ok: false, reason: 'conflict', currentRevision: 1 });
});
```

## Against a real database

In-memory repos are fast but can hide SQL bugs. Add **repository integration tests** that run against real Postgres:
- **PGlite** (Postgres compiled to WebAssembly, running in-process) is what this course's DB exercises use (Module 16). It's real Postgres with no Docker.
- **Testcontainers** start a real Postgres in Docker for each test run. It's closest to production.
- Each test should start from a known state: run migrations, then either wrap each test in a transaction that's rolled back, or truncate the tables.

A good balance for your game:
- **Many** fast route and service tests with in-memory repos.
- **Some** repository tests against PGlite or Postgres.
- **A few** Playwright E2E tests through the real frontend and API (12.5).

## Check your understanding

1. Why use `request.agent(app)` instead of `request(app)` for testing login?
2. A test checks that `savesService.put` was called once. What's better?
3. Why still write repository tests against a real database?

<details><summary>Answers</summary>

1. An agent keeps cookies between requests, so the session cookie set by `/login` is sent on the following `/me` request, just as in a browser.
2. Assert on the observable outcome: the response, and that a subsequent `GET` returns the new data. That tests behaviour and survives refactoring.
3. In-memory fakes can't catch SQL mistakes, constraint violations, transaction issues or migration problems. Only a real database exercises those.
</details>

## Further reading
- supertest: https://github.com/ladjs/supertest
- Testcontainers for Node: https://node.testcontainers.org

**🎉 That's Module 15 done.** Next: storing data for real.

---
[← Structuring a backend](06-structuring-a-backend.md) · [Module overview](README.md) · [Next module: Databases & SQL →](../16-databases/README.md)
