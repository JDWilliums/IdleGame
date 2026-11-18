# Hints · Module 07

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 07-01 · snapshot-bugs

> In the test output you'll see `TypeError: Cannot assign to read only property 'hp'`. That's not a problem with the test, it's one of the bugs showing itself. Something is mutating an object it doesn't own.

<details><summary>Level 1 · Nudge</summary>

Each bug matches one section of lesson 07.1:
- *The classic puzzle*
- *Even with time passing*
- *Updating arrays in state*
- *Updating objects in state* (and lesson 01.1's "shallow copy" warning)
</details>

<details><summary>Level 2 · Direction</summary>

- `TripleXpButton` and `DelayedCollect`: the setter reads `xp`/`gold` from this render's snapshot. Make the update *relative to the latest value* instead.
- `ActivityLog`: `push` + passing the same array back. React compares references.
- `PlayerHealth`: `{ ...player }` copies one level. Which object is `next.stats`?
</details>

<details><summary>Level 3 · Walkthrough</summary>

- `setXp((x) => x + 1)` (three times) and `setGold((g) => g + 10)`.
- `setEntries((prev) => [...prev, \`Entry ${prev.length + 1}\`])`.
- `setPlayer((p) => ({ ...p, stats: { ...p.stats, hp: Math.max(0, p.stats.hp - 3) } }))`.
</details>

---

## 07-02 · lifting-state

<details><summary>Level 1 · Nudge</summary>

Three pieces of state in `ShopScreen`: `gold`, `ownedIds` and `selectedId`. Everything else (owned items, the selected item, can-afford, is-owned) is derived.
</details>

<details><summary>Level 2 · Direction</summary>

- `const selected = items.find((i) => i.id === selectedId) ?? null;`
- Pass down **data + callbacks**: `ShopList` gets `items`, `gold`, `ownedIds`, `onBuy`, `onSelect`. `OwnedList` gets the owned items and `onSell`. `ItemDetails` gets `item` and `isOwned`.
- `handleBuy(item)` updates gold and ownedIds. `handleSell(item)` does the reverse, refunding `Math.floor(price / 2)`.
- `aria-label={\`Buy ${item.name}\`}` gives the button the accessible name the tests use, while its visible text is "Buy" or "Owned".
</details>

<details><summary>Level 3 · Walkthrough</summary>

- Owned items in purchase order: `ownedIds.map((id) => items.find((i) => i.id === id))`, then filter out `undefined` with a type predicate: `.filter((i): i is ShopItem => i !== undefined)`.
- `<section aria-label="Details">` gets the ARIA role `region`, which is why the test uses `getByRole('region', { name: 'Details' })`.
- Why does the "in sync" test pass automatically with this structure? `ItemDetails` receives `isOwned` computed from `ownedIds` on **every** render. There's no copy to go stale.
</details>

---

## 07-03 · use-interval

<details><summary>Level 1 · Nudge</summary>

Two effects and one ref. One effect keeps the ref up to date. The other owns the interval.
</details>

<details><summary>Level 2 · Direction</summary>

1. `const savedCallback = useRef(callback);`
2. An effect with **no dependency array** that sets `savedCallback.current = callback`.
3. An effect with `[delay]`: if `delay === null`, return early. Otherwise `setInterval(() => savedCallback.current(), delay)` and return a cleanup that clears it.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why does the interval call `() => savedCallback.current()` and not `savedCallback.current` directly? `setInterval(savedCallback.current, delay)` would capture the *function that's in the ref right now*, which brings the stale closure back. The arrow reads `.current` **at each tick**, so it always gets the latest one.

Why is StrictMode fine? Its setup → cleanup → setup sequence clears the first interval before creating the second, so only one ever runs. That works because your cleanup is correct.
</details>

---

## 07-04 · use-local-storage

<details><summary>Level 1 · Nudge</summary>

- `useState(() => …)` for the one-time read.
- One effect to write (`[key, value]`).
- One effect to subscribe to `storage` events (with cleanup).
- `try/catch` around both `JSON.parse` and `setItem`.
</details>

<details><summary>Level 2 · Direction</summary>

- Write a helper `parse(raw: string | null, fallback, validate)`: return `fallback` for `null`, for invalid JSON, or when `validate` rejects. Use it for the initial read *and* for storage events.
- React's `setValue` from `useState` already accepts a value or an updater, so return it directly.
- For the `storage` listener: `if (event.key !== key) return;`. A `null` `newValue` means the key was removed.
</details>

<details><summary>Level 3 · Walkthrough</summary>

A subtle point: callers often pass `validate` as an inline function and `initialValue` as an inline object, so both are new on every render. If your `storage` effect lists them as dependencies, it will unsubscribe and resubscribe every render. Two solutions:
1. The latest-ref pattern from 07.6: store `{ initialValue, validate }` in a ref updated every render, read it inside the listener, and give the effect deps `[key]`.
2. `useEffectEvent` for the handler.

Both satisfy the tests. The ref version is what the reference solution uses.
</details>

---

## 07-05 · countdown-timer

<details><summary>Level 1 · Nudge</summary>

- Model the status as a union: `'idle' | 'running' | 'paused' | 'done'`.
- Store **when** things happened (timestamps), not how many ticks occurred.
- Derive `elapsed`, `fraction` and `secondsLeft` during render.
- Pass `null` as the interval delay when not running.
</details>

<details><summary>Level 2 · Direction</summary>

Store:
- `status`
- `banked`: ms already elapsed in this cycle before the current running stretch (added to when you pause)
- `startedAt`: `Date.now()` when the current running stretch began
- `now`: the latest `Date.now()`. Updating it each tick is what makes the component re-render.

`elapsed = status === 'running' ? banked + (now - startedAt) : banked`.

On each tick: compute the total from `Date.now()`. If it's under the duration, update `now`. Otherwise call `onComplete()` and either restart (repeat) or switch to `done`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- Pause: `banked += now - startedAt`, status `paused`. Resume: `startedAt = now`, status `running`.
- Put these values in **one** state object (they change together), and update it with updaters (`setTimer((t) => ...)`) in the button handlers.
- Call `onComplete()` in the **tick callback**, not inside a state updater (updaters must be pure, and StrictMode calls them twice) and not in an effect watching `status` (that would fire again on remount).
- Reuse the `useInterval` from 07-03 by copying it into this file. The latest-ref pattern means the tick callback always sees the current state and the current `onComplete` prop.
</details>
