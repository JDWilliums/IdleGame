# 15.6 · Structuring a backend

> ⏱ 2 hours · Module 15 · Node.js & Express

## What you'll learn
- Layers: routes → services → repositories
- Dependency injection with plain functions: `createApp(deps)`
- Config, composition root and graceful shutdown
- A folder structure for the game's API

---

## Why structure?

A 200-line `server.ts` with routes that query the database directly works, until you need to test the logic without a database, reuse logic between routes, swap the database for an in-memory one, or let three people work on it at once. Layers keep each piece focused.

## The layers

```
HTTP request
   │
   ▼
┌───────────────┐  routes / handlers: HTTP concerns only. Parse and validate input,
│   routes      │  call a service, choose the status code, send the response.
└──────┬────────┘
       ▼
┌───────────────┐  services: business rules ("you can't overwrite a newer save",
│   services    │  "usernames are unique"). No Express, no SQL. Plain functions.
└──────┬────────┘
       ▼
┌───────────────┐  repositories: data access. SQL/ORM lives here, and nowhere else.
│ repositories  │  Interface: savesRepo.get(userId), savesRepo.put(…)
└──────┬────────┘
       ▼
    database
```

| Layer | Knows about | Doesn't know about |
|---|---|---|
| routes | HTTP, `req`/`res`, validation schemas | SQL |
| services | the domain rules, repository *interfaces* | HTTP, Express, SQL |
| repositories | the database | HTTP, business rules |

For a small API you can merge routes and services, and that's fine. The two non-negotiables are: **keep SQL in repositories**, and **inject dependencies**.

## Dependency injection, the simple way

No framework needed. **Pass dependencies in as arguments**:

```ts
// repositories/saves.ts
export type SaveRepo = {
  get(userId: string): Promise<StoredSave | undefined>;
  put(userId: string, data: SaveData, expectedRevision: number | null): Promise<PutResult>;
};

export function createPostgresSaveRepo(db: Db): SaveRepo { … }   // production
export function createInMemorySaveRepo(): SaveRepo { … }         // tests and local dev
```

```ts
// app.ts
export type AppDeps = {
  saves: SaveRepo;
  users: UserRepo;
  sessions: SessionRepo;
  now: () => Date;                 // even the clock: tests control time
  config: { cookieSecure: boolean; corsOrigin: string };
};

export function createApp(deps: AppDeps) {
  const app = express();
  app.use(express.json({ limit: '200kb' }));
  app.use('/api/auth', authRouter(deps));
  app.use('/api/save', requireAuth(deps), saveRouter(deps));
  app.use(notFound);
  app.use(errorHandler({ exposeStack: !deps.config.cookieSecure, logger: console }));
  return app;
}
```

```ts
// server.ts: the "composition root", the ONLY place that wires real implementations
const config = loadConfig(process.env);               // validated with Zod (19.4)
const db = createDb(config.databaseUrl);
const app = createApp({
  saves: createPostgresSaveRepo(db),
  users: createPostgresUserRepo(db),
  sessions: createPostgresSessionRepo(db),
  now: () => new Date(),
  config,
});
const server = app.listen(config.port);
```

```ts
// test
const app = createApp({ saves: createInMemorySaveRepo(), users: …, now: () => new Date('2026-01-01'), config: testConfig });
```

The benefits:
- Tests are **fast** (no database) and **deterministic** (fixed clock).
- Each piece can be tested on its own.
- The dependency graph is explicit: reading `AppDeps` tells you everything the app talks to.

It's the same principle as `tick(state, dt, rng)` in your engine, applied to a server.

## Graceful shutdown

Hosts stop your app by sending `SIGTERM` (during deploys and scaling). Finish in-flight requests, then close resources:

```ts
process.on('SIGTERM', () => {
  server.close(async () => {          // stop accepting connections, and wait for in-flight requests
    await db.end();                   // close the DB pool
    process.exit(0);
  });
});
```

## A folder structure for the game API

```
apps/api/src/
  server.ts              ← composition root: config, db, createApp, listen, shutdown
  app.ts                 ← createApp(deps): middleware + routers
  config.ts              ← env → validated config (19.4)
  http/
    validate.ts          ← 15-03
    errors.ts            ← HttpError + errorHandler + notFound (15-04)
    cookies.ts, rate-limit.ts   ← Module 17
  features/
    auth/   auth.routes.ts  auth.service.ts  sessions.repo.ts  users.repo.ts
    saves/  saves.routes.ts saves.service.ts saves.repo.ts
    leaderboard/ …
  db/
    schema.ts  client.ts  migrations/
  test/
    builders.ts          ← test data helpers (15.7)
```

**Feature folders** (everything about saves together) scale better than **type folders** (`routes/`, `services/`, `repos/` at the top level), the same idea you saw for the frontend in 06.2.

## Check your understanding

1. Where does SQL live, and why only there?
2. What is the composition root?
3. How does `createApp(deps)` make tests faster and more reliable?
4. What should happen when the process receives `SIGTERM`?

<details><summary>Answers</summary>

1. In repositories. The rest of the app depends on repository interfaces, so data access can change (a schema, an ORM, an in-memory version for tests) without touching business logic or routes.
2. The single place, usually `server.ts`, where real implementations (config, database, repositories, clock) are created and wired into the app.
3. Tests pass in-memory repositories and a fixed clock, so there's no database to start, no shared state between tests, and time-dependent behaviour is predictable.
4. Stop accepting new connections, let in-flight requests finish (`server.close`), close resources such as the DB pool, then exit with code 0.
</details>

## Further reading
- Node.js best practices (goldbergyoni/nodebestpractices on GitHub): "Project architecture" and "Error handling"

---
[← Validation & error handling](05-validation-and-error-handling.md) · [Module overview](README.md) · [Next: Testing APIs →](07-testing-apis.md)
