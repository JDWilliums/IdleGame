# 01.5 · async/await & error handling

> ⏱ 75 min · Module 01 · JavaScript You'll Use Every Day

## What you'll learn
- `async`/`await` as a nicer syntax for promises
- Error handling with `try`/`catch`/`finally`, custom error classes and `cause`
- Sequential vs parallel async work, and the `forEach` trap
- Timeouts and cancellation with `AbortController`
- Retrying with exponential backoff (you'll use it for cloud saves)

---

## `async`/`await`

An `async` function **always returns a promise**. Inside it, `await` pauses *that function* (not the whole program) until a promise settles:

```js
async function loadSave() {
  const response = await fetch('/api/save');   // pause until the response arrives
  const save = await response.json();          // pause until the body is parsed
  return save;                                  // the promise fulfils with `save`
}

loadSave().then((save) => console.log(save));  // callers still get a promise
```

While `loadSave` is paused, the event loop keeps running other code. Clicks still work. `await` is built on microtasks: everything after an `await` resumes in a microtask once the awaited promise settles.

> `await` only works inside `async` functions, or at the top level of an ES module ("top-level await").

## Errors

### `throw` real `Error` objects
```js
throw new Error('Not enough logs');     // ✅ has a message AND a stack trace
throw 'Not enough logs';                // ❌ a string, with no stack trace
```

### `try` / `catch` / `finally`
With `await`, a rejected promise **throws** at the `await` line, so ordinary `try/catch` works:

```js
async function saveGame(state) {
  showSpinner();
  try {
    const res = await fetch('/api/save', { method: 'PUT', body: JSON.stringify(state) });
    if (!res.ok) throw new Error(`Save failed with HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Could not save', error);
    throw error;          // re-throw if the caller needs to know
  } finally {
    hideSpinner();        // always runs: success, failure or return
  }
}
```

> ⚠️ `fetch` only rejects on **network failure**. A `404` or `500` response *fulfils* normally. You must check `res.ok` yourself. Lesson 03.4 covers this.

### What type is the caught error?
In TypeScript, `catch (error)` gives you `unknown`, because anything can be thrown. Narrow it before you use it:

```ts
try { /* ... */ } catch (error) {
  const message = error instanceof Error ? error.message : String(error);
}
```

### Custom error classes
Custom errors let callers react differently to different failures:

```js
class NotEnoughItemsError extends Error {
  constructor(itemId, needed, have) {
    super(`Need ${needed} ${itemId}, have ${have}`);
    this.name = 'NotEnoughItemsError';
    this.itemId = itemId;
  }
}

try {
  craft('bronze_bar');
} catch (e) {
  if (e instanceof NotEnoughItemsError) showToast(e.message);
  else throw e;        // unknown errors: don't swallow them!
}
```

Wrap low-level errors without losing them using `cause`:

```js
catch (e) {
  throw new Error('Could not load your save', { cause: e });
}
```

## Sequential vs parallel

```js
// Sequential: each waits for the previous one. Total ≈ a + b + c
const a = await getA();
const b = await getB();
const c = await getC();

// Parallel: start all three, then wait. Total ≈ max(a, b, c)
const [a2, b2, c2] = await Promise.all([getA(), getB(), getC()]);
```

Use sequential when each step **depends** on the previous one (log in → then load *that user's* save), or when you must not overload a server. Otherwise, go parallel.

### The `forEach` trap

```js
// ❌ forEach ignores the returned promises, so "done" logs BEFORE the saves finish
items.forEach(async (item) => { await save(item); });
console.log('done');

// ✅ Parallel
await Promise.all(items.map((item) => save(item)));

// ✅ Sequential (one at a time, in order)
for (const item of items) {
  await save(item);
}
```

## Timeouts and cancellation

Network requests can hang. Two tools help.

**A timeout with `Promise.race`.** Whichever settles first wins:

```js
function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms));
}
const data = await Promise.race([fetch(url), timeout(5000)]);
```

The catch: the slow `fetch` keeps running in the background. To actually **cancel** it, use an `AbortController`:

```js
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
const res = await fetch(url, { signal: controller.signal });  // rejects with AbortError on abort

// Shorthand for the same thing:
const res2 = await fetch(url, { signal: AbortSignal.timeout(5000) });
```

> 🧠 You'll use `AbortController` again in lesson 10.3 to stop **race conditions** in React, where an old, slow request finishes after a newer one and overwrites fresh data.

## Retrying with exponential backoff

Networks fail temporarily: the player walks into a tunnel, or the server restarts. Retrying straight away hammers a struggling server, so instead **wait longer after each failure**:

```
attempt 1 fails → wait 500ms
attempt 2 fails → wait 1000ms
attempt 3 fails → wait 2000ms
attempt 4 fails → give up, throw the last error
```

delay = `baseDelay × 2^attemptNumber`. Production systems also add **jitter** (a random ± amount), so that thousands of clients don't all retry at the same instant. You'll implement a version in exercise 01-04, and your cloud-save code will use it in Module 18.

## ⚠️ Common mistakes

```js
// 1. Forgetting await: you get a Promise object, not the data
const save = fetch('/api/save');      // Promise {<pending>}

// 2. Swallowing errors silently
try { await risky(); } catch {}        // the bug disappears and comes back as mystery behaviour

// 3. Not checking res.ok
const data = await (await fetch(url)).json();   // a 500 error page gets parsed as JSON → crash

// 4. Sequential awaits when parallel would do (slow pages)
// 5. async callbacks in forEach (see above)
```

## Check your understanding

1. What does an `async` function return if you `return 5` from it?
2. Why doesn't `try/catch` around a `fetch` catch a 404?
3. Rewrite this to run in parallel: `const a = await loadA(); const b = await loadB();` (neither depends on the other).
4. What does `Promise.race` + timeout *not* do that `AbortController` does?
5. Why exponential backoff instead of retrying every 100 ms?

<details><summary>Answers</summary>

1. A promise that fulfils with `5`.
2. `fetch` only rejects on network errors. A 404 is a successful HTTP exchange, so the promise fulfils, and you have to check `res.ok` or `res.status` yourself.
3. `const [a, b] = await Promise.all([loadA(), loadB()]);`
4. It doesn't cancel the underlying request. The request keeps running and using resources. `AbortController` actually aborts it.
5. If the server is struggling, rapid retries from many clients make things worse. Backing off gives it time to recover and saves the client's battery and data.
</details>

## Further reading
- MDN: [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- MDN: [Error, including `cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- MDN: [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

**Practice:** exercise `01-04` async-control-flow → `npm run watch 01-04`

---
[← The event loop, timers & promises](04-the-event-loop-timers-and-promises.md) · [Module overview](README.md) · [Next: Modules →](06-modules.md)
