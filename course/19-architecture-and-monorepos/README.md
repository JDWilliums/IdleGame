# Module 19 · Architecture & Monorepos

**Time:** ~6 hours · **Prerequisites:** Modules 13–18

## Why this module matters
Until now, every exercise has been one file. Your game will be a web app, an API and shared packages that have to fit together, keep fitting together as they change, and run on different machines with different settings. This module covers the structure that makes that manageable: a monorepo with workspaces, shared schemas so the client and server can't disagree, a folder structure a new teammate can navigate, and configuration that fails loudly instead of mysteriously. It's the bridge between "I can build features" and "I can build a codebase", and it's what milestone C01 sets up.

## Learning objectives
By the end of this module you can:
- set up an npm-workspaces monorepo with apps and internal packages
- decide what belongs in shared code, and share Zod schemas and game data between client and server
- organise a React app by feature, with clear homes for every kind of state
- record architectural decisions as ADRs
- load configuration from the environment, validate it at startup and keep secrets out of code and bundles

## Lessons
| # | Lesson | Time |
|---|---|---|
| 19.1 | [Monorepos & workspaces](01-monorepos-and-workspaces.md) | 1.5h |
| 19.2 | [Shared code](02-shared-code.md) | 1.5h |
| 19.3 | [Structuring a real app](03-structuring-a-real-app.md) | 1.5h |
| 19.4 | [Config & secrets](04-config-and-secrets.md) | 1.5h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `19-01` | [env-config](../../exercises/19-architecture-and-monorepos/01-env-config/exercise.ts) | 19.4 |

Hints: [`exercises/19-architecture-and-monorepos/HINTS.md`](../../exercises/19-architecture-and-monorepos/HINTS.md)

The rest of this module's practice is milestone **C01**, where you set up your game's monorepo for real.

## Checkpoint quiz
1. What's the difference between `apps/` and `packages/` in the layout from 19.1?
2. How does `import { SaveSchema } from '@hearthwild/shared'` find the code?
3. Why can the web app import a shared package that exports `.ts` files directly?
4. Name something that must never be put in a shared package, and say why.
5. Where should "which tab is selected on the skills page" live? And "the current user"?
6. What's an ADR, and what are its three sections?
7. Why is `Boolean(process.env.COOKIE_SECURE)` a bug?
8. Is it safe to put an API key in `VITE_API_KEY`?

<details><summary>Answers</summary>

1. `apps/` holds things you deploy (the web app, the API). `packages/` holds libraries they use.
2. npm workspaces symlink `packages/shared` into the root `node_modules/@hearthwild/shared`, so normal package resolution finds it.
3. Vite compiles TypeScript in any file it imports, including files from workspace packages.
4. Any of: database code (it would be bundled into the browser or fail to build), secrets or config (the bundle is public), React or DOM code (the server and engine can't use it).
5. The tab: the URL. The current user: TanStack Query (server state).
6. A short record of one architectural decision: Context, Decision and Consequences.
7. Environment variables are strings, and `'false'` is a non-empty string, so it's truthy. Parse `'true'`/`'false'` explicitly.
8. No. `VITE_` values are pasted into the public JavaScript bundle at build time.
</details>

## Extra practice
1. **A mini monorepo.** In a scratch folder, create a root with workspaces, a `packages/shared` exporting one Zod schema, and two apps (a Vite app and a tsx script) that import it. Change the schema and watch both type-check against the change.
2. **Three ADRs.** Write ADRs for three decisions you've already made in this course: sessions vs JWTs (17.3), storing the save as `jsonb` (16.1), and choosing a save over merging (18.3). These go straight into your capstone repo.
3. **Typed client env.** Add `src/vite-env.d.ts` typing for one `VITE_` variable to a Vite project, and confirm a typo in its name is a compile error.

**Next:** [Module 20 · Deployment & DevOps →](../20-deployment/README.md)
