# 05.2 · npm, packages & semver

> ⏱ 1.5 hours · Module 05 · Tools of the Trade

## What you'll learn
- What's in `package.json`, field by field
- `dependencies` vs `devDependencies`
- Semantic versioning and version ranges
- Lockfiles, `npm install` vs `npm ci`
- `npx` and npm scripts
- `npm audit`: reading security warnings sensibly
- How to choose a package (and when not to add one)

---

## `package.json`

Open this repo's [`package.json`](../../package.json):

```jsonc
{
  "name": "idle-game-academy",
  "version": "1.0.0",
  "private": true,                 // never accidentally `npm publish` this
  "type": "module",                // .js files are ES modules (lesson 01.6)
  "engines": { "node": ">=22" },   // which Node versions are supported
  "scripts": {                     // commands for `npm run <name>`
    "check": "node scripts/check.mjs",
    "test": "vitest run"
  },
  "devDependencies": {             // tools needed only to develop/build/test
    "vitest": "^5.1.1"
  }
}
```

### `dependencies` vs `devDependencies`
- **`dependencies`**: needed **at runtime** in production (`react`, `express`, `zod`).
- **`devDependencies`**: needed only for **development and building** (`vitest`, `typescript`, `eslint`, `vite`).

```bash
npm install zod                # → dependencies
npm install -D vitest          # → devDependencies
npm uninstall left-pad
```

For a frontend app the distinction is a bit blurry, because the bundler includes whatever you import. For a **Node server** it matters: production installs often skip dev dependencies (`npm ci --omit=dev`), making the deployed app smaller and reducing what can go wrong.

## Semantic versioning (semver)

Versions look like `MAJOR.MINOR.PATCH`, e.g. `5.3.2`:

| Bump | Meaning | Example |
|---|---|---|
| **MAJOR** | breaking changes: your code might need updating | 4.x → 5.0.0 |
| **MINOR** | new features, backwards compatible | 5.2 → 5.3.0 |
| **PATCH** | bug fixes, backwards compatible | 5.3.1 → 5.3.2 |

Version **ranges** in `package.json`:

| Range | Allows | Notes |
|---|---|---|
| `5.3.2` | exactly 5.3.2 | |
| `^5.3.2` | ≥5.3.2 and <6.0.0 | **npm's default**: minor and patch updates |
| `~5.3.2` | ≥5.3.2 and <5.4.0 | patch updates only |
| `*` / `latest` | anything | don't |

> ⚠️ Versions `0.x` are special: `^0.45.4` only allows `0.45.x`, because by convention 0.x minors may break things. Drizzle ORM in this repo is a 0.x package.

Semver is a **promise**, not a guarantee. Packages sometimes break things in minor releases. That's one reason lockfiles exist.

## Lockfiles

`package.json` says "any 5.x is fine". `package-lock.json` records the **exact** version of every package installed, *including the dependencies of your dependencies* (hundreds of them), plus integrity hashes.

- **Commit the lockfile.** It guarantees that your laptop, your teammate's laptop, CI and production all run identical code.
- `npm install` installs, and may **update** the lockfile if `package.json` changed.
- `npm ci` (clean install) installs **exactly** what the lockfile says, deletes `node_modules` first, and **fails** if the lockfile and `package.json` disagree. Use it in CI and deployments.

## `npx` and scripts

```bash
npx vitest run             # run a package's CLI from node_modules/.bin (or download it temporarily)
npx tsc --version
npm create vite@latest     # runs the `create-vite` package: scaffolds a project (05.3)
```

Scripts in `package.json` can call any CLI in `node_modules/.bin` directly:

```jsonc
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",   // && = run the second only if the first succeeds
  "test": "vitest",
  "lint": "eslint .",
  "check-all": "npm run lint && npm run typecheck && npm test -- --run"
}
```

`npm run test -- --watch` passes `--watch` through to the script (everything after `--`). `npm test` and `npm start` work without `run`.

## `npm audit`: reading security warnings

Sooner or later, `npm install` will end with something like this (this repo printed exactly this for a while, before the fix was released):

```
6 high severity vulnerabilities
```

**Don't panic, and don't blindly run `npm audit fix --force`.** Investigate first, like a professional:

```bash
npm audit
```

```
picomatch  *
Severity: high
picomatch vulnerable to ReDoS through single-branch repeated extglobs
fix available via `npm audit fix --force`
Will install vitest@3.1.4, which is a breaking change
```

Ask three questions:
1. **What is the vulnerability?** ReDoS (Regular expression Denial of Service): a carefully crafted glob pattern can make the matcher take a very long time.
2. **Can an attacker reach it?** `picomatch` is used by the *test runner and bundler* to match **your own file paths**, on **your own machine**. No untrusted user input ever reaches it, and it's never shipped to production. **The real risk here is close to zero.**
3. **What would the "fix" cost?** Here it would *downgrade* Vitest by two major versions. That's worse than the problem.

The right call is to note it and wait for the upstream fix (run `npm outdated` and `npm update` periodically). Compare that with a vulnerability in `express` or a JWT library in your **production server's** `dependencies`: that's urgent.

> 🧠 In interviews, "how do you handle `npm audit` warnings?" is a good chance to show judgement: severity × reachability × environment (dev vs prod).

## Keeping dependencies healthy
```bash
npm outdated          # what's behind?
npm update            # update within your semver ranges
npm install vitest@latest   # deliberately take a new major (read the changelog / migration guide first!)
```

Tools like **Renovate** and **Dependabot** open PRs automatically for updates. Most companies use one.

## Choosing a package

Before `npm install some-package`, check:
- **Do I need it?** A 10-line helper you write yourself beats a dependency, especially for something like `left-pad`.
- **Is it maintained?** Look at recent releases, open issues and commit activity.
- **Is it popular and trusted?** Weekly downloads, and who maintains it.
- **How big is it?** For frontend code, check its bundle size on bundlephobia.com. Every KB is downloaded by every player on mobile data.
- **Does it ship TypeScript types?** (Look for a "TS" badge on npm, or a matching `@types/` package.)
- **What's the license?** MIT, Apache-2.0, ISC and BSD are fine for almost anything.

**Supply-chain attacks are real.** Malicious packages with names close to popular ones ("typosquatting") and compromised maintainer accounts both happen. Spell package names carefully, and be suspicious of brand-new packages with few downloads.

## Other package managers
- **pnpm**: fast, saves disk space with a global store, and is strict about undeclared dependencies. Very popular for monorepos, and many companies use it.
- **Yarn**: an older alternative that's still common.
- **Bun**: a runtime plus package manager. Fast and newer.

The concepts are identical. This course uses npm because it ships with Node.

## Do it
- [ ] Run `npm outdated` in this repo. What, if anything, is behind?
- [ ] Run `npm ls zod` and `npm explain picomatch` to see *why* a package is installed.
- [ ] Look up `zustand` on npm and bundlephobia. Note its size, weekly downloads and last publish date.
- [ ] Add a script `"hello": "node -e \"console.log('hi')\""` to a scratch project's `package.json` and run it.

## Check your understanding

1. Is `typescript` a dependency or a devDependency of a React app? And `zod`?
2. `"react": "^19.0.0"`: could `npm install` pick React 19.3.1? React 20.0.0?
3. Why use `npm ci` in CI?
4. A high-severity `npm audit` warning appears for a package used only by your test runner. How urgent is it?

<details><summary>Answers</summary>

1. `typescript` is a devDependency (only needed to type-check). `zod` is a dependency (it runs in the app).
2. 19.3.1 yes. 20.0.0 no (a new major).
3. It's reproducible (exactly the lockfile versions), it fails loudly if `package.json` and the lockfile disagree, and it's faster and cleaner.
4. Usually low. It doesn't ship to production and only processes your own trusted input. Track it and update when a fix is available, but don't break your toolchain over it.
</details>

## Further reading
- npm Docs: [package.json](https://docs.npmjs.com/cli/configuring-npm/package-json)
- [semver.org](https://semver.org/), and the npm semver calculator: https://semver.npmjs.com
- npm Docs: [npm audit](https://docs.npmjs.com/cli/commands/npm-audit)

---
[← The terminal & git](01-terminal-and-git.md) · [Module overview](README.md) · [Next: Bundlers & Vite →](03-bundlers-and-vite.md)
