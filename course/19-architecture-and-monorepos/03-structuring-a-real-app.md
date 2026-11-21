# 19.3 · Structuring a real app

> ⏱ 1.5 hours · Module 19 · Architecture & Monorepos

## What you'll learn
- A feature-based folder structure for the React app
- Where each kind of state lives, in one table
- Public entry points for features, and import rules that keep them independent
- Naming and colocation conventions
- Architecture Decision Records: writing down *why*

---

## The web app

```
apps/web/src/
├── main.tsx                  ← starts the game runtime, renders <App/> (14.1)
├── app/                      ← wiring: providers, router, layout, error boundary
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx         ← QueryClientProvider, GameStoreProvider…
├── runtime/                  ← the game store and loop, created once (14.1, 14.2)
├── features/
│   ├── skills/               ← skill list, skill page, action cards, progress bars
│   │   ├── components/
│   │   ├── hooks.ts
│   │   ├── selectors.ts
│   │   └── index.ts          ← the feature's public API
│   ├── bank/
│   ├── shop/
│   ├── combat/
│   ├── auth/                 ← useMe, login/register pages (17.8)
│   └── sync/                 ← sync engine, status indicator, conflict dialog (18.5)
├── components/ui/            ← design-system pieces: Button, Card, Dialog, ProgressBar
├── lib/                      ← api client, formatting, storage helpers
└── styles/
```

This is the **feature folder** structure from 06.2, at full size. Everything about the bank (its components, hooks, selectors and tests) lives in `features/bank/`. When a ticket says "the bank's sort is wrong", you know where to look, and deleting a feature means deleting one folder.

### Public entry points
Each feature exports what others may use from its `index.ts`:

```ts
// features/bank/index.ts
export { BankPage } from './components/BankPage';
export { useItemCount } from './hooks';
```

Other code imports `from '@/features/bank'`, never `from '@/features/bank/components/internal/SortMenu'`. Then the bank's internals can be reorganised freely without breaking anything else.

Rules for imports between folders:

```
app/ ──► features/* ──► components/ui, lib, runtime, @hearthwild/engine, @hearthwild/shared
              │
              └──► other features only through their index.ts (and sparingly)
```

Put these rules in the README, and enforce them with a lint rule (e.g. `no-restricted-imports` patterns) if they start being broken.

### Path aliases
`import { Button } from '../../../components/ui/Button'` gets unreadable. An alias makes it `@/components/ui/Button`:

```ts
// vite.config.ts
resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
```

```jsonc
// tsconfig.json → compilerOptions
"paths": { "@/*": ["./src/*"] }
```

Both are needed: one for Vite at build time, one for TypeScript.

## Where state lives

You've learned several kinds of state across the course. In a real app, each piece of data has **one** home:

| Data | Home | Lesson |
|---|---|---|
| Game state (skills, bank, gold, current action) | the game store, outside React | 14.1–14.2 |
| Server state (the current user, the leaderboard) | TanStack Query | 10.4, 17.8 |
| Sync status | the sync engine | 18.5 |
| UI state for one component (a menu is open, a text field's value) | `useState` in that component | 07 |
| UI state that should survive a reload or be shareable (the selected tab, a filter) | the URL | 10.1 |
| Settings (sound, notifications) | inside the save, so they sync | 13.10 |
| Theme | `localStorage` + a CSS class | 11 |

When someone asks "where should this go?", go down this table. Most state bugs come from keeping one piece of data in two places.

## The API

The backend follows 15.6, organised by feature in the same way:

```
apps/api/src/
├── index.ts               ← composition root: config, db, repos, createApp, listen, shutdown
├── app.ts                 ← createApp(deps): middleware + routers
├── config.ts              ← loadConfig (19.4, exercise 19-01)
├── db/                    ← Drizzle client, schema, migrations
├── features/
│   ├── auth/              ← routes, session service, password hasher (17-01..17-03)
│   ├── saves/             ← routes, repository, plausibility checks (18-01, 18-04)
│   └── leaderboard/
└── middleware/            ← error handler, rate limiter, request logging
```

## Conventions

- **File names**: `PascalCase.tsx` for components, `camelCase.ts` for everything else. Pick a convention and follow it everywhere. Consistency matters more than the choice.
- **Tests sit next to the code**: `BankPage.tsx` and `BankPage.test.tsx`. Moving a file moves its test.
- **One component per file**, apart from tiny private helpers.
- **Named exports**, which rename consistently and autocomplete better than default exports.
- **No `utils.ts` dumping ground**: `lib/format.ts`, `lib/storage.ts`, `lib/api.ts`. A file's name should say what's inside.

## Architecture Decision Records

Six months from now, someone (probably you) will ask "why is the save a JSON blob and not tables?" An **ADR** is a short markdown file recording one decision, so the answer isn't lost:

```markdown
# 0003. Store the save as a jsonb document

Date: 2026-04-02 · Status: accepted

## Context
The client's engine owns a versioned GameState object (13.10). The server must store it,
sync it between devices and build leaderboards from it.

## Decision
Store the whole save in `saves.data` (jsonb), with a revision for optimistic concurrency.
Copy skill XP into `skill_xp` in the same transaction for the leaderboard.

## Consequences
+ New game features need no migrations or server changes.
+ One read and one write per sync.
− Ad-hoc queries inside saves are clumsier (jsonb operators).
− The extracted columns must be kept in step (same transaction, one code path).
```

Keep them in `docs/adr/`, numbered, and never edit a decision. Write a new one that supersedes it. A handful of ADRs in your capstone repo shows reviewers and interviewers that you think about trade-offs, and it's exactly what senior engineers do.

## Check your understanding

1. What goes in `app/`, `features/` and `components/ui/`?
2. Why should other code import a feature only through its `index.ts`?
3. Where does the selected tab on the skills page live? The current user? The player's gold?
4. Why are path aliases configured in both Vite and TypeScript?
5. What's an ADR, and why write one?

<details><summary>Answers</summary>

1. `app/`: wiring (providers, router, layout). `features/`: everything for one product area. `components/ui/`: generic, reusable building blocks with no game knowledge.
2. So the feature's internals can change without breaking other code, and dependencies between features stay visible and deliberate.
3. The tab: the URL (so it survives reloads and can be linked). The user: TanStack Query. Gold: the game store.
4. Vite resolves imports when bundling, and TypeScript resolves them when type-checking. Each needs to know about the alias.
5. A short record of one architectural decision: its context, the decision and its consequences. It preserves the reasoning for future readers and shows you weigh trade-offs.
</details>

## Further reading
- "Bulletproof React" (alan2207/bulletproof-react on GitHub), a well-known reference structure
- Michael Nygard, "Documenting Architecture Decisions" (the original ADR post)

---
[← Shared code](02-shared-code.md) · [Module overview](README.md) · [Next: Config & secrets →](04-config-and-secrets.md)
