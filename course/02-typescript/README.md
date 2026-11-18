# Module 02 · TypeScript in Depth

**Time:** ~20 hours · **Prerequisites:** Module 01, basic TS syntax (annotations, interfaces)

## Why this module matters
Nearly every React job listing asks for TypeScript, and interviewers can quickly tell whether you're *fighting* the compiler or *using* it. This module takes you from "I add types so the red squiggles go away" to "I design types so whole categories of bugs can't happen". In your game, good types mean you can't misspell an item id, forget to handle an action, or load a corrupted save without noticing.

## Learning objectives
By the end of this module you can:
- explain structural typing, inference, type erasure, and the important `tsconfig` options
- choose between `type` and `interface`, and model objects, arrays, tuples and records
- narrow unions with `typeof`, `in`, `instanceof`, equality and custom type guards
- model state and events with discriminated unions, with compiler-enforced exhaustiveness
- write generic functions and types with constraints
- derive types from data with `keyof`, `typeof`, indexed access, `as const` and `satisfies`
- validate untrusted data at runtime with type guards and Zod

## Lessons
| # | Lesson | Time |
|---|---|---|
| 02.1 | [How TypeScript thinks](01-how-typescript-thinks.md) | 90 min |
| 02.2 | [Object types & interfaces](02-object-types-and-interfaces.md) | 75 min |
| 02.3 | [Unions & narrowing](03-unions-and-narrowing.md) | 90 min |
| 02.4 | [Discriminated unions](04-discriminated-unions.md) | 90 min |
| 02.5 | [Generics](05-generics.md) | 120 min |
| 02.6 | [Type operators & utility types](06-type-operators-and-utility-types.md) | 120 min |
| 02.7 | [Validating unknown data](07-validating-unknown-data.md) | 90 min |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `02-01` | [typed-game-data](../../exercises/02-typescript/01-typed-game-data/exercise.ts) | 02.2 (and 02.6 for `satisfies`) |
| `02-02` | [narrowing](../../exercises/02-typescript/02-narrowing/exercise.ts) | 02.3 |
| `02-03` | [discriminated-unions](../../exercises/02-typescript/03-discriminated-unions/exercise.ts) | 02.4 |
| `02-04` | [generics](../../exercises/02-typescript/04-generics/exercise.ts) | 02.5 |
| `02-05` | [type-level](../../exercises/02-typescript/05-type-level/exercise.ts) | 02.6 |
| `02-06` | [validate-with-zod](../../exercises/02-typescript/06-validate-with-zod/exercise.ts) | 02.7 |

Some of these exercises grade your **types**. Each one has a `types.check.ts` file that the real TypeScript compiler checks. If your types are wrong, the test output shows the exact compiler error.

Hints: [`exercises/02-typescript/HINTS.md`](../../exercises/02-typescript/HINTS.md)

## Checkpoint quiz
1. Does TypeScript make your code run differently? What happens to types at runtime?
2. `type A = { name: string }` and `type B = { name: string }`. Can you pass a `B` where an `A` is expected? Why?
3. What's the difference between `any` and `unknown`?
4. What makes a union "discriminated", and why is it useful?
5. What does `never` mean, and how do you use it to make a `switch` exhaustive?
6. When would you use `satisfies` instead of a type annotation?
7. Your API returns JSON. Why can't a TypeScript type alone guarantee its shape?
8. What does `noUncheckedIndexedAccess` change about `record[key]`?

<details><summary>Answers</summary>

1. No. Types are **erased** at compile time and the output is plain JavaScript. They exist only to catch mistakes before the code runs.
2. Yes. TypeScript is **structurally** typed, so types are compatible when their shapes match, whatever their names.
3. `any` switches type checking off: you can do anything with it, unsafely. `unknown` means "could be anything", so you must narrow it before using it. Prefer `unknown`.
4. Every member has a common property with a distinct literal type (like `type: 'chop'`). Checking that property narrows to exactly one member, so the compiler knows which fields exist.
5. `never` is the type with no values. In the `default` branch, assign the narrowed value to `never` (for example with `assertNever(x)`). If you later add a union member and forget to handle it, the value isn't `never` any more and compilation fails.
6. When you want to *check* a value against a type but keep its more specific inferred type (for example literal keys for an `ItemId` union) instead of widening it to the annotation.
7. Types are erased and the compiler never sees runtime data. You need runtime validation (a type guard or a Zod schema) at the boundary.
8. The result type becomes `T | undefined`, which forces you to handle missing keys.
</details>

## Extra practice
1. **Type challenges.** Do the "warm-up" and "easy" puzzles at the type-challenges repo on GitHub (`type-challenges/type-challenges`). Aim for 10.
2. **Model a vending machine** with a discriminated union of states (`idle`, `selecting`, `paying`, `dispensing`) and a reducer with an exhaustive switch.
3. **Typed event emitter.** Write `createEmitter<Events extends Record<string, unknown>>()` with `on(name, handler)` and `emit(name, payload)`, where the payload type depends on the event name.
4. **Read real types.** Open `node_modules/zod/` or `node_modules/@types/react/index.d.ts` and find how `useState` is typed. Write down what each generic does.

**Next:** [Module 03 · How the Web Works →](../03-how-the-web-works/README.md)
