# Hints · Module 13

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 13-01 · game-data

<details><summary>Level 1 · Nudge</summary>

Tasks 1–3 are the `as const satisfies` + `keyof typeof` pattern from 02-01. The validator is a loop with a few `if`s, in the order given.
</details>

<details><summary>Level 2 · Direction</summary>

- `ItemStack = { item: ItemId; qty: number }`, and `ActionDefinition` uses `SkillId` and `readonly ItemStack[]`.
- After `ACTIONS` is typed, `const ACTION_IDS = Object.keys(ACTIONS) as ActionId[]` (a documented, safe cast) at module level.
- Sort: `(a, b) => ACTIONS[a].level - ACTIONS[b].level || ACTIONS[a].name.localeCompare(ACTIONS[b].name)`.
- Validator: `Object.entries(actions)` preserves key order. Use `Object.hasOwn(skills, action.skill)` for membership. Track a `badQuantity` boolean so that message appears once.
</details>

<details><summary>Level 3 · Walkthrough</summary>

For "skills with no actions": build `new Set(Object.values(actions).map((a) => a.skill))` and check each key of `skills` against it.

The level check is `!Number.isInteger(level) || level < 1 || level > 99`, and the quantity check is `!(Number.isInteger(qty) && qty > 0)`.
</details>

---

## 13-02 · xp-curve

<details><summary>Level 1 · Nudge</summary>

Build the table with an IIFE (`(() => { … })()`) and a running sum. Lesson 13.6 shows the binary search.
</details>

<details><summary>Level 2 · Direction</summary>

- Start the table as `[0, 0]`. For `level` from 1 to 98: `points += Math.floor(level + 300 * 2 ** (level / 7))`, then push `Math.floor(points / 4)`. That pushes levels 2..99.
- `levelFromXp`: `lo = 1, hi = MAX_LEVEL`. While `lo < hi`: `mid = Math.ceil((lo + hi) / 2)`. If `XP_TABLE[mid] <= xp`, set `lo = mid`, otherwise `hi = mid - 1`.
- `timeToLevel`: `Math.ceil(remainingXp / xpPerAction) * actionMs`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

If your values are slightly off (e.g. 82 instead of 83), check that the inner `Math.floor` is applied **per term** and the `/ 4` floor is applied to the **running total**, not per term.

With `noUncheckedIndexedAccess`, `XP_TABLE[mid]` is `number | undefined`. Use `XP_TABLE[mid] ?? Infinity` in comparisons.
</details>

---

## 13-03 · fixed-timestep-loop

<details><summary>Level 1 · Nudge</summary>

Three closure variables: `running`, `last` and `accumulator`. `frame()` is the accumulator loop from lesson 13.4.
</details>

<details><summary>Level 2 · Direction</summary>

- `start()`: if already running, return. Otherwise `running = true; last = now(); accumulator = 0;`.
- `frame()`: `const current = now(); accumulator += Math.max(0, current - last); last = current;`, then a `while` loop with a `steps` counter.
- After the loop, `if (accumulator >= stepMs)`, the cap was hit: `remainder = accumulator % stepMs`, report `accumulator - remainder`, and set `accumulator = remainder`.
- Finally `render?.(accumulator / stepMs)`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why does `start()` reset `last` to `now()`? So the time spent stopped isn't fed into the accumulator by the next `frame()`. That time belongs to offline progress, which calculates it properly instead of the loop dropping or simulating it.
</details>

---

## 13-04 · action-ticks

<details><summary>Level 1 · Nudge</summary>

Follow lesson 13.5's algorithm exactly: `progress`, `possible`, `affordable`, `completions`, `ranOut`. Write two helpers first: `affordableRepetitions(bank, inputs)` and `applyStacks(bank, stacks, times, sign)`.
</details>

<details><summary>Level 2 · Direction</summary>

- `affordableRepetitions`: `Infinity` with no inputs, otherwise `Math.min(...inputs.map((i) => Math.floor((bank[i.item] ?? 0) / i.qty)))`.
- `applyStacks`: copy the bank (`{ ...bank }`), then for each stack add `sign * qty * times`, and `delete` the key if it hits 0. Deleting from **your own fresh copy** isn't a mutation of the input.
- Build the new state with spreads: `skills: { ...state.skills, [skill]: { xp: newXp } }`, which leaves other skills as the same references.
- Level up: compare `levelFromXp(oldXp)` with `levelFromXp(newXp)`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Order of operations in `tick`:
1. Early return the same state if idle or `dtMs <= 0`.
2. `possible === 0` → return a state with only `progressMs` updated.
3. If `completions > 0`: new bank, skills and stats, plus the events (`actionCompleted`, `itemsUsed`…, `itemsGained`…, `xpGained`, maybe `levelUp`).
4. If `ranOut`: `activeAction: null` plus the `actionStopped` event. Otherwise `activeAction: { id, progressMs: progress - possible * duration }`.

Note the remainder uses `possible`, not `completions`. When you didn't run out, they're equal anyway.
</details>

---

## 13-05 · seeded-rng-and-loot

<details><summary>Level 1 · Nudge</summary>

Copy mulberry32 from lesson 13.7 exactly. Everything else builds on `rng()` returning `[0, 1)`.
</details>

<details><summary>Level 2 · Direction</summary>

- `randomInt`: `min + Math.floor(rng() * (max - min + 1))`.
- `rollWeighted`: sum the positive weights, `roll = rng() * total`, then subtract each positive weight until `roll < 0`.
- `rollLoot`: an `add(item, qty)` helper that ignores 0. Roll in the order always → chance → oneOf.
- `expectedLoot`: accumulate unrounded totals per item, then floor at the end.
</details>

<details><summary>Level 3 · Walkthrough</summary>

In `rollLoot`, a chance entry consumes **one** rng call for the chance check and, only if it hits, **another** for the quantity. The first test relies on that exact sequence: `fixed(0, 0.1, 0, 0.9)` → always qty (0) → chance check (0.1, hit) → bottle qty (0) → oneOf pick (0.9).

In `expectedLoot`, flooring each source separately would lose fractions (0.5 + 0.5 should be 1). Add first, then floor. A tiny epsilon (`Math.floor(x + 1e-9)`) guards against `199.99999999`.
</details>

---

## 13-06 · offline-progress

<details><summary>Level 1 · Nudge</summary>

The provided `tick` handles any `dt` in O(1), so offline progress is **one** call to it. The work is in the summary.
</details>

<details><summary>Level 2 · Direction</summary>

- `appliedMs = Math.min(Math.max(0, elapsedMs), capMs)`, then `tick(state, appliedMs)`.
- Loop over the returned **events** with a `switch` to fill `completions`, `itemsGained`, `itemsUsed`, `xpGained` and `stoppedReason`.
- `levelsGained`: compare `levelFromXp` before and after for `ACTIONS[actionId].skill`.
- `catchUp`: compute `now - state.lastUpdatedAt`, call `calculateOfflineProgress`, then set `lastUpdatedAt: Math.max(state.lastUpdatedAt, now)`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why not compute `levelsGained` from the `levelUp` event? There's at most one event, with the *final* level, but you need the difference. The XP before and after gives it directly.

The 30-day performance test fails if you loop `tick(state, 100)` over the elapsed time (26 million iterations). That's the whole point of lesson 13.8.
</details>

---

## 13-07 · format-numbers

<details><summary>Level 1 · Nudge</summary>

Handle the special cases first (NaN, negatives, Infinity, small numbers, huge numbers), then pick a unit, round, and check for rollover.
</details>

<details><summary>Level 2 · Direction</summary>

- Unit index: `Math.floor(Math.log10(n) / 3)` (1 → K, 2 → M…), and `value = n / 1000 ** unit`.
- Decimals for 3 significant digits: `value >= 100 ? 0 : value >= 10 ? 1 : 2`.
- Round, and **if the rounded value is ≥ 1000**, move to the next unit and recompute.
- Also re-check the decimals after rounding: 99.96K rounds to 100.0 (1 decimal), but it should be shown as "100K".
- `roundTo`: work with `Math.abs(n)`, scale, nudge by `(1 + Number.EPSILON)`, `Math.round`, then put the sign back.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Small numbers: `String(roundTo(n, 2))`. Converting a number to a string drops trailing zeros for you (`12.50` → `"12.5"`).

Big numbers: use `rounded.toFixed(decimals)`, which *keeps* trailing zeros (`"1.00M"`), as the spec requires.

Scientific: `n.toExponential(2)` gives `"1.00e+21"`, so `.replace('e+', 'e')`.
</details>

---

## 13-08 · save-migrations

<details><summary>Level 1 · Nudge</summary>

Validate → migrate → validate. Check the version first, in the order the errors are listed.
</details>

<details><summary>Level 2 · Direction</summary>

- v1→v2: sum duplicate ids into a `totals` object, then `Object.fromEntries(Object.entries(totals).filter(([, q]) => q > 0))`.
- v2→v3: `const { log, ...rest } = save.bank`. If `log` is defined, `oak_log: (rest.oak_log ?? 0) + log`.
- `loadSave`: after `JSON.parse`, check it's a non-null, non-array object with `'version' in raw && typeof raw.version === 'number'`. Then the newer-version check, then the integer ≥ 1 check, then a `safeParse` with the matching schema.
- Export: `TextEncoder` → bytes → a binary string → `btoa`. Import: the reverse with `atob`, `Uint8Array.from(binary, (c) => c.charCodeAt(0))` and `TextDecoder`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why validate *before* migrating as well as after? A migration written for valid v1 data might throw or produce garbage on corrupt input (e.g. `items` not being an array). Validating the input at its own version turns that into a clean `'Save is corrupted'`.

`atob` throws on invalid base64 characters, so wrap the decode in `try/catch`. `new TextDecoder('utf-8', { fatal: true })` also throws on invalid UTF-8, which is a nice extra safeguard.
</details>
