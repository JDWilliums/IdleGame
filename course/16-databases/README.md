# Module 16 · Databases & SQL

**Time:** ~18 hours · **Prerequisites:** Module 15 (Express, layers and dependency injection), 02.7 (Zod)

## Why this module matters
Every job ad for a full-stack or backend role lists SQL, and interviewers love asking about joins, indexes and transactions. Your game needs a database for accounts, cloud saves and leaderboards, and the hardest bug in cloud saves (two devices overwriting each other) is a database concurrency problem. You'll learn SQL properly first, then use **Drizzle ORM** the way most modern TypeScript teams do. Every exercise runs on a **real PostgreSQL engine** (PGlite, compiled to WebAssembly), so you don't need Docker or a server to start.

## Learning objectives
By the end of this module you can:
- model data as tables with primary keys, foreign keys and sensible types
- write `SELECT`, `INSERT`, `UPDATE`, `DELETE` and upserts, always with parameters
- explain SQL injection and prevent it
- combine tables with joins, summarise them with `GROUP BY`, and rank them with window functions
- choose indexes for real queries and read `EXPLAIN` output
- use constraints and transactions to keep data correct, and optimistic concurrency to prevent lost updates
- connect to Postgres from Node, handle its type quirks and manage migrations
- define a schema and write a repository with Drizzle

## Lessons
| # | Lesson | Time |
|---|---|---|
| 16.1 | [Relational thinking](01-relational-thinking.md) | 2.5h |
| 16.2 | [SQL fundamentals](02-sql-fundamentals.md) | 3.5h |
| 16.3 | [Joins, aggregates & indexes](03-joins-aggregates-and-indexes.md) | 3h |
| 16.4 | [Constraints, transactions & concurrency](04-constraints-transactions-and-concurrency.md) | 3h |
| 16.5 | [Postgres in practice](05-postgres-in-practice.md) | 2.5h |
| 16.6 | [Drizzle ORM](06-drizzle-orm.md) | 3h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `16-01` | [sql-basics](../../exercises/16-databases/01-sql-basics/exercise.ts) | 16.2 |
| `16-02` | [joins-and-aggregates](../../exercises/16-databases/02-joins-and-aggregates/exercise.ts) | 16.3 |
| `16-03` | [transactions](../../exercises/16-databases/03-transactions/exercise.ts) | 16.4 |
| `16-04` | [drizzle-repository](../../exercises/16-databases/04-drizzle-repository/exercise.ts) | 16.6 |

Hints: [`exercises/16-databases/HINTS.md`](../../exercises/16-databases/HINTS.md)

Each test file starts its own in-memory Postgres (about a second) and resets the schema before every test, so tests never affect each other.

## Checkpoint quiz
1. What does a foreign key guarantee?
2. Why is `` `SELECT * FROM players WHERE name = '${name}'` `` dangerous, and what's the fix?
3. What's the difference between `WHERE` and `HAVING`?
4. Write the SQL (in words is fine) for "every player and their fishing XP, including players with none".
5. Why might an index on `(xp, skill)` not help `WHERE skill = 'fishing' ORDER BY xp DESC`?
6. What does the "A" in ACID mean, and what goes wrong without it in a gold transfer?
7. Two devices upload a save based on revision 7. How does `WHERE revision = $base` stop the second from overwriting the first?
8. `count(*)` comes back as `'12'` (a string). Why, and how do you fix it?
9. You changed `schema.ts`. What are the steps to get that change into production?

<details><summary>Answers</summary>

1. That the value in the column matches an existing row in the referenced table, on every insert and update. The `ON DELETE` rule decides what happens when the referenced row is deleted.
2. The input is pasted into the SQL, so input like `x' OR '1'='1` changes the query itself (SQL injection). Use parameters: `WHERE name = $1` with `[name]`.
3. `WHERE` filters rows before grouping. `HAVING` filters groups after aggregation, so it can use `sum(…)`, `count(…)` and so on.
4. `SELECT p.name, s.xp FROM players p LEFT JOIN skill_xp s ON s.player_id = p.id AND s.skill = 'fishing'`. The skill condition goes in the `ON`, not the `WHERE`.
5. A B-tree is sorted by its first column. With `xp` first, the fishing rows are scattered through the index. Put the equality column first: `(skill, xp DESC)`.
6. Atomicity: all statements in the transaction happen or none do. Without it, a crash between "subtract from Ava" and "add to Bram" destroys gold.
7. The first upload matches, updates and bumps the revision to 8. The second's `WHERE revision = 7` then matches no rows, so nothing is overwritten and the server reports a conflict.
8. `count` returns `bigint`, which `pg` returns as a string to avoid precision loss. Cast in SQL: `count(*)::integer`.
9. Run `drizzle-kit generate`, read the generated SQL, commit it with the code, and have the deploy run the migration (`drizzle-kit migrate` or `migrate()` in code) before the new version starts.
</details>

## Extra practice
1. **SQL katas.** Work through the free interactive lessons at pgexercises.com (the "Joins", "Aggregation" and "Modifying data" sections). They use a small club-booking schema and run real Postgres in your browser.
2. **Per-skill rank.** Write one query that returns, for a given player, their rank in **every** skill they have XP in (`PARTITION BY`, a CTE and a filter).
3. **Explain it.** In a playground, insert 200,000 rows into `skill_xp` with `generate_series`, run `EXPLAIN ANALYZE` on the leaderboard query, add the index from 16.3 and compare.
4. **Swap the repo.** Implement `PlayerRepo` from 15-02 with Drizzle on PGlite and run 15-02's tests against it by passing it to `createApp`. Same API, real database: that's what dependency injection buys you.

**Next:** [Module 17 · Authentication & Security →](../17-auth-and-security/README.md)
