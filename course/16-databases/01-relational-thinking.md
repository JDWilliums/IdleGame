# 16.1 · Relational thinking

> ⏱ 2.5 hours · Module 16 · Databases & SQL

## What you'll learn
- Why apps use a database rather than files
- Tables, rows, columns and types
- Primary keys, foreign keys and the three kinds of relationship
- Normalisation in plain English, and when to break the rules
- How to model the game's data, including the big decision: a save "blob" versus normalised tables

---

## Why not just a JSON file?

You could store every player's save in a `saves.json` file on the server. It breaks down quickly:

| Problem | What goes wrong with a file | What a database gives you |
|---|---|---|
| **Concurrency** | Two requests write at once and one overwrites the other | Transactions and locking |
| **Durability** | The server crashes mid-write and the file is half-written | A write-ahead log: a committed write survives crashes |
| **Querying** | "Top 10 fishers" means loading every save into memory | Indexes and SQL: the database does the work |
| **Integrity** | Nothing stops a save pointing at a user who doesn't exist | Constraints the database enforces on every write |
| **Scale** | One file on one disk | Replicas, backups, point-in-time recovery |

A **relational database** (PostgreSQL, MySQL, SQLite, SQL Server) stores data in **tables** and lets you query it with **SQL**. PostgreSQL ("Postgres") is the default choice for new web projects: it's free, extremely reliable, and has excellent JSON support. It's what this course uses.

> Other kinds of database exist: document stores (MongoDB), key-value stores (Redis), wide-column stores and so on. They're good tools for specific jobs. A relational database is the right default for almost every app, and SQL is a skill employers expect from full-stack developers.

## Tables, rows and columns

A **table** is a set of **rows** that all have the same **columns**. Each column has a **type**.

```
players
┌────┬──────────┬───────────────────────────┐
│ id │ name     │ created_at                │
├────┼──────────┼───────────────────────────┤
│  1 │ Ava      │ 2026-03-01 10:00:00+00    │
│  2 │ Bram     │ 2026-03-02 09:30:00+00    │
└────┴──────────┴───────────────────────────┘
```

Unlike a JavaScript array, a table has **no inherent order**. If you want rows in an order you must ask for it (`ORDER BY`). Rows are also not objects you mutate in place: you send the database a statement ("set the name of player 2 to Bryn") and it changes the stored data.

Common Postgres types you'll use:

| Type | For | JS value |
|---|---|---|
| `integer` / `bigint` | counts, ids, gold, XP | `number` (see 16.5 for `bigint`) |
| `text` | names, ids like `'oak_log'` | `string` |
| `boolean` | flags | `boolean` |
| `timestamptz` | points in time (always use the `tz` version) | `Date` |
| `jsonb` | structured documents, like a save | object / array |
| `numeric` | exact decimals (money) | `string` (to avoid float rounding) |

## Keys

### Primary key
Every table should have a **primary key**: a column (or set of columns) that uniquely identifies a row and never changes. Usually it's a generated number (`id`) or a random UUID. That's a **surrogate key**: it has no meaning outside the database.

A **natural key** is something from the real world, such as an email address. Natural keys are tempting but they change (people change emails), so use a surrogate primary key and put a `UNIQUE` constraint on the natural one.

### Foreign key
A **foreign key** is a column that refers to the primary key of another table. The database guarantees it points at a row that exists.

```
players                       inventory
┌────┬──────┐                 ┌───────────┬───────────┬─────┐
│ id │ name │ ◄───────────────│ player_id │ item_id   │ qty │
├────┼──────┤                 ├───────────┼───────────┼─────┤
│  1 │ Ava  │                 │         1 │ oak_log   │  40 │
│  2 │ Bram │                 │         1 │ raw_trout │  12 │
└────┴──────┘                 │         2 │ oak_log   │   3 │
                              └───────────┴───────────┴─────┘
```

Try to insert `player_id = 99` and Postgres rejects it. That's **referential integrity**.

## Relationships

| Kind | Example | How to store it |
|---|---|---|
| **One-to-one** | a user has one save | a foreign key with `UNIQUE` (or share the primary key) |
| **One-to-many** | a player has many inventory rows | a foreign key on the "many" side (`inventory.player_id`) |
| **Many-to-many** | players belong to many guilds; guilds have many players | a **join table** `guild_members(guild_id, player_id)` with a primary key on both columns |

A common beginner mistake is storing a list inside one column: `guild_ids = '3,7,12'`. You can't index it, join on it or enforce that the guilds exist. If you need to ask questions about the parts, give them their own rows.

## Normalisation, in plain English

Normalisation is a set of rules for removing duplicated data. The formal "normal forms" (1NF, 2NF, 3NF…) boil down to three ideas:

1. **One value per cell.** No lists or comma-separated strings in a column (1NF).
2. **Every fact lives in exactly one place.** If an item's sell price is stored on every inventory row, changing the price means updating thousands of rows and one day they'll disagree. Put the price on an `items` table and reference it (2NF/3NF).
3. **Columns describe the key, the whole key, and nothing but the key.** `inventory(player_id, item_id, qty, player_name)` is wrong because `player_name` describes the player, not the (player, item) pair.

```
❌ inventory(player_id, player_name, item_id, item_name, sell_price, qty)

✅ players(id, name)
   items(id, name, sell_price)
   inventory(player_id → players.id, item_id → items.id, qty)
```

### When to break the rules
Normalised data is easy to keep correct. **Denormalised** data (duplicated on purpose) can be faster to read. Real systems mix both. You denormalise deliberately, for a measured reason, such as a cached `total_level` column on `players` so the leaderboard doesn't have to add up every skill on every request. Then you make sure only one piece of code updates it.

## Modelling the game

What does Hearthwild's server actually need to store?

- **Accounts**: users, their password hashes, sessions (Module 17).
- **Saves**: each user's game state, so it follows them across devices (Module 18).
- **Leaderboards**: XP per skill per player, sortable.

The interesting decision is **how to store the save**.

### Option A: fully normalised
Tables for `skills`, `inventory`, `equipment`, `quests`… Every change in the game becomes many SQL writes.

- ✅ You can query anything ("how many players own a gold ring?").
- ❌ Every new game feature needs a migration and server changes.
- ❌ The engine (Module 13) already has a complete, versioned `GameState` object. You'd be taking it apart and rebuilding it on every save.

### Option B: a document column
One `saves` row per user with the whole `GameState` in a `jsonb` column, plus a `revision` number and `updated_at`.

- ✅ The server doesn't need to understand the game. New features need no migration, because the save format is versioned by the client's migrations (13.10).
- ✅ One row read and one row write per sync.
- ❌ Querying inside the blob is possible in Postgres but slower and clumsier.

### What we'll do: B, plus extracted columns
Store the save as `jsonb`, and **also** copy out the few values the server needs to query, such as total level and XP per skill, into proper columns or a `skill_xp` table that the leaderboard reads. The server validates the save (Zod) before storing it and updates the extracted values in the **same transaction** (16.4) so they never disagree.

```
users(id, username UNIQUE, password_hash, created_at)
sessions(id_hash PK, user_id → users.id, expires_at)
saves(user_id PK → users.id, data jsonb, revision, updated_at)
skill_xp(user_id → users.id, skill, xp, PRIMARY KEY (user_id, skill))
```

That's a pattern you'll see at work: a document for the flexible part, relational tables for the parts you query.

## Drawing it

Before writing SQL for a feature, sketch the tables and arrows on paper or in a tool like dbdiagram.io. For each arrow, ask: "one or many on each end?" and "what happens to this row when the other one is deleted?" (16.4 covers the second question).

## Check your understanding

1. Why should a table usually have a surrogate primary key even when there's a natural unique value like a username?
2. How do you store a many-to-many relationship?
3. What's wrong with `players(id, name, item_ids text)` where `item_ids` is `'oak_log,raw_trout'`?
4. What is denormalisation, and what's the risk?
5. Why is storing the save as a `jsonb` document a good fit for an idle game whose rules run on the client?

<details><summary>Answers</summary>

1. Natural values change (usernames can be renamed, emails change). Other tables reference the primary key, so it must never change. Keep the natural value unique with a `UNIQUE` constraint instead.
2. With a join table holding a foreign key to each side, with a primary key over both columns, e.g. `guild_members(guild_id, player_id)`.
3. It breaks "one value per cell". You can't index it, join on it, enforce that the items exist, or update one item without string manipulation. Use an `inventory` table with one row per item.
4. Deliberately duplicating data to make reads faster. The risk is the copies disagreeing, so exactly one piece of code must update them, ideally in the same transaction as the source data.
5. The game state is already a single versioned object owned by the client's engine. Storing it whole means one read and one write per sync and no server changes for new features. Values the server must query (leaderboards) are copied into columns.
</details>

## Further reading
- PostgreSQL docs: "Tutorial › The SQL Language › Concepts" (postgresql.org/docs/current/tutorial-concepts.html)
- "Use The Index, Luke" (use-the-index-luke.com), for later in this module

---
[← Module overview](README.md) · [Next: SQL fundamentals →](02-sql-fundamentals.md)
