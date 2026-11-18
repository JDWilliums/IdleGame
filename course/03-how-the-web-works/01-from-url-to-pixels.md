# 03.1 · From URL to pixels

> ⏱ 75 min · Module 03 · How the Web Works

## What you'll learn
- The anatomy of a URL
- DNS, TCP and TLS: how your browser finds and securely connects to a server
- What the server sends back, and how the browser turns it into pixels
- How JavaScript loading affects rendering
- How an app built with Vite is actually delivered

---

## 1. The URL

```
  https://game.example.com:443/play/skills?tab=fishing#top
  └─┬─┘   └───────┬───────┘└┬┘└─────┬────┘└────┬────┘└┬─┘
 scheme         host       port    path       query  fragment
```

- **scheme**: `https` (encrypted) or `http`.
- **host**: a domain name. `game` is a *subdomain* of `example.com`.
- **port**: defaults to 443 for HTTPS and 80 for HTTP. Your dev server uses others (e.g. `5173`).
- **path**: which resource.
- **query**: key/value parameters (`?a=1&b=2`).
- **fragment**: `#top`. **Never sent to the server.** The browser uses it for in-page navigation.

**Origin** = scheme + host + port. `https://game.example.com` and `https://api.example.com` are *different origins*. This matters enormously for CORS and cookies (lessons 03.4 and 17.4).

## 2. DNS: finding the server

Computers connect by IP address (`93.184.216.34`), not by name. **DNS** (Domain Name System) translates names to addresses:

```
browser cache → OS cache → your router → ISP's resolver → root servers → .com servers → example.com's nameservers
                                                                   "game.example.com is 93.184.216.34"
```

The answer is cached for a period set by the record's TTL (time to live). When you deploy your game (lesson 20.2) you'll create DNS records: an `A`/`AAAA` record (name → IP) or a `CNAME` (name → another name, for example your hosting provider's).

## 3. TCP and TLS: a secure connection

1. **TCP handshake.** Browser and server agree to talk (SYN → SYN-ACK → ACK). This gives a reliable, ordered stream of bytes.
2. **TLS handshake.** For HTTPS, the server proves its identity with a **certificate** signed by a trusted authority, and both sides agree on encryption keys. After this, everything is encrypted: nobody on the café Wi-Fi can read your session cookie.

> Modern HTTP/3 runs over QUIC (UDP-based) and merges these steps to save round-trips, but the idea is the same.

HTTPS isn't optional for your game. **Secure cookies, service workers (PWA) and many browser APIs only work on HTTPS** (with an exception for `localhost` during development).

## 4. The HTTP request and response

The browser sends a request:

```http
GET /play/skills?tab=fishing HTTP/1.1
Host: game.example.com
Accept: text/html
Cookie: session=abc123
User-Agent: Mozilla/5.0 ...
```

The server responds:

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: no-cache

<!doctype html>
<html>…
```

Lesson 03.2 covers HTTP in depth.

## 5. The browser renders the page

```
HTML bytes → tokens → DOM tree ─┐
                                 ├─► Render tree → Layout → Paint → Composite → 🖥️
CSS bytes  → CSSOM ─────────────┘     (what's      (where     (pixels   (layers
                                       visible)     & how big)  per layer) combined)
```

1. **Parse HTML → DOM.** The browser reads the HTML top to bottom and builds the **DOM** (Document Object Model), a tree of element objects.
2. While parsing, it discovers `<link rel="stylesheet">`, `<script>` and `<img>` and **fetches them**.
3. **CSS → CSSOM.** Styles are parsed into a tree of rules. CSS is **render-blocking**: the browser won't paint until it has the CSS, to avoid a flash of unstyled content.
4. **Render tree.** DOM + CSSOM, visible elements only (`display: none` elements are excluded).
5. **Layout** (also called "reflow"): compute the position and size of every box.
6. **Paint**: fill in pixels (text, colours, borders, shadows).
7. **Composite**: combine layers on the GPU. Animating `transform` and `opacity` can skip layout and paint entirely, which is why they're the cheapest properties to animate (lesson 11.4).

After the first render, any DOM or style change can trigger some of these steps again. Changing an element's width means **layout → paint → composite**. Changing `transform` usually means **composite only**. You'll use this to make smooth progress bars in Module 14.

## 6. JavaScript and rendering

By default, a `<script>` **stops HTML parsing** until it has downloaded and run, because the script might change the document. That's why old advice said "put scripts at the end of `<body>`". Modern options:

```html
<script src="app.js" defer></script>   <!-- download in parallel, run after parsing, in order -->
<script src="ads.js" async></script>   <!-- download in parallel, run as soon as ready (any order) -->
<script type="module" src="main.js"></script>  <!-- modules are deferred by default -->
```

Vite outputs `<script type="module">`, so it's deferred automatically.

Remember lesson 01.4: JavaScript and rendering share **one main thread**. A long-running script delays rendering, and the page looks frozen.

## 7. How a React app built with Vite is delivered

When you run `npm run build`, Vite produces **static files**:

```
dist/
  index.html              ← a nearly empty shell: <div id="root"></div>
  assets/index-4f3a1c.js  ← all your React code, bundled and minified
  assets/index-9b2e7d.css
```

A visit to your game goes like this:
1. The browser downloads `index.html` (tiny).
2. It downloads the JS and CSS bundles.
3. React runs, builds the UI in JavaScript, and inserts it into `#root`.
4. From then on, navigating between "pages" happens **in the browser** without new HTML requests. That's a **Single-Page Application (SPA)**.
5. The app calls your **API** (a separate server) with `fetch` to load and save data.

The hash in `index-4f3a1c.js` changes whenever the content changes, so these files can be cached "forever" (`Cache-Control: max-age=31536000, immutable`), while `index.html` is always re-checked. You'll set this up in Module 20.

> **SPA vs server rendering.** Frameworks like Next.js render HTML on the server first (SSR) for faster first paint and SEO. An idle game behind a login doesn't need SEO, and an SPA is simpler, so that's what you'll build. Lesson 22.6 explains when SSR is worth it.

## 8. CDNs

Static files are usually served from a **CDN** (Content Delivery Network): copies of your files on servers around the world, so a player in Sydney downloads from Sydney, not from Frankfurt. Static hosts like Cloudflare Pages, Netlify and Vercel do this automatically.

## Check your understanding

1. Which part of `https://a.com/x?y=1#z` is never sent to the server?
2. Are `https://example.com` and `https://www.example.com` the same origin?
3. Why is CSS render-blocking?
4. Why is animating `transform` cheaper than animating `width`?
5. What does the `index.html` of a Vite-built React app mostly contain?

<details><summary>Answers</summary>

1. The fragment, `#z`.
2. No. The hosts differ, so they're different origins.
3. Painting without CSS would show unstyled content and then jump when the styles arrive. Browsers wait for CSS to avoid that flash and the extra layout work.
4. `width` changes trigger layout and paint for the element and possibly its neighbours. `transform` changes can usually be handled by the compositor (GPU) alone.
5. A mostly empty shell, with a root `<div>` and `<script type="module">`/`<link>` tags pointing at the hashed JS and CSS bundles.
</details>

## Further reading
- MDN: [How browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work)
- MDN: [What is a URL?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)
- web.dev: [Rendering performance](https://web.dev/articles/rendering-performance)

---
[Module overview](README.md) · [Next: HTTP in depth →](02-http-in-depth.md)
