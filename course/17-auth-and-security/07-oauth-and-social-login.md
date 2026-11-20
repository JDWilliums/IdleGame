# 17.7 · OAuth & social login

> ⏱ 2 hours · Module 17 · Authentication & Security

## What you'll learn
- What OAuth 2.0 and OpenID Connect are, and the difference between them
- The authorization code flow with PKCE, step by step
- What `state`, `code_verifier` and the redirect URI each protect against
- Linking social accounts to your own users table
- Which parts to hand to a library

---

There's no exercise for this lesson. Adding "Sign in with GitHub/Google/Discord" is a **stretch goal** in the capstone, and you'll use a library for it. You still need to understand the flow: you'll configure it, debug it, and be asked about it in interviews.

## Two standards, two jobs

- **OAuth 2.0** is about **authorisation**: "Hearthwild may read my Discord username and avatar." The user grants your app an **access token** for a limited set of permissions (**scopes**) on another service, without giving you their password.
- **OpenID Connect (OIDC)** is a layer on top of OAuth for **authentication**: "this person is Discord user 12345." It adds an **ID token**, a JWT (17.3) signed by the provider that says who logged in.

"Sign in with Google" is OIDC. "Let this app post to my calendar" is plain OAuth.

## The authorization code flow with PKCE

```
 Player's browser                 Hearthwild API                       Provider (e.g. GitHub)
      │ click "Sign in with GitHub" ─►│                                        │
      │                               │ 1. make state + code_verifier;         │
      │                               │    store both in short-lived           │
      │                               │    HttpOnly cookies                    │
      │◄── 302 redirect to provider ──│                                        │
      │ ──── GET /authorize?client_id&redirect_uri&scope&state&code_challenge ─►│
      │                               │                        2. user logs in │
      │                               │                           and consents │
      │◄────────── 302 redirect to redirect_uri?code=…&state=… ────────────────│
      │ ── GET /api/auth/github/callback?code&state ─►│                        │
      │                               │ 3. check state matches the cookie      │
      │                               │ 4. POST /token (code, code_verifier, ──►│
      │                               │    client_secret)                      │
      │                               │◄───── access token (+ ID token) ───────│
      │                               │ 5. fetch the user's profile ──────────►│
      │                               │ 6. find or create the local user,      │
      │                               │    create OUR session (17.5)           │
      │◄── Set-Cookie: session=… + redirect to the game ─│                     │
```

The provider proves who the user is. After step 6, everything is **your own session system**, exactly as in 17.5. OAuth is just another way to reach "create a session for user 7".

### What each piece protects

| Piece | Protects against |
|---|---|
| **`redirect_uri`**, registered in advance with the provider | the provider sending the code to an attacker's site |
| **`state`**: a random value you generate, check in the callback, then discard | CSRF on the callback: an attacker tricking a victim's browser into finishing *the attacker's* login, which links the attacker's account |
| **PKCE** (`code_verifier` / `code_challenge`): you send a hash of a random secret at the start, and the secret itself when exchanging the code | a stolen authorization code being exchanged by someone else |
| **`client_secret`**: only ever on your server | anyone else pretending to be your app |
| **Short-lived codes** (single use, about a minute) | replaying an intercepted code later |

With OIDC you also send a **`nonce`** and check it in the ID token, and you verify the ID token's signature, issuer (`iss`), audience (`aud`) and expiry. This is exactly the kind of fiddly, security-critical code to leave to a library.

## Linking accounts

Social logins need their own table, because one user might link several providers, and a provider's user id is only unique within that provider:

```sql
CREATE TABLE oauth_accounts (
  provider         text    NOT NULL,          -- 'github', 'discord', 'google'
  provider_user_id text    NOT NULL,          -- their id for this person (never their username: those change)
  user_id          integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, provider_user_id)
);
```

In the callback:

1. Look up `(provider, provider_user_id)`. If found, log in as that `user_id`.
2. If not found and the user is **already logged in**, link the provider to their current account ("connect GitHub" in settings).
3. If not found and not logged in, **create a new user** and link it.

Be careful about linking by **email**. If a provider lets people set an unverified email address, an attacker could claim yours and be merged into your account. Only auto-link when the provider says the email is verified, or ask the user to log in to the existing account first. Many apps simply don't link by email.

Users created through OAuth have no password. Make `password_hash` nullable, and remember "can't remove your last way to log in" when they unlink a provider.

## Use a library for the protocol

- **Arctic** (arcticjs.dev) is a small, typed set of OAuth clients for 50+ providers. You still own the routes and sessions, which fits this module's design exactly.
- **Auth.js**, **Better Auth** and **Passport** handle more (routes, sessions, account linking), in exchange for following their way of doing things.
- Hosted services (Auth0, Clerk, Supabase Auth) do it all for you.

Whichever you use, you'll **register an OAuth app** with each provider (GitHub: Settings → Developer settings → OAuth Apps). You get a client id and secret, and you register redirect URIs for each environment (`http://localhost:5173/api/auth/github/callback` in development, your real domain in production). A mismatched redirect URI is the most common "it doesn't work" problem.

## Check your understanding

1. What's the difference between OAuth 2.0 and OpenID Connect?
2. Where must the `client_secret` live, and why?
3. What attack does the `state` parameter prevent?
4. What does PKCE protect against?
5. After the OAuth callback succeeds, how does the user stay logged in to Hearthwild?
6. Why key `oauth_accounts` on `(provider, provider_user_id)` and not on email or username?

<details><summary>Answers</summary>

1. OAuth 2.0 grants an app limited access to a user's data on another service (authorisation). OIDC adds authentication on top: an ID token that says who the user is.
2. Only on your server, never in the frontend or the repo. Anyone with it can impersonate your app to the provider.
3. CSRF on the callback: an attacker making the victim's browser complete the attacker's login, so the victim ends up linked to or signed in as the attacker's account.
4. An intercepted authorization code being exchanged for tokens by someone who doesn't have the original `code_verifier`.
5. With your own session: the callback creates a normal session (17.5) and sets the session cookie, just like a password login.
6. The provider's user id is stable and unique within that provider. Usernames and emails can change, and emails may be unverified.
</details>

## Further reading
- "OAuth 2.0 Simplified" by Aaron Parecki (oauth.com)
- The Copenhagen Book (thecopenhagenbook.com), a free, concise guide to implementing auth, including OAuth
- Arctic docs (arcticjs.dev)

---
[← Web security essentials](06-web-security-essentials.md) · [Module overview](README.md) · [Next: Auth in the frontend →](08-auth-in-the-frontend.md)
