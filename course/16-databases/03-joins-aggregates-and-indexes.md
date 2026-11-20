# 16.3 · Joins, aggregates & indexes

> ⏱ 3 hours · Module 16 · Databases & SQL

## What you'll learn
- Combining tables with `INNER JOIN` and `LEFT JOIN`
- Finding "rows with no match" (anti-joins)
- Aggregates: `count`, `sum`, `avg`, `GROUP BY`, `HAVING`
- Window functions for rankings: `rank()`, `row_number()`, `PARTITION BY`
- `WITH` (CTEs) for readable multi-step queries
- What an index is, how to see whether a query uses one, and the N+1 problem

---

The examples use this schema. Paste it into a playground file and run it, then try each query.

```sql
CREATE TABLE players  (id serial PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE items    (id text PRIMARY KEY, name text NOT NULL, sell_price integer NOT NULL);
CREATE TABLE skill_xp (
  player_id integer NOT NULL REFERENCES players(id),
  skill     text    NOT NULL,
  xp        integer NOT NULL,
  PRIMARY KEY (player_id, skill)
);
CREATE TABLE inventory (
  player_id integer NOT NULL REFERENCES players(id),
  item_id   text    NOT NULL REFERENCES items(id),
  qty       integer NOT NULL,
  PRIMARY KEY (player_id, item_id)
);

INSERT INTO players (name) VALUES ('Ava'), ('Bram'), ('Cleo'), ('Dev');
INSERT INTO items VALUES ('oak_log', 'Oak log', 5), ('raw_trout', 'Raw trout', 12), ('iron_ore', 'Iron ore', 20);
INSERT INTO skill_xp VALUES (1, 'fishing', 4000), (2, 'fishing', 9000), (3, 'fishing', 4000),
                            (1, 'woodcutting', 1200), (4, 'woodcutting', 300);
INSERT INTO inventory VALUES (1, 'oak_log', 40), (1, 'raw_trout', 10), (2, 'iron_ore', 3);
```

## INNER JOIN

A join combines rows from two tables where a condition matches.

```sql
SELECT p.name, i.item_id, i.qty
FROM inventory i
JOIN players p ON p.id = i.player_id      -- JOIN means INNER JOIN
ORDER BY p.name, i.item_id;
```

| name | item_id | qty |
|---|---|---|
| Ava | oak_log | 40 |
| Ava | raw_trout | 10 |
| Bram | iron_ore | 3 |

`i` and `p` are **aliases**, short names for the tables. An inner join only returns rows that match on **both** sides, so Cleo and Dev (no inventory) don't appear.

Joins chain:

```sql
SELECT p.name, it.name AS item, inv.qty * it.sell_price AS value
FROM inventory inv
JOIN players p ON p.id = inv.player_id
JOIN items  it ON it.id = inv.item_id;
```

## LEFT JOIN

A `LEFT JOIN` keeps **every** row from the left table. Where there's no match, the right side's columns are `NULL`.

```sql
SELECT p.name, s.xp AS fishing_xp
FROM players p
LEFT JOIN skill_xp s ON s.player_id = p.id AND s.skill = 'fishing'
ORDER BY p.name;
```

| name | fishing_xp |
|---|---|
| Ava | 4000 |
| Bram | 9000 |
| Cleo | 4000 |
| Dev | *NULL* |

Notice the `s.skill = 'fishing'` condition is in the `ON`, not a `WHERE`. A `WHERE s.skill = 'fishing'` would run **after** the join, see `NULL` for Dev, and throw his row away, quietly turning your left join back into an inner join. This is one of the most common SQL bugs.

### Anti-join: "who has no …?"
Players who have never fished:

```sql
-- version 1: LEFT JOIN and keep only the non-matches
SELECT p.name
FROM players p
LEFT JOIN skill_xp s ON s.player_id = p.id AND s.skill = 'fishing'
WHERE s.player_id IS NULL;

-- version 2: NOT EXISTS (often clearer, and just as fast in Postgres)
SELECT p.name
FROM players p
WHERE NOT EXISTS (
  SELECT 1 FROM skill_xp s WHERE s.player_id = p.id AND s.skill = 'fishing'
);
```

## Aggregates and GROUP BY

Aggregate functions collapse many rows into one value:

```sql
SELECT count(*) AS players, sum(xp) AS total, max(xp) AS best, avg(xp) AS mean
FROM skill_xp WHERE skill = 'fishing';
```

`GROUP BY` produces one output row **per group**:

```sql
SELECT skill, count(*) AS players, sum(xp) AS total_xp, round(avg(xp))::integer AS avg_xp
FROM skill_xp
GROUP BY skill
ORDER BY skill;
```

| skill | players | total_xp | avg_xp |
|---|---|---|---|
| fishing | 3 | 17000 | 5667 |
| woodcutting | 2 | 1500 | 750 |

The rule: every column in the `SELECT` must either be in the `GROUP BY` or be inside an aggregate. (`SELECT skill, player_id … GROUP BY skill` fails, because which `player_id` would it show?)

### Types that come back from aggregates
- `count(*)` and `sum(integer)` return `bigint`.
- `avg(…)` returns `numeric`, an exact decimal. Drivers return `numeric` as a **string** (`'5666.6666666666666667'`) so no precision is lost.
- The fix is to **cast in SQL** to the type you want: `round(avg(xp))::integer`, `count(*)::integer`. `::type` is Postgres's cast syntax.

### WHERE vs HAVING
`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** aggregation.

```sql
-- players whose inventory is worth at least 200 gold
SELECT p.name, sum(inv.qty * it.sell_price)::integer AS value
FROM players p
JOIN inventory inv ON inv.player_id = p.id
JOIN items it      ON it.id = inv.item_id
GROUP BY p.id, p.name
HAVING sum(inv.qty * it.sell_price) >= 200
ORDER BY value DESC;
```

### COALESCE for "nothing found"
`sum` over zero rows is `NULL`, not `0`. Wrap it: `coalesce(sum(…), 0)`.

## Window functions: rankings

An aggregate collapses rows. A **window function** computes something across a set of rows but keeps every row. That's exactly what a leaderboard needs.

```sql
SELECT p.name, s.xp,
       rank()       OVER (ORDER BY s.xp DESC) AS rank,
       dense_rank() OVER (ORDER BY s.xp DESC) AS dense,
       row_number() OVER (ORDER BY s.xp DESC, p.name) AS row_num
FROM skill_xp s
JOIN players p ON p.id = s.player_id
WHERE s.skill = 'fishing'
ORDER BY rank, p.name;
```

| name | xp | rank | dense | row_num |
|---|---|---|---|---|
| Bram | 9000 | 1 | 1 | 1 |
| Ava | 4000 | 2 | 2 | 2 |
| Cleo | 4000 | 2 | 2 | 3 |

- `rank()` gives ties the same rank and then **skips** (1, 2, 2, 4). This is what sports tables do.
- `dense_rank()` doesn't skip (1, 2, 2, 3).
- `row_number()` gives every row a different number. Use a tie-breaker so it's deterministic.

`PARTITION BY` restarts the window for each group, e.g. a player's rank **in each skill**:

```sql
SELECT player_id, skill, rank() OVER (PARTITION BY skill ORDER BY xp DESC) AS rank
FROM skill_xp;
```

## WITH: name your steps

A **common table expression** (CTE) names a subquery so a complicated query reads top to bottom:

```sql
WITH ranked AS (
  SELECT player_id, xp, rank() OVER (ORDER BY xp DESC) AS rank
  FROM skill_xp WHERE skill = 'fishing'
)
SELECT p.name, r.xp, r.rank
FROM ranked r JOIN players p ON p.id = r.player_id
WHERE r.player_id = 1;          -- "what's MY rank?"
```

You can't filter on a window function's result in the same query's `WHERE` (it runs before windows are computed), so a CTE like this is the standard way to do it.

## Indexes

Without help, `SELECT … WHERE skill = 'fishing' ORDER BY xp DESC LIMIT 10` must read **every row** of `skill_xp` (a sequential scan) and sort them. At 100 rows nobody notices. At 10 million, every leaderboard request takes seconds.

An **index** is a separate, sorted data structure (usually a **B-tree**) that maps column values to rows. Finding a value goes from reading everything (O(n)) to a few page lookups (O(log n)), much like a book's index.

```sql
CREATE INDEX skill_xp_leaderboard_idx ON skill_xp (skill, xp DESC);
```

This one index serves "rows for one skill, already ordered by XP": Postgres jumps to `fishing` and reads the first 10 entries.

### Seeing what the database does
```sql
EXPLAIN ANALYZE
SELECT player_id, xp FROM skill_xp WHERE skill = 'fishing' ORDER BY xp DESC LIMIT 10;
```

Look for `Seq Scan` (reads the whole table) versus `Index Scan` / `Index Only Scan`. On a tiny table Postgres often chooses a sequential scan anyway, because it's faster for a handful of rows. Indexes matter at scale.

### Rules of thumb
- `PRIMARY KEY` and `UNIQUE` create indexes automatically.
- **Foreign key columns are not indexed automatically.** If you look rows up by `player_id`, or delete players (which checks referencing rows), index it. (A composite primary key that **starts** with `player_id` already covers it.)
- In a composite index, **column order matters**. `(skill, xp)` helps `WHERE skill = …` but not `WHERE xp > …` alone. Put equality columns first, then the sort or range column.
- Indexes aren't free. Every `INSERT`/`UPDATE` must update every index, and they take disk space. Add them for queries you actually run.

### Keyset pagination
`OFFSET 100000` still walks past 100,000 rows. For deep pages use the last row you saw: `WHERE (xp, player_id) < ($1, $2) ORDER BY xp DESC, player_id DESC LIMIT 20`. With a matching index this is fast on any page. Infinite-scroll feeds use this.

## The N+1 problem

```ts
// ❌ 1 query for players + N queries for their XP
const players = await db.query('SELECT id, name FROM players');
for (const p of players.rows) {
  p.xp = await db.query('SELECT skill, xp FROM skill_xp WHERE player_id = $1', [p.id]);
}
```

With 50 players that's 51 round-trips to the database. Use one query with a join (or `WHERE player_id = ANY($1)` with an array of ids). The N+1 problem shows up constantly in code review, and ORMs make it easy to write by accident.

## Check your understanding

1. What's the difference between `JOIN` and `LEFT JOIN`?
2. Why can putting a condition on the right-hand table in `WHERE` break a `LEFT JOIN`?
3. When do you use `HAVING` rather than `WHERE`?
4. `rank()` gave two players rank 2. What rank does the next player get? And with `dense_rank()`?
5. Why might `avg(xp)` arrive in JavaScript as a string, and how do you fix it?
6. You index `(xp, skill)`. Does it help `WHERE skill = 'fishing' ORDER BY xp DESC`? Why or why not?
7. What is the N+1 problem?

<details><summary>Answers</summary>

1. `JOIN` (inner) returns only rows with a match on both sides. `LEFT JOIN` returns every left row, with `NULL`s where there's no match.
2. `WHERE` runs after the join. Rows without a match have `NULL` in the right-hand columns, so a condition like `s.skill = 'fishing'` is never true for them and they're removed. Put the condition in the `ON` instead.
3. When filtering on an aggregate result (e.g. `sum(…) >= 200`). `WHERE` runs before grouping and can't see aggregates.
4. Rank 4 with `rank()`, rank 3 with `dense_rank()`.
5. `avg` returns `numeric`, which drivers return as a string to avoid losing precision. Cast in SQL: `round(avg(xp))::integer`.
6. Not well. The index is sorted by `xp` first, so all the `fishing` rows aren't together. `(skill, xp DESC)` puts the equality column first.
7. Running one query to get a list, then one more query per item in the list, instead of a single query (a join or `= ANY($1)`). It multiplies round-trips.
</details>

## Further reading
- PostgreSQL docs: "Tutorial › Joins Between Tables", "Aggregate Functions", "Window Functions"
- "Use The Index, Luke" (use-the-index-luke.com), the best free resource on indexes
- explain.dalibo.com: paste `EXPLAIN` output to visualise it

---
[← SQL fundamentals](02-sql-fundamentals.md) · [Module overview](README.md) · [Next: Constraints, transactions & concurrency →](04-constraints-transactions-and-concurrency.md)
