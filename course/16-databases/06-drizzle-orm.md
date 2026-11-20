# 16.6 · Drizzle ORM

> ⏱ 3 hours · Module 16 · Databases & SQL

## What you'll learn
- What ORMs and query builders are for, and what they cost
- Defining tables in TypeScript and inferring row types
- Selecting, filtering, joining, inserting, upserting, updating and deleting with Drizzle
- Transactions and error handling
- Generating and running migrations with drizzle-kit
- Writing a repository with Drizzle

---

## Why a query builder?

Raw SQL strings work (you've written them all module), but:

- The row types you pass to `query<Row>()` are promises the compiler can't check. Rename a column and nothing tells you which queries broke.
- Building queries with optional filters means gluing strings together carefully.
- Mapping `snake_case` rows to `camelCase` objects is repetitive.

An **ORM** (object-relational mapper) or **query builder** describes tables in code and generates SQL from method calls. **Drizzle** sits close to SQL: if you can write the SQL, you can write the Drizzle, and its types come straight from your schema. (Prisma is the other popular choice. It uses its own schema language and generates a client. Both are fine, and Drizzle teaches you more SQL.)

The trade-off is that you're learning an extra API, and complex queries can be harder to express than in SQL. Drizzle's `sql` template handles those cases (below).

## Setup

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

```ts
// src/db/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);
```

In tests (and the exercises) the same code runs on PGlite. Only the import changes:

```ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

const db = drizzle(new PGlite());
```

## Defining the schema

```ts
// src/db/schema.ts
import { integer, jsonb, pgTable, primaryKey, serial, text, timestamp, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const saves = pgTable('saves', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  revision: integer('revision').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const skillXp = pgTable(
  'skill_xp',
  {
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    skill: text('skill').notNull(),
    xp: integer('xp').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skill] }), index('skill_xp_leaderboard_idx').on(t.skill, t.xp.desc())],
);

export type User = typeof users.$inferSelect;      // { id: number; username: string; createdAt: Date }
export type NewUser = typeof users.$inferInsert;   // { username: string; id?: number; createdAt?: Date }
```

- The **TypeScript key** (`createdAt`) and the **SQL column name** (`'created_at'`) are separate, so the snake/camel mapping happens for you.
- `$inferSelect` is the type of a row you read. `$inferInsert` makes columns with defaults optional.
- `withTimezone: true` gives `timestamptz` (16.5).

## Queries

```ts
import { and, desc, eq, sql } from 'drizzle-orm';

// SELECT … WHERE
const [user] = await db.select().from(users).where(eq(users.username, 'ava'));
//     ^ User | undefined (with noUncheckedIndexedAccess)

// choose columns, sort, paginate
const page = await db
  .select({ id: users.id, username: users.username })
  .from(users)
  .orderBy(desc(users.createdAt), desc(users.id))
  .limit(20)
  .offset(40);

// INSERT … RETURNING
const [created] = await db.insert(users).values({ username: 'ava' }).returning();

// UPDATE with a value computed by the database
await db
  .update(skillXp)
  .set({ xp: sql`${skillXp.xp} + ${25}` })
  .where(and(eq(skillXp.userId, 1), eq(skillXp.skill, 'fishing')));

// DELETE, checking whether anything was deleted
const deleted = await db.delete(users).where(eq(users.id, 9)).returning({ id: users.id });
const existed = deleted.length > 0;
```

Every value you pass (`'ava'`, `25`, `9`) becomes a **parameter**. Drizzle never pastes values into the SQL string, so injection isn't possible through these APIs. Values inside the `sql` template are parameters too. The exception is `sql.raw(…)`, which pastes text in as-is. Treat it like string concatenation and never give it user input.

### Upsert
```ts
await db
  .insert(skillXp)
  .values({ userId: 1, skill: 'fishing', xp: 100 })
  .onConflictDoUpdate({
    target: [skillXp.userId, skillXp.skill],
    set: { xp: sql`excluded.xp` },          // the value we tried to insert
  });
```

### Joins and aggregates
```ts
import { count } from 'drizzle-orm';

const recent = await db
  .select({ username: users.username, revision: saves.revision, updatedAt: saves.updatedAt })
  .from(saves)
  .innerJoin(users, eq(users.id, saves.userId))
  .orderBy(desc(saves.updatedAt))
  .limit(10);

const perSkill = await db
  .select({ skill: skillXp.skill, players: count(), best: sql<number>`max(${skillXp.xp})` })
  .from(skillXp)
  .groupBy(skillXp.skill);
```

`sql<number>` declares the TypeScript type of a raw SQL expression. Like `query<Row>()`, it's a promise, not a check. Cast in SQL if the driver might return a string (16.5).

### Dynamic filters
Conditions are values, so you can build them up. `and()` ignores `undefined`:

```ts
const rows = await db
  .select()
  .from(skillXp)
  .where(and(eq(skillXp.skill, skill), minXp !== undefined ? sql`${skillXp.xp} >= ${minXp}` : undefined));
```

### Window functions and anything else
When the builder doesn't cover something, drop into `sql`:

```ts
const board = await db
  .select({
    username: users.username,
    xp: skillXp.xp,
    rank: sql<number>`rank() over (order by ${skillXp.xp} desc)`.mapWith(Number),
  })
  .from(skillXp)
  .innerJoin(users, eq(users.id, skillXp.userId))
  .where(eq(skillXp.skill, 'fishing'));
```

`.mapWith(Number)` converts the value as it comes back, so the result is a number even on drivers that return strings.

## Transactions

```ts
await db.transaction(async (tx) => {
  await tx.update(saves).set({ /* … */ }).where(eq(saves.userId, userId));
  await tx.insert(skillXp).values(rows).onConflictDoUpdate({ /* … */ });
}); // commits if the callback resolves; rolls back and rethrows if it throws
```

As with PGlite's helper, use `tx` inside the callback, not `db`.

## Errors

When a query fails, Drizzle throws its own error that wraps the driver's error. The Postgres `code` is on **`.cause`**:

```ts
function pgCode(err: unknown): string | undefined {
  const cause = err instanceof Error ? err.cause : undefined;
  if (typeof cause === 'object' && cause !== null && 'code' in cause && typeof cause.code === 'string') {
    return cause.code;
  }
  return undefined;
}

try {
  await db.insert(users).values({ username });
} catch (err) {
  if (pgCode(err) === '23505') throw new UsernameTakenError(username);
  throw err;
}
```

`err.cause` is the standard way JavaScript errors point at the error that caused them (`new Error('…', { cause })`). Check it whenever a library wraps errors.

## Migrations with drizzle-kit

drizzle-kit compares your `schema.ts` with the previous migrations and writes the SQL for the difference.

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',                          // migration files go here (commit them)
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

```bash
npx drizzle-kit generate     # schema.ts changed → writes drizzle/0003_xxx.sql
npx drizzle-kit migrate      # applies any migrations the database hasn't run
npx drizzle-kit studio       # a web UI to browse your data
```

**Read every generated migration before committing it.** drizzle-kit is good, but a rename can look like "drop column + add column", which loses data. It asks when it can't tell, but you're responsible for what runs in production.

There's also `drizzle-kit push`, which changes the database to match the schema without writing migration files. It's handy for prototyping, but use `generate` + `migrate` for anything you deploy.

You can also run migrations from code (e.g. at deploy time or in test setup):

```ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';
await migrate(db, { migrationsFolder: './drizzle' });
```

## A repository with Drizzle

Put it together in the layered structure from 15.6. The repository exposes **domain** operations, and nothing outside it knows Drizzle exists:

```ts
export type SaveRepo = {
  get(userId: number): Promise<SaveRecord | undefined>;
  put(userId: number, data: unknown, baseRevision: number): Promise<PutResult>;
};

export function createSaveRepo(db: Database, deps: { now: () => Date }): SaveRepo {
  return {
    async get(userId) {
      const [row] = await db.select().from(saves).where(eq(saves.userId, userId));
      return row;
    },
    async put(userId, data, baseRevision) {
      /* the optimistic-concurrency update from 16.4, in Drizzle: exercise 16-04 */
    },
  };
}
```

Routes depend on `SaveRepo`, tests can pass an in-memory one, and exercise 16-04 has you build the real one.

## Check your understanding

1. What does Drizzle give you over raw SQL strings? What does it cost?
2. What's the difference between `$inferSelect` and `$inferInsert`?
3. Is `sql\`${skillXp.xp} + ${amount}\`` safe from SQL injection? Is `sql.raw(amount)`?
4. Where is the Postgres error code on an error thrown by Drizzle?
5. What does `drizzle-kit generate` do, and why must you read its output?
6. Why should routes depend on a `SaveRepo` type rather than on Drizzle directly?

<details><summary>Answers</summary>

1. Types derived from the schema (renames are compile errors), automatic column-name mapping, composable conditions, and parameters everywhere. The cost is another API to learn and, for complex queries, sometimes less clarity than plain SQL.
2. `$inferSelect` is a row as read from the database (every column present). `$inferInsert` is what you pass to `insert`: columns with defaults or generated values are optional.
3. Yes: values in the `sql` template become parameters. `sql.raw` is not: it pastes text into the SQL.
4. On `err.cause.code`. Drizzle wraps the driver's error and sets it as the `cause`.
5. It compares the schema with the existing migrations and writes a SQL migration for the difference. It can misread intent (a rename as drop + add, losing data), and that SQL runs in production.
6. So the data layer can change (another library, a schema change, an in-memory fake for tests) without touching routes, and so routes are easy to test.
</details>

## Further reading
- Drizzle docs (orm.drizzle.team): "Schema", "Select", "Insert", "Transactions", "Migrations"
- MDN: `Error.prototype.cause`

---
[← Postgres in practice](05-postgres-in-practice.md) · [Module overview](README.md) · [Module 17 · Authentication & Security →](../17-auth-and-security/README.md)
