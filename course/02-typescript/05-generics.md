# 02.5 · Generics

> ⏱ 120 min · Module 02 · TypeScript in Depth

## What you'll learn
- Why generics exist: reuse without losing type information
- Generic functions and inference of type arguments
- Constraints with `extends`, and `keyof` constraints
- Generic types (`Result<T>`, `AsyncState<T>`) and defaults
- Reading generic signatures in libraries (like React's `useState`)
- When *not* to use generics

---

## The problem generics solve

```ts
function firstNumber(arr: number[]): number | undefined { return arr[0]; }
function firstString(arr: string[]): string | undefined { return arr[0]; }
// …one for every type? No.

function firstAny(arr: any[]): any { return arr[0]; }
const x = firstAny(['a']);   // any. We've lost all type information
```

A **generic** function takes a **type parameter**, a placeholder for "whatever type the caller uses":

```ts
function first<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}

const a = first([1, 2, 3]);       // T inferred as number → number | undefined
const b = first(['oak', 'ash']);  // T inferred as string → string | undefined
const c = first<boolean>([]);     // you can pass T explicitly
```

Read `<T>` as "for any type T". The relationship is what matters: **whatever goes in determines what comes out.**

## Inference

You almost never write the type argument yourself. TS infers it from the arguments:

```ts
function pair<A, B>(a: A, b: B): [A, B] { return [a, b]; }
const p = pair('gold', 100);  // [string, number]

function mapValues<T, U>(obj: Record<string, T>, fn: (value: T) => U): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));
}
const labels = mapValues({ oak: 3, ash: 5 }, (n) => `${n} logs`);  // Record<string, string>
```

## Constraints: `extends`

Sometimes you need T to have certain properties. Constrain it:

```ts
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest('oak', 'willow');     // ✅ strings have length
longest([1, 2], [1, 2, 3]);   // ✅ arrays have length
longest(10, 20);              // ❌ number doesn't have 'length'
```

`T extends X` here means "T must be assignable to X". It has nothing to do with classes.

```ts
// Anything with an id
function byId<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
const skills = byId([{ id: 'fishing', maxLevel: 99 }]);  // Record<string, { id: string; maxLevel: number }>
```

Notice the result keeps the *full* type of the items (including `maxLevel`), not just `{ id: string }`. That's the power of generics.

### `keyof` constraints

`keyof T` is the union of T's property names. Combine it with a second type parameter to write type-safe property access:

```ts
function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const items = [{ id: 'oak', value: 5 }, { id: 'ash', value: 8 }];
pluck(items, 'value');   // number[]
pluck(items, 'id');      // string[]
pluck(items, 'weight');  // ❌ '"weight"' is not assignable to '"id" | "value"'
```

`T[K]` is an **indexed access type**: "the type of property K on T" (more in 02.6).

## Generic types

Types can have parameters too:

```ts
type Result<T, E = string> =      // E has a DEFAULT
  | { ok: true; value: T }
  | { ok: false; error: E };

type AsyncState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

const r: Result<number> = { ok: true, value: 3 };            // E = string by default
const r2: Result<number, Error> = { ok: false, error: new Error('x') };
```

Generic helpers for building them:

```ts
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

(`never` here means "this side can't happen", so `Result<number, never>` fits into `Result<number, string>`.)

## Reading library signatures

Simplified slightly, React's `useState` is declared as:

```ts
function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
```

Reading it: "For some state type `S`: give me an initial `S` (or a function that returns one), and I'll give you back a tuple of the current `S` and a setter." So:

```ts
const [gold, setGold] = useState(0);                 // S = number
const [player, setPlayer] = useState<Player | null>(null);  // explicit: null alone would infer S = null
```

When inference would be too narrow (like `null`), pass the type argument explicitly. You'll do this all the time in React.

## Generic classes and interfaces (briefly)

```ts
interface Repository<T extends { id: string }> {
  get(id: string): Promise<T | undefined>;
  save(item: T): Promise<void>;
}
```

You'll write something like this for your backend in Module 15.

## When *not* to use generics

Generics are for preserving a **relationship** between inputs and outputs. If a type parameter appears only once, you probably don't need it:

```ts
// ❌ T is pointless: it's used once and doesn't connect anything
function log<T>(value: T): void { console.log(value); }
// ✅
function log(value: unknown): void { console.log(value); }
```

Too many type parameters make code hard to read. If a signature takes you more than a few seconds to understand, simplify it.

## ⚠️ Common mistakes

```ts
// 1. Constraining too loosely, then using `as` inside. Constrain properly instead.
// 2. Writing <T,> in .tsx files: `<T>` alone can be parsed as JSX in arrow functions.
const identity = <T,>(x: T) => x;    // the trailing comma tells the parser it's a generic
// 3. Expecting T to exist at runtime. It's erased like every other type.
function create<T>() { return new T(); }  // ❌ impossible
```

## Check your understanding

1. In `function first<T>(arr: readonly T[]): T | undefined`, what's T when you call `first([true, false])`?
2. What does `K extends keyof T` guarantee?
3. Why would you write `useState<string | null>(null)` instead of `useState(null)`?
4. What's wrong with `function wrap<T>(x: unknown): T`?

<details><summary>Answers</summary>

1. `boolean`.
2. That `K` is one of T's property names, so `T[K]` is a valid type and `item[key]` is a safe access.
3. With only `null` to go on, S would be inferred as `null`, and you could never set a string.
4. T isn't connected to any input, so the caller picks any T and gets an unchecked "cast". It's `as` in disguise and gives no safety.
</details>

## Further reading
- TypeScript Handbook: [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- Matt Pocock's Total TypeScript (free articles and tutorials) has excellent material on generics. Search "Total TypeScript generics".

**Practice:** exercise `02-04` generics → `npm run watch 02-04`

---
[← Discriminated unions](04-discriminated-unions.md) · [Module overview](README.md) · [Next: Type operators & utility types →](06-type-operators-and-utility-types.md)
