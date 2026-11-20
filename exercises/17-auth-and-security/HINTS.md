# Hints · Module 17

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 17-01 · password-hashing

<details><summary>Level 1 · Nudge</summary>

Lesson 17.2 has the building blocks: "scrypt in Node" (including the `promisify` cast and `maxmem`), "A self-describing format", "Verifying, in constant time" and "Normalising Unicode". Get `hash` passing the format test first, then `verify`, then `needsRehash`.
</details>

<details><summary>Level 2 · Direction</summary>

1. Destructure the options with defaults at the top of `createPasswordHasher`.
2. Write a `parse(stored)` helper that returns the parts, or `undefined` for anything malformed. `verify` and `needsRehash` both use it.
3. `hash`: normalise, make a salt, derive, then `join('$')` the six parts. Buffers have `.toString('base64url')`, and `Buffer.from(text, 'base64url')` goes back.
4. `verify`: parse, derive using the **parsed** salt, parameters and key length, then compare.
5. `checkPasswordPolicy`: normalise, count characters, then run the checks in the order given, returning at the first failure.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **"memory limit exceeded" with the default options?** scrypt needs about `128 × N × r` bytes, and Node's default `maxmem` is 32 MiB. Pass `maxmem: 256 * N * r`.
- **What counts as malformed?** Not exactly six `$`-separated parts, the first part isn't `scrypt`, `N`/`r`/`p` aren't positive integers, or the salt or key isn't base64url. Regular expressions such as `/^[1-9]\d*$/` and `/^[A-Za-z0-9_-]+$/` help.
- **The "N isn't a power of two" case throws?** scrypt itself rejects bad parameters. Wrap the derive call in `try/catch` and return `false`.
- **`timingSafeEqual` throws "Input buffers must have the same byte length"?** Check the lengths first: `a.length === b.length && timingSafeEqual(a, b)`.
- **The emoji test fails?** `'😀'.length` is 2 (UTF-16 code units). `[...string].length` counts code points.
</details>

---

## 17-02 · session-tokens

<details><summary>Level 1 · Nudge</summary>

Lesson 17.3, "Designing the session token", covers all four parts: randomness, hashing at rest, sliding expiry and invalidation. Tasks 1 and 2 are one line each with `node:crypto`.
</details>

<details><summary>Level 2 · Direction</summary>

1. `generateSessionToken`: `randomBytes(32)`, encoded as base64url.
2. `hashSessionToken`: `createHash('sha256').update(token).digest('hex')`.
3. `create`: generate, hash, build the `Session`, `store.insert` it, return the token **and** the session.
4. `validate`: hash the token, look it up, then work out `remaining = expiresAt - now`:
   - `remaining <= 0` means expired, so delete and return `null`.
   - `remaining < renewWithinMs` means renew: a new `expiresAt`, saved with `setExpiry`.
5. `invalidate` deletes by hash. `invalidateAllForUser` passes straight through to the store.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- Work in milliseconds: `date.getTime()` and `new Date(ms)`. Comparing `Date` objects with `<` works, but subtraction is clearer.
- **The renewal test passes but "saved, not just returned" fails?** You updated the object you returned but didn't call `store.setExpiry`. The in-memory store hands out *copies*, like a real database, so changing the copy changes nothing stored.
- **Exactly 15 days left must not renew:** "fewer than" means `<`, not `<=`.
- **Exactly at expiry must be rejected:** `remaining <= 0`.
- `invalidate('')` and unknown tokens: deleting a hash that isn't there is fine. Just don't throw.
</details>

---

## 17-03 · auth-middleware

<details><summary>Level 1 · Nudge</summary>

Lesson 17.5 walks through every route and both middlewares, and 17.4's "Cookies in Express" covers Task 1. Read `provided.ts` before you start: `setCurrentUser`, `getCurrentUser`, `HttpError` and the error handler are there to use.
</details>

<details><summary>Level 2 · Direction</summary>

1. **Cookies**: one `cookieOptions(secure)` object (`httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`) shared by `res.cookie` (plus `maxAge`) and `res.clearCookie`.
2. **Order inside `createApp`**: `express.json()`, `cookieParser()`, `loadSession`, the routers, then `notFound` and `errorHandler` last.
3. **Validation**: one Zod schema for credentials, used by register and login. Let `.parse` throw, and the provided error handler turns it into a 400.
4. **Register**: hash, `users.create` (catch `UsernameTakenError` and throw a 409 `HttpError`), create a session, set the cookie, 201.
5. **Login**: find the user, then `verify` against their hash *or* a dummy hash. If the user is missing or the password wrong, throw the same 401.
6. **Notes**: put `requireAuth` on the whole notes router with `router.use(requireAuth)`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **`me` keeps returning 401 after register in agent tests?** Is `loadSession` registered **before** the routers? Does it `await` the session lookup before calling `next()`?
- **The dummy hash:** make it once, the first time it's needed, e.g. `dummy ??= passwords.hash(randomString)`, and `await` it in the login route. Creating it per request would also work, but costs a hash every time.
- **"clears a junk cookie" fails?** When the cookie is present but `sessions.validate` returns `null` (or the user no longer exists), call `clearSessionCookie`.
- **Max-Age is wrong?** Express's `maxAge` option is in **milliseconds**. It writes `Max-Age` in seconds for you.
- **Someone else's note returns 403 or deletes it?** Look the note up, then check `note.userId` against the current user. Treat "missing" and "not yours" the same way, as 404.
- **`Number('abc')` is `NaN`,** and the repo won't find a note with id `NaN`, so that case already becomes a 404.
</details>

---

## 17-04 · rate-limiter

<details><summary>Level 1 · Nudge</summary>

Lesson 17.6, "Rate limiting". You need a `Map` from key to `{ start, count }`. Everything else is arithmetic with `now()`.
</details>

<details><summary>Level 2 · Direction</summary>

1. `hit(key)`:
   - Get the key's window. If there isn't one, or it has ended, start a new one with `count = 0`.
   - If `count >= max`, the hit is blocked. Otherwise, increment the count and allow it.
2. `retryAfterMs` = when the window ends (`start + windowMs`) minus now.
3. `prune` loops over the map and deletes ended windows.
4. Middleware: get the key and skip if it's `undefined`. Call `hit`. Either call `next()`, or set `Retry-After` and send the 429.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **"Blocked hits don't extend the window"** means you never touch `start` for an existing, unfinished window, and you don't increment `count` past `max` (or, if you do, it doesn't matter, because you compare with `>=`).
- **Has a window ended?** `now >= start + windowMs`. At exactly `start + windowMs`, a new window begins.
- **Retry-After:** `Math.ceil(ms / 1000)`, as a string. Rounding up means a client that waits exactly that long is never refused again.
- **Deleting from a `Map` while iterating it with `for…of` is safe** in JavaScript. You won't skip entries.
</details>
