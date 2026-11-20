# 16.5 · Postgres in practice

> ⏱ 2.5 hours · Module 16 · Databases & SQL

## What you'll learn
- Running a real Postgres locally with Docker, or using a hosted one
- Connecting from Node with `pg`: pools, connection strings, SSL and shutdown
- Type gotchas: `bigint`, `numeric`, `timestamptz`, `jsonb`
- Querying inside `jsonb`
- Migrations: changing a live schema safely
- How to test code that talks to a database

---

## Getting a real Postgres

PGlite is perfect for tests and learning. Your deployed game needs a real Postgres server. There are two easy ways to get one for development.

### Option 1: Docker
Install Docker Desktop (or Docker Engine on Linux), then add a `compose.yaml` to your project:

```yaml
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_USER: hearthwild
      POSTGRES_PASSWORD: devpassword        # dev only: never a real secret
      POSTGRES_DB: hearthwild
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql          # keeps data between restarts
volumes:
  pgdata:
```

```bash
docker compose up -d
```

Your connection string is then `postgres://hearthwild:devpassword@localhost:5432/hearthwild`. Connect with a GUI (TablePlus, DBeaver, or VS Code's PostgreSQL extension) or with `docker compose exec db psql -U hearthwild`.

### Option 2: a hosted database
Neon, Supabase and others offer free development databases. You sign up and get a connection string. Module 20 picks one for deployment. Providers' free tiers change often, so check their current pricing pages.

Either way, the connection string goes in an **environment variable** (`DATABASE_URL`), never in code. You'll validate it at startup in 19.4.

## Connecting with `pg`

`pg` (node-postgres) is the standard Postgres driver for Node.

```bash
npm install pg
npm install -D @types/pg
```

```ts
import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                    // up to 10 connections at once
});

const { rows } = await pool.query<{ id: number; name: string }>(
  'SELECT id, name FROM players WHERE id = $1',
  [42],
);
```

### Why a pool?
Opening a Postgres connection takes tens of milliseconds and uses memory on the server. A **pool** keeps a few connections open and lends one to each query. `pool.query` checks one out, runs the query and returns it. For transactions you check one out yourself (`pool.connect()`, 16.4).

- Create **one** pool per process, in your composition root (15.6), and pass it to your repositories.
- Postgres has a connection limit (often 100, and lower on free hosted plans). Ten app instances × `max: 20` can exceed it. Hosted providers offer a **pooler** URL (PgBouncer) for this reason.
- On shutdown (`SIGTERM`, 15.6), call `await pool.end()` after the HTTP server has closed.

### SSL
Hosted databases require encrypted connections. Their connection strings usually include `?sslmode=require`, which `pg` understands. Don't "fix" SSL errors by turning certificate verification off in production. That makes the connection open to interception.

## Type gotchas

| Postgres | `pg` returns | Watch out |
|---|---|---|
| `integer` | `number` | — |
| `bigint` (`count(*)`, `sum`, `bigserial`) | **`string`** | JavaScript numbers lose precision above 2⁵³. `pg` refuses to guess |
| `numeric` (`avg`, money) | **`string`** | exact decimals; convert deliberately |
| `timestamptz` | `Date` | — |
| `timestamp` (no tz) | `Date`, read as **local time** | a classic source of off-by-hours bugs |
| `json` / `jsonb` | parsed object | when **sending** one, pass `JSON.stringify(value)`: `pg` turns a top-level JS array into a Postgres array, not JSON |

**PGlite is more relaxed**: it returns a `bigint` as a `number` when it fits safely. Code that passes its tests on PGlite can then get `'3'` instead of `3` on a real server. To make queries behave the same on both, **cast in SQL**: `count(*)::integer`, `round(avg(xp))::integer`. Use `integer` columns for game values unless they could really pass 2.1 billion (total XP across all players could; one player's skill XP can't).

### Time
- Use `timestamptz` for every point in time. Despite the name, it stores an absolute moment (internally UTC) and converts correctly for any client.
- Use `now()` in SQL or `new Date()` in Node, never a hand-built date string.
- Within one transaction, `now()` returns the **same** time for every statement. That's usually what you want.

### IDs
`serial` integers are simple and compact. Random UUIDs (`uuid DEFAULT gen_random_uuid()`) don't reveal how many users you have and can be generated anywhere. Postgres 18 adds `uuidv7()`, time-ordered UUIDs that index better. Either is fine for this game. Pick one and be consistent.

## Querying jsonb

Even when the save is one `jsonb` document, Postgres can look inside it:

```sql
SELECT data->'skills'->'fishing'->>'xp' AS fishing_xp FROM saves WHERE user_id = 1;
--      ->  returns jsonb          ->> returns text

SELECT user_id FROM saves WHERE data @> '{"settings": {"sound": false}}';  -- "contains"

CREATE INDEX saves_data_idx ON saves USING gin (data);  -- makes @> fast
```

This is handy for admin queries and one-off analysis. For anything on a hot path, such as the leaderboard, keep the extracted columns from 16.1. They're simpler, typed and cheap to index.

## Migrations

Your schema will change: a new skill table, a column for display names, an index for a slow query. A **migration** is a file that moves the schema from one version to the next, kept in Git and applied in order:

```
migrations/
  0001_create_users.sql
  0002_create_saves.sql
  0003_add_skill_xp.sql
```

A tool records which migrations have run (in a table of its own) and applies only the new ones, in development, CI and production alike. In 16.6 you'll let **drizzle-kit** generate these files from your TypeScript schema.

The rules:

1. **Never edit a migration that has run anywhere else.** Other databases already applied the old version. Write a new migration instead.
2. **Migrations are code.** They go through review like any other change.
3. **Run them as a deploy step**, before the new app version starts (Module 20).
4. **Back up before risky ones.** Hosted providers take automatic backups. Know how to restore before you need to.

### Changing a live table: expand and contract
Renaming `name` to `display_name` in one step breaks the app versions still running during a deploy. Do it in phases:

1. **Expand**: add `display_name`. Deploy code that writes **both** columns.
2. **Migrate data**: `UPDATE players SET display_name = name WHERE display_name IS NULL;`
3. Deploy code that reads `display_name` only.
4. **Contract**: drop `name` in a later migration.

It's slower, but nothing breaks at any point. You don't need this for a hobby game with no players yet, but you'll see it at work, and it's a good interview answer.

### Seeding
A **seed** script fills a development database with realistic data (a few users, some saves) so you can work on the UI. Keep it in the repo (`npm run db:seed`), make it safe to run twice, and never run it against production.

## Security basics
- The app connects as a user that **isn't** a superuser and can only touch its own database.
- Credentials live in environment variables or the host's secret store, never in Git (Module 20).
- Parameterised queries, always (16.2).
- Don't expose the database port to the internet. Hosted providers handle this for you.

## Testing database code

| Approach | Speed | Realism | Use for |
|---|---|---|---|
| In-memory fake repository (15.6) | ⚡⚡⚡ | low | route and service tests |
| **PGlite** in-process | ⚡⚡ | real Postgres SQL | repository tests (what the exercises do) |
| Real Postgres in Docker, CI service container or Testcontainers | ⚡ | identical to production | a smaller set of integration tests |

To keep tests independent, reset the database between them. Dropping and recreating the schema (`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`) then re-running migrations takes milliseconds on PGlite. Another approach is running each test inside a transaction that's always rolled back.

## Check your understanding

1. Why does an app use a connection pool rather than one connection per request?
2. `SELECT count(*) FROM players` returns `'12'` from `pg` but `12` from PGlite. Why, and what's the portable fix?
3. Why `timestamptz` rather than `timestamp`?
4. A teammate edits `0003_add_skill_xp.sql`, which has already run in production. What goes wrong?
5. Describe expand and contract for renaming a column.
6. When would you test against a real Postgres rather than PGlite?

<details><summary>Answers</summary>

1. Opening connections is slow and each uses server memory, and Postgres limits the total. A pool reuses a small number of open connections.
2. `count` returns `bigint`, which `pg` returns as a string to avoid precision loss. PGlite converts small values to numbers. Cast in SQL (`count(*)::integer`) so both return a number.
3. `timestamptz` stores an absolute moment and converts correctly. `timestamp` has no zone, so the same value means different moments depending on the server's or client's settings.
4. Production already applied the old version, so the edit never runs there. Environments drift apart, and fresh databases get a different schema from production. Write a new migration instead.
5. Add the new column and write to both. Copy existing data. Switch reads to the new column. Drop the old column in a later release.
6. For features PGlite may not match exactly (extensions, connection pooling, concurrency between several connections, performance) and for a final integration check in CI before deploying.
</details>

## Further reading
- node-postgres docs (node-postgres.com): "Pooling", "Transactions", "Data types"
- PostgreSQL docs: "JSON Types" (datatype-json) and "JSON Functions and Operators"
- Docker docs: "Get started" if you haven't used Docker before

---
[← Constraints, transactions & concurrency](04-constraints-transactions-and-concurrency.md) · [Module overview](README.md) · [Next: Drizzle ORM →](06-drizzle-orm.md)
