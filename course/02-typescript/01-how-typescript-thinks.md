# 02.1 · How TypeScript thinks

> ⏱ 90 min · Module 02 · TypeScript in Depth

## What you'll learn
- What TypeScript actually is (and isn't)
- Type erasure: why types vanish at runtime
- Structural typing
- Inference, and when to write annotations yourself
- `any` vs `unknown`
- The `tsconfig.json` options that matter, and why this course uses strict settings
- How to read TypeScript error messages

---

## TypeScript = JavaScript + a type checker

TypeScript is JavaScript with type annotations, plus a program (`tsc`) that **checks** them. When your code runs, the types are gone:

```ts
// what you write
function heal(hp: number, amount: number): number {
  return Math.min(hp + amount, 100);
}

// what actually runs (types erased)
function heal(hp, amount) {
  return Math.min(hp + amount, 100);
}
```

Three consequences:
1. **Types have zero runtime cost**, and also **zero runtime protection**. If data from an API or `localStorage` is the wrong shape, TypeScript can't stop it (lesson 02.7 handles this).
2. You **can't use a type as a value**: `if (x instanceof MyType)` only works for classes, not for `type`s or `interface`s.
3. Many tools **strip** types without checking them. Vite, Vitest, esbuild and Node's built-in TS support all do this. Your code can *run* with type errors in it, so you must run `tsc` (`npm run typecheck`) to actually check, and CI should run it too (lesson 20.4).

> 🧠 **TypeScript 7.** This course uses TypeScript 7, whose compiler was rewritten in Go and is roughly 10× faster than the old JavaScript-based one. The *language* is the same: everything you learn applies to TS 5/6 codebases at work too.

## Structural typing

TypeScript compares types by their **shape**, not their name:

```ts
type Player = { name: string; level: number };
type Monster = { name: string; level: number };

function describe(p: Player) { return `${p.name} (lvl ${p.level})`; }

const goblin: Monster = { name: 'Goblin', level: 3 };
describe(goblin);  // ✅ fine: same shape
```

An object with **extra** properties also fits:

```ts
const boss = { name: 'Dragon', level: 50, hp: 9000 };
describe(boss);    // ✅ boss has everything Player needs (and more)
```

…except when you pass an **object literal directly**, where TypeScript runs an "excess property check" to catch typos:

```ts
describe({ name: 'Dragon', level: 50, hp: 9000 });
// ❌ Object literal may only specify known properties, and 'hp' does not exist in type 'Player'
```

## Inference: let the compiler work

You don't need to annotate everything. TypeScript **infers** types from values:

```ts
let gold = 100;            // number
const name = 'Ava';        // "Ava": a const can never change, so its type is the literal
let title = 'Ava';         // string: a let could change, so it's widened
const items = ['log', 'ore'];           // string[]
const pos = { x: 1, y: 2 };             // { x: number; y: number }
const total = items.map((i) => i.length);  // number[]
```

**Where to write types yourself:**
- **Function parameters.** They can't be inferred.
- **Exported function return types.** This is optional but recommended. It documents intent and stops accidental changes to your API.
- **Empty collections**: `const ids: string[] = [];` (otherwise TS doesn't know what goes in).
- **When inference is too wide or too narrow** for what you mean.

Don't annotate what's obvious: `const count: number = 0` is just noise.

## `any` vs `unknown`

```ts
let a: any = JSON.parse(text);
a.foo.bar.baz();         // compiles! Explodes at runtime. `any` turns checking OFF.

let u: unknown = JSON.parse(text);
u.foo;                   // ❌ Error: 'u' is of type 'unknown'
if (typeof u === 'object' && u !== null && 'foo' in u) {
  u.foo;                 // ✅ after narrowing (lesson 02.3)
}
```

- `any` is **contagious**: anything you touch from it is also `any`, and bugs spread silently.
- `unknown` is the **safe** "I don't know yet" type. It forces you to check before using.

**Rule: never write `any` in this course.** If you're tempted to, use `unknown` and narrow it.

## `tsconfig.json`: the options that matter

Open this repo's [`tsconfig.json`](../../tsconfig.json). Here's what each option does:

| Option | Meaning |
|---|---|
| `strict: true` | Turns on the family of strict checks, most importantly `strictNullChecks` (`null`/`undefined` aren't assignable to everything) and `noImplicitAny`. **Always on in professional code.** |
| `noUncheckedIndexedAccess` | `record[key]` and `array[i]` are typed as `T \| undefined`, because the key might not exist. Slightly more typing, *much* safer. Great for game lookups. |
| `target` / `lib` | Which JS version to output, and which built-in APIs (like `Array.prototype.toSorted` or the DOM) exist. |
| `module` / `moduleResolution: "bundler"` | How imports are written and resolved. `bundler` matches how Vite resolves them. |
| `jsx: "react-jsx"` | Compile JSX for React 17+ (you don't need `import React`). |
| `verbatimModuleSyntax` | Type-only imports must use `import type`. What you write is exactly what remains in the JS. |
| `isolatedModules` | Each file can be compiled on its own, as Vite and esbuild require. |
| `noEmit` | `tsc` only checks. Something else (Vite) produces the JavaScript. |
| `skipLibCheck` | Don't type-check `.d.ts` files inside `node_modules`. Faster, and avoids errors in other people's code. |

### What `strictNullChecks` buys you
```ts
function findItem(id: string): Item | undefined { /* ... */ }

const item = findItem('oak_log');
item.name;          // ❌ 'item' is possibly 'undefined'
item?.name;         // ✅ string | undefined
if (item) item.name // ✅ string
```

Without strict mode, that first line compiles and crashes at runtime with *"Cannot read properties of undefined"*, probably the most common JavaScript error there is.

## Reading error messages

TypeScript errors look scary but follow a pattern. Read them **from the bottom up**, because the last line is usually the most specific:

```
Argument of type '{ name: string; lvl: number; }' is not assignable to parameter of type 'Player'.
  Property 'level' is missing in type '{ name: string; lvl: number; }' but required in type 'Player'.
```

→ The bottom line says it all: you wrote `lvl`, and it wants `level`.

Tips:
- Hover over variables in VS Code to see their inferred types. This is the single best way to learn TS.
- The error code (`TS2322`) is searchable.
- Long errors about generic types usually have a simple cause on the last line.

## The TypeScript playground

https://www.typescriptlang.org/play is an in-browser editor that shows the compiled JavaScript and the inferred types side by side. Use it to try out examples from this module and to see type erasure happen.

## ⚠️ Common mistakes

```ts
// 1. Using `as` to silence errors. It lies to the compiler (more in 02.3)
const save = JSON.parse(text) as SaveFile;    // no check happens at all!

// 2. Annotating with a wider type than you mean
const directions: string[] = ['north', 'south'];   // now any string is allowed
const directions2 = ['north', 'south'] as const;   // readonly ['north', 'south']

// 3. Thinking a passing typecheck means correct data at runtime (it doesn't for external data)

// 4. Using `Object`, `Function`, `{}` as types. They accept almost anything.
//    Use specific types, `object`, `unknown`, or `(...args: unknown[]) => unknown`.
```

## Check your understanding

1. You run your Vite app and it works, but `npm run typecheck` shows errors. How is that possible?
2. Why is `const role = 'admin'` typed as `'admin'` but `let role = 'admin'` typed as `string`?
3. With `noUncheckedIndexedAccess`, what's the type of `inventory['oak_log']` if `inventory: Record<string, number>`?
4. Why is `unknown` safer than `any`?

<details><summary>Answers</summary>

1. Vite strips types without checking them. The JavaScript runs, but it contains mistakes the type checker would have caught.
2. A `const` can never be reassigned, so its type is exactly that literal. A `let` might be reassigned to another string, so TS **widens** it to `string`.
3. `number | undefined`.
4. `any` disables checking, so mistakes compile. `unknown` requires you to prove what the value is (narrowing) before using it.
</details>

## Further reading
- TypeScript Handbook: [The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)
- TypeScript Handbook: [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [TSConfig reference](https://www.typescriptlang.org/tsconfig/): look up each option from this repo's config

---
[Module overview](README.md) · [Next: Object types & interfaces →](02-object-types-and-interfaces.md)
