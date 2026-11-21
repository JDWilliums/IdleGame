# C03 · App shell & navigation

> ⏱ ~8 hours · Lessons: 04.5, 06–11, 14.1–14.2, 21.2 · Course exercises to reuse: 14-01, P1

## Why
The shell is the frame every screen lives in: navigation, layout, theme and the game runtime humming underneath. Getting it right on a phone first, then letting it expand to desktop, is the "mobile-first" promise of the whole project.

## User stories

### US-1 · Layout that fits the device
*As a phone player, I want navigation under my thumb. As a desktop player, I want to use the extra space.*

**Acceptance criteria**
- [ ] Under ~768 px wide: a header (game name, gold) and a **bottom tab bar**: Skills · Bank · Shop · Combat · More.
- [ ] From ~768 px: the same destinations in a **sidebar**, with the main content beside it.
- [ ] Safe areas respected (`viewport-fit=cover`, `env(safe-area-inset-*)`), and `100dvh` layout (21.2).
- [ ] Touch targets at least 44 px. Works from 360 px wide with no horizontal scrolling.

### US-2 · Routes
*As a player, I want each screen to have its own URL, so reloads and the back button behave.*

**Acceptance criteria**
- [ ] React Router routes as in [ARCHITECTURE §5](../ARCHITECTURE.md#5-the-ui-appswebsrc), with placeholder pages for screens not built yet.
- [ ] The current tab or sidebar item is marked with `aria-current="page"`.
- [ ] Unknown URLs show a friendly 404 page with a link home.

### US-3 · The game is running
*As a player, I want the game to tick from the moment it loads.*

**Acceptance criteria**
- [ ] The store (14-01 pattern) and the fixed-timestep loop are created **once** in `main.tsx`, outside React (14.1), and provided through context.
- [ ] A temporary "Start Oak Tree" button and a gold/oak-log readout prove the store, the loop and React are connected.
- [ ] The loop pauses when the tab is hidden and resumes when visible (14.4). Full offline catch-up comes in C07.
- [ ] React StrictMode is on, and nothing runs twice (no double loops).

### US-4 · Theme
*As a player, I want a comfortable theme, in light or dark.*

**Acceptance criteria**
- [ ] Design tokens (colours, spacing, radii, font sizes) as CSS custom properties or Tailwind theme values (11.3).
- [ ] A dark theme by default and a light theme, chosen from `prefers-color-scheme` on first visit, with a toggle that persists in `localStorage`.
- [ ] Text contrast meets WCAG AA in both themes.

### US-5 · When something breaks
*As a player, I want a helpful screen instead of a blank page if the app crashes.*

**Acceptance criteria**
- [ ] A top-level error boundary (09.4) with a friendly message and a "Reload" button.
- [ ] Errors are logged to the console for now (error tracking comes in C12).

## Accessibility (part of done)
- A "Skip to main content" link, and `header`, `nav` and `main` landmarks.
- A visible focus style using `:focus-visible`.
- Each page sets `document.title` (e.g. "Bank · Hearthwild").

## Tests to write
- Navigation renders every destination and marks the current one with `aria-current`.
- Routing: rendering at `/bank` shows the bank placeholder; an unknown route shows the 404.
- The theme toggle switches the class or attribute and persists it.
- The runtime: creating it twice doesn't create two loops (test the factory with fake timers).

## Hints (directions, not code)
- Build the layout with CSS first (mobile, then a min-width media query). JavaScript shouldn't decide between the tab bar and the sidebar.
- StrictMode mounts effects twice in development. If the loop starts in an effect, you'll get two loops. That's one of the reasons it's started outside React.
- Your P1 project already solved much of the CSS. Reuse what still makes sense.

## Lessons to revisit
04.5 (mobile-first) · 08.5 (external stores) · 10.1 (routing) · 11.3 (tokens and theming) · 14.1–14.2 · 21.2

## Stretch goals
- Page transitions that are disabled under `prefers-reduced-motion`.
- A "More" sheet on mobile with Settings, Account and About.

## Demo
Screenshots at 375 px and 1280 px wide, in both themes.

---
[← C02](C02-engine-core.md) · [Capstone overview](../README.md) · [Next: C04 · Skills UI & live progress →](C04-skills-ui.md)
