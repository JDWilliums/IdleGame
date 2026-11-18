# 01.3 · Array & object power tools

> ⏱ 75 min · Module 01 · JavaScript You'll Use Every Day

## What you'll learn
- The array methods that do 90% of data work in React apps
- Converting between objects and arrays with `Object.entries`/`fromEntries`
- Grouping, lookups, and when to use `Map` and `Set`
- Destructuring, optional chaining and nullish coalescing

---

React UIs are mostly **data transformed into elements**: "take the inventory, filter it, sort it, turn each item into a card". Being fluent here makes React feel easy.

We'll use this data throughout:

```js
const items = [
  { id: 'oak_log',    name: 'Oak Log',    category: 'wood', value: 5,  qty: 30 },
  { id: 'willow_log', name: 'Willow Log', category: 'wood', value: 12, qty: 4 },
  { id: 'trout',      name: 'Trout',      category: 'fish', value: 20, qty: 0 },
  { id: 'copper_ore', name: 'Copper Ore', category: 'ore',  value: 8,  qty: 12 },
];
```

## The core array methods

| Method | Returns | Use it to… |
|---|---|---|
| `map(fn)` | new array, same length | transform each item |
| `filter(fn)` | new array, ≤ length | keep items matching a condition |
| `find(fn)` | first match or `undefined` | look up one item |
| `findIndex(fn)` | index or `-1` | find a position |
| `some(fn)` / `every(fn)` | boolean | "any match?" / "all match?" |
| `includes(x)` | boolean | membership for primitives |
| `reduce(fn, init)` | anything | fold a list into one value |
| `flatMap(fn)` | new flattened array | map where each item yields 0..n items |
| `toSorted(cmp)` | new sorted array | sort without mutating |

```js
const names      = items.map((i) => i.name);
const inStock    = items.filter((i) => i.qty > 0);
const trout      = items.find((i) => i.id === 'trout');
const anyEmpty   = items.some((i) => i.qty === 0);         // true
const allValued  = items.every((i) => i.value > 0);        // true
const totalValue = items.reduce((sum, i) => sum + i.value * i.qty, 0); // 294
```

### Chaining
Methods that return arrays can be chained. Read top to bottom like a pipeline:

```js
const shelfLabels = items
  .filter((i) => i.qty > 0)                    // only things we have
  .toSorted((a, b) => b.value - a.value)       // most valuable first
  .slice(0, 3)                                 // top 3
  .map((i) => `${i.name} (${i.qty})`);         // to labels
```

### Sorting properly
The comparator returns **negative** (a first), **positive** (b first) or **0** (keep order):

```js
items.toSorted((a, b) => a.value - b.value);              // ascending numbers
items.toSorted((a, b) => b.value - a.value);              // descending numbers
items.toSorted((a, b) => a.name.localeCompare(b.name));   // alphabetical
// Tie-breaker: by value desc, then name asc
items.toSorted((a, b) => b.value - a.value || a.name.localeCompare(b.name));
```

> ⚠️ `[10, 9, 1].sort()` gives `[1, 10, 9]`. With no comparator, it sorts as **strings**. Always pass a comparator for numbers.

### `reduce` in depth
`reduce` is the most powerful method and the most abused. It takes an **accumulator** and each item, and returns the next accumulator:

```js
// Count items per category
const counts = items.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] ?? 0) + 1;
  return acc;
}, {});
// { wood: 2, fish: 1, ore: 1 }
```

> Mutating the accumulator *inside* reduce, as above, is fine: it's a brand-new object you created as the initial value, so nobody else holds a reference to it. Rule of thumb: if a `reduce` is hard to read, a `for...of` loop is often clearer, and that's OK.

## Objects ⇄ arrays

Objects aren't iterable with array methods directly, so convert them:

```js
const inventory = { oak_log: 30, trout: 0, copper_ore: 12 };

Object.keys(inventory);     // ['oak_log', 'trout', 'copper_ore']
Object.values(inventory);   // [30, 0, 12]
Object.entries(inventory);  // [['oak_log', 30], ['trout', 0], ['copper_ore', 12]]

// Transform an object: entries → map/filter → fromEntries
const nonEmpty = Object.fromEntries(
  Object.entries(inventory).filter(([, qty]) => qty > 0)
);
// { oak_log: 30, copper_ore: 12 }
```

### Lookup tables
Searching an array with `find` is O(n). If you'll look things up by id often, build a lookup object or `Map` once:

```js
const byId = Object.fromEntries(items.map((i) => [i.id, i]));
byId['trout'].value;  // 20, an instant lookup
```

Your game will define items as an **array** (easy to write and loop over) and build a **lookup** for fast access by id. You'll do exactly this in exercise 01-03 and again in Module 13.

### Grouping
Modern JavaScript has built-in grouping (Node 21+, all modern browsers):

```js
const byCategory = Object.groupBy(items, (i) => i.category);
// { wood: [oak, willow], fish: [trout], ore: [copper] }
```

It's still worth knowing how to write it with `reduce`, because interviewers love asking.

## `Map` and `Set`

| Use… | When |
|---|---|
| plain object `{}` | string keys, JSON serialisation needed (save files!), simple records |
| `Map` | keys that aren't strings, frequent add/remove, insertion order matters, big caches |
| `Set` | unique values, fast "have I seen this?" checks |

```js
const unlocked = new Set(['oak_tree']);
unlocked.add('willow_tree');
unlocked.has('oak_tree');      // true
[...unlocked];                 // back to an array

const cache = new Map();
cache.set(42, 'answer');       // number keys stay numbers
cache.get(42);
```

> ⚠️ `JSON.stringify(new Map([['a', 1]]))` gives `"{}"`. Maps and Sets **don't serialise to JSON**. That's why game state that gets saved uses plain objects and arrays (lesson 13.3).

## Destructuring

```js
const { name, qty = 0, category: type } = item;   // default + rename
const [first, second, ...rest] = items;            // arrays by position
function render({ name, qty }) { /* ... */ }       // in parameters (all over React props!)

// Nested, with a default for a missing branch
const { skills: { fishing } = {} } = state;
```

## Optional chaining `?.` and nullish coalescing `??`

```js
const level = state.skills?.fishing?.level;   // undefined instead of crashing if missing
const name  = byId['nope']?.name ?? 'Unknown';
callback?.();                                  // call only if defined
```

Know the difference between `??` and `||`:

```js
0 || 10;      // 10: || treats 0, '', false, NaN as "missing"
0 ?? 10;      // 0:  ?? only treats null/undefined as missing
'' ?? 'n/a';  // ''
```

> 🧠 In a game, `0` is very often a legitimate value (0 gold, level 0, quantity 0). Using `||` for defaults is a common source of bugs. **Prefer `??`.**

## ⚠️ Common mistakes

```js
items.map((i) => { name: i.name });        // returns undefined. Need ({ name: i.name })
items.find((i) => i.id === 'x').name;      // crashes if not found. Use ?.
items.reduce((sum, i) => sum + i.qty);     // no initial value: wrong start, and crashes on []
Object.entries(obj).map(([k, v]) => ...)   // fine, but the result is an ARRAY, not an object
```

## Check your understanding

1. What do `filter` and `find` return when nothing matches?
2. Rewrite `items.filter(i => i.qty > 0).length > 0` using a single, more efficient method.
3. Why is `quantity || 1` dangerous as a default, and what should you use?
4. You need to save game state to `localStorage` as JSON. Should the inventory be a `Map` or a plain object? Why?

<details><summary>Answers</summary>

1. `filter` returns an empty array `[]`. `find` returns `undefined`.
2. `items.some(i => i.qty > 0)`. It stops at the first match and returns a boolean.
3. If the quantity is legitimately `0`, `||` replaces it with `1`. Use `quantity ?? 1`, which only falls back for `null` or `undefined`.
4. A plain object (or array). `Map` doesn't survive `JSON.stringify` without custom conversion.
</details>

## Further reading
- MDN: [Array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) (browse the sidebar list)
- MDN: [`Object.groupBy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy)
- MDN: [Nullish coalescing `??`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)

**Practice:** exercise `01-03` data-transforms → `npm run watch 01-03`

---
[← Functions & closures](02-functions-and-closures.md) · [Module overview](README.md) · [Next: The event loop, timers & promises →](04-the-event-loop-timers-and-promises.md)
