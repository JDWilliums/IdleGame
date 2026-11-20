# 16.2 · SQL fundamentals

> ⏱ 3.5 hours · Module 16 · Databases & SQL

## What you'll learn
- How to run SQL without installing anything (PGlite)
- `CREATE TABLE` with types, defaults and basic constraints
- The four core statements: `INSERT`, `SELECT`, `UPDATE`, `DELETE`
- `RETURNING`, `ORDER BY`, `LIMIT`/`OFFSET`, `NULL` and upserts
- **Parameterised queries**, and why string-building SQL is a security hole
- Turning rows into typed objects

---

## A database in your playground

PGlite is real PostgreSQL compiled to WebAssembly. It runs inside Node with no server, Docker or install, which is why the exercises use it. Try this in `playground/sql.ts` and run it with `npx tsx playground/sql.ts`:

```ts
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite(); // in-memory; new PGlite('./data/dev') would persist to disk

await db.exec(`
  CREATE TABLE players (
    id         serial PRIMARY KEY,
    name       text NOT NULL UNIQUE,
    gold       integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  );
`);

const result = await db.query('SELECT 1 + 1 AS answer');
console.log(result.rows); // [ { answer: 2 } ]
```

- `exec(sql)` runs one or more statements and is meant for setup scripts. It can't take parameters.
- `query(sql, params)` runs **one** statement with parameters and returns `{ rows, affectedRows, fields }`.

In a real project you'll use a Postgres server and the `pg` driver (16.5), whose `query` looks almost identical.

SQL keywords are case-insensitive. Writing them in CAPITALS is a convention that helps them stand out. Names are lower-case `snake_case` by convention, because unquoted identifiers are folded to lower case.

## CREATE TABLE

```sql
CREATE TABLE players (
  id         serial PRIMARY KEY,          -- auto-incrementing integer
  name       text NOT NULL UNIQUE,        -- required, no duplicates
  gold       integer NOT NULL DEFAULT 0,  -- default if not supplied
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- `serial` is shorthand for "integer with a sequence that hands out 1, 2, 3…". Newer code often writes `integer GENERATED ALWAYS AS IDENTITY`, which does the same thing in standard SQL.
- `NOT NULL` makes a column required. **Make columns `NOT NULL` unless you have a reason not to.** Every nullable column is a question every reader has to answer.
- `DEFAULT` supplies a value when an `INSERT` leaves the column out.

`DROP TABLE players;` deletes the table and all its data. There's no undo.

## INSERT … RETURNING

```sql
INSERT INTO players (name, gold) VALUES ('Ava', 50);
INSERT INTO players (name) VALUES ('Bram'), ('Cleo');     -- several rows; gold defaults to 0

INSERT INTO players (name) VALUES ('Dev') RETURNING id, created_at;
```

`RETURNING` sends back the inserted row, including generated values like `id`. It's a Postgres feature that saves a second query, and you'll use it constantly.

## SELECT

```sql
SELECT * FROM players;                                -- every column, every row (fine for exploring)
SELECT id, name FROM players WHERE gold > 10;         -- choose columns, filter rows
SELECT name FROM players ORDER BY created_at DESC, id DESC LIMIT 10 OFFSET 20;  -- page 3
SELECT count(*) AS total FROM players;
SELECT name FROM players WHERE lower(name) = lower('AVA');  -- case-insensitive match
SELECT name FROM players WHERE name ILIKE 'a%';        -- starts with a/A (% = any characters)
```

- In application code, **name your columns** rather than using `SELECT *`. When someone adds a 2 MB column later, your query won't suddenly start fetching it.
- **Always `ORDER BY` when the order matters.** Without it Postgres may return rows in any order, and the order can change between runs.
- When sorting by something that can tie (`created_at`), add a **tie-breaker** (`id`) so pages don't shuffle.
- `OFFSET` pagination is simple but gets slower deep into a big table. 16.3 mentions the alternative.

## UPDATE and DELETE

```sql
UPDATE players SET gold = gold + 25 WHERE id = 1;     -- relative update, computed by the database
UPDATE players SET name = 'Bryn' WHERE id = 2 RETURNING *;
DELETE FROM players WHERE id = 3;
```

> ⚠️ `UPDATE players SET gold = 0;` with no `WHERE` updates **every row**. When writing an `UPDATE` or `DELETE` by hand, write the `WHERE` first.

Drivers report how many rows a statement changed. In PGlite it's `result.affectedRows`; in `pg` it's `result.rowCount`. "Zero rows affected" is how you discover that the row you tried to update doesn't exist, which is your 404.

## NULL is not a value

`NULL` means "unknown". Any comparison with `NULL` is itself unknown, so it's never true:

```sql
SELECT NULL = NULL;               -- NULL (not true!)
SELECT * FROM t WHERE x = NULL;   -- returns nothing, ever
SELECT * FROM t WHERE x IS NULL;  -- correct
SELECT coalesce(nickname, name) FROM t;  -- first non-null value
```

## Upserts: INSERT … ON CONFLICT

"Add 5 oak logs to the player's inventory, creating the row if it doesn't exist" is a single statement in Postgres:

```sql
CREATE TABLE inventory (
  player_id integer NOT NULL REFERENCES players(id),
  item_id   text    NOT NULL,
  qty       integer NOT NULL,
  PRIMARY KEY (player_id, item_id)          -- one row per player per item
);

INSERT INTO inventory (player_id, item_id, qty)
VALUES (1, 'oak_log', 5)
ON CONFLICT (player_id, item_id)
DO UPDATE SET qty = inventory.qty + EXCLUDED.qty   -- EXCLUDED = the row you tried to insert
RETURNING qty;
```

`ON CONFLICT` needs a unique constraint or primary key to detect the conflict. `DO NOTHING` is the other option ("insert unless it exists"). Upserts are **atomic**: two requests running at once can't both decide the row is missing.

## Parameters and SQL injection

This is the most important section in the module.

Imagine looking a player up by name by gluing a string together:

```ts
// ❌ NEVER do this
const rows = await db.query(`SELECT * FROM players WHERE name = '${name}'`);
```

Now a "player" types this as their name:

```
x' OR '1'='1
```

Your SQL becomes `SELECT * FROM players WHERE name = 'x' OR '1'='1'`, which returns **every player**. With other inputs an attacker can read other tables, change data, or drop tables. This is **SQL injection**, and it's still one of the most common serious vulnerabilities on the web (OWASP Top 10, "Injection").

The fix is **parameters**: placeholders in the SQL, with the values sent separately.

```ts
// ✅ Always
const result = await db.query('SELECT id, name FROM players WHERE name = $1', [name]);
```

The database parses the SQL **first**, with `$1` as a slot, and only then fills in the value. Whatever the value contains, it can only ever be data, never SQL. Postgres numbers parameters `$1`, `$2`, …

```ts
await db.query('UPDATE players SET name = $1 WHERE id = $2', [newName, id]);
await db.query('SELECT name FROM players ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
```

### What can't be a parameter
Parameters stand for **values** only. Table names, column names, `ASC`/`DESC` and keywords can't be parameters. If a user picks a sort column, map their choice through an **allowlist**:

```ts
const SORTS = { name: 'name ASC', newest: 'created_at DESC' } as const;
const orderBy = SORTS[sortParam as keyof typeof SORTS] ?? SORTS.newest;   // never the raw input
await db.query(`SELECT id, name FROM players ORDER BY ${orderBy}, id LIMIT $1`, [limit]);
```

Interpolating `orderBy` is safe here because it can only ever be one of the strings **you** wrote.

## Rows into typed objects

Rows come back keyed by column name, which is `snake_case`. Your TypeScript uses `camelCase`. Convert at the edge, in one function per table:

```ts
type PlayerRow = { id: number; name: string; created_at: Date };
export type Player = { id: number; name: string; createdAt: Date };

const toPlayer = (row: PlayerRow): Player => ({ id: row.id, name: row.name, createdAt: row.created_at });

const { rows } = await db.query<PlayerRow>('SELECT id, name, created_at FROM players WHERE id = $1', [id]);
const player = rows[0] ? toPlayer(rows[0]) : undefined;
```

The `<PlayerRow>` type argument is a **promise you're making**, not a check: the driver trusts you. Keep it in sync with the `SELECT` list. (Drizzle, in 16.6, derives these types from the schema for you.)

## Check your understanding

1. What's the difference between `exec` and `query` in PGlite?
2. Why add `id` to `ORDER BY created_at DESC, id DESC`?
3. Why does `WHERE nickname = NULL` never match anything?
4. What does `EXCLUDED` refer to in an `ON CONFLICT … DO UPDATE`?
5. Explain, as you would to a colleague, why `$1` parameters prevent SQL injection.
6. A route lets users sort by any column name in `?sort=`. How do you make that safe?

<details><summary>Answers</summary>

1. `exec` runs any number of statements without parameters (setup scripts). `query` runs one statement with `$n` parameters and returns rows plus metadata.
2. `created_at` can tie. Without a tie-breaker, tied rows can come back in a different order each time, so pagination can repeat or skip rows.
3. Comparing anything with `NULL` gives `NULL` (unknown), which is not true. Use `IS NULL`.
4. The row you tried to insert, the one that conflicted.
5. The SQL text is parsed before any values are added, and values are sent separately. A value can only ever fill a slot as data; it can't change the structure of the statement.
6. Map the user's choice through an allowlist of column names you wrote, and fall back to a default. Never interpolate raw input.
</details>

## Further reading
- PostgreSQL docs: "Tutorial" chapters 2 and 3 (postgresql.org/docs/current/tutorial.html)
- OWASP "SQL Injection Prevention Cheat Sheet"
- PGlite docs (pglite.dev/docs)

---
[← Relational thinking](01-relational-thinking.md) · [Module overview](README.md) · [Next: Joins, aggregates & indexes →](03-joins-aggregates-and-indexes.md)
