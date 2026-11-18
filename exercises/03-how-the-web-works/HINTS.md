# Hints · Module 03

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 03-01 · urls-and-query-strings

<details><summary>Level 1 · Nudge</summary>

- `new URL(path, base)` resolves a path against a base.
- `url.searchParams` is a `URLSearchParams`, and it has `append`, `get` and `getAll`.
- `new URLSearchParams('?a=1')` parses a query string (the `?` is fine).
- `url.origin` exists.
- `new URL(...)` **throws** on invalid input.
</details>

<details><summary>Level 2 · Direction</summary>

- `buildUrl`: create the URL, loop over `Object.entries(params)`, skip `undefined`, `append` each value (loop over arrays). Return `url.toString()`.
- `parseQuery`: loop over the *unique* keys (`new Set(params.keys())`). Use `getAll(key)`, which returns one string or an array depending on its length.
- `getLeaderboardParams`: write a small `parseInteger(value: string | null): number | undefined` helper. `Number.isInteger(Number(v))` rejects `'1.5'` and `'abc'`, but watch out for `Number('')` being `0`.
- `isSafeRedirect`: resolve `target` against `appOrigin`, then compare `.origin`s and check `.protocol`. Wrap it in `try/catch`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- Clamping: `Math.min(100, Math.max(1, n))`.
- For the skill, write a type guard `isSkillId(v: string | null): v is SkillId` using `SKILLS.some((s) => s === v)` (`SKILLS.includes(v)` complains about the argument type, which is a well-known TS quirk with readonly tuples).
- Why does `'//evil.com'` resolve to evil.com? A URL starting with `//` is *protocol-relative*: it keeps the base's scheme but replaces the host. Comparing origins after resolving catches it automatically.
</details>

---

## 03-02 · typed-api-client

<details><summary>Level 1 · Nudge</summary>

- `super(message, { cause })` stores a cause on an `Error`.
- All three methods share 90% of their logic. Write one private `send(path, init)` function inside `createApiClient`.
- `response.headers.get('Content-Type')` might be `null`.
</details>

<details><summary>Level 2 · Direction</summary>

`send(path, init)`:
1. `try { response = await fetchFn(baseUrl + path, { ...init, credentials: 'include', headers: { Accept: 'application/json', ...init.headers } }) } catch (e) { throw new NetworkError(e) }`
2. If `!response.ok`, read the body (JSON or text, depending on the Content-Type) and `throw new HttpError(response.status, body)`.
3. Return the response.

Then `get` = `send` + `schema.parse(await response.json())`. `put` passes `method`, `Content-Type` and `body: JSON.stringify(body)`. `delete` just awaits `send`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- The `HttpError` constructor: call `super(\`HTTP ${status}\`)`, then set `this.name`, `this.status` and `this.body`. Declare `readonly status: number; readonly body: unknown;` as class fields.
- Merging headers: putting `Accept` first and spreading `init.headers` after it lets `put` add `Content-Type` without losing `Accept`. (This works because you pass plain objects. A `Headers` instance wouldn't spread.)
- Checking JSON: `response.headers.get('Content-Type')?.includes('application/json')`.
</details>

---

## 03-03 · vanilla-dom

<details><summary>Level 1 · Nudge</summary>

- `document.createElement`, `.textContent`, `.dataset`, `.append`, `container.replaceChildren(...)`.
- Delegation: `event.target.closest(selector)`.
- Every listener function must be a **named** reference so you can remove it.
- `instanceof HTMLInputElement`.
</details>

<details><summary>Level 2 · Direction</summary>

- `renderBank`: build the `<ul>` (or `<p>`) in memory, then `container.replaceChildren(node)` once. That clears the old content and inserts the new in a single step.
- `onSell`: inside the click handler, check `event.target instanceof Element`, find `closest('button[data-action="sell"]')`, then find that button's `closest('li')` and read `dataset.id`.
- `bindShortcuts`: look up `shortcuts[event.key.toLowerCase()]`. With `noUncheckedIndexedAccess`, it's `(() => void) | undefined`, so check it before calling.
- Each function returns `() => target.removeEventListener(type, sameHandler)`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- A typing target is `target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable`. jsdom doesn't implement `isContentEditable`, so also check `target.contentEditable === 'true'`.
- `event.key` for Shift+S is `'S'`, which is why you lowercase it.
- `onVisibilityChange` handler: `doc.visibilityState === 'hidden' ? callbacks.onHidden() : callbacks.onVisible()`.
</details>
