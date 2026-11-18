# 02.4 · Discriminated unions

> ⏱ 90 min · Module 02 · TypeScript in Depth

## What you'll learn
- Discriminated (tagged) unions, the most useful pattern in TypeScript
- Exhaustive `switch` statements with `never`
- Using unions to make impossible states impossible
- Modelling game actions and async loading states
- The `Result` type for errors without exceptions

---

## The pattern

A **discriminated union** is a union of object types that all share one property (the **discriminant** or **tag**) with a *different literal type* in each member:

```ts
type GameAction =
  | { type: 'chop'; treeId: string }
  | { type: 'fish'; spotId: string; baitId?: string }
  | { type: 'sell'; itemId: string; quantity: number }
  | { type: 'idle' };
```

Checking the tag narrows to exactly one member, so TypeScript knows which other fields exist:

```ts
function describe(action: GameAction): string {
  switch (action.type) {
    case 'chop':
      return `Chopping ${action.treeId}`;        // action: { type: 'chop'; treeId }
    case 'fish':
      return `Fishing at ${action.spotId}`;      // action.baitId is available here
    case 'sell':
      return `Selling ${action.quantity}× ${action.itemId}`;
    case 'idle':
      return 'Doing nothing';
  }
}
```

Try accessing `action.treeId` in the `'fish'` case: it's a compile error. The compiler is keeping track for you.

> 🧠 **You'll use this pattern everywhere.** Reducer actions in React (lesson 08.1) and your game engine are discriminated unions. So are API responses, loading states, form states, and the props of many components.

## Exhaustiveness checking with `never`

What happens when you add `{ type: 'mine'; rockId: string }` to `GameAction` next month? Every `switch` on `action.type` should handle it, and you want the **compiler** to find them all.

`never` is the type with no possible values. After you've handled every case, the narrowed type in `default` is `never`. If you forgot a case, it isn't:

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

function describe(action: GameAction): string {
  switch (action.type) {
    case 'chop': return '…';
    case 'fish': return '…';
    case 'sell': return '…';
    case 'idle': return '…';
    default:
      return assertNever(action);
      // If 'mine' is added and not handled:
      // ❌ Argument of type '{ type: "mine"; rockId: string }' is not assignable to parameter of type 'never'
  }
}
```

This turns "I forgot to handle the new action" from a runtime bug into a compile error that points at every place you need to update. It's one of the most valuable tricks in TypeScript.

## Make impossible states impossible

Here's a common way to model loading data:

```ts
// ❌ Booleans and optionals
type SaveState = {
  isLoading: boolean;
  error?: string;
  data?: SaveFile;
};
```

How many combinations does that allow? `isLoading: true` *and* `error` *and* `data` all at once. What does that even mean? Your UI code has to defend against nonsense states.

```ts
// ✅ A discriminated union: only valid states can exist
type SaveState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: SaveFile }
  | { status: 'error'; error: string };

function SaveBanner(state: SaveState) {
  switch (state.status) {
    case 'idle':    return null;
    case 'loading': return 'Loading your save…';
    case 'success': return `Welcome back, ${state.data.playerName}`; // data guaranteed
    case 'error':   return `Couldn't load: ${state.error}`;          // error guaranteed
  }
}
```

You can't access `data` while loading, and you can't forget to show the error. You'll use this pattern for the cloud-sync status in Module 18.

## Making it generic

Loading state is so common that you'll want to reuse it for any data type. Here's a preview of generics (lesson 02.5):

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

let leaderboard: AsyncState<Player[]> = { status: 'idle' };
```

## Errors as values: the `Result` type

Exceptions are invisible in function signatures: nothing tells you `parseSave` might throw. An alternative popular in TypeScript codebases is to **return** success or failure as a union:

```ts
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parseQuantity(input: string): Result<number> {
  const n = Number(input);
  if (!Number.isInteger(n) || n < 0) return { ok: false, error: `Invalid quantity: ${input}` };
  return { ok: true, value: n };
}

const result = parseQuantity(userInput);
if (result.ok) {
  sell(result.value);        // number
} else {
  showError(result.error);   // string
}
```

The caller *can't* use the value without checking `ok` first. Use `Result` for **expected** failures (bad input, item not found, validation) and exceptions for **unexpected** ones (bugs, a corrupted environment).

## Narrowing by tag in other ways

You don't always need `switch`:

```ts
if (action.type === 'sell') {
  total += action.quantity;    // narrowed
}

const sells = actions.filter((a) => a.type === 'sell');
// TS 5.5+ infers the narrowed type here; on older versions add a type predicate:
const sells2 = actions.filter((a): a is Extract<GameAction, { type: 'sell' }> => a.type === 'sell');
```

`Extract<Union, Shape>` picks the union members that match a shape (more in 02.6).

## ⚠️ Common mistakes

```ts
// 1. Using `string` for the tag. It must be a LITERAL type per member, or no narrowing happens
type Bad = { type: string; treeId?: string };

// 2. Destructuring before narrowing loses the connection
const { type, treeId } = action;  // ❌ treeId doesn't exist on every member

// 3. Default branch that swallows new cases silently
default: return '';               // compiles even when you forget a case. Use assertNever

// 4. Optional fields instead of separate members
type Action = { type: 'chop' | 'fish'; treeId?: string; spotId?: string };  // impossible states again
```

## Check your understanding

1. What two things make a union "discriminated"?
2. What's the type of `action` in the `default` branch after every case has been handled?
3. Rewrite `{ loading: boolean; data?: string[]; error?: string }` as a discriminated union.
4. When would you return a `Result` instead of throwing?

<details><summary>Answers</summary>

1. Every member has a common property, and that property has a distinct **literal** type in each member.
2. `never`.
3. `{ status: 'loading' } | { status: 'success'; data: string[] } | { status: 'error'; error: string }`. Add `{ status: 'idle' }` if "not started" is a state you need.
4. For expected, recoverable failures that callers should handle, like invalid input or a missing item, so the possibility shows up in the type signature.
</details>

## Further reading
- TypeScript Handbook: [Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) and [Exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- Talk: Richard Feldman, *"Making Impossible States Impossible"*. It's about Elm, but the ideas apply directly to TS.

**Practice:** exercise `02-03` discriminated-unions → `npm run watch 02-03`

---
[← Unions & narrowing](03-unions-and-narrowing.md) · [Module overview](README.md) · [Next: Generics →](05-generics.md)
