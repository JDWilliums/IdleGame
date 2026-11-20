# 17.5 · Implementing session auth

> ⏱ 3.5 hours · Module 17 · Authentication & Security

## What you'll learn
- The tables behind accounts and sessions
- Registration, login, "who am I?" and logout, end to end in Express
- A `loadSession` middleware and a `requireAuth` guard
- Authorisation: checking ownership on every request, and 403 vs 404
- Logging out everywhere, and when to do it
- Testing auth flows with supertest agents

---

This lesson puts 17.2–17.4 together into a working auth system. Exercise 17-03 has you build it.

## The tables

```sql
CREATE TABLE users (
  id            serial PRIMARY KEY,
  username      text NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));  -- unique, case-insensitively

CREATE TABLE sessions (
  id_hash    text PRIMARY KEY,                                   -- sha256(token), never the token
  user_id    integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);           -- for "log out everywhere"
```

- A unique index on `lower(username)` stops `Ava` and `ava` from both existing, while still displaying the capitalisation the user chose.
- `ON DELETE CASCADE`: deleting an account deletes its sessions.
- Expired sessions are deleted when someone tries to use one. A scheduled cleanup (`DELETE FROM sessions WHERE expires_at < now()`) keeps the table small.

## Layers

Following 15.6, the routes depend on small interfaces, not on Postgres or crypto directly:

```ts
type Deps = {
  users: UserRepo;            // findByUsername, findById, create
  sessions: SessionService;   // create(userId) → token, validate(token), invalidate(token), invalidateAllForUser(userId)
  passwords: PasswordHasher;  // hash, verify (17.2, exercise 17-01)
  cookieSecure: boolean;
};
```

Tests pass in-memory versions and a fast fake hasher. Production passes Postgres repositories, exercise 17-02's session manager and exercise 17-01's scrypt hasher.

## Registration

```ts
const Credentials = z.object({
  username: z.string().trim().regex(/^[a-z0-9_]{3,20}$/i, '3–20 letters, digits or underscores'),
  password: z.string().min(8).max(128),
});

router.post('/register', async (req, res) => {
  const { username, password } = Credentials.parse(req.body);       // ZodError → 400 via the error handler (15.5)

  const passwordHash = await passwords.hash(password);
  const user = await users.create({ username, passwordHash });       // unique violation → 409 USERNAME_TAKEN

  const token = await sessions.create(user.id);                       // registering logs you in
  setSessionCookie(res, token);
  res.status(201).json({ user: { id: user.id, username: user.username } });
});
```

**Never send `passwordHash` to the client.** Build response objects explicitly (`{ id, username }`) rather than spreading the database row, so a column added later can't leak.

## Login

```ts
// Computed once at startup: a real hash of a random password, so "no such user" costs the same time.
const DUMMY_HASH = await passwords.hash(randomBytes(16).toString('hex'));

router.post('/login', async (req, res) => {
  const { username, password } = Credentials.parse(req.body);

  const user = await users.findByUsername(username);
  const ok = await passwords.verify(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');

  const token = await sessions.create(user.id);                       // always a NEW session (no fixation)
  setSessionCookie(res, token);
  res.json({ user: { id: user.id, username: user.username } });
});
```

In production this is where you'd also check `needsRehash` (17.2) and apply the rate limiter (exercise 17-04).

## Loading the session on every request

One middleware, registered before the routes, turns the cookie into a user:

```ts
async function loadSession(req: Request, res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.session;
  if (typeof token === 'string' && token.length > 0) {
    const session = await sessions.validate(token);
    const user = session && (await users.findById(session.userId));
    if (user) {
      res.locals.user = { id: user.id, username: user.username };
    } else {
      clearSessionCookie(res);      // expired, revoked or junk: tell the browser to drop it
    }
  }
  next();                           // never rejects: anonymous requests are allowed through
}
```

It **doesn't reject** anything. Some routes are public (`/api/leaderboard`, `/api/auth/login`). A separate guard protects the rest:

```ts
function requireAuth(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.user) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Log in to continue' } });
    return;
  }
  next();
}

app.use('/api/notes', requireAuth, notesRouter);
```

### Typing `res.locals.user`
`res.locals` is typed as `Record<string, any>`, so `res.locals.user` is `any`. In a real app, use **declaration merging** to type it once for the whole project:

```ts
// src/types/express.d.ts
declare global {
  namespace Express {
    interface Locals {
      user?: { id: number; username: string };
    }
  }
}
export {};
```

(The exercises can't do this, because exercise and solution files are type-checked together and would declare it twice, so they use small `getCurrentUser(res)` / `setCurrentUser(res, user)` helpers instead.)

## Me and logout

```ts
router.get('/me', requireAuth, (_req, res) => {
  res.json({ user: res.locals.user });
});

router.post('/logout', async (req, res) => {
  const token: unknown = req.cookies?.session;
  if (typeof token === 'string') await sessions.invalidate(token);   // kill it on the server…
  clearSessionCookie(res);                                            // …and in the browser
  res.status(204).end();
});
```

Logout works **even if you're not logged in** (204, nothing to do). A logout button should never show an error.

The frontend calls `GET /api/auth/me` when it starts to find out whether it's logged in (17.8). A `401` there is normal, not an error to log.

### Log out everywhere
`invalidateAllForUser(userId)` deletes every session the user has. Offer it as a button ("log out of all devices"), and do it automatically when the password changes or is reset: whoever knew the old password may already have a session.

## Authorisation: whose is it?

Being logged in only proves who you are. Every route that touches user data must also check that the data belongs to the user:

```ts
router.delete('/:id', async (req, res) => {
  const user = res.locals.user;
  const note = await notes.get(Number(req.params.id));
  if (!note || note.userId !== user.id) throw new HttpError(404, 'NOT_FOUND', 'Note not found');
  await notes.delete(note.id);
  res.status(204).end();
});
```

Better still, make the query itself scoped to the user, so forgetting the check is impossible: `WHERE id = $1 AND user_id = $2`. Every repository method that reads user data takes the `userId`. For saves (Module 18) it's even simpler: the route never accepts a user id from the client at all, only `res.locals.user.id`.

### 403 or 404?
For "this exists but isn't yours", `403 Forbidden` is technically accurate, but it tells an attacker that note 17 **exists**. Returning `404` for both "doesn't exist" and "not yours" reveals nothing. GitHub does exactly this for private repositories. Use `403` when the resource's existence isn't secret, e.g. "you can see this guild, but only officers can edit it".

## Testing with supertest agents

`request.agent(app)` remembers cookies between requests, like a browser:

```ts
const ava = request.agent(app);
await ava.post('/api/auth/register').send({ username: 'ava', password: 'correct horse' }).expect(201);
await ava.get('/api/auth/me').expect(200);         // the cookie from register is sent automatically

const bram = request.agent(app);                   // a second "browser" with its own cookie jar
await bram.get('/api/auth/me').expect(401);
```

- Create the app with `cookieSecure: false` for agent tests: the agent (correctly) won't send a `Secure` cookie over plain HTTP. Test the `Secure` attribute separately, by reading `res.headers['set-cookie']` from an app created with `cookieSecure: true`.
- Inject a fake clock into the session service so you can test expiry without waiting 30 days.
- Inject a fake password hasher so tests don't spend 300 ms per hash. Keep one real-hasher test for confidence.
- Test the unhappy paths at least as carefully as the happy ones. In auth, that's where the bugs that matter live.

## Check your understanding

1. Why does registration build `{ id, username }` instead of returning the user row?
2. What does `DUMMY_HASH` prevent?
3. Why doesn't `loadSession` reject requests without a valid cookie?
4. Logout clears the cookie. Why must it also invalidate the session on the server?
5. When should all of a user's sessions be invalidated?
6. Why can `404` be better than `403` for someone else's note?
7. Why do agent-based tests use `cookieSecure: false`?

<details><summary>Answers</summary>

1. So sensitive or future columns (`password_hash`, an email) can never leak through the response by accident.
2. User enumeration by timing. Without it, unknown usernames respond much faster than wrong passwords.
3. Many routes are public. Loading and guarding are separate jobs: `loadSession` identifies the user if there is one, and `requireAuth` protects specific routes.
4. A copy of the token (stolen, or from another tab or device) would otherwise keep working until the session expires.
5. When the password changes or is reset, when the user asks ("log out everywhere"), or when the account is compromised or banned.
6. It doesn't reveal that the resource exists.
7. The supertest agent follows browser rules and won't send a `Secure` cookie over plain HTTP, so the session wouldn't be sent back.
</details>

## Further reading
- OWASP "Authentication Cheat Sheet" (login, error messages, password reset)
- OWASP "Authorization Cheat Sheet"
- supertest README: "Cookies" and `request.agent`

---
[← Cookies in depth](04-cookies-in-depth.md) · [Module overview](README.md) · [Next: Web security essentials →](06-web-security-essentials.md)
