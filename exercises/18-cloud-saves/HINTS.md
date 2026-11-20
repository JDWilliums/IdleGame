# Hints · Module 18

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 18-01 · save-endpoint

<details><summary>Level 1 · Nudge</summary>

Lesson 18.1, "The route, in outline", is most of `PUT`. You've built every piece before: a router with `requireAuth` (17-03), Zod body validation (15-03), and an `HttpError` with `details` (15-04). Read `provided.ts` first.
</details>

<details><summary>Level 2 · Direction</summary>

1. Create a `Router()`, mount it at `/api/save`, and put `requireAuth` on the whole router.
2. Write a tiny middleware that sets `Cache-Control: no-store` and calls `next()`. Run it **before** `requireAuth`, so even the 401s carry the header.
3. Write one `toJson(record)` that turns `updatedAt` into an ISO string. GET and the conflict both use it.
4. `PUT`: parse the body with a Zod schema (`baseRevision` and `data: SaveSchema`), call `saves.put`, and either respond with `{ revision, updatedAt }` or throw a 409 `HttpError` with `{ current }` as its details.
5. Body size: look at the options `express.json()` accepts.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **`'0'` (a string) was accepted as `baseRevision`?** Use `z.number()`, not `z.coerce.number()`. JSON bodies have real numbers, so a string means a broken client.
- **The 413 test gets a 200 or 404?** `express.json()`'s default limit is `100kb`, and the test body is about 70 KB. Pass `{ limit: '64kb' }`.
- **The conflict response has no `details`?** The fourth argument of the provided `HttpError` is the details object: `{ current: … }`.
- **`current` should be `null` when there's no save:** `result.current ? toJson(result.current) : null`.
- **`no-store` missing on 400s?** The `ZodError` is thrown inside the router, so any header you set *before* it in that router is kept. Make sure your header middleware runs first.
</details>

---

## 18-02 · conflict-resolution

<details><summary>Level 1 · Nudge</summary>

Task 2 is the four-row table in 18.3, "Four situations". Work out the two booleans first (`dirty` and "server changed"), and the rest is a few `if`s.
</details>

<details><summary>Level 2 · Direction</summary>

1. `summarise`: `Object.values(save.skills)` gives the `{ xp }` objects. Two sums.
2. `resolveConflict`: handle `remote === null` first. Then compute `serverChanged`, then one `if` per table row.
3. Recommendation: compare total XP, then `lastSavedAt`, and fall back to `'remote'`.
4. `describeSummary`: build the three parts and `join(' · ')`. `new Intl.NumberFormat('en-US').format(n)` adds the commas.
5. `applyChoice`: two object literals. Look at what stays the same between them (`baseRevision`).
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **The age:** compute `ms = now - lastSavedAt`, then check the units from smallest to largest: `< 60_000` gives "just now" (this also catches negative values), `< 3_600_000` gives minutes, and so on. Use `Math.floor` for the count.
- **Singular vs plural:** a helper like `(n, unit) => \`${n} ${unit}${n === 1 ? '' : 's'} ago\`` avoids repeating yourself.
- **"Treats a LOWER server revision as changed" fails?** Use `!==`, not `>`. A restored backup can make the server's revision go down, and that's still different from what we're based on.
- **"Does not mutate its inputs"?** Return new objects. Don't assign to `local.baseRevision`.
</details>

---

## 18-03 · sync-state-machine

<details><summary>Level 1 · Nudge</summary>

This is a `useReducer`-style reducer (08.1), but with a much bigger table. Write it as a `switch (event.type)`, and inside each case check `state.phase`. For anything that doesn't apply, `return state`.
</details>

<details><summary>Level 2 · Direction</summary>

1. `backoffMs`: `Math.min(1000 * 2 ** (attempt - 1), 60_000)`.
2. For each event, start the case with a guard: `if (state.phase !== 'syncing') return state;`.
3. Build new states with spread: `{ ...state, phase: 'error', attempt, retryAt }`.
4. For the "same object" rules, check *before* spreading: if the value you'd set is already there, return `state`.
5. `shouldSyncNow`: check `online` first, then `switch (state.phase)` with `dirty` and `error` cases, and `default: return false`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **`localChanged` has a different rule per phase.** A nested `switch (state.phase)` inside the `localChanged` case reads clearly.
- **`syncSucceeded`:** build the shared fields once (`baseRevision`, `attempt: 0`, `retryAt: null`, `lastSyncedAt`, `changedWhileSyncing: false`), then choose between the `dirty` and `idle` versions based on `state.changedWhileSyncing`, the **old** value, before you reset it.
- **`syncFailed`:** compute `const attempt = state.attempt + 1` first, then `retryAt: event.at + backoffMs(attempt)`.
- **`cameOnline`:** if already online, `return state`. Otherwise set `online: true`, and also `retryAt: event.at` only when the phase is `error`. A conditional spread does this neatly: `...(cond ? { retryAt: event.at } : {})`.
- **`conflictResolved`:** the new `baseRevision` comes from `state.conflict.revision`. Guard against `state.conflict` being `null`.
- **TypeScript complains a case doesn't return?** Make sure every path in every case ends in a `return`.
</details>

---

## 18-04 · trusted-offline-time

<details><summary>Level 1 · Nudge</summary>

Lesson 18.4 has the formulas: "Estimating the clock offset" for Task 1, "Using server time" for Task 2, and "Server-side plausibility checks" for Task 3. Each task is a small, pure function.
</details>

<details><summary>Level 2 · Direction</summary>

1. **Offset**: loop over the samples, keep the best one so far (the smallest non-negative round trip), and compute the offset from it at the end.
2. **Offline time**: `raw = Math.max(0, serverNow - lastSaveServerTime)`, then `Math.min` for the cap. Tamper detection compares `clientElapsedMs` with `raw` using `Math.abs`.
3. **Progress**:
   - Collect every skill name from both saves into a `Set`, then sort it.
   - For each skill, read the XP before and after (`?? 0`), and check the three cases **in order**.
   - Check gold last.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **"First of equal samples" fails?** Replace the best sample only when the new round trip is strictly **less** (`<`, not `<=`).
- **The budget:** `Math.floor(rate * (elapsedMs + slackMs) / 1000)`. Rates are per **second** and times are in **milliseconds**.
- **Order of checks for a skill:** a decrease is reported even for unknown skills, so check `after < before` first. Then "no rate for this skill" (only if it has XP), then "too fast".
- **`limits.maxXpPerSecond[skill]` is `number | undefined`** under `noUncheckedIndexedAccess`. That's exactly the "unknown skill" check.
- **Don't flag gold going down.** Only `gained > allowed` matters, and a negative gain never exceeds the allowance.
</details>
