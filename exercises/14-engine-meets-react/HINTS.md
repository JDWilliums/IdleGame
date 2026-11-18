# Hints · Module 14

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 14-01 · game-store

<details><summary>Level 1 · Nudge</summary>

Lesson 14.2 has the shape almost line for line. The key detail is the "no change, no set" helper.
</details>

<details><summary>Level 2 · Direction</summary>

- Create `const listeners = new Set<…>()` **outside** `createStore`, in the factory's closure.
- `const update = (next) => { if (next !== get().game) set({ game: next }); };`, then `startAction`/`stopAction`/`sell`/`catchUp` all call `update(engineFn(get().game, …))`.
- `advance`: run `tick`. If `state !== current`, `set({ game: { ...state, lastUpdatedAt: deps.now() } })`. Then, if `events.length > 0`, call every listener.
- Selectors are tiny functions returning primitives.
- `useGameEvents`: the latest-ref pattern (a ref updated by an effect with no deps), plus an effect with `[store]` that subscribes and returns the unsubscribe.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why do the "progress-only ticks" not re-render the components? Each `advance(100)` sets a new `game` object (progress changed), so every subscriber's selector runs. But `selectGold` still returns the same number, `selectItemCount('oak_log')` returns the same number, and `selectLevel` returns the same level. `useStore` compares with `Object.is`, sees no change, and skips re-rendering.

If your test fails here, check that you're selecting **primitives** and not objects like `s.game.skills.woodcutting`.
</details>

---

## 14-02 · smooth-progress-bar

<details><summary>Level 1 · Nudge</summary>

Two refs to DOM nodes, one ref for the latest selector, and one effect that calls `store.subscribe`. No `useState`, no `useStore`.
</details>

<details><summary>Level 2 · Direction</summary>

- Inside the subscribing effect, define `apply(state)`: compute the clamped fraction, then `fillRef.current?.style.setProperty('--progress', String(fraction))` and `barRef.current?.setAttribute('aria-valuenow', String(Math.round(fraction * 100)))`.
- Call `apply(store.getState())` once immediately, then `return store.subscribe(apply);`.
- Deps: `[store]`. Read the selector from `latestSelect.current` inside `apply`, so changing it doesn't resubscribe.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Check that **both** DOM elements actually have their refs attached (`ref={barRef}` and `ref={fillRef}`). A missing ref fails silently, because `ref.current?.…` just does nothing, and the tests will show the value as `''`. (The course author made exactly this mistake while writing the reference solution, and this test caught it.)

Why doesn't the component re-render? Nothing in it is React state. Store changes go straight to the DOM, so React never hears about them.
</details>

---

## 14-03 · use-page-visibility

<details><summary>Level 1 · Nudge</summary>

The hook is lesson 14.4's `usePageLifecycle` code. The guard is a closure with `read()`, `write()` and `isStale()` helpers.
</details>

<details><summary>Level 2 · Direction</summary>

- `read()`: `getItem(key)`, return `null` if missing, otherwise `JSON.parse` in `try/catch` and validate the shape with a type guard (`ownerId` string, `heartbeatAt` number).
- `write()`: `setItem(key, JSON.stringify({ ownerId: id, heartbeatAt: now() }))`.
- `tryAcquire`: free if `record === null || isStale(record) || record.ownerId === id`.
- `heartbeat`: if `read()?.ownerId !== id` return `false`, otherwise `write()` and return `true`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why must `release()` check ownership? If tab A lost the lock to tab B (B took over) and then A closes and calls `release()`, an unconditional `removeItem` would delete **B's** lock. B would then think it still owns the lock while a third tab could grab it, and you'd have two tabs running the game.
</details>
