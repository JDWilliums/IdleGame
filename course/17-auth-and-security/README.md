# Module 17 · Authentication & Security

**Time:** ~22 hours · **Prerequisites:** Module 15 (Express), Module 16 (databases), 03.2 (HTTP), 10.4 (TanStack Query)

## Why this module matters
Accounts are what let a player pick up their game on another device, and they're also the part of your app attackers aim at first. Security questions come up in almost every web developer interview: "how would you store passwords?", "sessions or JWTs?", "what's CSRF?", "why is my cookie not being sent?". Juniors who can answer those clearly, and explain the trade-offs, stand out. You'll build session authentication yourself from vetted primitives, so that when you use an auth library or service at work you'll understand exactly what it's doing for you.

## Learning objectives
By the end of this module you can:
- tell authentication from authorisation, and threat-model a feature
- hash passwords correctly with a salted, memory-hard function, and design a password policy
- compare server sessions and JWTs, and design session tokens that are safe at rest
- configure cookies (`HttpOnly`, `Secure`, `SameSite`) and choose a deployment layout where they work
- build register, login, logout and "log out everywhere", with ownership checks on every request
- defend against XSS, CSRF and brute force, and configure CORS and security headers correctly
- explain the OAuth authorization code flow with PKCE
- handle auth state, protected routes and guest mode in a React app

## Lessons
| # | Lesson | Time |
|---|---|---|
| 17.1 | [Auth concepts & threat modelling](01-auth-concepts-and-threats.md) | 2h |
| 17.2 | [Storing passwords](02-storing-passwords.md) | 2.5h |
| 17.3 | [Sessions vs JWTs](03-sessions-vs-jwts.md) | 2h |
| 17.4 | [Cookies in depth](04-cookies-in-depth.md) | 2.5h |
| 17.5 | [Implementing session auth](05-implementing-session-auth.md) | 3.5h |
| 17.6 | [Web security essentials](06-web-security-essentials.md) | 3h |
| 17.7 | [OAuth & social login](07-oauth-and-social-login.md) | 2h |
| 17.8 | [Auth in the frontend](08-auth-in-the-frontend.md) | 2.5h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `17-01` | [password-hashing](../../exercises/17-auth-and-security/01-password-hashing/exercise.ts) | 17.2 |
| `17-02` | [session-tokens](../../exercises/17-auth-and-security/02-session-tokens/exercise.ts) | 17.3 |
| `17-03` | [auth-middleware](../../exercises/17-auth-and-security/03-auth-middleware/exercise.ts) | 17.5 |
| `17-04` | [rate-limiter](../../exercises/17-auth-and-security/04-rate-limiter/exercise.ts) | 17.6 |

Hints: [`exercises/17-auth-and-security/HINTS.md`](../../exercises/17-auth-and-security/HINTS.md)

Keep your 17-01 and 17-02 solutions handy: in the capstone (milestone C08) they become the real password hasher and session manager behind your game's API.

## Checkpoint quiz
1. What's the difference between `401` and `403`?
2. Why are passwords hashed with scrypt or Argon2 rather than SHA-256? What does the salt add?
3. Why does the server store `sha256(token)` for sessions, and why is a fast hash fine there?
4. Give one strength of server sessions and one of JWTs. Which suits a browser app talking to its own API, and why?
5. Which cookie attributes does a session cookie need, and what does each do?
6. Your game is on `hearthwild.vercel.app` and the API on `hearthwild.onrender.com`. Login "works" but players are logged out on every request in Safari. Why?
7. How do `SameSite=Lax`, an Origin check and a JSON-only API each help against CSRF?
8. What does CORS protect, and what doesn't it protect?
9. Why should login run a password hash even when the username doesn't exist?
10. In the OAuth code flow, what are `state` and PKCE for?

<details><summary>Answers</summary>

1. `401`: not authenticated (no valid session). `403`: authenticated, but not allowed to do this.
2. SHA-256 is fast, so attackers can try billions of guesses per second. Password hashes are deliberately slow and memory-hard. The salt makes identical passwords hash differently, which defeats precomputed tables and forces attackers to crack each user separately.
3. So a database leak doesn't give attackers working session cookies. The token is 256 random bits, so there's nothing to brute-force, and slowness adds no protection.
4. Sessions: instant revocation. JWTs: verifiable without a lookup. Sessions suit a browser app: they're simpler, revocable, and live in an `HttpOnly` cookie.
5. `HttpOnly` (no JavaScript access), `Secure` (HTTPS only), `SameSite=Lax` (not sent on cross-site POSTs and sub-requests), `Path=/`, and `Max-Age` matching the session lifetime.
6. `vercel.app` and `onrender.com` are public suffixes, so the two hosts are different sites and the API's cookie is a third-party cookie, which Safari blocks. Serve both from one origin or from subdomains of your own domain.
7. Lax cookies aren't sent on cross-site POSTs. The Origin check rejects state-changing requests from unexpected origins, including same-site subdomains. Forms can't send `application/json`, and cross-origin JSON requests need a preflight that CORS refuses.
8. It protects users: it controls which other origins' JavaScript may read your responses. It doesn't protect the server at all, because non-browser clients ignore it.
9. Otherwise unknown usernames get a much faster response, which reveals which accounts exist.
10. `state` stops CSRF on the callback (an attacker completing their login in your browser). PKCE stops an intercepted authorization code from being exchanged by anyone without the original verifier.
</details>

## Extra practice
1. **Real dependencies.** Run the 17-03 tests with your 17-01 hasher (`N: 2 ** 10` for speed) and an adapter around your 17-02 session manager instead of the test doubles. Only the wiring should change.
2. **Postgres sessions.** Implement 17-02's `SessionStore` with Drizzle on PGlite (16.6) using the `sessions` table from 17.5, and run 17-02's tests against it.
3. **Change password.** Add `POST /api/auth/password { currentPassword, newPassword }` to your 17-03 app: verify the current password, store the new hash, invalidate every *other* session, and keep the current one logged in. Write the tests first.
4. **CSRF middleware.** Add the Origin check from 17.6 to your 17-03 app with an allowlist, and test that a `POST` with `Origin: https://evil.example` gets `403` while one with no `Origin` passes.
5. **Read the cheat sheets.** OWASP's Authentication, Session Management and Password Storage cheat sheets. Note one thing each recommends that this module didn't cover.

**Next:** [Module 18 · Cloud Saves & Sync →](../18-cloud-saves/README.md)
