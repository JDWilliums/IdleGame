# 07.1 · State as a snapshot

> ⏱ 2 hours · Module 07 · State & Effects

## What you'll learn
- Why state behaves like a snapshot for each render
- What really happens when you call a setter
- Queuing several updates with **updater functions**
- The "state doesn't update" bugs, and how to fix every one of them
- Updating objects and arrays in state, revisited

---

## Each render has its own state

When React calls your component, `useState` hands you the state **for that render**. It's a constant, fixed for the whole render, including every event handler and closure created during it.

```tsx
function GoldCounter() {
  const [gold, setGold] = useState(0);

  function handleClick() {
    setGold(gold + 1);
    console.log(gold);   // logs 0, not 1!
  }

  return <button onClick={handleClick}>Gold: {gold}</button>;
}
```

`setGold(gold + 1)` doesn't change the `gold` variable. It **asks React to re-render with a new value**. In the current render, `gold` is `0`, and it stays `0` until the function finishes. The *next* render gets `1`.

Think of each render as a **photo**: the JSX, the handlers and the state are all frozen in that photo. A setter asks React to take a new photo.

## The classic puzzle

```tsx
function handleClick() {
  setGold(gold + 1);
  setGold(gold + 1);
  setGold(gold + 1);
}
```

If `gold` is `0`, what's it after one click? **1**, not 3. All three calls mean `setGold(0 + 1)`, because `gold` is `0` in this render's snapshot.

Even with time passing:

```tsx
function handleClick() {
  setGold(gold + 5);
  setTimeout(() => {
    alert(gold);   // still 0. The closure belongs to THIS render (lesson 01.2!)
  }, 3000);
}
```

## Updater functions: "based on the latest value"

When the next state depends on the previous state, **pass a function**:

```tsx
function handleClick() {
  setGold((g) => g + 1);
  setGold((g) => g + 1);
  setGold((g) => g + 1);
}
// one click → +3
```

React queues these functions and runs them in order during the next render, passing each the result of the previous one:

| Queued update | `g` | returns |
|---|---|---|
| `g => g + 1` | 0 | 1 |
| `g => g + 1` | 1 | 2 |
| `g => g + 1` | 2 | 3 |

You can mix them. A plain value replaces whatever's queued so far, and later updaters build on it:

```tsx
setGold(10);              // replace with 10
setGold((g) => g * 2);    // 20
```

### When to use updaters
- **Always** when the new value is computed from the old one **and** there's any chance of several updates before a re-render: multiple calls in one handler, async callbacks, intervals, subscriptions.
- In a simple `onClick={() => setOpen(!open)}` it doesn't matter, but `setOpen((o) => !o)` is never wrong.

> 🧠 **In your game, updaters are essential.** The game loop calls updates repeatedly from a timer (a closure created long ago), so `setState(state + x)` would use a stale `state`. You'll see this in 07.6, and it's the reason the engine in Module 14 lives outside React.

Naming convention: name the updater's parameter after the state's first letter or as `prev`: `setItems((prev) => [...prev, item])`.

Updater functions must be **pure**: no side effects inside them. React may call them twice in StrictMode.

## "My state isn't updating!": the checklist

When the screen doesn't show what you expect:

1. **Are you reading state right after setting it?** It won't have changed yet. Use the value you computed: `const next = gold + 1; setGold(next); doSomething(next);`
2. **Did you mutate instead of replacing?** Same reference, so React bails out (01.1, 06.5).
   ```tsx
   inventory.push(log); setInventory(inventory);       // ❌
   setInventory((prev) => [...prev, log]);              // ✅
   ```
3. **Is a closure using an old snapshot?** Timers, async callbacks and subscriptions created in earlier renders see old values (07.6). Use updaters.
4. **Are you setting state on a component that's been unmounted, or a different instance than you think?** (06.6, state belongs to a tree position)
5. **Did you set it to the same value?** React skips the re-render if `Object.is(old, new)`.

## Updating objects in state

Nested updates need a new object at every level you change (01.1):

```tsx
type Player = { name: string; stats: { hp: number; maxHp: number } };
const [player, setPlayer] = useState<Player>({ name: 'Ava', stats: { hp: 10, maxHp: 10 } });

function takeDamage(amount: number) {
  setPlayer((p) => ({
    ...p,
    stats: { ...p.stats, hp: Math.max(0, p.stats.hp - amount) },
  }));
}
```

## Updating arrays in state

| Goal | ✅ Do | ❌ Avoid |
|---|---|---|
| add | `[...prev, item]`, `[item, ...prev]` | `push`, `unshift` |
| remove | `prev.filter((x) => x.id !== id)` | `splice` |
| replace one | `prev.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x))` | `prev[i].qty++` |
| insert at i | `prev.toSpliced(i, 0, item)` | `splice` |
| sort | `prev.toSorted(cmp)` | `sort` |

```tsx
// Cap the activity log at the 50 most recent entries
setLog((prev) => [entry, ...prev].slice(0, 50));
```

> If these nested updates feel verbose, you're right. **Immer** (lesson 08.4) lets you write `draft.stats.hp -= amount` and handles the copying for you. Learn the manual way first so you understand what Immer does.

## Check your understanding

1. What does this log, and what's displayed after one click? `setN(n + 1); console.log(n);` (starting at 0)
2. Rewrite `setN(n + 1); setN(n + 1);` so it adds 2.
3. `setN(5); setN((n) => n + 1);`. What's `n` on the next render?
4. Why is `setTimeout(() => setN(n + 1), 1000)` risky if the user clicks several times quickly?
5. Write the setter call to increase the `quantity` of the item with `id === 'trout'` in an `items` array.

<details><summary>Answers</summary>

1. It logs `0`, and the display shows `1` after the re-render.
2. `setN((n) => n + 1); setN((n) => n + 1);`
3. `6`.
4. Each timeout closes over the `n` from the render where the click happened. Several clicks in the same render (or before re-renders) all compute from the same stale `n`, so updates get lost. Use `setN((n) => n + 1)`.
5. `setItems((prev) => prev.map((item) => (item.id === 'trout' ? { ...item, quantity: item.quantity + 1 } : item)));`
</details>

## Further reading
- react.dev: [State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- react.dev: [Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates)
- react.dev: [Updating Objects in State](https://react.dev/learn/updating-objects-in-state) and [Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)

**Practice:** exercise `07-01` snapshot-bugs → `npm run watch 07-01`

---
[Module overview](README.md) · [Next: Structuring & lifting state →](02-structuring-and-lifting-state.md)
