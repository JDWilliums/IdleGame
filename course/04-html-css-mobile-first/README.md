# Module 04 · HTML & CSS, Mobile-First

**Time:** ~20 hours · **Prerequisites:** Module 03

## Why this module matters
Many developers coming from programming courses treat CSS as an afterthought, and it shows. Ask most junior candidates to centre something or build a responsive layout without a framework and they struggle. A frontend developer who's confident with CSS stands out. Your game must work well on a 375px-wide phone *and* a 1440px monitor, and that comes down to layout skill, not framework magic.

You'll write **plain HTML and CSS** in this module (no React yet), so you learn the platform rather than an abstraction over it. Tailwind arrives in Module 11, and it'll make far more sense once you know what it generates.

## Learning objectives
By the end of this module you can:
- write semantic, accessible HTML (landmarks, headings, buttons vs links, labelled forms)
- explain the box model, `display` types, positioning, stacking and overflow
- build any common layout with Flexbox and Grid, and know which to use when
- design mobile-first: viewport, units, media and container queries, touch targets, safe areas
- organise CSS with custom properties, sensible naming, cascade layers and themes (including dark mode)

## Lessons
| # | Lesson | Time |
|---|---|---|
| 04.1 | [Semantic HTML & accessibility](01-semantic-html-and-accessibility.md) | 2h |
| 04.2 | [Box model, display & positioning](02-box-model-display-and-positioning.md) | 2h |
| 04.3 | [Flexbox](03-flexbox.md) | 2h |
| 04.4 | [Grid](04-grid.md) | 2h |
| 04.5 | [Responsive, mobile-first design](05-responsive-mobile-first-design.md) | 2.5h |
| 04.6 | [CSS architecture, variables & theming](06-css-architecture-variables-and-theming.md) | 1.5h |

## Project
**P1 · [Game UI shell in pure HTML & CSS](../projects/P1-game-ui-shell.md)** (~8h). Build the static layout of an idle game: a bottom tab bar on mobile, a sidebar on desktop, skill cards in a responsive grid, a progress bar and a modal. There are no tests. You check your work against an acceptance checklist, exactly like a real ticket.

## How to practise CSS
CSS isn't auto-graded here, because visual correctness is hard to test. Instead:
1. Type every example into an `.html` file in `playground/` and open it in the browser.
2. **Use DevTools constantly**: inspect elements, toggle properties, and edit values live. The Elements → Styles and Computed panels show the box model and *which rule won* (lesson 05.5).
3. Use the device toolbar (`Ctrl/Cmd+Shift+M` in Chrome) to test phone sizes.
4. Play the games listed in Extra practice. They're surprisingly effective.

## Checkpoint quiz
1. When should you use a `<button>` and when an `<a>`?
2. With `box-sizing: border-box`, what does `width: 200px` include?
3. What's the difference between `position: relative`, `absolute`, `fixed` and `sticky`?
4. Flexbox or Grid for: (a) a row of buttons; (b) a dashboard of cards in rows *and* columns; (c) centring one thing?
5. What does "mobile-first" mean in terms of how you write media queries?
6. Why might `height: 100vh` be wrong on a phone, and what can you use instead?
7. What's the minimum recommended touch target size?
8. How do you make a colour theme switchable (light/dark) without duplicating every rule?

<details><summary>Answers</summary>

1. A `<button>` performs an **action** on the current page (sell, start skill, open modal). An `<a href>` **navigates** to another URL or page. Never use a `<div>` with an `onclick`.
2. Content + padding + border. Only the margin is outside it.
3. `relative`: offset from its normal position, and becomes the containing block for absolutely-positioned children. `absolute`: removed from the flow and positioned relative to the nearest positioned ancestor. `fixed`: positioned relative to the viewport. `sticky`: normal flow until a scroll threshold, then it sticks.
4. (a) Flexbox (one dimension). (b) Grid (two dimensions). (c) Either. `display: grid; place-items: center` is the shortest.
5. Base styles target small screens, and `min-width` media queries *add* styles as the screen gets bigger.
6. On mobile browsers `100vh` can be taller than the visible area because of the collapsing browser toolbars, so content gets hidden. Use `100dvh` (dynamic viewport height), or `100svh` for the smallest size.
7. At least 44×44 CSS pixels (Apple's guideline; WCAG AAA uses 44 and the AA minimum is 24).
8. Define colours as CSS custom properties on `:root`, then override just the variables for `[data-theme="dark"]` or inside `@media (prefers-color-scheme: dark)`.
</details>

## Extra practice
- **Flexbox Froggy** (flexboxfroggy.com) and **Grid Garden** (cssgridgarden.com): finish both.
- **CSS Diner** (flukeout.github.io): selectors.
- **Recreate three screens** from mobile apps you use, in HTML and CSS, at phone *and* desktop sizes.
- **Frontend Mentor** (frontendmentor.io): do two "newbie" challenges from their designs.

**Next:** [Module 05 · Tools of the Trade →](../05-tools-of-the-trade/README.md)
