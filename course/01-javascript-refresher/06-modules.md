# 01.6 · Modules

> ⏱ 45 min · Module 01 · JavaScript You'll Use Every Day

## What you'll learn
- ES modules: `import`/`export`, named vs default
- Module scope, and why a module is effectively a singleton
- Type-only imports, dynamic `import()` and barrel files
- ES modules vs CommonJS, which you'll meet in older Node code

---

## Every file is a module

In modern JavaScript each file is a **module** with its own scope. Nothing leaks out unless you `export` it, and nothing comes in unless you `import` it.

```js
// xp.js
const MAX_LEVEL = 99;                        // private to this file

export function xpForLevel(level) { /*…*/ }  // named export
export const LEVEL_CAP = MAX_LEVEL;          // named export

// game.js
import { xpForLevel, LEVEL_CAP } from './xp.js';
import { xpForLevel as xpNeeded } from './xp.js'; // rename on import
import * as xp from './xp.js';                    // namespace: xp.xpForLevel
```

### Named vs default exports

```js
// default export: one per file, imported with any name
export default function SkillCard() { /*…*/ }
import SkillCard from './SkillCard.js';
import Whatever from './SkillCard.js';   // also works, which is the problem
```

**Prefer named exports.** They:
- keep names consistent across the codebase (searchable, and refactor-friendly with `F2`)
- give better autocomplete and auto-imports in VS Code
- let you export several things without mixing styles

Some tools *require* default exports in specific places, like React's `lazy()` (lesson 09.4) and some framework route files. Use defaults there and named everywhere else. That's what most teams do.

## Modules run once, so they're singletons

A module's top-level code runs **once**, the first time it's imported. Every importer gets the **same** instance:

```js
// store.js
export const gameState = { gold: 0 };

// a.js
import { gameState } from './store.js';
gameState.gold = 100;

// b.js
import { gameState } from './store.js';
console.log(gameState.gold); // 100: same object
```

This is how stores like Zustand work: you create the store in one module and import it anywhere (lesson 08.5). It's also why module-level mutable state can cause surprising bugs in tests, which is why the course scripts run every test file in isolation.

## Imports are live, read-only bindings

```js
// counter.js
export let count = 0;
export function increment() { count++; }

// main.js
import { count, increment } from './counter.js';
increment();
console.log(count); // 1: imports are live views of the exported variable
count = 5;          // ❌ TypeError: you can't assign to an import
```

## Type-only imports (TypeScript)

In TS you'll often import something that exists **only as a type**:

```ts
import type { Item } from './types';           // removed entirely from the JS output
import { createItem, type ItemId } from './items';
```

This repo's `tsconfig.json` has `verbatimModuleSyntax: true`, which **requires** `import type` for type-only imports. It makes it obvious what exists at runtime and what doesn't, and it prevents subtle bundling bugs.

## Dynamic `import()`

`import()` loads a module **on demand** and returns a promise:

```js
button.onclick = async () => {
  const { openCombatSimulator } = await import('./combat-simulator.js');
  openCombatSimulator();
};
```

Bundlers split dynamically imported code into a separate file, so users only download it when needed. This is **code splitting** (lesson 21.3), and React's `lazy()` is built on it.

## Barrel files

A "barrel" re-exports things from several files:

```js
// components/index.js
export { SkillCard } from './SkillCard.js';
export { ItemList } from './ItemList.js';

// elsewhere
import { SkillCard, ItemList } from './components';
```

They make imports tidy, but big barrels can slow down tooling and tests, and can cause circular import problems. Use them sparingly, for example one per *package* in a monorepo (lesson 19.2). Don't put one in every folder.

## ES modules vs CommonJS

Node originally had its own module system, **CommonJS**, and you'll still see it in older code and tutorials:

```js
// CommonJS
const express = require('express');
module.exports = { start };

// ES modules: what this course uses everywhere
import express from 'express';
export { start };
```

How Node decides which one a file uses:
- `.mjs` files are always ESM, and `.cjs` files are always CommonJS.
- `.js` files are ESM if the nearest `package.json` has `"type": "module"` (this repo does).
- In Node ESM, **relative imports need the file extension** (`'./xp.js'`). Bundlers like Vite and Vitest let you leave it off, which is why exercises import `'./exercise'`.

## Circular imports

If `a.js` imports `b.js` and `b.js` imports `a.js`, one of them will see the other **half-initialised** (values `undefined`, or "Cannot access 'x' before initialization"). If you hit this, move the shared piece into a third module that both import.

## Check your understanding

1. Why do most teams prefer named exports?
2. Two files import `store.js`. One changes an exported object's property. Does the other see the change? Why?
3. What does `import type` guarantee?
4. What's the main benefit of `import()` compared with a static `import`?

<details><summary>Answers</summary>

1. Names stay consistent everywhere, which helps searching, refactoring and auto-imports. It also avoids every importer making up its own name.
2. Yes. A module's top-level code runs once and every importer shares the same exported object.
3. That the import is erased from the JavaScript output: it's types only, with no runtime cost or side effects.
4. The module is loaded on demand, and bundlers put it in a separate chunk, so the initial download is smaller.
</details>

## Further reading
- MDN: [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- Node docs: [Modules: Packages, "Determining module system"](https://nodejs.org/api/packages.html#determining-module-system)

---
[← async/await & error handling](05-async-await-and-errors.md) · [Module overview](README.md) · [Next module: TypeScript in Depth →](../02-typescript/README.md)
