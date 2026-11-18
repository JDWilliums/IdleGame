# 05.4 · Linting, formatting & type-checking

> ⏱ 1.5 hours · Module 05 · Tools of the Trade

## What you'll learn
- Three different tools and three different jobs: the linter, the formatter and the type checker
- oxlint (the Vite template default) and ESLint (what most existing codebases use)
- The React hooks rules you must have switched on
- Prettier, and ending style debates for good
- Running everything automatically: editor, git hooks and CI

---

## Three tools, three jobs

| Tool | Answers | Examples |
|---|---|---|
| **Type checker** (`tsc`) | "Are the types consistent?" | passing a `string` where a `number` is expected |
| **Linter** (oxlint / ESLint) | "Is this code *likely to be a bug* or a bad pattern?" | an unused variable, a hook called conditionally, a missing effect dependency, `==` instead of `===` |
| **Formatter** (Prettier) | "Is the code laid out consistently?" | quotes, semicolons, indentation, line breaks |

Don't make one tool do another's job. In particular, **don't use the linter for formatting rules**: Prettier handles layout, and the linter handles correctness.

## Linting

### oxlint
The Vite React template ships with **oxlint**, a linter written in Rust that's 50–100× faster than ESLint and implements most of the popular ESLint rules (including the React hooks rules). The template's `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

**Add the exhaustive-deps rule.** It's the one that catches most `useEffect` bugs (lesson 07.4):

```json
"react/exhaustive-deps": "warn"
```

Run it with `npm run lint`. The output looks like this:

```
src/App.tsx:4:37: warning react-hooks(exhaustive-deps): React Hook useEffect has missing dependencies: 'x', and 'id'
src/App.tsx:5:25: error react-hooks(rules-of-hooks): React Hook "useState" is called conditionally.
```

### ESLint (what you'll meet at work)
Most existing React codebases use **ESLint** (v9+ "flat config") with **typescript-eslint**. You'll read configs like this at your first job:

```js
// eslint.config.js
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,   // rules-of-hooks + exhaustive-deps (+ React Compiler checks)
      '@typescript-eslint/no-floating-promises': 'error', // requires type-aware linting
    },
  },
);
```

> **Version note (late 2026):** typescript-eslint's *type-aware* rules (like `no-floating-promises`) depend on TypeScript's JavaScript API, and at the time of writing they support TypeScript up to 6.0, not the new native TS 7. That's one reason new projects are moving to oxlint, which has its own `--type-aware` mode. Most company codebases are still on TS 5.x/6.x with ESLint, so you need to be able to read both kinds of config.

### Rules that matter most for React
- **`rules-of-hooks`**: hooks must be called unconditionally at the top level of components and custom hooks (lesson 06.5).
- **`exhaustive-deps`**: effect, memo and callback dependency arrays must list everything they use (07.4).
- **`no-unused-vars`**: dead code and typos.
- **`no-floating-promises`** (type-aware): you called an async function and forgot to `await` or handle it.

**Treat warnings as work to do, not noise.** A codebase with 300 ignored warnings hides the one that matters.

## Formatting with Prettier

```bash
npm install -D prettier
echo '{ "singleQuote": true, "printWidth": 100 }' > .prettierrc
npx prettier --write .        # format everything
npx prettier --check .        # CI: fail if anything isn't formatted
```

Set VS Code to **format on save**. This repo's [`.vscode/settings.json`](../../.vscode/settings.json) already does. You'll never think about formatting again, and code reviews can focus on what matters.

> There's also a Rust-based formatter in the Oxc project ("oxfmt") and the Biome toolchain (lint and format in one tool). Prettier is still the most widely used.

## Type-checking

```jsonc
"scripts": {
  "typecheck": "tsc -b"       // or `tsc --noEmit` for a single tsconfig
}
```

Run it in CI and before you push. Your editor checks the files you have open; `tsc` checks **everything**.

## Automate it

### 1. In the editor
Install the extensions from `.vscode/extensions.json`. You get problems underlined as you type, and formatting on save.

### 2. Before each commit: git hooks
A **pre-commit hook** runs a command before git accepts a commit. The common setup is `husky` (manages hooks) plus `lint-staged` (runs tools only on the *staged* files, so it's fast):

```bash
npm install -D husky lint-staged
npx husky init                       # creates .husky/pre-commit
echo "npx lint-staged" > .husky/pre-commit
```

```jsonc
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["oxlint", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

Now a commit with lint errors is blocked, and formatting is fixed automatically.

> Keep hooks **fast** (a few seconds). Slow hooks get skipped with `--no-verify`. Run the full test suite in CI, not in the hook.

### 3. In CI
The final gate: lint, typecheck, test and build on every pull request (lesson 20.4). Nothing merges unless everything passes.

## Do it
In your `vite-sandbox` project:
- [ ] Add `"react/exhaustive-deps": "warn"` to `.oxlintrc.json`.
- [ ] Write a component with a `useEffect` that's missing a dependency, and see the warning (in the editor via the oxc VS Code extension, or with `npm run lint`).
- [ ] Install Prettier with this repo's `.prettierrc` and format the project.
- [ ] Add `typecheck`, `lint` and `format:check` scripts.
- [ ] Set up husky + lint-staged and try to commit a file with a lint error.

## Check your understanding

1. Which tool catches `if (user.isAdmin = true)`? Which catches `const x: number = 'a'`? Which fixes two-space vs four-space indentation?
2. Why shouldn't you turn off `exhaustive-deps` when it complains?
3. Why run lint-staged instead of the full linter in a pre-commit hook?

<details><summary>Answers</summary>

1. The linter (assignment in a condition, `no-cond-assign`). The type checker. The formatter.
2. It's almost always pointing at a real bug: an effect using stale values. The fix is usually to restructure the code (lesson 07.5), not to silence the rule.
3. Speed. It only processes the staged files, so the hook takes seconds and developers don't bypass it.
</details>

## Further reading
- oxlint: https://oxc.rs/docs/guide/usage/linter.html
- ESLint: [Configuration files (flat config)](https://eslint.org/docs/latest/use/configure/configuration-files)
- typescript-eslint: [Getting Started](https://typescript-eslint.io/getting-started/)
- Prettier: [Why Prettier?](https://prettier.io/docs/why-prettier)

---
[← Bundlers & Vite](03-bundlers-and-vite.md) · [Module overview](README.md) · [Next: Debugging & DevTools →](05-debugging-and-devtools.md)
