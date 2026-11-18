# Module 03 · How the Web Works

**Time:** ~10 hours · **Prerequisites:** Modules 01–02

## Why this module matters
React is a layer on top of the browser, and your game's backend is a layer on top of HTTP. When something breaks (a CORS error, a cookie that won't stick, a save that vanished on iOS, a page that freezes), the cause is almost always down at this level. Developers who understand the platform debug in minutes what others debug in days. Interviewers love "what happens when you type a URL" for exactly this reason.

## Learning objectives
By the end of this module you can:
- walk through everything that happens between typing a URL and seeing a rendered page
- read and write HTTP requests and responses, and pick the right method and status code
- manipulate the DOM, handle events with delegation, and clean up listeners
- choose between cookies, `localStorage`, `sessionStorage` and IndexedDB, and know their limits
- use `fetch` properly (errors, JSON, abort, credentials) and explain CORS

## Lessons
| # | Lesson | Time |
|---|---|---|
| 03.1 | [From URL to pixels](01-from-url-to-pixels.md) | 75 min |
| 03.2 | [HTTP in depth](02-http-in-depth.md) | 120 min |
| 03.3 | [The browser: DOM, events & storage](03-the-browser-dom-events-and-storage.md) | 120 min |
| 03.4 | [fetch, JSON & CORS](04-fetch-json-and-cors.md) | 120 min |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `03-01` | [urls-and-query-strings](../../exercises/03-how-the-web-works/01-urls-and-query-strings/exercise.ts) | 03.2 |
| `03-02` | [typed-api-client](../../exercises/03-how-the-web-works/02-typed-api-client/exercise.ts) | 03.4 |
| `03-03` | [vanilla-dom](../../exercises/03-how-the-web-works/03-vanilla-dom/exercise.ts) | 03.3 |

Hints: [`exercises/03-how-the-web-works/HINTS.md`](../../exercises/03-how-the-web-works/HINTS.md)

## Checkpoint quiz
1. List the main steps between pressing Enter on `https://game.example.com` and seeing the page.
2. Which HTTP methods are idempotent? Why does that matter for retrying a request?
3. What's the difference between a 401 and a 403?
4. Why is `element.innerHTML = userInput` dangerous, and what should you use instead?
5. What is event delegation, and when does it help?
6. Why is `localStorage` alone not enough to keep an idle game's progress safe on an iPhone?
7. Your `fetch` to the API fails with a CORS error, but the same request works with `curl`. Why?
8. Does `fetch` reject on a 500 response?

<details><summary>Answers</summary>

1. URL parsing → DNS lookup → TCP connection → TLS handshake → HTTP request → server response → HTML parsing into the DOM (fetching CSS and JS as discovered) → CSSOM → render tree → layout → paint → composite. JavaScript runs along the way.
2. GET, PUT, DELETE (and HEAD and OPTIONS). Repeating them has the same effect as doing them once, so they're safe to retry. POST isn't idempotent, and retrying it might create duplicates.
3. 401 Unauthorized means "I don't know who you are" (not logged in, or the session expired). 403 Forbidden means "I know who you are, and you're not allowed".
4. It parses the string as HTML, so a malicious `<img onerror=…>` runs script (XSS). Use `textContent` for text. React escapes text automatically.
5. You attach one listener to a parent and check `event.target` to see which child was clicked. It handles children added later and avoids hundreds of listeners.
6. Safari can delete script-writable storage (including `localStorage`) for sites the user hasn't interacted with for 7 days, the user can clear it, and it's tied to one browser on one device. You need a server-side save.
7. CORS is enforced by **browsers**, to protect users. `curl` doesn't apply it. The server must send the right `Access-Control-Allow-*` headers for the browser to let your page read the response.
8. No. It only rejects on network failure. You must check `response.ok`.
</details>

## Extra practice
1. **curl tour.** Use `curl -i` and `curl -v` against `https://api.github.com/users/<your-username>`. Identify the status line, five response headers, and the TLS handshake in the verbose output.
2. **DevTools Network tab.** Load any site with the Network tab open. Find a request served from cache, a `304 Not Modified`, a preflight `OPTIONS` request (if any), and the waterfall for the main document.
3. **Build a to-do list with no framework.** Use plain DOM APIs, event delegation and `localStorage`. You'll appreciate React much more afterwards.
4. **Storage limits.** In the console, write a loop that stores increasingly large strings in `localStorage` until it throws. What's the error, and roughly how much fit?

**Next:** [Module 04 · HTML & CSS, Mobile-First →](../04-html-css-mobile-first/README.md)
