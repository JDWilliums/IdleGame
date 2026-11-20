# 16.4 · Constraints, transactions & concurrency

> ⏱ 3 hours · Module 16 · Databases & SQL

## What you'll learn
- Constraints as your last line of defence: `CHECK`, `UNIQUE`, foreign keys and `ON DELETE`
- Turning constraint errors into HTTP responses
- Transactions and the ACID guarantees
- Using transactions from Node (PGlite and `pg`)
- Race conditions: lost updates, atomic updates, row locks, and **optimistic concurrency**, which is how cloud saves will work

---

## Constraints

Your Zod schemas validate input at the edge. **Constraints** validate every write inside the database, whichever code path made it: a route, a script, a migration, a colleague in `psql` at 2 a.m. They're the last line of defence for data integrity.

```sql
CREATE TABLE players (
  id    serial  PRIMARY KEY,
  name  text    NOT NULL UNIQUE CHECK (length(name) BETWEEN 3 AND 20),
  gold  integer NOT NULL DEFAULT 0 CHECK (gold >= 0)
);

CREATE TABLE saves (
  player_id  integer PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  data       jsonb   NOT NULL,
  revision   integer NOT NULL CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

- `CHECK (gold >= 0)` means no bug anywhere can ever leave a player with negative gold. The statement fails instead.
- `REFERENCES players(id)` is a foreign key.

### ON DELETE: what happens to children?
When a player is deleted, what about their save?

| Action | Effect | Use when |
|---|---|---|
| `NO ACTION` / `RESTRICT` (default) | the delete **fails** while children exist | children must be dealt with explicitly (orders, payments) |
| `CASCADE` | children are deleted too | children make no sense without the parent (saves, sessions) |
| `SET NULL` | the child's column becomes `NULL` | the child stands alone (a forum post by a deleted user) |

### Constraint errors → HTTP
When a constraint fails, Postgres raises an error with a five-character **SQLSTATE code**. The ones you'll meet:

| Code | Name | Typical HTTP response |
|---|---|---|
| `23505` | `unique_violation` | 409 Conflict ("That name is taken") |
| `23503` | `foreign_key_violation` | 400 or 404 (referenced row doesn't exist) |
| `23514` | `check_violation` | 400 (or a domain error, e.g. "not enough gold") |
| `23502` | `not_null_violation` | 400, but usually means a bug in your code |

The error object has `code`, and usually `constraint` (the constraint's name) too:

```ts
try {
  await db.query('INSERT INTO players (name) VALUES ($1)', [name]);
} catch (err) {
  if (isPgError(err) && err.code === '23505') throw new HttpError(409, 'NAME_TAKEN', 'That name is taken');
  throw err; // anything else is unexpected: let the error handler log it (15.5)
}

function isPgError(err: unknown): err is { code: string; constraint?: string } {
  return typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string';
}
```

Why rely on the constraint instead of checking first with a `SELECT`? Because **check-then-act is a race**. Two sign-ups for "Ava" can both run the `SELECT`, both see no "Ava", and both insert. Only the `UNIQUE` constraint truly prevents duplicates. (Checking first for a nicer error message is fine, as long as the constraint is still there.)

## Transactions

Moving 100 gold from Ava to Bram is two statements:

```sql
UPDATE players SET gold = gold - 100 WHERE id = 1;
UPDATE players SET gold = gold + 100 WHERE id = 2;
```

If the server crashes, or the second statement fails, between the two, 100 gold has vanished. A **transaction** groups statements so they succeed or fail **as one**:

```sql
BEGIN;
UPDATE players SET gold = gold - 100 WHERE id = 1;
UPDATE players SET gold = gold + 100 WHERE id = 2;
COMMIT;      -- or ROLLBACK; to undo everything since BEGIN
```

If any statement fails, the transaction is aborted and nothing since `BEGIN` takes effect.

### ACID
Transactions provide four guarantees, which you'll be asked about in interviews:

- **Atomicity**: all of it happens, or none of it.
- **Consistency**: constraints hold before and after. A transaction can't commit a state that breaks a `CHECK` or foreign key.
- **Isolation**: concurrent transactions don't see each other's half-finished work.
- **Durability**: once `COMMIT` returns, the data survives a crash or power cut.

### Transactions from Node

**PGlite** has a helper that commits when your function resolves and rolls back when it throws:

```ts
await db.transaction(async (tx) => {
  await tx.query('UPDATE players SET gold = gold - $1 WHERE id = $2', [amount, fromId]);
  await tx.query('UPDATE players SET gold = gold + $1 WHERE id = $2', [amount, toId]);
}); // throws (after rolling back) if anything inside threw
```

Inside the callback, use **`tx`**, not `db`. The transaction is bound to `tx`, and statements sent through `db` run outside it. (PGlite queues them until the transaction finishes, so using `db` inside the callback simply deadlocks.)

**node-postgres (`pg`)**, which you'll use against a real server, has a pool of connections. A transaction lives on **one** connection, so check one out and use only that:

```ts
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE …', […]);
  await client.query('UPDATE …', […]);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release(); // ALWAYS give the connection back, or the pool runs dry
}
```

Calling `pool.query('BEGIN')` and then `pool.query('UPDATE …')` is a classic bug: each call can use a **different** connection, so the "transaction" protects nothing. Most teams wrap this in a `withTransaction(pool, fn)` helper, and Drizzle has one built in (16.6).

### Business rules inside a transaction
A "not enough gold" check can come from the `CHECK` constraint, or you can test explicitly and throw:

```ts
await db.transaction(async (tx) => {
  const res = await tx.query('UPDATE players SET gold = gold - $1 WHERE id = $2 AND gold >= $1', [amount, fromId]);
  if (res.affectedRows === 0) throw new InsufficientFundsError();    // rolls back
  const res2 = await tx.query('UPDATE players SET gold = gold + $1 WHERE id = $2', [amount, toId]);
  if (res2.affectedRows === 0) throw new PlayerNotFoundError(toId);   // rolls back the first update too
});
```

Throwing a **domain error** from inside the transaction both undoes the work and tells the caller exactly what went wrong, which the route can map to a status code.

## Concurrency: the lost update

Ava plays on her phone and her laptop. Both devices load her save (revision 7). Each plays for a while, then each uploads:

```
time ──────────────────────────────────────────────────────►
phone:   read rev 7 ··· play ··· PUT save (fishing 40) ✔
laptop:  read rev 7 ······ play ······ PUT save (fishing 12, woodcutting 30) ✔   ← phone's progress is GONE
```

Both writes succeed, and the second silently overwrites the first. This is a **lost update**, and it's the central problem of cloud saves. Three tools solve different versions of it.

### 1. Atomic updates
When the change can be expressed relative to the current value, let the database do it in one statement:

```sql
UPDATE players SET gold = gold + 25 WHERE id = 1;          -- ✅ never loses an update
```

versus reading `gold` into JavaScript, adding 25 and writing it back, which races. Atomic updates work for counters, not for "replace this whole document".

### 2. Pessimistic locking: SELECT … FOR UPDATE
Inside a transaction, `SELECT … FOR UPDATE` locks the rows it reads. Other transactions trying to lock or change them **wait** until you commit.

```sql
BEGIN;
SELECT gold FROM players WHERE id = 1 FOR UPDATE;   -- others wait here
-- … decide in application code …
UPDATE players SET gold = $1 WHERE id = 1;
COMMIT;
```

That's good for short, server-side read-modify-write steps. It's useless for the save problem, because you can't hold a lock while a player plays for an hour on their phone.

### 3. Optimistic concurrency: a revision number
Don't lock. Instead, give each row a `revision` that goes up on every write, and make every write say **which revision it's based on**:

```sql
UPDATE saves
SET data = $1, revision = revision + 1, updated_at = now()
WHERE player_id = $2 AND revision = $3        -- $3 = the revision the client last saw
RETURNING revision;
```

- If nobody else wrote in between, the `WHERE` matches, one row updates, and you return the new revision.
- If someone else did, the stored revision is higher, **zero rows** match, and you know there's a **conflict**. Nothing was overwritten.

```
phone:   read rev 7 ··· PUT (base 7) → ✔ now rev 8
laptop:  read rev 7 ········· PUT (base 7) → ✖ conflict (current is 8)
                                   → the laptop must pull, merge or ask the player (Module 18)
```

The check and the write happen in **one statement**, so two requests can't both pass the check. That's the key difference from "`SELECT` the revision in JavaScript, compare, then `UPDATE`", which races.

Optimistic concurrency is used by HTTP (`ETag` / `If-Match`), Git (push rejected: "fetch first"), Google Docs and almost every sync system. You'll build the full sync flow on it in Module 18.

### Isolation levels (briefly)
Postgres's default isolation level is **Read Committed**: each statement sees data committed before **that statement** started. It's fine for most apps when combined with atomic updates, constraints and the patterns above. `SERIALIZABLE` makes transactions behave as if they ran one at a time, but the database may abort one with error `40001`, and your code must **retry** it. Reach for it when the simpler tools don't fit.

## Check your understanding

1. Why keep a `UNIQUE` constraint even if your code checks for duplicates first?
2. Which `ON DELETE` action fits sessions when a user is deleted? Which fits a player's purchase history?
3. What does each letter of ACID guarantee?
4. What's wrong with calling `pool.query('BEGIN')` and then `pool.query('UPDATE …')` with `pg`?
5. Describe a lost update in your own words.
6. Why does `UPDATE … WHERE revision = $3` prevent lost updates while "select, compare in JS, update" doesn't?

<details><summary>Answers</summary>

1. Check-then-insert is a race: two requests can both pass the check and both insert. Only the constraint is enforced atomically by the database.
2. Sessions: `ON DELETE CASCADE` (meaningless without the user). Purchase history: usually `RESTRICT` (keep financial records and handle deletion explicitly) or `SET NULL` if the records must survive anonymised.
3. Atomicity (all or nothing), Consistency (constraints always hold), Isolation (no seeing others' half-done work), Durability (committed data survives crashes).
4. Each `pool.query` may run on a different connection, so the `UPDATE` may not be inside the transaction at all. Check out one client with `pool.connect()` and use it for every statement, then release it.
5. Two writers read the same version, each changes it, and the second write overwrites the first one's changes without anyone noticing.
6. The compare and the write are one atomic statement. In the JS version, another write can happen between your `SELECT` and your `UPDATE`.
</details>

## Further reading
- PostgreSQL docs: "Constraints" (ddl-constraints), "Transactions" (tutorial-transactions), "Transaction Isolation" (transaction-iso)
- PostgreSQL docs: "Appendix A. PostgreSQL Error Codes"
- Martin Kleppmann, *Designing Data-Intensive Applications*, chapter 7 (Transactions): the book to read once you're working

---
[← Joins, aggregates & indexes](03-joins-aggregates-and-indexes.md) · [Module overview](README.md) · [Next: Postgres in practice →](05-postgres-in-practice.md)
