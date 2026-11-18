# 02.6 · Type operators & utility types

> ⏱ 120 min · Module 02 · TypeScript in Depth

## What you'll learn
- `keyof`, `typeof` (in type positions) and indexed access types `T[K]`
- `as const` and `satisfies`: deriving types **from data**
- The built-in utility types you'll use weekly
- Mapped types and template literal types (enough to read and write common ones)
- The "single source of truth" pattern for game data

---

## `typeof` in a type position

In a type annotation, `typeof value` gives you the **type of a value**:

```ts
const defaultSettings = { volume: 0.8, notifications: true, theme: 'dark' };
type Settings = typeof defaultSettings;
// { volume: number; notifications: boolean; theme: string }
```

## `keyof`

`keyof T` gives the union of T's keys:

```ts
type SettingKey = keyof Settings;   // 'volume' | 'notifications' | 'theme'
```

## Indexed access: `T[K]`

```ts
type Volume = Settings['volume'];               // number
type SomeValues = Settings['volume' | 'theme']; // number | string
type AllValues = Settings[keyof Settings];      // number | boolean | string

const tiers = ['bronze', 'iron', 'steel'] as const;
type Tier = (typeof tiers)[number];             // 'bronze' | 'iron' | 'steel'
```

`[number]` means "the type of any element".

## `as const`

`as const` tells TS to infer the **narrowest** type: literals instead of `string`/`number`, and `readonly` everywhere:

```ts
const a = { id: 'oak_log', price: 5 };            // { id: string; price: number }
const b = { id: 'oak_log', price: 5 } as const;   // { readonly id: 'oak_log'; readonly price: 5 }
const c = ['north', 'south'] as const;            // readonly ['north', 'south']
```

## `satisfies`

`satisfies` **checks** a value against a type **without changing** the value's inferred type.

```ts
type ItemDefinition = { name: string; category: 'log' | 'fish' | 'ore'; sellPrice: number };

// With an annotation, the keys widen to `string` and we lose them
const ITEMS_A: Record<string, ItemDefinition> = {
  oak_log: { name: 'Oak Log', category: 'log', sellPrice: 5 },
};
type IdA = keyof typeof ITEMS_A;   // string 😞, so any typo is allowed

// With satisfies, it's checked AND the specific keys are kept
const ITEMS = {
  oak_log: { name: 'Oak Log', category: 'log', sellPrice: 5 },
  trout:   { name: 'Trout', category: 'fish', sellPrice: 20 },
  // copper: { name: 'Copper', category: 'metal', sellPrice: 8 },  ❌ 'metal' isn't allowed
} as const satisfies Record<string, ItemDefinition>;

type ItemId = keyof typeof ITEMS;   // 'oak_log' | 'trout' 🎉
```

## The single-source-of-truth pattern

This is how your game will define its content. You write the **data** once, and the **types are derived from it**, so they can never drift apart:

```ts
export const SKILLS = {
  woodcutting: { name: 'Woodcutting', icon: '🪓' },
  fishing:     { name: 'Fishing',     icon: '🎣' },
  mining:      { name: 'Mining',      icon: '⛏️' },
} as const satisfies Record<string, { name: string; icon: string }>;

export type SkillId = keyof typeof SKILLS;   // 'woodcutting' | 'fishing' | 'mining'

export function getSkill(id: SkillId) {
  return SKILLS[id];          // no `undefined`, because the key is guaranteed to exist
}

getSkill('fishing');          // ✅
getSkill('fishin');           // ❌ caught at compile time
```

Add a skill to the object and `SkillId` updates automatically. Every `Record<SkillId, …>` in your codebase then fails to compile until you handle the new skill. You'll build this for real in lesson 13.2.

## Utility types

These are built into TypeScript. Learn them and you'll read most type definitions with ease.

| Utility | Result | Example use |
|---|---|---|
| `Partial<T>` | all props optional | update/patch objects |
| `Required<T>` | all props required | after filling in defaults |
| `Readonly<T>` | all props readonly | state you shouldn't mutate |
| `Pick<T, K>` | only keys K | `Pick<User, 'id' \| 'name'>` for a public profile |
| `Omit<T, K>` | all keys except K | `Omit<User, 'passwordHash'>` |
| `Record<K, V>` | object with keys K → V | lookups |
| `Exclude<U, X>` | union members not assignable to X | `Exclude<Status, 'idle'>` |
| `Extract<U, X>` | union members assignable to X | `Extract<Action, { type: 'sell' }>` |
| `NonNullable<T>` | removes null and undefined | |
| `ReturnType<F>` | a function's return type | `ReturnType<typeof createStore>` |
| `Parameters<F>` | a tuple of parameter types | wrapping functions |
| `Awaited<T>` | unwraps a Promise | `Awaited<ReturnType<typeof loadSave>>` |

```ts
type User = { id: string; email: string; passwordHash: string; createdAt: number };

type PublicUser = Omit<User, 'passwordHash'>;
type NewUser = Pick<User, 'email'> & { password: string };
type UserPatch = Partial<Pick<User, 'email'>>;
```

## Mapped types

Utility types are built with **mapped types**, which loop over keys:

```ts
// How Partial is defined:
type MyPartial<T> = { [K in keyof T]?: T[K] };

// Make every property a getter function
type Getters<T> = { [K in keyof T]: () => T[K] };

// Remove readonly with -readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Every skill → its level
type SkillLevels = { [S in SkillId]: number };   // same as Record<SkillId, number>
```

## Template literal types

Types can be built from strings:

```ts
type Direction = 'up' | 'down';
type ArrowKey = `Arrow${Capitalize<Direction>}`;   // 'ArrowUp' | 'ArrowDown'

type EventName<T extends string> = `on${Capitalize<T>}`;
type Handlers = EventName<'click' | 'hover'>;     // 'onClick' | 'onHover'
```

You won't write these often, but you'll see them in library types (React's event props use similar ideas).

## Conditional types (reading level)

```ts
type IsString<T> = T extends string ? true : false;
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;   // `infer` captures a type
type X = ElementOf<string[]>;  // string
```

Aim to be able to *read* these. You'll rarely need to write them in application code.

## ⚠️ Common mistakes

```ts
// 1. Annotating data objects, which widens their keys. Use `satisfies` + `as const`
// 2. typeof in the wrong place
const t = typeof ITEMS;            // runtime typeof → the string "object"
type T = typeof ITEMS;             // type-level typeof → the object's type
// 3. Forgetting `as const`, so the element types widen to string
const tiers = ['bronze', 'iron'];  // string[], and (typeof tiers)[number] is just string
// 4. Over-engineering with clever types. Readable beats clever.
```

## Check your understanding

1. What's the type of `keyof { a: 1; b: 2 }`?
2. What's the difference between `const x: Config = {...}` and `const x = {...} satisfies Config`?
3. Write the type "a `User` without `passwordHash`, with every remaining field optional".
4. Given `const SIZES = ['s', 'm', 'l'] as const`, write a type for one size.

<details><summary>Answers</summary>

1. `'a' | 'b'`.
2. The annotation makes `x`'s type exactly `Config`, so specific literal types and keys are lost. `satisfies` checks against `Config` but keeps the narrower inferred type.
3. `Partial<Omit<User, 'passwordHash'>>`.
4. `type Size = (typeof SIZES)[number];` → `'s' | 'm' | 'l'`.
</details>

## Further reading
- TypeScript Handbook: [Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html) (covers keyof, typeof, indexed access, conditional, mapped and template literal types)
- TypeScript Handbook: [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- TS 4.9 release notes: [The `satisfies` operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)

**Practice:** finish `02-01` (the `satisfies` task), then exercise `02-05` type-level → `npm run watch 02-05`

---
[← Generics](05-generics.md) · [Module overview](README.md) · [Next: Validating unknown data →](07-validating-unknown-data.md)
