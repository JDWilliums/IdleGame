# 11.1 · Styling approaches

> ⏱ 1.5 hours · Module 11 · Styling React Apps

## What you'll learn
- The main ways to style a React app, with their trade-offs
- What the industry uses in 2026
- The approach this course uses, and why

---

## The problem at scale

In a small project one stylesheet is fine. In a React app with 200 components and five developers:
- **Naming collisions**: two components both define `.card`, and one breaks.
- **Dead CSS**: nobody dares delete a rule, because who knows what uses it?
- **Specificity wars**: overrides on top of overrides, then `!important`.
- **Inconsistency**: 37 slightly different greys and 14 paddings.

Each approach below solves some of these problems.

## 1. Global CSS (with a naming convention)

```tsx
import './SkillCard.css';
<article className="skill-card skill-card--active">
```

- ✅ It's just CSS: no tooling, and everyone knows it.
- ❌ Everything is global. You rely on discipline (BEM, from 04.6) to avoid collisions.
- 👍 Fine for small apps, and for global base styles in any app (resets, typography, tokens).

## 2. CSS Modules

Vite supports these out of the box. Name the file `*.module.css`:

```css
/* SkillCard.module.css */
.card { padding: var(--space-4); border-radius: var(--radius-md); }
.active { outline: 2px solid var(--color-accent); }
.title { font-size: var(--text-lg); }
```

```tsx
import styles from './SkillCard.module.css';

<article className={isActive ? `${styles.card} ${styles.active}` : styles.card}>
  <h3 className={styles.title}>{name}</h3>
</article>
```

At build time, class names are rewritten to unique ones (`SkillCard_card__x7f2a`), so **collisions are impossible**, and deleting a component deletes its CSS.

- ✅ Real CSS (media queries, container queries, nesting, animations), scoped automatically.
- ✅ No runtime cost.
- ❌ Jumping between files, and naming every class yourself.
- 👍 A solid, framework-free choice. Common in many companies.

## 3. Utility-first CSS: Tailwind

Compose styles from small single-purpose classes, directly in the markup:

```tsx
<article className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900">
  <h3 className="text-lg font-semibold">{name}</h3>
</article>
```

- ✅ **Very fast to build with** once you know the vocabulary: no naming, no file switching.
- ✅ **A built-in design system**: spacing, colours and type all come from a consistent scale.
- ✅ **Tiny CSS output**: only the classes you use are generated, and the size stays roughly constant as the app grows.
- ✅ **Safe to change**: styles live with the markup, so deleting a component deletes its styles.
- ❌ Long class lists. Some people find them noisy (extracting components helps).
- ❌ You need to know CSS anyway (Tailwind *is* CSS, just named differently), which is why this course taught CSS first.
- 👍 **The most popular choice for new React projects**, and used by shadcn/ui and most modern templates.

## 4. CSS-in-JS (runtime): styled-components, Emotion

```tsx
const Card = styled.article<{ $active: boolean }>`
  padding: 16px;
  outline: ${(p) => (p.$active ? '2px solid green' : 'none')};
`;
```

- ✅ Dynamic styles from props, scoped, co-located.
- ❌ A **runtime cost**: styles are generated in JavaScript while rendering, which slows rendering and grows the bundle.
- ❌ It doesn't work well with React Server Components.
- 📉 Very common in codebases from about 2017–2022, so **you'll likely maintain it at some point**, but it's less often chosen for new projects.

## 5. Zero-runtime CSS-in-JS: vanilla-extract, Panda CSS, StyleX

You write styles in TypeScript, and they're extracted to static CSS at build time. These are type-safe with no runtime cost, but they're niche compared with Tailwind and CSS Modules.

## 6. Inline styles

```tsx
<div style={{ width: `${percent}%` }} />
```

Good for **truly dynamic values** (progress percentages, positions, CSS variables). Not for general styling: no media queries, no pseudo-classes, and hard to override.

## Comparison

| | Scoped | Runtime cost | Media/container queries | Design system | Popularity for new apps |
|---|---|---|---|---|---|
| Global CSS | ❌ (convention) | none | ✅ | DIY | low |
| CSS Modules | ✅ | none | ✅ | DIY (tokens) | medium |
| **Tailwind** | ✅ (by construction) | none | ✅ (prefixes) | **built in** | **high** |
| Runtime CSS-in-JS | ✅ | ⚠️ yes | ✅ | DIY | declining |
| Inline styles | ✅ | small | ❌ | ❌ | dynamic values only |

## This course's choice

**Tailwind CSS v4 + CSS custom properties for tokens**, with inline styles or CSS variables for genuinely dynamic values (like progress bar fills). Reasons:
- it's what you're most likely to meet in a React job today
- it pairs well with headless component libraries (11.4)
- it's great for mobile-first responsive work
- because you learned real CSS first, you'll understand what every utility does

**You can use CSS Modules for your capstone instead** if you prefer them. The milestones don't require Tailwind. Being able to explain *why* you picked one is worth more in an interview than the pick itself.

## Check your understanding

1. Which approaches have **zero** runtime cost?
2. Why might a company be migrating away from styled-components?
3. When are inline styles the right tool?

<details><summary>Answers</summary>

1. Global CSS, CSS Modules, Tailwind, zero-runtime CSS-in-JS (and inline styles are near zero).
2. Runtime style generation costs rendering performance and bundle size, and it doesn't fit React Server Components well.
3. For truly dynamic per-render values (a width percentage, a transform, a CSS variable value). Not for static styling.
</details>

## Further reading
- Vite docs: [CSS Modules](https://vite.dev/guide/features#css-modules)
- Tailwind docs: [Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes) (it explains the philosophy well)
- The "State of CSS" survey results (stateofcss.com) show what developers actually use each year

---
[Module overview](README.md) · [Next: Tailwind CSS →](02-tailwind-css.md)
