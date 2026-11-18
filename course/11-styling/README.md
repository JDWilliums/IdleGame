# Module 11 · Styling React Apps

**Time:** ~10 hours · **Prerequisites:** Module 04 (CSS) and Modules 06–09

## Why this module matters
You know CSS. Now you need to apply it at the scale of a React app: dozens of components, consistent spacing and colour, dark mode, responsive layouts, and accessible interactive widgets, without the stylesheet turning into chaos. This module compares the main styling approaches used in industry, teaches **Tailwind CSS** (the most common choice in new React codebases), and covers theming, component libraries and motion. It's also where your game starts to *feel* good, because motion and feedback are a big part of why idle games are satisfying.

## Learning objectives
By the end of this module you can:
- compare global CSS, CSS Modules, Tailwind and CSS-in-JS, and choose sensibly
- build responsive, mobile-first, dark-mode-aware UIs with Tailwind v4
- set up design tokens and a theme switcher without a flash of the wrong theme
- use headless/accessible component libraries (Radix, React Aria, shadcn/ui)
- add purposeful motion and feedback while respecting reduced-motion preferences

## Lessons
| # | Lesson | Time |
|---|---|---|
| 11.1 | [Styling approaches](01-styling-approaches.md) | 1.5h |
| 11.2 | [Tailwind CSS](02-tailwind-css.md) | 3h |
| 11.3 | [Design tokens & theming](03-design-tokens-and-theming.md) | 2h |
| 11.4 | [Accessible components & motion](04-accessible-components-and-motion.md) | 2.5h |

There are no auto-graded exercises in this module, because visual work isn't something tests can judge well. Each lesson has a **"Do it"** list in your `vite-sandbox`. Then do **project P2** at the end of Module 12, which brings everything from Part 2 together.

## Checkpoint quiz
1. What problem do CSS Modules solve compared with global CSS?
2. In Tailwind, what does `md:grid-cols-3` mean, and why is that mobile-first?
3. Why can't you build class names dynamically like `` `bg-${color}-500` `` in Tailwind?
4. How do you stop a dark-themed site from flashing light on first load?
5. What does a "headless" component library give you, and what doesn't it?
6. Which CSS properties should you animate for smooth performance?
7. How do you respect users who've asked for reduced motion?

<details><summary>Answers</summary>

1. Name collisions and leakage. Class names are scoped to the component automatically (they're rewritten to unique names), so `.title` in two files won't clash.
2. "Use three grid columns at the `md` breakpoint *and up*." Unprefixed utilities apply to all sizes (mobile), and prefixes add styles for larger screens.
3. Tailwind generates CSS by scanning your source files for complete class names. A string built at runtime never appears in full, so its CSS isn't generated. Map values to complete class strings instead.
4. Apply the theme before React (or the CSS) renders, using a small inline script in `index.html` that reads the saved preference and sets `data-theme` on `<html>`.
5. Behaviour and accessibility (keyboard handling, focus management, ARIA, positioning) with no styles, so you style it yourself. It doesn't give you a visual design.
6. `transform` and `opacity`. They can be handled by the compositor without triggering layout or paint.
7. Use `@media (prefers-reduced-motion: reduce)` (or Tailwind's `motion-reduce:`/`motion-safe:` variants) to remove or shorten non-essential animations.
</details>

## Extra practice
1. **Restyle P1 with Tailwind.** Port your P1 game shell to a React + Tailwind version in `vite-sandbox`. Compare the two codebases.
2. **Component kit.** Build `Button`, `Card`, `Badge`, `ProgressBar` and `IconButton` with variants (using `cva` or plain maps), all of them dark-mode aware.
3. **Juice it.** Make a "+1 Oak Log" floating text animation that rises and fades, with a reduced-motion fallback.

**Next:** [Module 12 · Testing →](../12-testing/README.md)
