# Project P2 · Pocket Forge, a React mini idle game

> ⏱ ~20 hours · After Module 12 · React + TypeScript + Vite + Tailwind (or CSS Modules) + Vitest

## The brief

Before the full capstone, build a **small, complete idle game** to bring together everything from Part 2. Think of it as a vertical slice: one gathering skill, one crafting skill, a shop, and an upgrade, polished and tested.

You're a blacksmith. Mine ore → smelt bars → sell bars for gold → buy upgrades that make everything faster.

It deliberately **doesn't** include offline progress, saving to a server, or a proper game engine. You'll learn the right way to build those in Modules 13–18. Building P2 the "straightforward React way" first means you'll *feel* the problems those modules solve, and that makes them stick.

## Setup

```bash
cd ~/code
npm create vite@latest pocket-forge -- --template react-ts
cd pocket-forge && npm install
git init && git add -A && git commit -m "chore: scaffold Vite React TS app"
```

Add your choice of styling (Tailwind v4 is recommended), Vitest + Testing Library, and Zustand. Copy this course repo's `CLAUDE.md` into the project so AI assistants stay in tutor mode.

## Game rules

| Thing | Rule |
|---|---|
| **Mining** | "Mine copper" takes 2.0 s per ore. While active it repeats automatically and gives **+1 copper ore** and **+5 Mining XP** each time. |
| **Smelting** | "Smelt bronze bar" takes 3.0 s and needs **2 copper ore** per bar. It gives **+1 bronze bar** and **+10 Smithing XP**. If you run out of ore, it stops automatically with a message. |
| **One action at a time** | Starting one action stops the other. |
| **Levels** | Level = `Math.floor(Math.sqrt(xp / 10)) + 1`, capped at 20. Show the level and the progress to the next level. |
| **Selling** | Copper ore sells for 2 g and bronze bars for 15 g. "Sell 1" and "Sell all" for each. |
| **Upgrades** (shop) | **Better pickaxe** (50 g): mining is 25% faster. **Bellows** (120 g): smelting is 25% faster. **Apprentice** (300 g): +1 extra ore per mining action. Each can be bought once. |
| **Unlock** | Smelting unlocks at Mining level 3. |

## Screens (React Router)
- `/` Forge: the current action with a progress bar, both actions, and levels
- `/bank`: items, sell buttons, total value
- `/shop`: upgrades, with owned, affordable and unaffordable states
- `/stats`: lifetime totals (ore mined, bars smelted, gold earned) and time played

Mobile-first: bottom tab bar on phones, sidebar on desktop (reuse P1).

## Technical requirements

### State
- [ ] Game state in a **Zustand store** (or `useReducer` + context) with typed actions, and the logic in **pure functions** that can be tested without React.
- [ ] Progress uses **timestamps** (`Date.now()`/`performance.now()`), not tick counting, so a throttled background tab still produces the right amount (lesson 07.6).
- [ ] The loop runs in **one place** (an effect in the app shell, or a store-driven interval), with correct cleanup. It must not run twice under StrictMode.
- [ ] Derived values (level, progress, affordability, total bank value) are **derived**, not stored.
- [ ] Settings (theme, reduced motion) persist with your `useLocalStorage` hook from 07-04.

### UI
- [ ] Accessible: real buttons and links, labelled progress bars, `aria-current` on nav, visible focus, keyboard usable.
- [ ] Responsive, with no horizontal scroll from 360px to 1440px.
- [ ] A smooth progress bar (CSS animation or a style updated without re-rendering the whole tree, as in lesson 11.4).
- [ ] Dark mode with no flash on load.
- [ ] "Level up!" feedback (a toast or modal) that respects reduced motion.

### Testing
- [ ] **Unit tests** for the pure game logic: mining/smelting outcomes, level formula boundaries, upgrade effects, running out of ore, can't-afford cases. Use injected time, not real waiting.
- [ ] **Component/integration tests** for at least: buying an upgrade (gold changes, item shows as owned), selling all, and smelting being locked before level 3.
- [ ] At least one **Playwright** test using `page.clock` to fast-forward through a mining cycle.
- [ ] Tests pass with `npm test`, and the project type-checks with `npm run typecheck` (add that script).

### Code quality
- [ ] TypeScript strict + `noUncheckedIndexedAccess`, and no `any`.
- [ ] oxlint (or ESLint) with `rules-of-hooks` and `exhaustive-deps` on, with no warnings.
- [ ] Feature-folder structure (`features/forge`, `features/bank`, `features/shop`).
- [ ] At least **20 meaningful commits** using conventional-commit style, on **branches with PRs** to your own `main` (practise the workflow from 05.1).
- [ ] A `README.md` with screenshots (mobile + desktop), how to run it, and a "What I'd do differently" section.

## Stretch goals
- [ ] Deploy it to a static host (lesson 20.3 explains how; for now, Netlify or Cloudflare Pages via drag-and-drop or Git is fine).
- [ ] An "+1 Copper Ore" floating animation.
- [ ] A second ore type (tin) and a recipe needing both.
- [ ] Save to `localStorage` and continue on reload (no offline progress yet). Notice how fiddly this gets without a proper save design. Module 13 fixes that.

## Reflection (write this in your README)

Answer honestly. These are great interview talking points:
1. Where did state live, and why? What would you change?
2. What happened when you left the tab in the background for 10 minutes? Was the progress right?
3. Which tests caught real bugs while you were building?
4. What was hardest? What would make offline progress and cloud saves difficult with your current design?

## When you're done
- Ask the AI tutor (or a friend) for a **code review**: "Review my P2 project like a senior React dev reviewing a PR. Focus on state design, effects and tests. Don't rewrite anything."
- Tick **Project `P2`** in `PROGRESS.md` and commit.

> **Part 2 review.** Before Module 13, re-do exercises `07-03` and `08-03` from scratch in a scratch folder, without looking. The engine you'll build next relies on both.
