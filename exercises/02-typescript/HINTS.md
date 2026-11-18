# Hints · Module 02

Open **one level at a time**. Give each level a real attempt before opening the next.

> **Reading type-test failures:** an error like `types.check.ts(36,20): error TS2344: Type 'false' does not satisfy the constraint 'true'` means "the `Expect<Equal<…>>` on line 36 isn't equal yet". Go to that line and hover over both sides in VS Code to compare. `Unused '@ts-expect-error' directive` means a line that *should* be an error currently isn't: your type is too loose.

---

## 02-01 · typed-game-data

<details><summary>Level 1 · Nudge</summary>

- Tasks 1–2 are plain type aliases (02.2).
- Task 3 is `as const` + `satisfies` (02.6).
- Task 4 is `keyof typeof` (02.6).
- Task 7 combines `Partial` and `Record`.
</details>

<details><summary>Level 2 · Direction</summary>

- `ItemDefinition` needs a `?` on `description`.
- After `ITEMS` is `as const satisfies Record<string, ItemDefinition>`, `keyof typeof ITEMS` gives the id union.
- `inventoryValue`: `Object.entries(inventory)` gives you `string` keys, not `ItemId`, because TS can't promise an object has no extra keys. Two options: loop over the *known* ids (`Object.keys(ITEMS)`, cast once to `ItemId[]`), or cast the entries. Both are acceptable, documented uses of `as`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

1. `export type ItemCategory = 'log' | 'fish' | 'ore' | 'bar';`
2. `export type ItemDefinition = { name: string; category: ItemCategory; sellPrice: number; description?: string };`
3. After the closing `}` of ITEMS: `as const satisfies Record<string, ItemDefinition>`.
4. `export type ItemId = keyof typeof ITEMS;`
5. `getItem` is one line: `return ITEMS[id];`.
6. `export type Inventory = Partial<Record<ItemId, number>>;`
7. `inventoryValue`: `(Object.keys(ITEMS) as ItemId[]).reduce((sum, id) => sum + sellValue(id, inventory[id] ?? 0), 0)`.
</details>

---

## 02-02 · narrowing

<details><summary>Level 1 · Nudge</summary>

- `value is ItemStack` as the return type makes a type guard.
- `Array.isArray` narrows arrays.
- Order your checks so each branch removes one possibility.
- A regular expression can check "only digits".
</details>

<details><summary>Level 2 · Direction</summary>

- `isItemStack`: check `typeof value === 'object'`, then `value !== null`, then `'itemId' in value`, then the property's type, and so on. Each check narrows `value` further, so the next check compiles.
- `describeReward`: handle `null`/`undefined` first, then `number`, then `string`, then arrays. Whatever is left must be a single `ItemStack`.
- `parseQuantity`: two branches, `typeof input === 'number'` and `typeof input === 'string'`. For strings, trim and test against `/^\d+$/`.
- `getErrorMessage`: `instanceof Error` first.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- After `'quantity' in value`, TS lets you read `value.quantity` (as `unknown`), so `typeof value.quantity === 'number' && Number.isInteger(value.quantity) && value.quantity > 0`.
- `describeReward` array branch: `reward.length === 0 ? 'nothing' : reward.map(describeStack).join(', ')` with a small helper `describeStack`.
- Why not `Number(input)` alone? `Number('')` is `0`, `Number('1e3')` is `1000` and `Number(' 7 ')` is `7`. The regex is stricter and clearer.
</details>

---

## 02-03 · discriminated-unions

<details><summary>Level 1 · Nudge</summary>

`switch (action.type)` with one `case` per member, and `default: return assertNever(action);`.
</details>

<details><summary>Level 2 · Direction</summary>

- Inside each `case`, `action` is narrowed, so you can read that member's fields.
- For cases that declare `const`s, wrap the body in `{ }` braces.
- Return the **same** `state` in the "no change" cases (`stopAction` when idle, selling more than you have).
- `LoadState<T>` is four object types joined with `|`, each with a `status` literal.
</details>

<details><summary>Level 3 · Walkthrough</summary>

`sellItem` step by step:
1. `const have = state.bank[action.itemId] ?? 0;`
2. `if (have < action.quantity) return state;`
3. Work out `remaining`. Build the new bank: if `remaining === 0`, use rest destructuring to drop the key (see 01-01), otherwise spread with the new count.
4. Return `{ ...state, bank: newBank, gold: state.gold + action.quantity * action.pricePerItem }`.

The singular/plural in `loadStateLabel`: `` `${n} ${n === 1 ? 'save' : 'saves'} found` ``.
</details>

---

## 02-04 · generics

<details><summary>Level 1 · Nudge</summary>

Every function needs `<T>` (and sometimes `<K>` or `<U>`). Ask yourself: *what relationship between input and output am I preserving?*
</details>

<details><summary>Level 2 · Direction</summary>

- `first<T>(arr: readonly T[]): T | undefined`
- `groupBy` needs `T` and `K extends PropertyKey` (PropertyKey = string | number | symbol).
- `pluck` needs `K extends keyof T`, and its return type is `T[K][]`.
- `Result<T, E = string>`: the `= string` is a default type parameter.
- `mapResult<T, U, E>`: the error type passes through unchanged.
- `createRegistry<T extends { id: string }>()`: use a `Map<string, T>` inside.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- `groupBy` body: `const groups: Partial<Record<K, T[]>> = {};`, then for each item `(groups[key] ??= []).push(item);`.
- `mapResult` body: `return result.ok ? ok(fn(result.value)) : result;`. Why can you return `result` directly in the error branch? Its type is narrowed to `{ ok: false; error: E }`, which is assignable to `Result<U, E>`.
- In the registry, `all()` returns `[...map.values()]`, because Maps keep insertion order.
</details>

---

## 02-05 · type-level

<details><summary>Level 1 · Nudge</summary>

Most of these are **mapped types**: `{ [K in keyof T]: T[K] }` with something changed. `ElementOf` is a **conditional type** with `infer`.
</details>

<details><summary>Level 2 · Direction</summary>

- Optional: `{ [K in keyof T]?: T[K] }`. Readonly: put `readonly` before the `[`.
- `MyPick`: loop over `K`, not over `keyof T`.
- `MyOmit`: loop over the keys of T *excluding* K (`Exclude`).
- `ValueOf`: index T with *all* its keys at once.
- `ElementOf<T> = T extends readonly (infer E)[] ? E : never`
- `Handlers`: key remapping looks like `{ [K in E as NewKey]: ... }`, where `NewKey` is a template literal type using `Capitalize<K>`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- `DeepReadonly<T>`: like `MyReadonly`, but for each property ask `T[K] extends object ? DeepReadonly<T[K]> : T[K]`. You don't need a special case for arrays: mapping over an array type with `readonly` produces a `readonly` array automatically.
- `Handlers<E>`: `{ [K in E as \`on${Capitalize<K>}\`]: () => void }`.
</details>

---

## 02-06 · validate-with-zod

<details><summary>Level 1 · Nudge</summary>

- `z.literal`, `z.string().trim().min().max()`, `z.number().int()`, `z.record(keySchema, valueSchema)`, `.default()`.
- `z.infer<typeof Schema>` gives you the type.
- `safeParse` doesn't throw.
- `asserts value is string` is the return type of an assertion function.
</details>

<details><summary>Level 2 · Direction</summary>

- Put `.trim()` **before** `.min(1)` so the length check runs on the trimmed string.
- `parseSave`: `JSON.parse` inside `try/catch` (return `Invalid JSON` from the catch). Then `safeParse`. On failure, take `result.error.issues[0]` and build `"path: message"`.
- `issue.path` is an array like `['skills', 'fishing', 'xp']`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

```
const issue = result.error.issues[0];
const where = issue && issue.path.length > 0 ? issue.path.join('.') : '(root)';
return { ok: false, error: `${where}: ${issue?.message}` };
```
(With `noUncheckedIndexedAccess`, `issues[0]` might be `undefined` as far as TS knows, hence the `issue &&` and `?.`.)

Return `result.data`, not `raw`, on success. Otherwise the trim and the bank default are lost.
</details>
