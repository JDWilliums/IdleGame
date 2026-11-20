# 17.3 · Sessions vs JWTs

> ⏱ 2 hours · Module 17 · Authentication & Security

## What you'll learn
- What "staying logged in" actually means over stateless HTTP
- Server-side sessions: how they work and why they're the default for web apps
- JWTs: what's inside one, what they're good for, and their sharp edges
- Designing session tokens: randomness, hashing at rest, expiry and renewal
- Why tokens don't belong in `localStorage`

---

## The problem

HTTP is stateless (03.2): every request stands alone. After a successful login, the browser needs something to send with **every later request** that proves "I'm the person who logged in". There are two main families of solution.

## Server-side sessions

1. At login, the server creates a **session record** (`user_id`, `expires_at`) in its database, identified by a long random **token**.
2. The server sends the token to the browser in a cookie.
3. The browser sends the cookie back automatically on every request.
4. The server looks the token up. If it finds a valid session, it knows the user.

```
browser                         server                         database
   │ POST /login (password) ──────►│ verify password               │
   │                               │ create session ───────────────►│ sessions: (hash(token), user 7, expires …)
   │◄── Set-Cookie: session=token ─│                               │
   │ GET /api/save  Cookie: token ►│ look up hash(token) ─────────►│
   │◄────────── 200 save ──────────│◄──────── user 7 ──────────────│
```

- ✅ **Revocable instantly**: delete the row and the token is worthless. "Log out", "log out of all devices", "ban this user" and "password changed" all just work.
- ✅ **Simple**: the token is meaningless random bytes, with nothing to parse, verify or misconfigure.
- ❌ One database lookup per request. For almost every app that's fine: it's a primary-key lookup taking well under a millisecond, and it can be cached.

## JWTs (JSON Web Tokens)

A JWT is a **signed** piece of JSON. The server puts claims in it, signs it with a secret key, and later verifies the signature instead of looking anything up.

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3IiwiZXhwIjoxNzYwMDAwMDAwfQ.kQ9…
└──── header ──────┘ └────────── payload ──────────────────┘ └ signature ┘
```

Each part is base64url. Decode the first two (try jwt.io, or `atob` in the console) and you get:

```json
{ "alg": "HS256" }
{ "sub": "7", "exp": 1760000000 }
```

- **Signed, not encrypted.** Anyone holding the token can read the claims. Never put secrets in them.
- ✅ **Stateless**: any server with the key can verify it with no database lookup. That's useful between services, and for APIs used by third parties and mobile apps.
- ❌ **Hard to revoke.** A stolen JWT stays valid until it expires. To revoke one you need a denylist… which is a database lookup again, so you're back to sessions with extra complexity.
- ❌ **Sharp edges.** Libraries have historically accepted `"alg": "none"` or confused algorithms. Always pin the expected algorithm when verifying, and use a well-maintained library (`jose`).
- ❌ **Stale data.** Claims like `"role": "admin"` stay in the token after you change them in the database.

The common JWT pattern is a **short-lived access token** (5–15 minutes) plus a long-lived **refresh token** that is stored server-side and revocable. Notice that this is a server-side session with extra steps.

### So which?
For a browser app talking to its own API, **server-side sessions in an `HttpOnly` cookie** are simpler and safer. That's what we'll build. You'll meet JWTs at work for service-to-service calls, OAuth/OpenID Connect `id_token`s (17.7) and third-party APIs, and interviewers love asking you to compare the two, so be ready to explain the revocation trade-off.

## Designing the session token

### 1. Unguessable
Generate it with a cryptographically secure random generator, with enough bits that guessing is hopeless:

```ts
import { randomBytes } from 'node:crypto';

const token = randomBytes(32).toString('base64url'); // 256 bits → 43 URL-safe characters
```

At 256 bits, an attacker making a billion guesses a second would need far longer than the age of the universe. Never build tokens from user ids, timestamps, `Math.random()` or `crypto.randomUUID()` sliced short.

### 2. Hashed at rest
Store **a hash of the token**, not the token itself:

```ts
import { createHash } from 'node:crypto';

const idHash = createHash('sha256').update(token).digest('hex');
// sessions table: id_hash (PK) | user_id | expires_at | created_at
```

If your database leaks, the attacker has hashes they can't turn back into working cookies. Each request hashes the cookie's token and looks that up.

Why is a *fast* hash fine here when it wasn't for passwords? Because the token has 256 bits of randomness, there's nothing to guess. Passwords are weak because humans choose them, so they need slow hashing. Random tokens don't.

### 3. Expiry: absolute and sliding
- Every session has an `expires_at`. Expired sessions are rejected (and deleted).
- A **sliding** expiry keeps active players logged in: when a session is used and is close to expiring, push `expires_at` forward.

A common scheme, which you'll implement in exercise 17-02:

```
ttl        = 30 days      (a new session lasts 30 days)
renewWithin = 15 days     (if fewer than 15 days remain when it's used, reset it to 30 days)
```

Renewing only in the second half of the lifetime means you write to the database at most about once every two weeks per session, not on every request. A player who visits weekly stays logged in forever. One who disappears for a month has to log in again.

If you also need a hard limit ("log in again after 90 days no matter what"), store `created_at` and check it.

### 4. Invalidation
- **Logout**: delete this session.
- **Password change or reset**: delete **all** the user's sessions (except, optionally, the current one).
- **Login**: always create a **new** session. Never reuse one the browser already had. Reusing it allows **session fixation**: an attacker plants a known session id in the victim's browser, waits for them to log in, then uses it.

## Where does the token live in the browser?

| Storage | Readable by JavaScript? | Sent automatically? | XSS impact |
|---|---|---|---|
| `localStorage` / `sessionStorage` | yes | no (you add a header) | **any** injected script can read the token and send it anywhere. The attacker has the session until it expires |
| Memory (a JS variable) | yes | no | lost on reload; still readable by injected script |
| **`HttpOnly` cookie** | **no** | yes | injected script can *use* the session while the page is open, but can't steal the token |

An `HttpOnly` cookie limits the damage of an XSS bug a great deal. It brings one new risk, CSRF, because the browser sends cookies automatically, and `SameSite` handles most of that (17.4, 17.6). Tutorials that put JWTs in `localStorage` are very common; now you know why they're a poor choice.

## Check your understanding

1. Give one advantage of server-side sessions and one of JWTs.
2. Why is revoking a JWT hard?
3. Is the payload of a JWT secret?
4. Why store `sha256(token)` rather than the token? Why is a fast hash acceptable here?
5. With `ttl = 30 days` and `renewWithin = 15 days`, a session is used on day 10, then on day 20. What happens each time?
6. What is session fixation, and how do you prevent it?
7. Why is an `HttpOnly` cookie safer than `localStorage` for a session token?

<details><summary>Answers</summary>

1. Sessions: instant revocation (and simplicity). JWTs: verifiable without a database lookup, which suits distributed systems and third-party APIs.
2. Verification only checks the signature and expiry, so the token stays valid until it expires. Revoking it early needs server-side state (a denylist), which removes the main advantage.
3. No. It's base64url-encoded JSON, readable by anyone holding the token. It's signed (tamper-evident), not encrypted.
4. So a database leak doesn't hand attackers working session cookies. The token is 256 random bits, so there's nothing for a fast hash to protect against brute force: it can't be guessed.
5. Day 10: 20 days remain (more than 15), so nothing changes. Day 20: 10 days remain (fewer than 15), so `expires_at` is reset to day 50.
6. An attacker gets a victim to use a session id the attacker knows, and the victim then logs in with it. Prevent it by always creating a fresh session at login.
7. JavaScript can't read it, so an XSS bug can't steal the token for later use. `localStorage` is readable by any script on the page.
</details>

## Further reading
- OWASP "Session Management Cheat Sheet"
- jwt.io: decode a JWT and read the introduction
- The Lucia guide (lucia-auth.com), "Sessions", for another walk-through of the same design

---
[← Storing passwords](02-storing-passwords.md) · [Module overview](README.md) · [Next: Cookies in depth →](04-cookies-in-depth.md)
