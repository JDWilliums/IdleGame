# 19.1 · Monorepos & workspaces

> ⏱ 1.5 hours · Module 19 · Architecture & Monorepos

## What you'll learn
- What a monorepo is, and why it suits a full-stack game
- npm workspaces: layout, installing, running scripts
- How internal packages reference each other
- Sharing TypeScript settings with a base config
- Running TypeScript packages in dev and in production
- When to reach for pnpm, Turborepo or Nx

---

## One repo, several packages

Hearthwild has at least three parts: the React app, the Express API, and code both of them need (the save schema, the game data, the engine's pure functions). You could put each in its own repository, but then a change to the save format means three pull requests, three version bumps and a careful release order.

A **monorepo** keeps them in one repository as separate **packages**. One pull request can change the schema, the server and the client together, and CI checks them together. Most companies you'll join use some form of monorepo, from a two-package setup like this one to Google-scale ones.

```
hearthwild/
├── package.json            ← the root: workspaces + scripts that run across them
├── package-lock.json       ← ONE lockfile for everything
├── tsconfig.base.json      ← shared compiler options
├── apps/
│   ├── web/                ← Vite + React (the game)
│   │   └── package.json    { "name": "@hearthwild/web" }
│   └── api/                ← Express + Drizzle
│       └── package.json    { "name": "@hearthwild/api" }
└── packages/
    ├── shared/             ← Zod schemas and API types used by both sides (19.2)
    │   └── package.json    { "name": "@hearthwild/shared" }
    └── engine/             ← the pure game engine and game data (Module 13)
        └── package.json    { "name": "@hearthwild/engine" }
```

`apps/` holds things you deploy. `packages/` holds libraries the apps use. The `@hearthwild/` prefix is a **scope**. It keeps your package names from colliding with public ones and makes imports obvious.

## npm workspaces

npm has workspaces built in. The root `package.json` lists them:

```json
{
  "name": "hearthwild",
  "private": true,
  "type": "module",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  }
}
```

`"private": true` stops the root (and you, by accident) from ever being published to npm.

When you run `npm install` at the root, npm installs every workspace's dependencies into one `node_modules` at the root, and **symlinks** each workspace there too: `node_modules/@hearthwild/shared → packages/shared`. That symlink is how `import { SaveSchema } from '@hearthwild/shared'` works anywhere in the repo.

### Everyday commands

```bash
npm install zod -w packages/shared            # add a dependency to one workspace
npm install -D vitest -w apps/api             # a dev dependency
npm run dev -w apps/web                       # run one workspace's script
npm run test --workspaces --if-present        # run a script everywhere that has it
```

`-w` is short for `--workspace`. It accepts a folder or a package name. Always run `npm install` **from the root**: there's only one lockfile, and it lives there.

### Depending on an internal package

```json
// apps/api/package.json
{
  "name": "@hearthwild/api",
  "dependencies": {
    "@hearthwild/shared": "*",
    "express": "^5.3.0"
  }
}
```

`"*"` means "whatever version is in this repo", which is always the current code. (pnpm and Yarn write this as `"workspace:*"`, which you'll see in other projects.)

## Exporting TypeScript directly

How does `apps/web` use `packages/shared`, which is written in TypeScript? The simplest approach, sometimes called an **internal** or **just-in-time** package, exports the source files themselves and lets each app's tooling compile them:

```json
// packages/shared/package.json
{
  "name": "@hearthwild/shared",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit" },
  "dependencies": { "zod": "^4.6.0" }
}
```

- **Vite** compiles TypeScript from any file it imports, workspace packages included. Nothing more to do.
- **Vitest** is the same.
- **The API in development** runs with `tsx watch src/index.ts`, which also compiles everything it imports.
- **The API in production** has two reasonable options:
  1. Run it with `tsx src/index.ts`. tsx compiles on startup, which is fine for a project this size.
  2. Bundle it ahead of time into one JavaScript file with **esbuild** (`esbuild src/index.ts --bundle --platform=node --format=esm --outfile=dist/index.js`) and run `node dist/index.js`. That's faster to start and has fewer moving parts at runtime.

The alternative is giving each package its own build step that outputs `.js` and `.d.ts` files. That's what you do when publishing a package to npm, but inside one repo it mostly adds watch processes and "did you rebuild shared?" bugs.

## Shared TypeScript settings

Put the compiler options every package agrees on in one place:

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

```jsonc
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "lib": ["ES2024", "DOM", "DOM.Iterable"], "jsx": "react-jsx", "types": ["vite/client"] },
  "include": ["src"]
}
```

```jsonc
// apps/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "lib": ["ES2024"], "types": ["node"] },
  "include": ["src"]
}
```

Notice that the API has **no `DOM` lib**. If server code accidentally uses `window` or `document`, the compiler says so. Likewise, `packages/shared` should have neither `DOM` nor `node` types, because it must run in both places.

## Bigger tools

npm workspaces are enough for Hearthwild. You'll meet these at work:

- **pnpm**: a faster package manager with a stricter `node_modules`, so you can only import what you declared. Workspaces work the same way, configured in `pnpm-workspace.yaml`.
- **Turborepo** and **Nx**: task runners that understand the dependency graph between packages, run tasks in the right order and in parallel, and **cache** results ("shared hasn't changed, so skip its tests"). They pay off once a monorepo has many packages or slow builds.

## Check your understanding

1. Why is a monorepo convenient when one change touches the client, the server and the save format?
2. What does npm do with each workspace during `npm install`, and why does that make imports work?
3. Where do you run `npm install`, and why?
4. What does `"@hearthwild/shared": "*"` mean in an app's dependencies?
5. Why can an internal package export `./src/index.ts` instead of compiled JavaScript?
6. Why does the API's tsconfig leave out the `DOM` lib?

<details><summary>Answers</summary>

1. The change lands as one pull request, checked by CI as a whole, with no versions to publish or release order to coordinate.
2. It symlinks each workspace into the root `node_modules` (e.g. `node_modules/@hearthwild/shared`), so a normal package import resolves to the workspace folder.
3. At the root. There's one lockfile for the whole repo, and npm needs the root to see every workspace.
4. Use the version of that package in this repository, whatever it is.
5. Every consumer's tooling (Vite, Vitest, tsx, esbuild) compiles TypeScript from imported files, so there's no need for a separate build step.
6. So the compiler rejects browser-only globals (`window`, `document`) in server code.
</details>

## Further reading
- npm docs: "workspaces"
- Turborepo docs: "Internal Packages"
- esbuild docs: "Bundling for node"

---
[← Module overview](README.md) · [Next: Shared code →](02-shared-code.md)
