# 17.1 · Auth concepts & threat modelling

> ⏱ 2 hours · Module 17 · Authentication & Security

## What you'll learn
- Authentication vs authorisation
- Authentication factors and MFA
- The attacks that actually happen to web apps' accounts
- How to threat-model a feature in fifteen minutes
- The auth design this course uses for Hearthwild, and why

---

## Two different questions

| | Question | Failure looks like | HTTP status |
|---|---|---|---|
| **Authentication** (authn) | *Who are you?* | "I don't know who you are" | `401 Unauthorized` (the name is historical: it means *unauthenticated*) |
| **Authorisation** (authz) | *Are you allowed to do this?* | "I know who you are, and no" | `403 Forbidden` (or `404`, see 17.5) |

Logging in is authentication. Checking that the save you're overwriting is **yours** is authorisation. Most real breaches are authorisation bugs: the app checked that you were logged in, but not that the thing you asked for belonged to you.

## Factors

An authentication **factor** is a kind of proof:

- **Something you know**: a password, a PIN.
- **Something you have**: a phone running an authenticator app, a security key, a passkey on your device.
- **Something you are**: a fingerprint or face, usually unlocking a "something you have".

**Multi-factor authentication** (MFA) combines two kinds. Stealing a password alone is then not enough. **Passkeys** (WebAuthn) replace the password with a key pair stored on the device, so there's nothing to phish or reuse. They're increasingly common, and a great stretch goal once the basics work.

This module builds password login with server sessions, the foundation everything else sits on. 17.7 adds "Sign in with…" through OAuth.

## What attackers actually do

| Attack | What happens | Main defences |
|---|---|---|
| **Credential stuffing** | Username/password pairs leaked from *other* sites are tried on yours, automatically, by the million | Rate limiting, breached-password checks, MFA |
| **Brute force** | Many guesses at one account's password | Rate limiting per account and per IP, slow password hashing |
| **Phishing** | A fake login page collects real passwords | MFA, passkeys |
| **Database leak** | Your user table is stolen (SQL injection, a backup in a public bucket, an insider) | Slow, salted password hashes (17.2); store only token *hashes* (17.3) |
| **Session hijacking** | A session token is stolen (XSS, logs, insecure transport) and replayed | `HttpOnly` + `Secure` cookies, HTTPS everywhere, short-lived sessions |
| **XSS** | Attacker-controlled script runs on your site, as your user | React's escaping, Content Security Policy (17.6) |
| **CSRF** | Another site makes the browser send a request to yours, with your cookies | `SameSite` cookies, Origin checks (17.6) |
| **Broken access control / IDOR** | `PUT /api/saves/42` works for a user who isn't 42 | Check ownership on **every** request (17.5) |
| **Account enumeration** | Different responses reveal which usernames exist | Identical errors and timing for "no such user" and "wrong password" |

The OWASP Top 10 (owasp.org/Top10) is the industry's list of the most critical web application risks. "Broken access control" has been at the top of it for years. Read it once now and again after this module.

## Threat modelling in fifteen minutes

Threat modelling sounds formal, but at its core it's four questions you ask about any feature (from the Threat Modeling Manifesto):

1. **What are we building?** Sketch the parts and where data flows between them.
2. **What can go wrong?** Walk the flows and ask "what if someone lies here?"
3. **What are we going to do about it?** A mitigation for each threat, or a decision to accept the risk.
4. **Did we do a good job?** Revisit after building.

### Applied to Hearthwild

**What are we building?** A browser game talking to an Express API over HTTPS, with Postgres behind it. Accounts exist to sync saves between devices and appear on leaderboards.

**What's valuable?**
- Account access (someone else's save could be wiped or vandalised).
- Users' passwords. People reuse them, so a leak here hurts them elsewhere. **This is the most valuable thing you store**, even though your game is small.
- Leaderboard integrity (17.6 and 18.4 cover cheating).
- Availability: the API staying up.

**What isn't here?** No payments, no personal data beyond a username (and maybe an email). That's a deliberate design choice: **data you don't collect can't leak.**

**What can go wrong, and what do we do?**

| Threat | Mitigation in this course |
|---|---|
| Password database leak | scrypt with salt (17.2) |
| Session token theft from the DB | store SHA-256 of tokens, not tokens (17.3) |
| Token theft via XSS | `HttpOnly` cookie, no tokens in `localStorage` (17.3, 17.4) |
| CSRF | `SameSite=Lax`, Origin check, JSON-only API (17.6) |
| Brute force / stuffing | rate limiter (exercise 17-04) |
| Overwriting someone else's save | the save API only ever uses the session's user id (18.1) |
| Fake saves with 99 in every skill | server-side validation and plausibility checks (18.4) |

That table is a real deliverable. Writing one in a design doc or PR description at work shows maturity.

## The design we'll build

- **Username + password** registration and login.
- Passwords hashed with **scrypt** (built into Node, no native dependencies).
- **Server-side sessions** stored in Postgres, identified by a random token.
- The token travels in an **`HttpOnly`, `Secure`, `SameSite=Lax` cookie**. JavaScript can never read it.
- Frontend and API on the **same site** (17.4 explains why that matters).
- Rate limiting on login and registration.
- The game is **playable without an account**. An account only adds sync (17.8).

## Build it or buy it?

At work you'll often use an auth library or service: Auth.js, Better Auth or Passport in your own server, or hosted providers such as Auth0, Clerk, Supabase Auth or Firebase Auth. They handle edge cases, MFA, OAuth and passkeys for you, and they're usually the right choice for a product.

So why build it yourself here? Because you can't evaluate, configure or debug an auth library well without knowing what it does underneath. Interviews ask exactly these questions, too. Everything you'll build uses standard, vetted primitives (`crypto.scrypt`, `crypto.randomBytes`, SHA-256). What you must **never** do is invent your own cryptography: your own hash function, cipher or "clever" token scheme.

> The Lucia project (lucia-auth.com) moved from being a library to a free guide to implementing sessions yourself, and it's close to the design in this module. It's a great second source once you've finished 17.5.

## Check your understanding

1. A logged-in user changes the id in `DELETE /api/notes/17` to another user's note, and it works. Is that an authentication or an authorisation bug?
2. What's the difference between `401` and `403`?
3. Why is the password the most valuable thing a small game stores?
4. What is credential stuffing, and why does rate limiting help?
5. Name the four questions of threat modelling.

<details><summary>Answers</summary>

1. Authorisation. The server knew who they were, but didn't check that the note was theirs (broken access control / IDOR).
2. `401`: not authenticated (no valid session). `403`: authenticated but not allowed.
3. People reuse passwords. A leak of weakly stored passwords gives attackers access to users' email, banking and other accounts, not just the game.
4. Automated login attempts using username/password pairs leaked from other sites. Rate limiting makes it slow and expensive to try enough pairs to find matches.
5. What are we building? What can go wrong? What are we going to do about it? Did we do a good job?
</details>

## Further reading
- OWASP Top 10 (owasp.org/Top10)
- OWASP "Authentication Cheat Sheet" and "Session Management Cheat Sheet" (cheatsheetseries.owasp.org)
- Threat Modeling Manifesto (threatmodelingmanifesto.org)

---
[← Module overview](README.md) · [Next: Storing passwords →](02-storing-passwords.md)
