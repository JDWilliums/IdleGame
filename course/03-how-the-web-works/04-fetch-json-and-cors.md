# 03.4 · fetch, JSON & CORS

> ⏱ 120 min · Module 03 · How the Web Works

## What you'll learn
- `fetch` in full: methods, headers, bodies, credentials, abort
- Proper error handling: network errors vs HTTP errors vs bad data
- JSON's quirks
- The same-origin policy and CORS: why the errors happen and how they're fixed
- Wrapping `fetch` in a small typed API client

---

## `fetch` in full

```ts
const response = await fetch('https://api.example.com/save', {
  method: 'PUT',                                   // default is GET
  headers: {
    'Content-Type': 'application/json',            // what we're sending
    Accept: 'application/json',                    // what we want back
  },
  body: JSON.stringify({ gold: 120 }),             // must be a string (or FormData, Blob…)
  credentials: 'include',                          // send cookies cross-origin (see CORS below)
  signal: AbortSignal.timeout(10_000),             // give up after 10s
});
```

The `Response` object:

```ts
response.ok;          // true if the status is 200–299
response.status;      // 409
response.statusText;  // "Conflict" (often empty over HTTP/2; don't rely on it)
response.headers.get('Content-Type');
await response.json();   // parse the body as JSON (throws if it isn't valid JSON)
await response.text();   // body as a string
```

> ⚠️ The body is a **stream** you can read only **once**. Calling `.json()` and then `.text()` throws "body already used".

## The three ways a request can fail

```ts
async function getSave(): Promise<SaveFile> {
  let response: Response;
  try {
    response = await fetch('/api/save', { credentials: 'include' });
  } catch (error) {
    // 1. NETWORK failure: offline, DNS failed, CORS blocked, aborted.
    //    fetch REJECTS only in these cases.
    throw new Error('Could not reach the server', { cause: error });
  }

  if (!response.ok) {
    // 2. HTTP error: the server answered, but with 4xx/5xx.
    //    fetch does NOT reject for these. You must check.
    throw new Error(`Server responded ${response.status}`);
  }

  const data: unknown = await response.json();
  // 3. BAD DATA: valid HTTP, wrong shape. Validate at the boundary (02.7).
  return SaveFileSchema.parse(data);
}
```

Each failure deserves different handling in the UI:
1. **Network** → "You're offline. We'll keep saving locally and sync later."
2. **HTTP** → depends on the status: 401 means show the login screen, 409 means show the conflict dialog, 5xx means retry later.
3. **Bad data** → a bug. Log it and show a generic error.

## JSON quirks

```js
JSON.stringify({ a: undefined, b: () => 1, c: NaN, d: new Date(0), e: new Map() });
// '{"c":null,"d":"1970-01-01T00:00:00.000Z","e":{}}'
```

- `undefined` and functions are **dropped**, and `NaN`/`Infinity` become `null`.
- `Date`s become ISO **strings**. They don't turn back into `Date`s when parsed.
- `Map`/`Set` become `{}`.
- Large integers above `2^53` lose precision (use strings for big ids).

That's why save data uses plain objects, arrays, strings, numbers and booleans, with timestamps stored as **numbers** (milliseconds since 1970).

## The same-origin policy

Browsers run code from many sites at once: your game, an ad iframe, a malicious page in another tab. Without restrictions, `evil.com` could run `fetch('https://bank.com/api/balance', { credentials: 'include' })` and read your bank balance using your cookies.

The **same-origin policy** prevents this: by default, JavaScript on one origin **can't read responses** from another origin.

But your game legitimately needs to call your API, and they may be on different origins:

```
https://game.example.com   (frontend, static host)
https://api.example.com    (backend, Node host)   ← different origin!
```

## CORS: controlled exceptions

**Cross-Origin Resource Sharing** lets a server say "I allow these other origins to read my responses". The browser enforces it.

### Simple requests
For basic GETs (and some POSTs), the browser sends the request with an `Origin` header and checks the response:

```http
GET /api/leaderboard
Origin: https://game.example.com

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://game.example.com     ← "yes, that origin may read this"
```

If the header is missing or doesn't match, the browser **hides the response** from your JavaScript and logs a CORS error. The request still reached the server; your code just can't see the answer.

### Preflight requests
For "non-simple" requests (`PUT`, `DELETE`, `Content-Type: application/json`, custom headers), the browser first sends an **OPTIONS preflight** to ask permission:

```http
OPTIONS /api/save
Origin: https://game.example.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://game.example.com
Access-Control-Allow-Methods: GET, PUT, DELETE
Access-Control-Allow-Headers: content-type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 600          ← cache this permission for 10 minutes
```

Only if the preflight passes does the browser send the real `PUT`.

### Cookies across origins
Cross-origin requests **don't send cookies** unless:
1. the client sets `credentials: 'include'`, **and**
2. the server responds with `Access-Control-Allow-Credentials: true`, **and**
3. `Access-Control-Allow-Origin` is a **specific origin**, not `*`, **and**
4. the cookie's own `SameSite` and `Secure` settings allow it (lesson 17.4).

That last point is why many teams avoid the cross-origin problem entirely by serving the API from the **same origin** (`https://game.example.com/api/...`) through a proxy or rewrite rule. You'll make that choice in lesson 20.2.

### Why `curl` works but the browser doesn't
CORS is a **browser** security feature that protects *users*. `curl`, Postman and your server-side code don't apply it. If something works in `curl` but fails in the browser with a CORS error, the server is missing or misconfiguring its `Access-Control-Allow-*` headers.

### In development: the Vite proxy
During development your frontend runs on `http://localhost:5173` and your API on `http://localhost:3000`, which are different origins. The easiest fix is to let Vite **proxy** API requests, so the browser only ever talks to one origin:

```ts
// vite.config.ts (you'll set this up in the capstone)
export default defineConfig({
  server: {
    proxy: { '/api': 'http://localhost:3000' },   // /api/* is forwarded to the backend
  },
});
```

Now the frontend calls `fetch('/api/save')`, which is same-origin, with no CORS and no cookie problems.

> ⚠️ **CORS is not authentication.** It stops *other websites* reading responses in a browser. It doesn't stop anyone calling your API directly with `curl`. Your server must still check sessions and validate input on every request.

## A small typed API client

Wrapping `fetch` once means every call gets the same error handling, headers and validation:

```ts
class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...init?.headers },
  });
  const body: unknown = response.headers.get('content-type')?.includes('json')
    ? await response.json()
    : await response.text();
  if (!response.ok) throw new HttpError(response.status, body);
  return schema.parse(body);
}

const save = await request('/save', SaveFileSchema);   // typed SaveFile
```

You'll build a fuller version in exercise 03-02. In Module 10 you'll combine it with TanStack Query.

## Check your understanding

1. Your app shows "Saved!" even though the server returned 500. What bug probably caused it?
2. What three things must be true for a cross-origin `fetch` to include cookies?
3. Why does a `PUT` with a JSON body trigger a preflight but a simple GET doesn't?
4. Does CORS protect your API from cheaters sending fake saves with `curl`?
5. What happens to a `Date` object inside `JSON.stringify`?

<details><summary>Answers</summary>

1. The code didn't check `response.ok`. `fetch` resolves normally for 500s.
2. `credentials: 'include'` on the client, `Access-Control-Allow-Credentials: true` from the server, and a specific (not `*`) `Access-Control-Allow-Origin`. The cookie's `SameSite`/`Secure` attributes must also allow it.
3. `PUT` and `Content-Type: application/json` aren't in the "simple request" set, so the browser asks permission with an `OPTIONS` preflight first.
4. No. CORS is enforced by browsers. The server must authenticate and validate every request itself.
5. It becomes an ISO date string, and `JSON.parse` won't turn it back into a `Date`.
</details>

## Further reading
- MDN: [Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- MDN: [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- MDN: [Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)

**Practice:** exercise `03-02` typed-api-client → `npm run watch 03-02`

---
[← The browser: DOM, events & storage](03-the-browser-dom-events-and-storage.md) · [Module overview](README.md) · [Next module: HTML & CSS, Mobile-First →](../04-html-css-mobile-first/README.md)
