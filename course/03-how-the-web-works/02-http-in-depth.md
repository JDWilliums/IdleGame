# 03.2 · HTTP in depth

> ⏱ 120 min · Module 03 · How the Web Works

## What you'll learn
- The structure of HTTP messages
- Methods and their semantics: safe and idempotent
- Status codes you'll actually use
- Important headers: content negotiation, caching, conditional requests, cookies
- HTTP is stateless, so how do logins work?
- Using `curl` to talk HTTP by hand

---

## Messages

Every HTTP exchange is a **request** and a **response**. Both have a start line, headers and an optional body:

```http
PUT /api/save HTTP/1.1                      ← method, path, version
Host: api.example.com                        ← headers (case-insensitive names)
Content-Type: application/json
Cookie: session=7f3a…
If-Match: "rev-41"
Content-Length: 58
                                             ← blank line
{"version":1,"gold":120,"skills":{"woodcutting":{"xp":450}}}  ← body
```

```http
HTTP/1.1 200 OK                              ← version, status code, reason
Content-Type: application/json
ETag: "rev-42"

{"revision":42,"savedAt":"2026-11-18T12:00:00Z"}
```

## Methods

| Method | Meaning | Safe? | Idempotent? | Body? |
|---|---|---|---|---|
| `GET` | read a resource | ✅ | ✅ | no |
| `HEAD` | like GET, headers only | ✅ | ✅ | no |
| `POST` | create something / run an action | ❌ | ❌ | yes |
| `PUT` | **replace** a resource entirely | ❌ | ✅ | yes |
| `PATCH` | partially update a resource | ❌ | ❌* | yes |
| `DELETE` | delete a resource | ❌ | ✅ | optional |
| `OPTIONS` | ask what's allowed (CORS preflight) | ✅ | ✅ | no |

- **Safe** means it doesn't change anything on the server. Browsers and crawlers can call GETs freely. **Never** make a GET request that changes data (`GET /api/deleteSave` is a real bug class: link prefetchers will happily delete your users' saves).
- **Idempotent** means doing it twice has the same effect as once. This matters for **retries**: if a `PUT /api/save` times out, you can safely send it again. If a `POST /api/purchase` times out, retrying might charge twice, unless you design for it (idempotency keys).

\* PATCH *can* be idempotent depending on how it's designed (`set gold to 5` is, `add 5 gold` isn't).

> 🧠 Your cloud save will use `PUT /api/save` (replace my save with this one), which is idempotent and safe to retry with the backoff you wrote in 01-04.

## Status codes

The first digit tells you the category:

| Range | Meaning |
|---|---|
| **2xx** | success |
| **3xx** | redirect / look elsewhere |
| **4xx** | **client** error: you sent something wrong |
| **5xx** | **server** error: the server broke |

The ones you'll use and see constantly:

| Code | Name | When |
|---|---|---|
| 200 | OK | general success with a body |
| 201 | Created | POST created something (often with a `Location` header) |
| 204 | No Content | success, no body (e.g. DELETE, logout) |
| 301 / 308 | Moved Permanently | URL changed for good |
| 302 / 307 | Found / Temporary Redirect | temporary redirect |
| 304 | Not Modified | your cached copy is still valid |
| 400 | Bad Request | malformed or invalid input (validation failed) |
| 401 | Unauthorized | **not authenticated**: no session, or an expired one |
| 403 | Forbidden | authenticated, but **not allowed** |
| 404 | Not Found | no such resource |
| 409 | Conflict | conflicts with current state, **e.g. your save is older than the server's** |
| 412 | Precondition Failed | an `If-Match` condition didn't hold (an alternative to 409 for saves) |
| 413 | Content Too Large | body too big (a save file bigger than the limit) |
| 422 | Unprocessable Content | well-formed but semantically invalid (some APIs use this for validation errors) |
| 429 | Too Many Requests | rate limited (lesson 17.6) |
| 500 | Internal Server Error | unhandled bug on the server |
| 502 / 503 / 504 | Bad Gateway / Unavailable / Gateway Timeout | the server or something in front of it is down or slow. **Worth retrying.** |

A useful rule of thumb for clients: **retry on network errors, 429 and 5xx** (with backoff). **Don't retry other 4xx errors**, because sending the same bad request again won't help.

## Headers worth knowing

### Content negotiation
- `Content-Type: application/json` says what format the **body** is in.
- `Accept: application/json` says what format **you want back**.

### Auth and state
- `Cookie: name=value; other=value` (request) and `Set-Cookie: session=…; HttpOnly; Secure; SameSite=Lax` (response). Lesson 17.4 covers cookies in depth.
- `Authorization: Bearer <token>`, for token-based APIs.

### Caching
- `Cache-Control: no-store` means never cache (use it for sensitive data).
- `Cache-Control: no-cache` means you may cache, but must revalidate before each use (use it for `index.html`).
- `Cache-Control: max-age=31536000, immutable` means cache for a year (use it for hashed asset files).
- `ETag: "abc"` is a fingerprint of a version of a resource.

### Conditional requests
- `If-None-Match: "abc"` (on GET): "only send it if it changed". The server replies `304 Not Modified` with no body if unchanged, which saves bandwidth.
- `If-Match: "rev-41"` (on PUT): "only apply my update if the current version is still rev-41". If someone else (your **phone**) saved in between, the server replies **409 or 412** instead of silently overwriting. This is **optimistic concurrency**, and it's the heart of safe cross-device saves (lesson 18.3).

### CORS (next lesson)
- `Origin`, `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, …

## HTTP is stateless

Each request stands alone. The server doesn't remember that your previous request was from you. So how do logins work?

1. You log in. The server creates a **session** and replies with `Set-Cookie: session=<random id>`.
2. The browser stores the cookie and **automatically attaches it** to every later request to that site.
3. The server looks up the session id on each request: "ah, this is player 42".

That's the whole trick, and you'll build it yourself in Module 17.

## Talking HTTP with `curl`

`curl` lets you send requests from the terminal. Get comfortable with it, because it's invaluable for testing your API.

```bash
curl https://api.github.com/zen                       # GET, print the body
curl -i https://api.github.com/zen                    # include response headers
curl -v https://example.com                           # verbose: see the TLS handshake and request headers
curl -X POST https://httpbin.org/post \
  -H "Content-Type: application/json" \
  -d '{"player":"Ava","gold":120}'                    # POST JSON
curl -I https://example.com                           # HEAD: headers only
```

`httpbin.org` echoes back what you send, which makes it a great sandbox.

## HTTP versions, briefly

- **HTTP/1.1**: text-based, one request at a time per connection.
- **HTTP/2**: binary, many requests multiplexed over one connection, header compression. This is why bundling everything into one file matters less than it used to.
- **HTTP/3**: HTTP/2's ideas over QUIC (UDP). Better on flaky mobile networks.

You don't change your code for these. Your host and the browser negotiate the version.

## Check your understanding

1. A player taps "Sell all" and the request times out. Is it safe to retry automatically if it's a `POST /sell`? What if it's `PUT /inventory/trout` with body `{ quantity: 0 }`?
2. Which status code would you return when someone sends a save file with `gold: -5`?
3. What's the difference between `no-cache` and `no-store`?
4. What does `If-Match` protect against?
5. Why should a GET request never modify data?

<details><summary>Answers</summary>

1. The `POST` isn't idempotent: if the first request actually succeeded, retrying could sell again (or fail confusingly). The `PUT`, which sets quantity to 0, is idempotent, so retrying is safe.
2. `400 Bad Request` (or `422` if your API uses it for validation errors), with a body explaining what's wrong.
3. `no-cache` allows caching but requires revalidation before use. `no-store` forbids storing it at all.
4. Lost updates: overwriting a newer version of the resource that changed since you last read it, for example a save made on another device.
5. GETs are "safe" by contract. Browsers, prefetchers, crawlers and caches may issue or repeat them without the user meaning to.
</details>

## Further reading
- MDN: [An overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- MDN: [HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- MDN: [HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods)
- MDN: [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)

**Practice:** exercise `03-01` urls-and-query-strings → `npm run watch 03-01`

---
[← From URL to pixels](01-from-url-to-pixels.md) · [Module overview](README.md) · [Next: The browser: DOM, events & storage →](03-the-browser-dom-events-and-storage.md)
