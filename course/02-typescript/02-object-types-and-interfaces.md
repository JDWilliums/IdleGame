# 02.2 · Object types & interfaces

> ⏱ 75 min · Module 02 · TypeScript in Depth

## What you'll learn
- `type` vs `interface`, and which to use
- Optional and `readonly` properties
- Arrays, readonly arrays and tuples
- Records and index signatures
- Function types
- Extending and combining types

---

## `type` and `interface`

Both describe object shapes:

```ts
type Skill = {
  id: string;
  name: string;
  maxLevel: number;
};

interface Monster {
  id: string;
  name: string;
  hp: number;
}
```

For objects they're nearly interchangeable. The differences:

| | `type` | `interface` |
|---|---|---|
| Objects | ✅ | ✅ |
| Unions, primitives, tuples (`type Id = string \| number`) | ✅ | ❌ |
| Extending | `&` (intersection) | `extends` |
| Declaration merging (two declarations combine) | ❌ | ✅ |

**What should you use?** Teams differ, and either is fine if you're consistent. This course uses **`type` by default**, because it handles everything (unions are everywhere in React and game code), and `interface` when you're describing something others might extend, like a library's public API. Don't spend your energy on this debate.

## Optional and readonly properties

```ts
type Item = {
  readonly id: string;       // can't be reassigned after creation
  name: string;
  description?: string;      // optional: string | undefined, and may be absent
};

const log: Item = { id: 'oak_log', name: 'Oak Log' };   // ✅ no description needed
log.id = 'other';     // ❌ Cannot assign to 'id' because it is a read-only property
log.description?.toUpperCase(); // must handle undefined
```

`readonly` is **compile-time only** (it doesn't freeze anything at runtime), but it's a great way to document "don't mutate this", which matters a lot with React state.

## Arrays and tuples

```ts
const ids: string[] = ['a', 'b'];
const ids2: Array<string> = ['a', 'b'];        // same thing, generic syntax

const frozen: readonly string[] = ['a', 'b'];  // no push/pop/sort
frozen.push('c');   // ❌ Property 'push' does not exist on type 'readonly string[]'

// Tuples: fixed length, a type per position
const entry: [string, number] = ['oak_log', 30];
const [itemId, qty] = entry;                   // string, number

// Named tuple members are just documentation, but helpful
type Range = [min: number, max: number];
```

Accept `readonly` arrays in function parameters when you don't modify them. Then callers can pass either kind:

```ts
function total(nums: readonly number[]) { return nums.reduce((a, b) => a + b, 0); }
```

## Records and index signatures

When the keys are dynamic (item ids, skill ids), use `Record` or an index signature:

```ts
type Inventory = Record<string, number>;   // any string key → number
// same as:
type Inventory2 = { [itemId: string]: number };

// With a union of keys, Record requires ALL of them
type SkillId = 'woodcutting' | 'fishing' | 'mining';
type SkillLevels = Record<SkillId, number>;
const levels: SkillLevels = { woodcutting: 1, fishing: 1 };   // ❌ 'mining' is missing

// Partial<Record<...>> makes them all optional
type Bank = Partial<Record<'oak_log' | 'trout', number>>;
```

With `noUncheckedIndexedAccess` on (as in this repo), reading a dynamic key gives `T | undefined`:

```ts
const inv: Inventory = { oak_log: 3 };
const n = inv['trout'];        // number | undefined
const safe = inv['trout'] ?? 0; // number
```

## Function types

```ts
type Formatter = (value: number) => string;
const formatGold: Formatter = (v) => `${v}g`;   // v is inferred as number

// Optional and default parameters
function grant(skill: string, xp = 10, bonus?: number) { /*…*/ }

// Callbacks in object types
type Button = {
  label: string;
  onClick: () => void;      // "returns nothing useful"
};
```

> `() => void` as a *type* means "I'll ignore what you return", so a function that returns a number can still be passed. That's why `arr.forEach((x) => list.push(x))` is allowed even though `push` returns a number.

## Extending and combining

```ts
type Entity = { id: string; name: string };

// Intersection: has everything from both
type Monster = Entity & { hp: number; attack: number };

// Interface version
interface Npc extends Entity {
  dialogue: string[];
}
```

Intersections of conflicting properties become `never`, which is usually a sign of a design problem:

```ts
type A = { id: string };
type B = { id: number };
type C = A & B;   // C['id'] is string & number = never
```

## Modelling data well

Good types read like documentation. Compare:

```ts
// ❌ vague
type Thing = { t: string; v: any; extra?: object };

// ✅ precise
type ItemDefinition = {
  id: string;
  name: string;
  category: 'log' | 'fish' | 'ore' | 'bar';  // a literal union, not any string
  sellPrice: number;
  stackable: boolean;
};
```

Tips:
- Use **literal unions** instead of `string` for fixed sets of values.
- Make a property **required** unless it's genuinely optional. Optional properties spread `undefined` checks everywhere.
- Keep data types **serialisable** (plain objects, arrays, strings, numbers, booleans) when they'll be saved or sent over the network. No class instances, functions, `Map`s or `Date`s inside save data.

## ⚠️ Common mistakes

```ts
// 1. Optional when it shouldn't be: every use now needs `?.`
type Player = { name?: string };

// 2. Forgetting that Record<string, T>[key] might be missing (turn on noUncheckedIndexedAccess!)

// 3. `interface` for unions. Not possible; use `type`
interface Shape = Circle | Square;   // syntax error

// 4. Thinking `readonly` prevents runtime mutation (it doesn't; Object.freeze does)
```

## Check your understanding

1. Name one thing `type` can do that `interface` can't.
2. What's the difference between `{ hp?: number }` and `{ hp: number | undefined }`?
3. What does `Record<'a' | 'b', boolean>` require?
4. Why might you type a parameter as `readonly Item[]`?

<details><summary>Answers</summary>

1. Unions (`type Id = string | number`), plus tuples and primitive aliases.
2. `hp?:` means the property may be **missing** entirely. `hp: number | undefined` means it must be **present**, although its value can be `undefined`.
3. An object with **both** keys `a` and `b`, each a boolean.
4. To promise callers you won't mutate their array, and to let them pass readonly arrays. It also stops you accidentally calling `.sort()` on it.
</details>

## Further reading
- TypeScript Handbook: [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- TypeScript Handbook: [Differences between type aliases and interfaces](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)

**Practice:** exercise `02-01` typed-game-data → `npm run watch 02-01` (you'll need `satisfies` from 02.6 for the last task, so you can do the rest now and come back)

---
[← How TypeScript thinks](01-how-typescript-thinks.md) · [Module overview](README.md) · [Next: Unions & narrowing →](03-unions-and-narrowing.md)
