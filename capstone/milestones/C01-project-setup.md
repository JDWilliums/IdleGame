# C01 · Repo, monorepo & CI

> ⏱ ~8 hours · Lessons: 05 (tools), 19.1, 19.3, 19.4, 20.4 · Before you start: skim 19.1 and 20.4 if you're doing this straight after Module 14

## Why
Every later milestone builds on this one. Twenty minutes of structure now saves twenty hours of untangling later, and a repo with CI from the first commit is exactly what reviewers like to see.

## User stories

### US-1 · A monorepo with four workspaces
*As the developer, I want the web app, the API and the shared code in one repository, so that changes that touch several of them land together.*

**Acceptance criteria**
- [ ] A new **public** (or private for now) GitHub repository, separate from this course.
- [ ] The root `package.json` declares workspaces `apps/*` and `packages/*` and is `"private": true`.
- [ ] `apps/web` (Vite + React + TypeScript), `apps/api` (Express 5 + TypeScript, run with `tsx watch` in dev), `packages/engine` and `packages/shared` exist, each with a scoped name (`@<your-game>/…`).
- [ ] One `npm install` at the root installs everything, and there's **one** `package-lock.json`.
- [ ] `apps/web` imports something from `packages/engine` (e.g. a `GAME_TITLE` constant) and shows it, proving cross-package imports work.
- [ ] `packages/shared` exports a Zod schema (e.g. a `HealthResponse`) that **both** apps import.

### US-2 · Tooling everyone can rely on
*As the developer, I want consistent type-checking, linting, formatting and testing, so that mistakes are caught before they're merged.*

**Acceptance criteria**
- [ ] `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax`. Each workspace extends it, with the right `lib`/`types` (the API has no `DOM`, the engine has neither `DOM` nor `node`).
- [ ] A linter (oxlint, as in Vite's template, or ESLint) including the React hooks rules, plus Prettier.
- [ ] Root scripts `dev`, `lint`, `typecheck`, `test` and `build` run across all workspaces (`--workspaces --if-present`).
- [ ] Vitest in `packages/engine` with at least one real passing test.

### US-3 · CI on every change
*As the developer, I want every pull request checked automatically, so that `main` is always working.*

**Acceptance criteria**
- [ ] `.github/workflows/ci.yml` runs on pull requests and pushes to `main`: `npm ci`, lint, typecheck, test, build (20.4).
- [ ] It uses `node-version-file: .nvmrc` and npm caching.
- [ ] A branch ruleset on `main` requires a pull request and passing checks.
- [ ] `.github/dependabot.yml` for npm and GitHub Actions.
- [ ] You've opened at least one pull request, watched CI run, and merged it.

### US-4 · The API talks to the web app
*As the developer, I want the web app to reach the API in development exactly as it will in production, so that cookies and paths behave the same.*

**Acceptance criteria**
- [ ] `GET /api/health` returns `{ status: 'ok' }`, validated against the shared schema in a supertest test.
- [ ] Vite's dev server proxies `/api` to the API (17.4), and the placeholder page shows "API: ok" (or a clear "API unreachable" state).
- [ ] `apps/api` loads its config with a `loadConfig` like exercise 19-01's, from `--env-file=.env` in development.

### US-5 · Repo hygiene
*As a future teammate (or interviewer), I want to understand and run the project in five minutes.*

**Acceptance criteria**
- [ ] `README.md`: a one-paragraph pitch, the tech stack, prerequisites, how to run it, the scripts, and the repo layout.
- [ ] `.gitignore` covers `node_modules`, `dist`, `.env`, coverage and test reports. `.env.example` is committed.
- [ ] `.nvmrc`, a `LICENSE` (MIT is fine), and **`CLAUDE.md` copied from this course** (tutor mode).
- [ ] `docs/adr/0001-monorepo-with-npm-workspaces.md` (19.3).

## Hints (directions, not code)
- Scaffold the web app with `npm create vite@latest` into `apps/web`, then delete *its* lockfile and `node_modules`: the root owns them now.
- Internal packages can export TypeScript directly (`"exports": { ".": "./src/index.ts" }`, 19.1). No build step needed for them.
- If an import from a workspace "can't be found", check: is the package's `name` exactly what you import? Did you run `npm install` at the root after adding it? Is it in the app's `dependencies` with `"*"`?
- Keep the first PR tiny ("add CI"). Get the pipeline green before adding features.

## Lessons to revisit
05.1 (Git) · 05.2 (npm, lockfiles) · 05.3 (Vite) · 05.4 (linting, formatting, type-checking) · 19.1 · 19.4 · 20.4

## Stretch goals
- Conventional Commits and a pull request template.
- Pre-commit hooks running the linter on staged files (lint-staged).
- Try Turborepo for cached `test`/`build` tasks, and write an ADR on whether it's worth it at this size.

## Demo
A screenshot of the placeholder page showing "Hearthwild" and "API: ok", and of a green CI run. Put both in the README.

---
[Capstone overview](../README.md) · [Next: C02 · Game data & engine core →](C02-engine-core.md)
