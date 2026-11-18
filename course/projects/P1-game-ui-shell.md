# Project P1 · Game UI shell in pure HTML & CSS

> ⏱ ~8 hours · After Module 04 · No framework, no JavaScript (except the optional stretch goal)

## The brief

You're the frontend developer on a new idle RPG. The designer is on holiday, but the product manager needs a **static, clickable-looking prototype** of the main game screen by Friday, to show at the stakeholder meeting, **on a phone and on a laptop**.

Build it with **only HTML and CSS**. No React, no Tailwind, no CSS framework, no copied templates.

## Where to build it

```bash
mkdir -p projects/p1-ui-shell
cd projects/p1-ui-shell
touch index.html styles.css
```

Open `index.html` in your browser. VS Code's "Live Server" extension or `npx serve` can auto-reload it. Commit as you go.

## What to build

### Layout
| | Mobile (< 64rem) | Desktop (≥ 64rem) |
|---|---|---|
| Header | game title + gold counter + settings icon button | same |
| Navigation | **bottom tab bar** fixed to the bottom: Skills, Bank, Shop, Profile (icon + label) | **left sidebar** with the same links, plus a "Skills" sub-list |
| Main | scrollable content area | scrollable content area beside the sidebar |

### Main content: the Skills screen
1. A page heading "Skills".
2. An **active action panel** at the top: "Chopping Oak Tree", a **progress bar** at about 60%, "+25 XP · 1 Oak Log per 3.0s" and a "Stop" button.
3. A **responsive grid of skill cards** (at least 6: Woodcutting, Fishing, Mining, Smithing, Cooking, Crafting). Each card shows:
   - an icon (an emoji or inline SVG is fine)
   - the skill name
   - "Level 12 / 99"
   - an XP progress bar towards the next level
   - one card styled as **active** (it's the current action), and one styled as **locked** (greyed out, with a lock icon and "Requires level 10 Mining")
4. A **"Recent activity" log** (a list of five or more entries like "+1 Oak Log"). On desktop it can sit in a right-hand column, and on mobile below the grid.

### A modal
A "Level up!" dialog, shown centred over a dimmed backdrop. Use the native `<dialog>` element with the `open` attribute for the static version. It needs a heading, a short message and an "Awesome!" button.

## Acceptance criteria

Tick these off yourself. Be strict, the way a reviewer would be.

**Structure and semantics**
- [ ] Uses `header`, `nav` (with `aria-label`), `main`, `section`/`article`, and lists where appropriate
- [ ] One `h1`, and headings in a logical order
- [ ] Navigation items are `<a href>`, actions (Stop, settings) are `<button type="button">`
- [ ] The icon-only settings button has an accessible name (`aria-label`)
- [ ] The current nav item is marked with `aria-current="page"`
- [ ] Progress bars are accessible (`<progress>`, or `role="progressbar"` with `aria-value*`)

**Layout**
- [ ] Looks right at **360px**, **390px**, **768px**, **1024px** and **1440px** wide (use DevTools' device toolbar)
- [ ] No horizontal scrolling at any width
- [ ] The skill grid uses `repeat(auto-fill, minmax(...))` and changes column count without media queries
- [ ] The tab bar ↔ sidebar switch uses **one** breakpoint and `grid-template-areas`
- [ ] Long text (try renaming a skill to "Advanced Ancient Runecrafting Mastery") truncates or wraps without breaking the layout
- [ ] The app shell is full height using `dvh`, and the bottom tab bar is never hidden behind mobile browser UI
- [ ] Tab bar and header respect `env(safe-area-inset-*)`

**Mobile**
- [ ] Every tappable element is at least 44×44px
- [ ] Hover effects are wrapped in `@media (hover: hover)`
- [ ] Numbers use `tabular-nums`

**CSS quality**
- [ ] Colours, spacing, radii and font sizes all come from custom-property **tokens** defined on `:root`
- [ ] A **dark theme** works through `prefers-color-scheme` (toggle it in DevTools → Rendering → "Emulate CSS media feature")
- [ ] There are no `!important`s (except the reduced-motion rule) and no id selectors for styling
- [ ] Focus is visible on every interactive element when tabbing (`:focus-visible`)
- [ ] `prefers-reduced-motion` is respected

**Process**
- [ ] At least 8 commits with meaningful messages (lesson 05.1 has the conventions)
- [ ] A short `README.md` in the project folder: what it is, a screenshot of mobile and desktop, and what you'd improve

## Stretch goals
- [ ] A theme toggle button (a few lines of JS setting `data-theme` on `<html>`)
- [ ] Use a **container query** so skill cards switch to a horizontal layout when they're wide
- [ ] Animate the progress bar fill with a CSS `@keyframes` loop (using `transform: scaleX`)
- [ ] Get a Lighthouse **Accessibility** score of 100 (DevTools → Lighthouse)
- [ ] Open it on your real phone (lesson 05.3 shows how to serve over your local network)

## When you're done
1. Take mobile and desktop screenshots for the README.
2. Ask a friend (or the AI tutor) to **review it like a PR**: "Here's my P1 project, review the HTML semantics and CSS like a senior frontend dev. Don't rewrite it."
3. Tick **Project `P1`** in `PROGRESS.md` and commit.

> Keep this project. When you build your game's real UI in React (capstone milestone C03), you'll reuse a lot of this CSS thinking, and comparing the two shows how much you've grown.
