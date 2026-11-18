# 04.6 · CSS architecture, variables & theming

> ⏱ 1.5 hours · Module 04 · HTML & CSS, Mobile-First

## What you'll learn
- CSS custom properties (variables) and how they cascade
- Design tokens: a scale for colours, spacing, type and radii
- Light/dark themes with a few lines of CSS
- Keeping CSS maintainable: naming, low specificity, cascade layers and nesting
- Transitions, the basics (animation comes in 11.4)

---

## Custom properties

```css
:root {
  --color-bg: #fffdf8;
  --color-text: #1d1b16;
  --color-accent: #2f7d4a;
  --radius: 0.75rem;
}

.button {
  background: var(--color-accent);
  border-radius: var(--radius);
  color: var(--color-on-accent, white);   /* a fallback if the variable isn't defined */
}
```

Unlike Sass variables, custom properties are **live** at runtime:
- They **cascade and inherit**: redefine one on an element and all its descendants see the new value.
- You can change them with JavaScript: `el.style.setProperty('--progress', '0.4')`.

That second point powers smooth progress bars without re-rendering: set one variable and let CSS do the drawing.

```css
.progress { --progress: 0; }
.progress__fill {
  transform: scaleX(var(--progress));    /* 0 → 1 */
  transform-origin: left;
}
```

## Design tokens

Professional UIs use a small, consistent **scale** for every visual decision, called design tokens. Instead of `padding: 13px` here and `14px` there:

```css
:root {
  /* spacing: a 4px-based scale */
  --space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem;
  --space-4: 1rem;     --space-6: 1.5rem;  --space-8: 2rem;

  /* type scale */
  --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.125rem;
  --text-xl: 1.25rem;  --text-2xl: 1.5rem;

  /* radii and shadows */
  --radius-sm: 0.375rem; --radius-md: 0.75rem; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.08);

  /* z-index scale (see 04.2) */
  --z-header: 10; --z-modal: 100; --z-toast: 1000;
}
```

Consistency makes a UI look professional, even with no designer involved. Tailwind (Module 11) is essentially a huge, ready-made token system.

### Semantic colour tokens
Name colours by **purpose**, not appearance:

```css
:root {
  /* palette (raw values) */
  --green-600: #2f7d4a;
  --stone-50: #fffdf8;
  --stone-900: #1d1b16;

  /* semantic tokens (what components use) */
  --color-bg: var(--stone-50);
  --color-surface: white;
  --color-text: var(--stone-900);
  --color-text-muted: #6b665c;
  --color-accent: var(--green-600);
  --color-danger: #b42318;
  --color-border: #e6e1d6;
  --color-focus: #2563eb;
}
```

Components only ever use semantic tokens (`--color-surface`), never palette values (`--stone-50`). Then theming is just a matter of reassigning the semantic tokens.

## Light and dark themes

```css
/* 1. Follow the system preference by default */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #15140f;
    --color-surface: #211f19;
    --color-text: #f2efe6;
    --color-text-muted: #a8a294;
    --color-border: #3a372e;
  }
}

/* 2. Let the player override it in settings */
:root[data-theme='light'] { --color-bg: var(--stone-50); /* … */ }
:root[data-theme='dark']  { --color-bg: #15140f;        /* … */ }

/* 3. Tell the browser, so scrollbars and form controls match */
:root { color-scheme: light dark; }
```

```js
document.documentElement.dataset.theme = 'dark';   // from the settings screen
```

Every component updates automatically, because they all read the tokens.

## Keeping CSS maintainable

### Naming
Pick a convention and stick with it. **BEM** (Block__Element--Modifier) is common in plain CSS:

```css
.skill-card { }                 /* block */
.skill-card__title { }          /* element inside the block */
.skill-card--active { }         /* modifier: a variant */
```

It keeps specificity flat (single classes) and makes it obvious where a style belongs. In React you'll mostly use **CSS Modules** or **Tailwind**, which solve naming collisions automatically (lesson 11.1), but the principles of flat specificity and component-scoped styles still apply.

### Native nesting
Modern CSS supports nesting directly (no Sass needed):

```css
.skill-card {
  padding: var(--space-4);

  & .skill-card__title { font-size: var(--text-lg); }
  &:focus-visible { outline: 2px solid var(--color-focus); }
  @media (min-width: 40rem) { padding: var(--space-6); }
}
```

Don't nest deeply, because it raises specificity. One or two levels is plenty.

### Cascade layers
`@layer` lets you decide which *groups* of styles win, whatever their specificity:

```css
@layer reset, base, components, utilities;   /* later layers win */

@layer reset { *, *::before, *::after { box-sizing: border-box; } }
@layer base { body { font-family: system-ui, sans-serif; } }
@layer components { .button { padding: var(--space-2) var(--space-4); } }
@layer utilities { .hidden { display: none; } }
```

Tailwind v4 uses layers internally. Understanding them helps when you mix your own CSS with a framework's.

## Transitions (a taste)

```css
.button {
  transition: background-color 150ms ease, transform 150ms ease;
}
.button:active { transform: scale(0.97); }   /* tactile press feedback, great on mobile */
```

Animate **`transform` and `opacity`** when you can, since they're cheap (lesson 03.1). Respect `prefers-reduced-motion`. More in lesson 11.4.

## Fonts

```css
body {
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;  /* fast: no download */
}
```

A system font stack loads instantly and looks native on every device, which is a great default. If you use a web font, use `font-display: swap` and only the weights you actually need.

## Check your understanding

1. What's the advantage of semantic colour tokens (`--color-surface`) over palette tokens (`--stone-50`) in components?
2. How do you make a theme follow the OS setting but still be switchable from settings?
3. Why does deep nesting cause problems?
4. Which two properties are cheapest to animate?

<details><summary>Answers</summary>

1. Themes only have to reassign the semantic tokens, and components never change. It also documents *intent* (surface, text, danger) instead of appearance.
2. Define dark values inside `@media (prefers-color-scheme: dark)`, and add explicit `[data-theme='light']` / `[data-theme='dark']` overrides on `:root`, set from JavaScript.
3. Each level adds specificity, which makes styles harder to override and couples the CSS to the HTML structure.
4. `transform` and `opacity`.
</details>

## Further reading
- MDN: [Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties)
- MDN: [Cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)
- MDN: [CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting)

**Next:** the project **[P1 · Game UI shell](../projects/P1-game-ui-shell.md)**.

---
[← Responsive, mobile-first design](05-responsive-mobile-first-design.md) · [Module overview](README.md) · [Next module: Tools of the Trade →](../05-tools-of-the-trade/README.md)
