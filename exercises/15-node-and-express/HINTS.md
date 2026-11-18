# Hints · Module 15

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 15-01 · raw-http-server

<details><summary>Level 1 · Nudge</summary>

Lesson 15.2 builds almost exactly this server. Start with only `/health`, get its test green, then add routes one by one. A raw server is just one big function: `(req, res) => { … }`.
</details>

<details><summary>Level 2 · Direction</summary>

1. Parse the URL once: `new URL(req.url ?? '/', 'http://localhost')` gives you `pathname` and `searchParams`.
2. Write a tiny `send(res, status, body, headers?)` helper that sets `Content-Type: application/json; charset=utf-8` and calls `res.end(JSON.stringify(body))`. Every response goes through it.
3. Route on `pathname` first, then on `req.method`. A path that exists with a wrong method returns 405 plus `Allow`. A path that doesn't exist returns 404.
4. Reading a body: lesson 15.2's `readJson` (`for await (const chunk of req)`, adding up `chunk.length`) is the pattern. Throw a dedicated error class when the total passes 10,000 bytes, so the caller can tell "too large" (413) apart from "invalid JSON" (400).
5. Wrap the whole handler in `try/catch` so a throw becomes a 500 rather than a hung request.
</details>

<details><summary>Level 3 · Walkthrough</summary>

The two mistakes that cost people the most time:

- **One `catch` for everything.** If `readJson` throws for both "too big" and "bad JSON", a single bare `catch` sends 400 for both. Check `error instanceof YourTooLargeError` first, which is why a custom error class is worth the three lines it takes.
- **`/api/items/:id` matching.** There's no router, so split the pathname: `pathname.split('/')` on `/api/items/3` gives `['', 'api', 'items', '3']`. Check the length and the first parts, then `Number(parts[3])`. Think about what `Number('abc')` returns and what should happen then.

If your handler is `async`, an error thrown inside it becomes a **rejected promise**, not an exception `createServer` can see. Your top-level `try/catch` must be *inside* the async function, around an `await`.

The `Location` header on a 201 is the URL of the new resource: `/api/items/<id>`.
</details>

---

## 15-02 · express-routes

<details><summary>Level 1 · Nudge</summary>

Lessons 15.3 ("Routers", "Async handlers") and 15.6 ("Dependency injection, the simple way"). The repository is already written: your job is the HTTP layer around it.
</details>

<details><summary>Level 2 · Direction</summary>

1. Inside `createApp`, create the app, add `express.json()`, then create a `Router()` and mount it at `/api/players`.
2. Write a `toJson(player)` function that turns `createdAt` into an ISO string, and use it in every response.
3. Write one `validateName(raw)` function used by both POST and PATCH. It returns the trimmed name or `undefined`.
4. Uniqueness is case-insensitive: compare `a.toLowerCase() === b.toLowerCase()`. For PATCH, skip the player being renamed.
5. Add a catch-all 404 **after** the router (`app.use((req, res) => …)`).
</details>

<details><summary>Level 3 · Walkthrough</summary>

For `?limit`: `Number(req.query.limit)` can be `NaN`, `0`, negative, a decimal or huge. Decide: "if it's a positive integer, use `Math.min(it, 100)`; otherwise use 20." `Number.isInteger` does most of the work.

For `?sort`: copy the array before sorting (`[...items].sort(…)`). Sorting by name uses `a.name.localeCompare(b.name)`, and sorting by date uses `a.createdAt.getTime() - b.createdAt.getTime()`.

For `:id`: `Number(req.params.id)`. If the repo returns `undefined` (including for `NaN`), respond 404.

DELETE returns `res.status(204).end()`: no JSON, no body.
</details>

---

## 15-03 · validation-middleware

<details><summary>Level 1 · Nudge</summary>

Lesson 15.5, section "A validation middleware". The middleware is a function that **returns** a function (a closure over `schemas`), which is the same "factory" idea as 01.2.
</details>

<details><summary>Level 2 · Direction</summary>

1. Start an empty `details` array.
2. For each of `body`, `query` and `params`: if there is a schema, `safeParse` the matching part of `req`. On failure, push one detail per issue. On success, remember the parsed data.
3. After checking **all three**, if `details` isn't empty, send the 400 and `return` without calling `next()`.
4. Otherwise store each parsed value where the spec says and call `next()`.

The path for each detail is the location followed by the issue's path: `issue.path` is an array like `['skills', 'fishing', 'xp']`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- `issue.path` can contain numbers (array indexes) and, in Zod 4's types, symbols. `issue.path.map(String)` makes them all strings before you `join('.')`.
- Why not write `req.query = parsed`? In Express 5, `req.query` is a **getter** with no setter. Assigning to it throws in strict mode (or silently does nothing). That's why the parsed query goes into `res.locals`, which exists for passing data between middleware.
- Why replace `req.body` at all? The parsed data is *better* than the raw data: it's trimmed, coerced and has defaults filled in. Handlers then trust `req.body`.
- If the success test gets `{ playerName: '  Ava  ', … }`, you're storing the raw value, not `result.data`.
</details>

---

## 15-04 · error-handling

<details><summary>Level 1 · Nudge</summary>

Lesson 15.5, sections "Expected failures: `HttpError`" and "The central error handler". Express recognises an error handler **only** by its four parameters, so keep `_next` even though you never call it.
</details>

<details><summary>Level 2 · Direction</summary>

1. `HttpError`: declare three `readonly` fields, assign them in the constructor after `super(message)`, and set `this.name`.
2. `notFound` doesn't call `next()`. It responds with a 404 itself. `req.method` and `req.path` give you the message.
3. `errorHandler` is a chain of checks, most specific first: `instanceof HttpError`, then `instanceof z.ZodError`, then the body-parser `type` checks, and finally the "unknown" fallback.
4. Each branch sends a response and `return`s.
5. Only the final fallback calls `logger.error`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- `err` is `unknown`, so TypeScript won't let you read `err.type` directly. Narrow it first: `typeof err === 'object' && err !== null && 'type' in err`. After that, `err.type` is `unknown`, so check `typeof err.type === 'string'` too.
- "`details` only if defined": build the error object, then add `details` with an `if`. (`JSON.stringify` would drop a `details: undefined` anyway, but an API that only includes fields it means to send is easier to document and to test.)
- For the stack, spread a conditional object: `...(condition ? { stack } : {})`. Check that `err instanceof Error` before reading `.stack`.
- The test checks that the **log** contains "hunter2" but the **response** doesn't. That's the whole point: full detail for you, nothing for an attacker.
</details>
