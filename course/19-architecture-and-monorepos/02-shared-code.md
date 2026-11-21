# 19.2 · Shared code

> ⏱ 1.5 hours · Module 19 · Architecture & Monorepos

## What you'll learn
- What belongs in shared packages, and what must never go there
- One schema for the save, used by the client, the server and migrations
- Typing the API contract once with Zod
- Sharing game data and engine code with the server
- Keeping shared code portable, and avoiding circular dependencies

---

## What to share

| Share | Why |
|---|---|
| **Zod schemas** for the save format and every API request and response | the client and server can never disagree about shapes (18.1) |
| **Save migrations** (13.10) | the server can migrate old saves too, with exactly the same code |
| **Game data** (items, actions, XP rates) and the **pure engine** functions | the server's plausibility checks (18.4) need the real maximum rates |
| **Constants**: limits, error codes, cookie names | one definition instead of two that drift apart |
| **Small pure utilities** (number formatting, `levelForXp`) | tested once, used everywhere |

| Never share | Why |
|---|---|
| Database code, Drizzle schemas, anything importing `pg` | it would end up in the browser bundle, or fail to build there |
| Secrets, environment config | the browser bundle is public (17.6) |
| React components, DOM code | the server can't run it, and the engine must stay framework-free (14.1) |

A useful test: **could this file run, unchanged, in both a browser and Node, with no environment variables?** If not, it doesn't belong in `packages/shared` or `packages/engine`.

## One save schema

```ts
// packages/shared/src/save.ts
import { z } from 'zod';

export const CURRENT_SAVE_VERSION = 3;

export const SaveV3Schema = z.object({
  version: z.literal(3),
  gold: z.number().int().nonnegative(),
  skills: z.record(z.string(), z.object({ xp: z.number().int().nonnegative() })),
  bank: z.record(z.string(), z.number().int().positive()),
  lastSavedAt: z.number(),
  createdAt: z.number(),
  settings: z.object({ sound: z.boolean(), notifications: z.boolean() }),
});
export type Save = z.infer<typeof SaveV3Schema>;

export { loadSave } from './migrations';   // validate + migrate any known version (13.10)
```

- **The client** validates what it reads from `localStorage` and what the server sends.
- **The server** validates every `PUT /api/save` body (18.1).
- **Tests** on both sides build fixtures typed as `Save`.

When you add a v4, you write the schema and the v3 → v4 migration once, here, and both sides get them in the same pull request. Remember the deploy order from 18.1: the server ships first.

## One API contract

The same idea works for every endpoint. Define each request and response as a schema, and derive the types:

```ts
// packages/shared/src/api.ts
import { z } from 'zod';
import { SaveV3Schema } from './save';

export const SaveResponse = z.object({
  save: z.object({ data: SaveV3Schema, revision: z.number().int(), updatedAt: z.iso.datetime() }).nullable(),
});
export type SaveResponse = z.infer<typeof SaveResponse>;

export const PutSaveRequest = z.object({ baseRevision: z.number().int().nonnegative(), data: SaveV3Schema });
export type PutSaveRequest = z.infer<typeof PutSaveRequest>;

export const ErrorResponse = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});
```

- The **server** parses request bodies with them (15.5), and can type its responses with the inferred types: `res.json(body satisfies SaveResponse)`.
- The **client's** API functions (17.8) parse responses with them, so a mismatch shows up as a clear validation error in development instead of `undefined is not a function` three components later.

Defining a schema and its type under the same name (`SaveResponse`) is a common, legal TypeScript pattern: one lives in the value space, the other in the type space.

> Bigger teams often generate this contract instead: from an OpenAPI spec, or with end-to-end typed RPC tools like tRPC or oRPC. Shared Zod schemas teach the same idea with no extra tools, and they're a perfectly good production approach at this size.

## Engine and game data on the server

The engine package (Module 13) is pure TypeScript with no DOM, no React and no timers in its core, so the server can import it too. The server mainly needs **data**: the fastest XP and gold rates possible in the game, for `checkProgress` (18.4).

```ts
// packages/engine/src/limits.ts
import { ACTIONS } from './data/actions';

/** The fastest XP per second any action gives, per skill. */
export function maxXpPerSecond(): Record<string, number> {
  const best: Record<string, number> = {};
  for (const action of Object.values(ACTIONS)) {
    const rate = action.xp / (action.durationMs / 1000);
    best[action.skill] = Math.max(best[action.skill] ?? 0, rate);
  }
  return best;
}
```

Because the limits are **derived from the data**, adding a faster action automatically raises the limit. There are no hand-maintained numbers to forget (the release-day false-alarm spike from 18.4).

## Keeping it healthy

- **Dependency direction.** `apps/*` depend on `packages/*`, never the other way round. `engine` may depend on `shared`, but `shared` depends on nothing internal. Draw the arrows. If two packages need each other, something in one of them belongs in a third.
- **No barrel-file bloat.** A `src/index.ts` that re-exports everything is convenient, but it can pull a lot into bundles and cause import cycles. Keep shared packages small and their exports deliberate.
- **Tests live with the package.** `packages/engine` has its own Vitest tests. They run in CI once, and every app benefits.
- **Watch the bundle.** Anything the web app imports from a shared package ends up in the bundle. A heavy dependency added to `shared` "just for the server" is a performance bug on phones (21.3).

## Check your understanding

1. Give two things that belong in a shared package and two that must never go there.
2. What's a quick test for whether code can live in `packages/shared`?
3. What does sharing the save schema buy you on the server? And on the client?
4. Why derive the server's XP limits from the game data instead of writing the numbers down?
5. Which direction should dependencies between `apps/*` and `packages/*` go?

<details><summary>Answers</summary>

1. Belong: any two of Zod schemas, save migrations, game data, the pure engine, constants, pure utilities. Never: any two of database code, secrets or env config, React or DOM code.
2. Could it run unchanged in both a browser and Node with no environment variables?
3. Server: it validates uploads exactly as the client defines a save. Client: it validates `localStorage` and server responses with the same rules. Both always change together.
4. So adding or rebalancing actions updates the limits automatically. Hand-written numbers go stale and cause false cheat flags.
5. Apps depend on packages, never the reverse. Shared packages don't depend on apps.
</details>

## Further reading
- Zod docs: "Basic usage" and "Defining schemas" (z.infer)
- "Dependency Inversion" for when an arrow points the wrong way

---
[← Monorepos & workspaces](01-monorepos-and-workspaces.md) · [Module overview](README.md) · [Next: Structuring a real app →](03-structuring-a-real-app.md)
