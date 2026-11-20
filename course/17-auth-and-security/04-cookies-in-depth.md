# 17.4 · Cookies in depth

> ⏱ 2.5 hours · Module 17 · Authentication & Security

## What you'll learn
- How `Set-Cookie` and `Cookie` headers work
- Every cookie attribute that matters for a session: `HttpOnly`, `Secure`, `SameSite`, `Path`, `Domain`, `Max-Age`, and the `__Host-` prefix
- "Site" versus "origin", and why it decides whether your login works at all
- Deployment layouts that work with cookies, and ones that don't
- Setting, reading and clearing cookies in Express
- `credentials` in `fetch`, and CORS with cookies

---

## The two headers

The server sets a cookie with a response header:

```
HTTP/1.1 200 OK
Set-Cookie: session=Qk3v…9w; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax
```

From then on, the browser sends it back on matching requests:

```
GET /api/save HTTP/1.1
Cookie: session=Qk3v…9w; theme=dark
```

- One `Set-Cookie` header per cookie. The `Cookie` header packs them all together, separated by `; `.
- Only `name=value` comes back: the browser never sends the attributes.
- Cookies are small (about 4 KB each). Store an id, not data.

## The attributes

| Attribute | Effect | For a session cookie |
|---|---|---|
| `HttpOnly` | JavaScript (`document.cookie`) can't read it | ✅ always |
| `Secure` | only sent over HTTPS | ✅ always in production |
| `SameSite=Lax` | not sent on cross-site sub-requests or cross-site `POST`s; sent when the user clicks a link to your site | ✅ the default choice |
| `SameSite=Strict` | never sent on any cross-site request, including clicking a link to your site from elsewhere | stricter, but users arriving from a link appear logged out |
| `SameSite=None` | sent on all cross-site requests; requires `Secure` | ❌ avoid unless you truly need cross-site cookies |
| `Path=/` | sent for every path on the host | ✅ |
| `Max-Age=<seconds>` / `Expires=<date>` | persists until then; without either, it's a session cookie that dies when the browser closes | match your session's expiry |
| `Domain=example.com` | also sent to subdomains | ❌ leave it out unless you need it, so the cookie stays on one host |

### The `__Host-` prefix
Naming the cookie `__Host-session` makes the browser **enforce** `Secure`, `Path=/` and no `Domain`. A compromised or careless subdomain can then never overwrite it. It's free hardening for production. (It needs HTTPS, so use a plain name in local development.)

## Site vs origin

This distinction decides whether your cookies work at all.

- An **origin** is scheme + host + port: `https://app.hearthwild.com:443`.
- A **site** is scheme + the *registrable domain* (eTLD+1): `https://hearthwild.com`. `app.hearthwild.com` and `api.hearthwild.com` are **different origins** but the **same site**.

`SameSite` is about **sites**. CORS (17.6) is about **origins**.

### The public suffix trap
"eTLD" means *effective* top-level domain, from the **Public Suffix List**. It includes `co.uk`, and also hosting platforms such as `vercel.app`, `netlify.app`, `onrender.com`, `github.io` and `pages.dev`. So:

- `hearthwild.vercel.app` and `hearthwild-api.onrender.com` are different **sites**.
- Even `game.vercel.app` and `api.vercel.app` are different sites.

A session cookie set by the API is then a **third-party cookie** on the game's pages. Safari and Firefox block third-party cookies by default and Chrome lets users block them, so login "works on my machine" and fails for many real users. This is one of the most common deployment bugs in full-stack projects.

### Layouts that work

| Layout | Same site? | Notes |
|---|---|---|
| **One origin**: the API serves the frontend's built files too, or a proxy routes `/api/*` to it | ✅ | simplest: no CORS at all. Vite's dev proxy does the same locally |
| `hearthwild.com` + `api.hearthwild.com` (your own domain) | ✅ | needs CORS (different origins) but cookies are first-party |
| `*.vercel.app` frontend + `*.onrender.com` API | ❌ | third-party cookies, blocked in many browsers |

Module 20 deploys with one of the working layouts. Locally, the Vite dev server proxies `/api` to Express, so the browser only ever talks to one origin:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
```

## Cookies in Express

Setting (`res.cookie` is built into Express):

```ts
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

res.cookie('session', token, {
  httpOnly: true,
  secure: config.cookieSecure,  // true in production; see "localhost" below
  sameSite: 'lax',
  path: '/',
  maxAge: THIRTY_DAYS,          // milliseconds in Express (Max-Age in the header is seconds)
});
```

Produces:

```
Set-Cookie: session=…; Max-Age=2592000; Path=/; Expires=…; HttpOnly; Secure; SameSite=Lax
```

Reading needs the `cookie-parser` middleware, which parses the `Cookie` header into `req.cookies`:

```ts
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.get('/api/auth/me', (req, res) => {
  const token: unknown = req.cookies.session;   // treat it as untrusted input: it may be missing or junk
});
```

Clearing tells the browser to delete it by sending an expiry in the past. The `path` (and `domain`, if used) must **match** the original, or the browser treats it as a different cookie and keeps the old one:

```ts
res.clearCookie('session', { httpOnly: true, secure: config.cookieSecure, sameSite: 'lax', path: '/' });
// Set-Cookie: session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax
```

Clearing the cookie isn't enough to log out: **delete the session on the server too**. Otherwise anyone who copied the token can keep using it.

### localhost and `Secure`
Browsers treat `http://localhost` as a secure context, so Chrome and Firefox accept `Secure` cookies there. Other tools may not. supertest's cookie agent, for example, won't send a `Secure` cookie over plain HTTP. Make `secure` a config option (`true` in production, often `false` in tests) rather than hard-coding it.

## `fetch` and credentials

`fetch` has a `credentials` option that decides whether cookies are sent:

| Value | Sends cookies… |
|---|---|
| `'same-origin'` (default) | only to the page's own origin |
| `'include'` | to other origins too (and accepts `Set-Cookie` from them) |
| `'omit'` | never |

With the one-origin layout (or the Vite proxy), the default just works. With `api.hearthwild.com`, every call needs `credentials: 'include'` **and** the server must send CORS headers that allow credentials for that exact origin:

```
Access-Control-Allow-Origin: https://hearthwild.com     ← exact origin; "*" is not allowed with credentials
Access-Control-Allow-Credentials: true
```

17.6 sets this up with the `cors` package.

## Debugging cookies
- **DevTools → Application → Cookies** lists every cookie with its attributes. In **Network**, select a request and open **Cookies**: blocked cookies show a yellow warning explaining why ("This Set-Cookie was blocked because…"). Read it. It names the exact attribute.
- No cookie on requests? Check, in order: did the response include `Set-Cookie`? Is it `Secure` over HTTP? Is it cross-site with `SameSite=Lax`? Is `fetch` using `credentials`? Does `Path` match?

## Check your understanding

1. Which attributes should a session cookie have, and why each?
2. Are `app.hearthwild.com` and `api.hearthwild.com` the same origin? The same site?
3. Why does a game on `game.vercel.app` with an API on `api.onrender.com` often fail to stay logged in?
4. What does `__Host-` enforce?
5. Your `clearCookie` call "doesn't work": the cookie is still there. What's the likely cause?
6. When do you need `credentials: 'include'`?

<details><summary>Answers</summary>

1. `HttpOnly` (script can't read it), `Secure` (HTTPS only), `SameSite=Lax` (not sent on cross-site POSTs and sub-requests, which blocks most CSRF), `Path=/`, and `Max-Age` matching the session lifetime.
2. Different origins (different hosts). The same site (same registrable domain, `hearthwild.com`).
3. Both are on the Public Suffix List, so they're different sites and the API's cookie is a third-party cookie, which Safari and Firefox block by default.
4. The cookie must be `Secure`, have `Path=/` and have no `Domain` attribute, so it's locked to exactly one host and can't be overwritten by subdomains.
5. The `path` (or `domain`) options don't match the ones used when the cookie was set, so the browser sees a different cookie.
6. When calling an API on a different origin and you want cookies sent and accepted. The server must also allow credentials for that exact origin via CORS.
</details>

## Further reading
- MDN: "Using HTTP cookies" and the `Set-Cookie` reference
- web.dev: "SameSite cookies explained"
- publicsuffix.org: browse the list for platforms you might deploy to

---
[← Sessions vs JWTs](03-sessions-vs-jwts.md) · [Module overview](README.md) · [Next: Implementing session auth →](05-implementing-session-auth.md)
