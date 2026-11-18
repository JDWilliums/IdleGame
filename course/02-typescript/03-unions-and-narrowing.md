# 02.3 · Unions & narrowing

> ⏱ 90 min · Module 02 · TypeScript in Depth

## What you'll learn
- Union and literal types
- **Narrowing**: how TypeScript tracks what a value can be at each line
- `typeof`, truthiness, equality, `in` and `instanceof` checks
- Handling `null` and `undefined` cleanly
- Why `as` and `!` are dangerous, and when they're acceptable

---

## Unions: "one of these"

```ts
type ItemId = string;
type Quantity = number | 'all';           // a number OR the literal 'all'
type Direction = 'north' | 'south' | 'east' | 'west';

function sell(id: ItemId, qty: Quantity) { /*…*/ }
sell('trout', 5);
sell('trout', 'all');
sell('trout', 'some');   // ❌ '"some"' is not assignable to type 'Quantity'
```

With a union, you can only use what's **common to every member** until you narrow:

```ts
function double(x: number | string) {
  return x * 2;   // ❌ The left-hand side must be of type number…
}
```

## Narrowing

TypeScript follows your `if`s, `return`s and `switch`es and **narrows** the type in each branch. This is called *control flow analysis*.

### `typeof`
```ts
function describe(qty: number | 'all') {
  if (typeof qty === 'number') {
    return `${qty.toFixed(0)} items`;   // qty: number
  }
  return 'everything';                  // qty: 'all'
}
```

`typeof` works for: `'string'`, `'number'`, `'bigint'`, `'boolean'`, `'symbol'`, `'undefined'`, `'function'`, `'object'`.

> ⚠️ `typeof null === 'object'` is a famous JavaScript bug. `typeof x === 'object'` doesn't rule out `null`.

### Truthiness
```ts
function greet(name?: string) {
  if (name) {
    return `Hi ${name}`;   // name: string
  }
  return 'Hi stranger';    // name: string | undefined (could be "")
}
```

Careful with numbers: `if (gold)` is false for `0`. Prefer an explicit `if (gold !== undefined)`.

### Equality
```ts
function move(dir: Direction | null) {
  if (dir === null) return;
  dir; // Direction
}
```

### `in`: check whether a property exists
```ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function travel(animal: Fish | Bird) {
  if ('swim' in animal) animal.swim();   // Fish
  else animal.fly();                     // Bird
}
```

### `instanceof`: for classes (including `Error`)
```ts
try { /*…*/ } catch (error) {           // error: unknown
  if (error instanceof Error) {
    console.log(error.message);         // Error
  }
}
```

### Early returns narrow everything after them
```ts
function levelLabel(level: number | undefined): string {
  if (level === undefined) return 'Locked';
  // from here on, level is number
  return level >= 99 ? 'MAX' : `Lv ${level}`;
}
```

## Narrowing `unknown`

The same tools work on `unknown`, step by step:

```ts
function getMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'   // TS 4.9+ narrows `in` checks on unknown objects
  ) {
    return error.message;
  }
  return 'Unknown error';
}
```

## Custom type guards: `value is T`

When a check is complex or reused, put it in a function whose return type is a **type predicate**:

```ts
type ItemStack = { itemId: string; quantity: number };

function isItemStack(value: unknown): value is ItemStack {
  return (
    typeof value === 'object' &&
    value !== null &&
    'itemId' in value && typeof value.itemId === 'string' &&
    'quantity' in value && typeof value.quantity === 'number'
  );
}

const data: unknown = JSON.parse(text);
if (isItemStack(data)) {
  data.quantity;   // ✅ ItemStack
}
```

> The compiler **trusts** your predicate. If `isItemStack` has a bug, TypeScript will happily narrow wrong data. Test your type guards (you will in exercise 02-02).

Type guards also work with `filter`:

```ts
const maybeItems: (Item | undefined)[] = ids.map(findItem);
const items = maybeItems.filter((i): i is Item => i !== undefined);  // Item[]
// TS 5.5+ often infers this predicate for simple callbacks like (i) => i !== undefined
```

## `null` and `undefined`

```ts
const name = player?.profile?.displayName ?? 'Anonymous';
```

- `?.` short-circuits to `undefined` if the left side is `null` or `undefined`.
- `??` provides a default only for `null` or `undefined`.
- Many codebases use `undefined` for "missing" and avoid `null`, except where an API returns `null` (like `localStorage.getItem` or DOM queries). This course follows that convention.

## The escape hatches: `as` and `!`

### `as` (type assertion)
```ts
const save = JSON.parse(text) as SaveFile;
```
This **doesn't check anything**. It tells the compiler "trust me". If you're wrong, you get a runtime crash far from the cause. Acceptable uses:
- narrowing something you *know* better than TS, with evidence (DOM: `document.getElementById('root') as HTMLDivElement` right after creating it)
- `as const` (a different feature, see 02.6)
- in tests

Never use `as` on data from outside your program. Validate it instead (02.7).

### `!` (non-null assertion)
```ts
const el = document.querySelector('#app')!;   // "this is definitely not null"
```
Same deal: it removes `null | undefined` with no check. If you're wrong, it crashes. Prefer a real check:

```ts
const el = document.querySelector('#app');
if (!el) throw new Error('#app not found');
el; // Element
```

## ⚠️ Common mistakes

```ts
// 1. Narrowing on a property of a different variable
if (typeof state.gold === 'number') {
  doSomethingAsync().then(() => state.gold.toFixed());  // narrowing can be lost in callbacks
}

// 2. typeof x === 'object' without excluding null
// 3. if (count) when 0 is a valid count
// 4. `as` to make errors go away. The error was probably right!
```

## Check your understanding

1. Inside `if (typeof x === 'object')`, what types might `x` still be?
2. What does a function returning `value is Cat` tell the compiler?
3. Why is `JSON.parse(text) as SaveFile` dangerous?
4. Rewrite `const el = document.querySelector('canvas')!;` without `!`.

<details><summary>Answers</summary>

1. Any object type, **and `null`** (because `typeof null === 'object'`).
2. That if the function returns `true`, the argument is a `Cat` in that branch. The compiler trusts it blindly, so the implementation must be correct.
3. No validation happens. If the file is corrupted or comes from an older version, your code receives the wrong shape and crashes somewhere unrelated.
4. `const el = document.querySelector('canvas'); if (!el) throw new Error('No canvas');`. After that, `el` is `HTMLCanvasElement`.
</details>

## Further reading
- TypeScript Handbook: [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html). Read the whole thing.

**Practice:** exercise `02-02` narrowing → `npm run watch 02-02`

---
[← Object types & interfaces](02-object-types-and-interfaces.md) · [Module overview](README.md) · [Next: Discriminated unions →](04-discriminated-unions.md)
