# 02.7 · Validating unknown data

> ⏱ 90 min · Module 02 · TypeScript in Depth

## What you'll learn
- Where "trust boundaries" are in a web app
- Hand-written type guards and assertion functions
- Zod: schemas, `parse` vs `safeParse`, inferred types, defaults and transforms
- Turning validation errors into useful messages

---

## Types stop at the boundary

TypeScript checks the code **you** write. It knows nothing about data that arrives at runtime:

```
            ┌─────────────── your typed program ───────────────┐
  network ──►│  fetch().json()   → any        ← TRUST BOUNDARY  │
  storage ──►│  localStorage     → string     ← TRUST BOUNDARY  │
  user    ──►│  form inputs      → string     ← TRUST BOUNDARY  │
  env     ──►│  process.env.X    → string|undefined ← BOUNDARY  │
            └──────────────────────────────────────────────────┘
```

At every boundary the data could be **anything**: a corrupted save, an old save format, a server bug, a malicious request, a user typing "abc" into a number field. You must **validate at the boundary**, and then the rest of your code can trust the types.

Common boundaries in your game:
- loading a save from `localStorage` (old versions, manual tampering, truncated writes)
- API responses on the client
- **request bodies on the server**. This is critical for security: never trust the client.
- environment variables (lesson 19.4)

## Step 1: treat external data as `unknown`

```ts
const raw: unknown = JSON.parse(text);   // JSON.parse returns `any`. Annotate it as unknown!
```

## Step 2a: hand-written type guards

For small shapes, write a type guard (lesson 02.3):

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type Settings = { volume: number; muted: boolean };

function isSettings(value: unknown): value is Settings {
  return (
    isRecord(value) &&
    typeof value.volume === 'number' && value.volume >= 0 && value.volume <= 1 &&
    typeof value.muted === 'boolean'
  );
}
```

### Assertion functions

An assertion function **throws** if the check fails, and narrows the type afterwards:

```ts
function assertIsString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string, got ${typeof value}`);
  }
}

const id: unknown = req.params.id;
assertIsString(id, 'id');
id.toUpperCase();   // ✅ string from here on
```

Hand-written guards are fine for tiny shapes, but they get long, repetitive and easy to get subtly wrong for real data. That's why there are libraries for this.

## Step 2b: Zod

**Zod** lets you describe a shape once, as a *schema*, and get both:
1. a **runtime validator**, and
2. a **TypeScript type**, inferred from the schema.

```ts
import { z } from 'zod';

const SettingsSchema = z.object({
  volume: z.number().min(0).max(1),
  muted: z.boolean(),
  theme: z.enum(['light', 'dark']).default('dark'),   // missing → 'dark'
});

type Settings = z.infer<typeof SettingsSchema>;
// { volume: number; muted: boolean; theme: 'light' | 'dark' }
```

There's one source of truth, and the type can't drift away from the validation.

### `parse` vs `safeParse`

```ts
// parse: returns the data or THROWS a ZodError
const settings = SettingsSchema.parse(raw);

// safeParse: never throws. Returns a discriminated union (lesson 02.4!)
const result = SettingsSchema.safeParse(raw);
if (result.success) {
  result.data.volume;          // typed Settings
} else {
  result.error.issues;         // what went wrong, and where
}
```

Use `safeParse` when failure is **expected and you want to handle it** (a user's save, a form). Use `parse` when failure means a **bug or misconfiguration** that should crash loudly (environment variables at server start-up).

### Reading errors

Each issue has a `path` (where in the object) and a `message`:

```ts
const r = SettingsSchema.safeParse({ volume: 2, muted: 'no' });
if (!r.success) {
  for (const issue of r.error.issues) {
    console.log(issue.path.join('.'), issue.message);
  }
  // volume  Too big: expected number to be <=1
  // muted   Invalid input: expected boolean, received string
  console.log(z.prettifyError(r.error));   // a multi-line human-readable summary
}
```

### A tour of the Zod toolbox

```ts
z.string().min(1).max(20)              // length limits
z.string().trim().toLowerCase()        // transforms run during parse
z.email()                              // common formats are top-level helpers
z.number().int().nonnegative()         // whole numbers ≥ 0
z.literal(1)                           // exactly the value 1
z.enum(['wood', 'fish', 'ore'])
z.array(z.string()).max(100)
z.record(z.string(), z.number())       // { [key: string]: number }
z.object({ ... }).strict()             // reject unknown keys
z.union([A, B]) / z.discriminatedUnion('type', [A, B])
z.string().optional() / .nullable() / .default('x')
z.coerce.number()                      // "42" → 42 (handy for query strings and form fields)
```

### Validating a save file

```ts
const SaveFileSchema = z.object({
  version: z.literal(1),
  playerName: z.string().min(1).max(20),
  gold: z.number().int().nonnegative(),
  skills: z.record(z.string(), z.object({ xp: z.number().int().nonnegative() })),
  bank: z.record(z.string(), z.number().int().positive()).default({}),
  lastSavedAt: z.number(),
});

type SaveFile = z.infer<typeof SaveFileSchema>;

function loadSave(text: string): SaveFile | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;                       // not even valid JSON
  }
  const result = SaveFileSchema.safeParse(raw);
  return result.success ? result.data : null;
}
```

In lesson 13.10 you'll extend this with **versioned saves and migrations**: you'll check `version` first, upgrade old saves step by step, and then validate.

> 🧠 **Server and client share schemas.** In Module 19 you'll put schemas like `SaveFileSchema` in a shared package. The client validates what it loads, the server validates what it receives, and both use the same definition.

## Where *not* to validate

Validate at boundaries, not everywhere. Inside your program, trust your types. Re-validating data you just validated adds noise and slows things down.

## ⚠️ Common mistakes

```ts
// 1. as instead of validation
const save = JSON.parse(text) as SaveFile;            // no check at all

// 2. Validating, then using the ORIGINAL object instead of the parsed one
const r = Schema.safeParse(raw);
if (r.success) use(raw);    // ❌ raw is unknown, and you lose defaults and transforms. Use r.data

// 3. Throwing from parse in a place where bad input is normal (forms, user saves)

// 4. Forgetting JSON.parse can throw. Wrap it in try/catch.
```

## Check your understanding

1. Name three trust boundaries in a full-stack game.
2. What two things does a Zod schema give you?
3. When would you choose `parse` over `safeParse`?
4. Why use `result.data` rather than the raw input after validation?

<details><summary>Answers</summary>

1. Any three of: API responses on the client, request bodies on the server, `localStorage` saves, form inputs, URL/query parameters, environment variables.
2. A runtime validator, and an inferred TypeScript type (`z.infer`).
3. When invalid data means a bug or misconfiguration that *should* crash loudly, like env vars at start-up. `safeParse` is for failures you expect and handle.
4. `result.data` is typed, and it includes defaults and transforms (trimmed strings, default values, coerced numbers). The raw input is still `unknown`.
</details>

## Further reading
- Zod docs: https://zod.dev (read "Basic usage" and "Defining schemas")
- TypeScript Handbook: [Assertion functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions)

**Practice:** exercise `02-06` validate-with-zod → `npm run watch 02-06`

---
[← Type operators & utility types](06-type-operators-and-utility-types.md) · [Module overview](README.md) · [Next module: How the Web Works →](../03-how-the-web-works/README.md)
