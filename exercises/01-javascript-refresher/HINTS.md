# Hints · Module 01

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 01-01 · immutable-updates

<details><summary>Level 1 · Nudge</summary>

- Object spread (`{ ...obj }`) and computed keys (`{ [key]: value }`) do most of the work.
- `Number.isInteger` exists.
- Removing a key without mutating: rest destructuring.
- For sorting, convert the object to entries first.
</details>

<details><summary>Level 2 · Direction</summary>

- `addItem`: validate first, then return `{ ...inventory, [itemId]: current + quantity }` where `current` defaults to 0 when the key is missing (`??`).
- `removeItem`: work out `have`. If `have < quantity`, throw. If the remainder is 0, build a copy *without* the key, otherwise spread with the new number.
- `addSkillXp`: you need a new top-level object, a new `skills` object, and a new object for *that one* skill. Spread at each of the three levels.
- `spendGold`: handle `amount === 0` first by returning `state` itself.
- `sortedInventory`: `Object.entries(...)` then sort with a two-part comparator.
</details>

<details><summary>Level 3 · Walkthrough</summary>

1. `removeItem` without the key: `const { [itemId]: _removed, ...rest } = inventory; return rest;`. Destructuring with a computed key pulls that one property out, and `rest` gets everything else.
2. `addSkillXp` shape:
   ```
   return {
     ...state,
     skills: {
       ...state.skills,
       [skillId]: /* the existing skill spread with new xp, OR a new { xp, level: 1 } */
     },
   };
   ```
   Because you only spread `state.skills`, `state.inventory` is carried over as the same reference automatically.
3. The comparator for sorting: `(a, b) => b[1] - a[1] || a[0].localeCompare(b[0])`. When quantities are equal the subtraction is `0` (falsy), so `||` falls through to comparing names.
</details>

---

## 01-02 · closures

<details><summary>Level 1 · Nudge</summary>

Each function needs a `let` variable declared **inside** the outer function and **outside** the function it returns. That variable is the private state.
</details>

<details><summary>Level 2 · Direction</summary>

- `createIdGenerator`: a `let n = 0` and a returned arrow function that increments it and builds the string.
- `createCounter`: one `let count = start`. Return an object whose four methods all read or write that same variable. `reset` can use `start`, because it's captured too.
- `once`: you need two pieces of state: *has it been called?* and *what was the result?*. Don't use the result itself as the flag, because the result could be `undefined`.
- `memoize`: a `new Map()`. Check with `.has(arg)`, not by truthiness.
- `debounce`: keep the timer id between calls. On each call, `clearTimeout` the old one and `setTimeout` a new one.
</details>

<details><summary>Level 3 · Walkthrough</summary>

`once` step by step:
1. `let called = false; let result;`
2. Return `(...args) => { ... }`.
3. Inside, if `!called`: set `called = true`, then `result = fn(...args)`.
4. Return `result` (on every call).

`debounce` step by step:
1. `let timer;` outside the returned function.
2. Inside the returned `(...args) => { }`: `clearTimeout(timer)` (safe even when `timer` is undefined).
3. `timer = setTimeout(() => fn(...args), ms);`. The arrow captures *this* call's `args`, so the latest call's arguments win.
4. TypeScript type for the timer: `ReturnType<typeof setTimeout> | undefined`.
</details>

---

## 01-03 · data-transforms

<details><summary>Level 1 · Nudge</summary>

`reduce`, `filter`, `Object.fromEntries`, `Object.groupBy`, `toSorted`, `slice`, `new Set`.
</details>

<details><summary>Level 2 · Direction</summary>

- Write a tiny helper `stackValue(item)` first. You'll use it four times.
- `toLookup`: map each item to an `[id, item]` pair, then `Object.fromEntries`.
- `topByValue`: filter out empty stacks → sort a copy (value desc, name asc) → take the first `n`.
- `summarize.categories`: map to categories, de-duplicate with a `Set`, spread back to an array, sort.
- `summarize.mostValuable`: reuse `topByValue(items, 1)`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- Tie-break comparator: `(a, b) => stackValue(b) - stackValue(a) || a.name.localeCompare(b.name)`.
- Distinct sorted categories: `[...new Set(items.map((i) => i.category))].toSorted()`.
- `mostValuable`: `const [top] = topByValue(items, 1);`. `top` is `undefined` for an empty list, so return `top ? top.name : null` (and make sure its stack value is above 0. Can it ever be 0 after `topByValue` filtered empty stacks? Think about `value: 0`).
</details>

---

## 01-04 · async-control-flow

<details><summary>Level 1 · Nudge</summary>

- `new Promise((resolve, reject) => ...)` wraps `setTimeout`.
- `Promise.race` settles with whichever promise settles first.
- `.finally()` runs no matter how a promise settles.
- A `for` loop with `try/catch` and `await` is the easiest way to write `retry`.
- `Promise.all` vs a `for...of` loop with `await`.
</details>

<details><summary>Level 2 · Direction</summary>

- `TimeoutError`: pass the message string to `super(...)`, then set `this.name`.
- `withTimeout`: create a second promise that *rejects* after `ms`. Race it against the original. Keep the timer id in an outer variable so `.finally` can clear it.
- `retry`: loop `attempt` from `0` up to `retries` (inclusive). Inside, `try { return await fn(); }`. In `catch`, remember the error, and if there are retries left, `await sleep(baseDelayMs * 2 ** attempt)`. After the loop, `throw` the remembered error.
- `loadAllInParallel`: one line with `Promise.all` and `map`.
- `loadSequentially`: an array, a `for...of`, and `await` inside it.
</details>

<details><summary>Level 3 · Walkthrough</summary>

`withTimeout`:
```
let timer;
const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new TimeoutError(ms)), ms); });
return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
```
(Add the types yourself: the timeout promise is `Promise<never>`.)

`retry`: why `return await fn()` and not `return fn()`? Without `await`, the rejected promise is *returned* out of the `try` block before it rejects, so your `catch` never sees the error. This is one of the few places where `return await` matters.
</details>
