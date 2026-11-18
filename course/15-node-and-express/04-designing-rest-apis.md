# 15.4 · Designing REST APIs

> ⏱ 2 hours · Module 15 · Node.js & Express

## What you'll learn
- Resources and URLs
- Mapping operations to methods and status codes
- Consistent response and error shapes
- Pagination, filtering and sorting
- Versioning and idempotency
- The API you'll build for your game

---

## REST in one paragraph

**REST** (Representational State Transfer) organises an API around **resources** (nouns: players, saves, leaderboard entries) identified by **URLs**, manipulated with **HTTP methods** (verbs), using **status codes** for outcomes. It's not a strict standard but a widely shared set of conventions. Following them means any developer can guess how your API works.

## URLs: nouns, not verbs

```
✅ GET    /api/players             list players
✅ POST   /api/players             create a player
✅ GET    /api/players/42          get one
✅ PATCH  /api/players/42          partially update
✅ DELETE /api/players/42          delete
✅ GET    /api/players/42/saves    a sub-resource: player 42's saves

❌ GET  /api/getPlayers
❌ POST /api/deletePlayer?id=42
❌ GET  /api/players/42/delete     (GETs must never change data, lesson 03.2)
```

Conventions: lowercase, plural nouns, kebab-case for multi-word names (`/api/leaderboard-entries`), and ids in the path.

**"Me" resources**: for the logged-in user's own data, `GET /api/me` and `PUT /api/save` (the current user's save) are clearer, and safer, than passing your own id. The server knows who you are from the session.

**Actions that aren't CRUD**: sometimes an operation really is an action. Model it as a sub-resource with `POST`:

```
POST /api/auth/login
POST /api/auth/logout
POST /api/saves/123/restore      (restore a backup)
```

## Methods and status codes

| Operation | Method | Success | Common errors |
|---|---|---|---|
| list | `GET /things` | 200 + array (or a page object) | 400 bad query |
| read | `GET /things/:id` | 200 | 404 |
| create | `POST /things` | **201** + created body + `Location` header | 400 validation, 409 duplicate |
| replace | `PUT /things/:id` | 200 (or 204) | 400, 404, 409 conflict, 412 |
| partial update | `PATCH /things/:id` | 200 + updated body | 400, 404 |
| delete | `DELETE /things/:id` | **204** (no body) | 404 (or 204 if already gone, which is idempotent) |
| not logged in | any | | **401** |
| logged in but not allowed | any | | **403** (or 404 to hide existence) |
| too many requests | any | | **429** + `Retry-After` |

Revisit lesson 03.2 for idempotency. `PUT` and `DELETE` must be safe to repeat, which is why the game's cloud save uses `PUT`.

## Consistent shapes

Pick one shape for successes and one for errors, and use them **everywhere**. Clients (your React app) can then handle them generically.

### Success
Return the resource directly for single items:

```json
{ "id": 42, "name": "Ava", "createdAt": "2026-11-18T10:00:00.000Z" }
```

For lists, wrap them so you can add pagination metadata later without breaking clients:

```json
{ "items": [ … ], "page": 2, "pageSize": 20, "total": 312 }
```

### Errors
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [{ "path": "name", "message": "Must be 3–20 characters" }]
  }
}
```

- `code`: a stable, machine-readable string the frontend can `switch` on (`SAVE_CONFLICT` → show the conflict dialog).
- `message`: human readable. It might be shown to users, so never include stack traces or SQL.
- `details`: optional extra structure (field errors, the current revision on a conflict).

(There's also a standard for this, **RFC 9457 "Problem Details"**, with `type`, `title`, `status` and `detail`. Many APIs use it. Either is fine, as long as you're consistent.)

### Dates and ids
- Dates: **ISO 8601 strings in UTC** (`2026-11-18T10:00:00.000Z`), or epoch milliseconds. Be consistent. The game save uses epoch ms internally, which is fine.
- Ids: if they're sequential numbers, consider exposing opaque ids (UUIDs) so people can't enumerate your users (`/api/players/1`, `/2`, `/3`…).

## Pagination, filtering, sorting

```
GET /api/leaderboard?skill=fishing&page=2&pageSize=20
GET /api/players?search=ava&sort=-createdAt
```

- **Offset pagination** (`page`/`pageSize` → `LIMIT`/`OFFSET`) is simple and fine for most cases.
- **Cursor pagination** (`?after=<lastSeenId>`) stays consistent when items are added while paging. Use it for feeds and infinite scroll.
- **Always cap `pageSize`** (03-01 clamped it to 100). Otherwise `?pageSize=1000000` is a denial of service.
- Validate every query parameter (15.5).

## Versioning

APIs evolve, and old clients (cached PWAs!) keep calling the old shapes. Options:
- **A URL prefix**: `/api/v1/…`, `/api/v2/…`. The simplest and most common.
- **Additive changes only**: add fields, never rename or remove them. Old clients ignore new fields.

For your game, the frontend and API are deployed together, so additive changes plus the **save version** (13.10) usually suffice. Still, a PWA might run an old cached frontend for a while (21.1), so be careful about removing fields.

## The game's API (what you'll build)

| Method & path | Purpose | Module |
|---|---|---|
| `POST /api/auth/register` | create an account | 17 |
| `POST /api/auth/login` | log in (sets the session cookie) | 17 |
| `POST /api/auth/logout` | log out | 17 |
| `GET /api/me` | the current user | 17 |
| `GET /api/save` | fetch my cloud save + revision | 18 |
| `PUT /api/save` | upload my save (with `baseRevision`) | 18 |
| `GET /api/leaderboard?skill=` | top players for a skill | 16, C10 |
| `GET /health` | liveness check for the host | 20 |

## Check your understanding

1. Design the URL and method to "add an item to player 7's favourites".
2. Why return list responses as `{ items, … }` instead of a bare array?
3. What's the difference between the `code` and `message` fields in an error?
4. Why cap `pageSize`?

<details><summary>Answers</summary>

1. `POST /api/players/7/favourites` with a body like `{ "itemId": "bronze_bar" }`. (Or `PUT /api/players/7/favourites/bronze_bar` for an idempotent "make it a favourite".)
2. You can add metadata (pagination, totals) later without breaking clients that expect the top level to be an object.
3. `code` is a stable identifier for programs to branch on, and `message` is a human-readable explanation that may change wording over time.
4. Otherwise a client can request enormous pages, overloading the database, memory and network. That's a cheap denial of service.
</details>

## Further reading
- Microsoft: [RESTful web API design](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design) (a thorough, practical guide)
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- Zalando's RESTful API Guidelines (a well-known public style guide)

**Practice:** exercise `15-02` express-routes → `npm run watch 15-02`

---
[← Express fundamentals](03-express-fundamentals.md) · [Module overview](README.md) · [Next: Validation & error handling →](05-validation-and-error-handling.md)
