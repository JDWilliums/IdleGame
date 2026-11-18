# 01.1 · Values, references & immutability

> ⏱ 90 min · Module 01 · JavaScript You'll Use Every Day

## What you'll learn
- The difference between primitive values and objects (references)
- Why `===` on two "identical" objects is `false`
- How to update objects and arrays **without mutating** them
- Why React cares about this so much

---

## Primitives are values, objects are references

JavaScript has two kinds of data:

| Primitives (copied by value) | Objects (shared by reference) |
|---|---|
| `string`, `number`, `boolean`, `null`, `undefined`, `bigint`, `symbol` | `{}` objects, `[]` arrays, functions, `Map`, `Set`, `Date`… |

When you assign a primitive, you get an independent copy:

```js
let gold = 100;
let backup = gold;
gold = 50;
console.log(backup); // 100. backup has its own copy
```

When you assign an object, you copy a **reference**, an arrow pointing at the same object in memory:

```js
const player = { name: 'Ava', gold: 100 };
const samePlayer = player;     // a second arrow to the SAME object
samePlayer.gold = 50;
console.log(player.gold);      // 50 😱
```

```
player ─────┐
            ├──► { name: 'Ava', gold: 50 }
samePlayer ─┘
```

The same thing happens when you pass objects into functions. The function receives the reference, so it can change the caller's object:

```js
function spend(p, amount) {
  p.gold -= amount;   // mutates the caller's object!
}
spend(player, 10);
```

## Equality compares identity, not contents

```js
'ava' === 'ava';                 // true:  primitives compare by value
{ gold: 1 } === { gold: 1 };     // false: two different objects
const a = { gold: 1 };
const b = a;
a === b;                         // true:  same reference
```

> 🧠 **Why it matters for React:** React decides whether to re-render by comparing the old state and the new state with `Object.is` (which works almost exactly like `===`). If you **mutate** an object and give React the *same reference* back, React sees "same object, nothing changed" and **doesn't update the screen**. This is the single most common React beginner bug. You'll see it again in lesson 07.1.

## `const` does not mean immutable

`const` stops you **reassigning the variable**. It doesn't freeze the object:

```js
const inventory = { logs: 3 };
inventory.logs = 4;        // ✅ allowed: mutating the object
inventory = { logs: 4 };   // ❌ TypeError: assignment to constant variable
```

`Object.freeze(obj)` does prevent changes, but only **shallowly** (nested objects can still be changed), and in strict mode (which all ES modules use) writing to a frozen object throws a `TypeError`. The exercise tests use freezing to catch accidental mutations.

## Immutable updates: make a new thing instead

"Immutable update" means: **don't change the existing object, create a new one with the change applied.** The spread operator (`...`) is the main tool.

### Objects

```js
const player = { name: 'Ava', gold: 100, level: 3 };

// ❌ mutation
player.gold = 150;

// ✅ new object: copy every property, then override gold
const richer = { ...player, gold: player.gold + 50 };

player === richer;   // false: new reference, so React will notice
player.gold;         // 100:   original untouched
```

Removing a property immutably uses rest destructuring:

```js
const { level, ...withoutLevel } = player;   // withoutLevel = { name, gold }
```

### Arrays

Learn which array methods **mutate** and which return a **new array**:

| ❌ Mutates in place | ✅ Returns a new array |
|---|---|
| `push`, `pop`, `shift`, `unshift` | `[...arr, x]`, `[x, ...arr]`, `concat` |
| `splice` | `toSpliced` (ES2023), `filter`, `slice` |
| `sort` | `toSorted` (ES2023) |
| `reverse` | `toReversed` (ES2023) |
| `arr[i] = x` | `arr.with(i, x)` (ES2023), `map` |

```js
const items = ['log', 'ore', 'fish'];

const added   = [...items, 'gem'];                 // add at end
const removed = items.filter((i) => i !== 'ore');  // remove by value
const renamed = items.map((i) => (i === 'log' ? 'oak log' : i)); // replace one
const sorted  = items.toSorted();                  // sorted copy
```

### Nested updates: copy every level you change

This is where people slip up. Spread is **shallow**: it copies the top level only. Nested objects are still shared references.

```js
const state = {
  gold: 100,
  skills: {
    woodcutting: { xp: 50, level: 2 },
    fishing: { xp: 0, level: 1 },
  },
};

// ❌ Looks immutable, but isn't: copy.skills is the SAME object as state.skills
const copy = { ...state };
copy.skills.woodcutting.xp = 60;   // also changes state!

// ✅ Copy each level on the path to the change
const next = {
  ...state,
  skills: {
    ...state.skills,
    woodcutting: {
      ...state.skills.woodcutting,
      xp: state.skills.woodcutting.xp + 10,
    },
  },
};
```

Notice what *didn't* get copied: `next.skills.fishing === state.skills.fishing` is still `true`. This is called **structural sharing**: unchanged branches are reused, changed branches are new. It's fast (you don't deep-copy everything), and it lets React and memoization see quickly what changed.

```
state ──► { gold, skills ──► { woodcutting ──► {xp:50}, fishing ─┐ } }
                                                                  ├──► {xp:0}  (shared!)
next  ──► { gold, skills ──► { woodcutting ──► {xp:60}, fishing ─┘ } }
```

> Writing deeply nested spreads gets tedious. In lesson 08.4 you'll meet **Immer**, which lets you write "mutating" code that produces immutable updates. Learn the manual way first so you understand what Immer does for you.

### What about deep copies?

`structuredClone(obj)` makes a full deep copy. It's useful (for example when cloning a save file), but don't reach for it to do updates: it copies *everything*, which is slow for big state and breaks structural sharing.

> ⚠️ `JSON.parse(JSON.stringify(obj))` is the old trick for deep copies. It silently drops `undefined`, functions and `Map`/`Set`, and turns `Date`s into strings. Prefer `structuredClone`.

## Why bother? (beyond React)

Immutability makes code easier to reason about:
- **No spooky action at a distance.** A function can't secretly change your data.
- **History is free.** Keep old state objects around and you get undo, replays and "what changed?" debugging.
- **Easy change detection.** `old !== new` tells you something changed, without a deep comparison.

Your game engine in Module 13 will be built from **pure functions** that take a state and return a new state. That's this lesson applied at scale.

## ⚠️ Common mistakes

```js
// 1. Sorting state in place
const top = state.items.sort((a, b) => b.value - a.value);  // mutates state.items!
const top2 = state.items.toSorted((a, b) => b.value - a.value); // ✅

// 2. Shallow copy, then mutate nested
const next = { ...state };
next.skills.fishing.xp += 5;   // mutates the shared nested object

// 3. Mutating then copying (the copy happens too late)
state.gold += 10;
const next2 = { ...state };    // state was already changed

// 4. Thinking const prevents mutation
const list = [];
list.push(1);                  // totally allowed
```

## Try it

In `playground/immutability.ts`:
1. Create a nested `state` like the one above and `Object.freeze` it (just the top level). Can you still mutate `state.skills.fishing.xp`? Why?
2. Write `addGold(state, amount)` that returns a new state. Check with `===` that the old one didn't change and `skills` is still the same reference.

## Check your understanding

1. What does `{ ...obj }` copy, and what does it *share*?
2. After `const next = { ...state, gold: 5 }`, is `next.skills === state.skills`? Is that a problem?
3. Which of these mutate: `filter`, `sort`, `splice`, `toSorted`, `map`, `reverse`?
4. Why would React fail to update if you did `state.gold += 1; setState(state);`?

<details><summary>Answers</summary>

1. It copies the top-level properties into a new object. Any nested objects or arrays are **shared** (both copies hold the same references).
2. Yes, they're the same reference. That's fine and desirable (structural sharing), *as long as you don't mutate* `next.skills`. If you need to change skills, copy that level too.
3. `sort`, `splice` and `reverse` mutate. `filter`, `toSorted` and `map` return new arrays.
4. You passed the *same object reference* back. React compares old and new with `Object.is`, sees they're identical, and skips the re-render.
</details>

## Further reading
- MDN: [Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)
- MDN: [Array (see which methods are "copying" vs "mutating")](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
- react.dev: [Updating Objects in State](https://react.dev/learn/updating-objects-in-state) and [Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state). These are React-flavoured, but they're the best explanation of this exact topic.

**Practice:** exercise `01-01` immutable-updates → `npm run watch 01-01`

---
[Module overview](README.md) · [Next: Functions & closures →](02-functions-and-closures.md)
