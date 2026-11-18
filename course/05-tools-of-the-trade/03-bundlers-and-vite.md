# 05.3 · Bundlers & Vite

> ⏱ 2 hours · Module 05 · Tools of the Trade

## What you'll learn
- What a bundler does, and why browsers need one
- How Vite's dev server and production build work
- Scaffolding a React + TypeScript app and touring every file
- Environment variables, and the most important security rule about them
- Testing on your phone over your local network
- The dev proxy for talking to your API

---

## Why bundle at all?

Your source code is written for **developers**: hundreds of small TypeScript and JSX files, imports from `node_modules`, CSS imported from JavaScript. Browsers need **efficient, standard JavaScript**. A bundler bridges the gap:

1. **Resolves the module graph**: starting at `main.tsx`, it follows every `import` to find all the code that's actually used.
2. **Transforms**: TypeScript → JavaScript (types stripped), JSX → function calls, modern syntax → whatever your target browsers support.
3. **Bundles** many modules into a few files, so there are fewer requests.
4. **Tree-shakes**: drops exports nobody imports.
5. **Code-splits**: `import()` calls become separate chunks that load on demand.
6. **Minifies**: removes whitespace and shortens names.
7. **Hashes filenames** (`index-4f3a1c.js`) so they can be cached forever (lesson 03.1).
8. **Handles assets**: imports of CSS, images and fonts become URLs or inlined data.

## Vite

**Vite** (French for "fast") is the standard build tool for new React apps. It has two modes:

| | Dev server (`vite`) | Production build (`vite build`) |
|---|---|---|
| How | serves your files as **native ES modules**, transforming each one on request | bundles everything into optimised files with **Rolldown** |
| Speed | starts instantly, because there's no upfront bundling | takes seconds, which is fine since you do it once per deploy |
| Updates | **HMR** (Hot Module Replacement): the edited module swaps in **without a page reload**, keeping your React state | n/a |

> Older apps use **Create React App** (deprecated) or **webpack**. The concepts carry over. Vite is just faster and simpler to configure.

## Scaffold an app

```bash
cd ~/code
npm create vite@latest vite-sandbox -- --template react-ts
cd vite-sandbox
npm install
npm run dev
```

Open the URL it prints (`http://localhost:5173`). Edit `src/App.tsx`, save, and watch it update instantly.

### Tour of the project

```
vite-sandbox/
  index.html            ← the entry point (NOT in public/): Vite starts here
  public/               ← copied as-is to the build (favicon, robots.txt). Referenced as /favicon.svg
  src/
    main.tsx            ← mounts React into <div id="root">
    App.tsx             ← your root component
    index.css, App.css  ← imported from JS; Vite bundles them
    assets/             ← imported assets (get hashed filenames)
  vite.config.ts        ← Vite configuration (plugins, dev server, proxy)
  tsconfig.json         ← "solution" file referencing the two below
  tsconfig.app.json     ← TS settings for src/ (browser code)
  tsconfig.node.json    ← TS settings for vite.config.ts (runs in Node)
  .oxlintrc.json        ← linter config (05.4)
  package.json
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

You'll understand every line of this by the end of Module 06, including why the `!` is acceptable there (we *just* wrote that element in `index.html`).

### Tighten the TypeScript settings
The template's `tsconfig.app.json` is a good start. Add these two lines to its `compilerOptions`, as this course's own config does (lesson 02.1):

```jsonc
"strict": true,
"noUncheckedIndexedAccess": true,
```

Note that the template also sets `erasableSyntaxOnly: true`. That disallows TypeScript features that generate runtime code (`enum`, `namespace`, constructor parameter properties). Use union types and `as const` objects instead, which is what this course has done all along.

## Scripts

```jsonc
"scripts": {
  "dev": "vite",                    // dev server with HMR
  "build": "tsc -b && vite build",  // type-check (tsc -b follows the project references), then bundle to dist/
  "lint": "oxlint",
  "preview": "vite preview"         // serve dist/ locally to check the production build
}
```

> Remember 02.1: Vite **strips types without checking them**. That's why `build` runs `tsc -b` first. During development, keep an eye on the editor's red squiggles, or run `npx tsc -b --watch` in a second terminal.

Run `npm run build` and look inside `dist/`. Open `dist/assets/*.js` and you'll see your code, minified.

## Environment variables

Vite loads `.env` files and exposes variables that start with `VITE_` on `import.meta.env`:

```bash
# .env.development
VITE_API_URL=http://localhost:3000
# .env.production
VITE_API_URL=https://api.hearthwild.example
```

```ts
const apiUrl = import.meta.env.VITE_API_URL;   // replaced at BUILD time with the literal string
import.meta.env.MODE;   // 'development' | 'production'
import.meta.env.DEV;    // boolean
import.meta.env.PROD;   // boolean
```

> ⚠️ **The most important rule: `VITE_` variables are public.** They're pasted into the JavaScript bundle that every visitor downloads, and anyone can read them in DevTools. **Never put secrets** (database passwords, private API keys, signing secrets) in frontend env vars. Secrets live on the **server** only (lesson 19.4). Vite's prefix requirement exists precisely so that you don't leak `DATABASE_URL` by accident.

Type them by adding a `src/vite-env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
```

## Testing on your phone

```bash
npm run dev -- --host
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: http://192.168.1.23:5173/    ← open this on your phone (same Wi-Fi)
```

Do this regularly in the capstone. Touch, performance and real mobile browser toolbars all behave differently from DevTools emulation.

> If it won't load, your computer's firewall is probably blocking incoming connections on port 5173. Allow Node through it.

## The dev proxy

From lesson 03.4: your API runs on another port during development. Proxy it so the browser sees one origin, with no CORS and no cookie headaches:

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',   // fetch('/api/save') → http://localhost:3000/api/save
    },
  },
});
```

## Do it
- [ ] Scaffold `vite-sandbox` with the `react-ts` template and run it.
- [ ] Add `strict` and `noUncheckedIndexedAccess` to `tsconfig.app.json`.
- [ ] Change the text in `App.tsx` and watch HMR keep the counter's value.
- [ ] Add `VITE_GREETING=Hello` to `.env`, render it in `App.tsx`, then find it in the built `dist/assets/*.js`. (That's why env vars aren't secret!)
- [ ] Run `npm run build && npm run preview`, then open the preview on your phone with `--host`.
- [ ] In DevTools → Network, compare the number of JS requests in `dev` (many modules) vs `preview` (a few bundles).

Keep `vite-sandbox`. You'll use it to try out examples throughout Part 2.

## Check your understanding

1. Why is Vite's dev server fast to start even for huge projects?
2. What does HMR give you that a normal reload doesn't?
3. Why does `npm run build` run `tsc` before `vite build`?
4. A teammate adds `VITE_STRIPE_SECRET_KEY` to `.env.production`. What do you tell them?

<details><summary>Answers</summary>

1. It doesn't bundle upfront. It serves native ES modules and transforms each file only when the browser requests it.
2. The changed module is swapped in place, keeping application state (form inputs, React state, scroll position), so the feedback loop is much faster.
3. Vite only strips types, it doesn't check them. `tsc` fails the build if there are type errors.
4. That value will be embedded in the public JS bundle, where anyone can read it. Secret keys must only exist on the server. They should move the Stripe call to the backend and rotate the key if it was ever deployed.
</details>

## Further reading
- Vite docs: [Getting Started](https://vite.dev/guide/), [Features](https://vite.dev/guide/features), [Env Variables and Modes](https://vite.dev/guide/env-and-mode)
- Vite docs: [Server options (proxy, host)](https://vite.dev/config/server-options)

---
[← npm, packages & semver](02-npm-packages-and-semver.md) · [Module overview](README.md) · [Next: Linting, formatting & type-checking →](04-linting-formatting-and-typechecking.md)
