# Hints · Module 16

Open **one level at a time**. Give each level a real attempt before opening the next.

**A tip for all four exercises:** write each query in a playground file first (16.2, "A database in your playground"). Paste the exercise's `SCHEMA` and `SEED`, run your SQL, and look at the rows. Once the rows are right, move the query into the function.

---

## 16-01 · sql-basics

<details><summary>Level 1 · Nudge</summary>

Everything you need is in lesson 16.2: `INSERT … RETURNING`, `affectedRows`, `ON CONFLICT … DO UPDATE` and the section "Rows into typed objects". Start with `createPlayer` and `getPlayer`, since half the tests depend on them.
</details>

<details><summary>Level 2 · Direction</summary>

1. Write a `PlayerRow` type (snake_case, as the database returns it) and a `toPlayer(row)` function. Every player function uses it.
2. Results always come back as `{ rows }`. "Not found" is `rows[0] === undefined`.
3. `renamePlayer` and `deletePlayer` don't need `RETURNING`. Use the result's `affectedRows`.
4. Case-insensitive matching: apply `lower()` to **both** sides of the comparison.
5. `addItem` is one upsert with `RETURNING qty`. The conflict target is the table's primary key.
6. `getInventory`: `ORDER BY item_id` in SQL, then `Object.fromEntries` in JavaScript.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- Why does the `deletePlayer` test pass without you deleting inventory rows? Read `SCHEMA`: `ON DELETE CASCADE` (16.4). The database does it.
- `affectedRows` is typed as optional (`number | undefined`), so compare with `(result.affectedRows ?? 0) > 0`.
- If `listPlayers` fails only on the `TieB`/`TieA` order, your `ORDER BY` has no tie-breaker. Those two rows have the same `created_at`, so add `id`.
- If the injection tests fail, find the `${…}` inside a SQL string and replace it with `$1`/`$2` plus a params array. That's the only fix.
- In the upsert, `inventory.qty` is the existing row and `EXCLUDED.qty` is the row you tried to insert.
</details>

---

## 16-02 · joins-and-aggregates

<details><summary>Level 1 · Nudge</summary>

Lesson 16.3 has a near-identical example for every task: the ranking table (`rank()`), the anti-join, `GROUP BY` with casts, `HAVING`, `coalesce` and a CTE. Work out each expected answer from `SEED` by hand first, so you know what you're aiming for.
</details>

<details><summary>Level 2 · Direction</summary>

1. **leaderboard**: join `skill_xp` to `players`, filter by skill, add `rank() OVER (ORDER BY xp DESC)`, order by rank then name, then `LIMIT`.
2. **playersWithoutSkill**: start from `players` and keep those where `NOT EXISTS` a matching `skill_xp` row (or use a `LEFT JOIN … IS NULL`, with the skill condition in the `ON`).
3. **skillStats**: one `GROUP BY skill`. Alias the columns so they match the TypeScript keys.
4. **inventoryValue**: join `inventory` to `items`, sum `qty * sell_price`, and handle "no rows".
5. **wealthiestPlayers**: like 4, but grouped per player, with `HAVING`.
6. **rankOf**: rank **every** player in the skill inside a `WITH`, then pick one row outside it. `count(*) OVER ()` gives the field size on every row.
7. **LEADERBOARD_INDEX**: equality column first, sort column second.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **Strings instead of numbers?** `count`, `sum` and `rank()` return `bigint`, and `avg` returns `numeric`. Add `::integer` (and `round(…)` for `avg`).
- **Camel-case keys.** Postgres folds unquoted names to lower case, so `AS totalXp` comes back as `totalxp`. Quote the alias, `AS "totalXp"`, or rename the keys in JavaScript.
- **`inventoryValue` returns `null` for Cleo.** `sum` over zero rows is `NULL`, so wrap it with `coalesce(…, 0)`.
- **`rankOf` always says rank 1.** You filtered by `player_id` *before* ranking, so the window only saw one row. That's what the CTE is for: rank first, filter after.
- **The index test fails.** Check the column order: `(skill, xp DESC)`.
</details>

---

## 16-03 · transactions

<details><summary>Level 1 · Nudge</summary>

Lesson 16.4: "Transactions from Node", "Business rules inside a transaction" and "Optimistic concurrency". `db.transaction(async (tx) => …)` commits when your function resolves and rolls back when it throws, so **throwing is how you undo**.
</details>

<details><summary>Level 2 · Direction</summary>

1. Write one helper, e.g. `applyDelta(tx, playerId, delta, reason)`, that does the gold `UPDATE … RETURNING gold` plus the ledger `INSERT`, and throws the right domain error. Both `adjustGold` and `transferGold` can call it inside their transactions.
2. The `UPDATE` should be relative (`gold = gold + $1`) so the database does the arithmetic.
3. "No row came back" means the player doesn't exist.
4. A `CHECK` violation is thrown by `tx.query`. Catch it, look at its `code`, and throw `InsufficientFundsError` instead. Rethrow anything else.
5. `transferGold`: validate first, then one transaction with two `applyDelta` calls.
6. `saveWithRevision`: two different statements depending on whether `baseRevision` is 0. If neither wrote a row, look up the current revision.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **Everything hangs (a test times out)?** You used `db` inside the transaction callback. PGlite runs one transaction at a time, so `db.query` waits for the transaction to end, which waits for `db.query`. Use `tx`.
- **The "rolls back the debit" test fails?** Either the two updates aren't in the same transaction, or you caught the error inside the callback and didn't rethrow it. If the callback resolves normally, the transaction **commits**.
- **`Number.isInteger(amount) && amount > 0`** handles 0, negatives, decimals and `NaN` in one check.
- **First save:** `INSERT … ON CONFLICT (player_id) DO NOTHING RETURNING revision` returns a row only if it inserted. No row means a save already existed, so it's a conflict.
- **Later saves:** `UPDATE … WHERE player_id = $1 AND revision = $3 RETURNING revision`. The revision check is in the `WHERE`, so there's no gap between checking and writing.
- **jsonb parameters:** pass `JSON.stringify(data)`. PGlite accepts the raw object, but `pg` sends a top-level array as a Postgres array (16.5).
</details>

---

## 16-04 · drizzle-repository

<details><summary>Level 1 · Nudge</summary>

Lesson 16.6 covers every builder call you need, and the "Errors" section explains `err.cause`. `put` is the same logic as 16-03's `saveWithRevision`, translated into Drizzle.
</details>

<details><summary>Level 2 · Direction</summary>

1. `createUser`: `db.insert(users).values({ username }).returning()`, inside a `try`. In the `catch`, check the code on `err.cause`.
2. `findUserByUsername`: compare `` sql`lower(${users.username})` `` with the lower-cased input using `eq`.
3. `get`: `select().from(saves).where(eq(…))`, then destructure the first row.
4. `put`, with base 0: `insert(…).values(…).onConflictDoNothing().returning()`.
5. `put` otherwise: `update(…).set({ …, revision: sql\`${saves.revision} + 1\` }).where(and(…, …)).returning()`.
6. `listRecent`: select three named fields `.from(saves).innerJoin(users, …)` and use two `orderBy` arguments.
7. `remove`: `delete(…).where(…).returning(…)` and check the length.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **`UsernameTakenError` never thrown?** `err.code` is `undefined` on Drizzle's error. The Postgres code is on `err.cause.code`. Narrow `unknown` step by step: `err instanceof Error`, then `typeof err.cause === 'object' && err.cause !== null && 'code' in err.cause`.
- **The "rethrows untouched" test fails?** You wrapped the error in a new one. Use `throw err` for anything that isn't a unique violation.
- **The `updatedAt` value is wrong?** Use `deps.now()` on both insert and update, not `defaultNow()` or `new Date()`. The tests control the clock.
- **`returning()` gives an array.** `const [record] = await …` gives `record` the type `SaveRecord | undefined`, which is exactly the "did it write?" question.
- **The ties in `listRecent` come out in the wrong order?** `orderBy(desc(saves.updatedAt), asc(users.username))`.
</details>
