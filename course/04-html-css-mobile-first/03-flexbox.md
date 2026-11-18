# 04.3 · Flexbox

> ⏱ 2 hours · Module 04 · HTML & CSS, Mobile-First

## What you'll learn
- The flex container and flex items
- Main axis vs cross axis
- `justify-content`, `align-items`, `gap`, `flex-wrap`
- `flex-grow`, `flex-shrink`, `flex-basis` and the `flex` shorthand
- The patterns you'll build again and again

---

## One-dimensional layout

Flexbox lays items out along **one axis**: a row or a column. Use it for toolbars, nav bars, button groups, a card's internal layout, and centring.

```css
.toolbar {
  display: flex;          /* children become flex items */
}
```

## The two axes

```
flex-direction: row (default)                flex-direction: column
main axis ───────────────►                   main axis
┌──────────────────────────┐                 │ ┌────────┐
│ [A]  [B]  [C]            │ ▲ cross         │ │  [A]   │
│                          │ │ axis          │ │  [B]   │
└──────────────────────────┘ ▼               ▼ │  [C]   │
                                               └────────┘  ◄─ cross axis ─►
```

- `justify-content` aligns items along the **main** axis.
- `align-items` aligns items along the **cross** axis.

When you switch to `flex-direction: column`, the two swap, which confuses everyone at first.

```css
.container {
  display: flex;
  flex-direction: row;           /* row | column | row-reverse | column-reverse */
  justify-content: space-between;/* flex-start | center | flex-end | space-between | space-around | space-evenly */
  align-items: center;           /* stretch (default) | flex-start | center | flex-end | baseline */
  gap: 0.75rem;                  /* space BETWEEN items (no margin hacks needed) */
  flex-wrap: wrap;               /* allow items to wrap onto new lines */
}
```

## Sizing items: grow, shrink, basis

Each item has three sizing properties:
- `flex-basis`: its starting size before free space is shared out (`auto` uses its width or content size).
- `flex-grow`: how much of the **leftover** space it takes (0 = none).
- `flex-shrink`: how much it shrinks when there **isn't enough** space (1 = shrinks equally, 0 = never).

Shorthands you'll actually use:

```css
.item { flex: 1; }        /* grow and shrink equally, basis 0: equal-width columns */
.item { flex: none; }     /* don't grow or shrink: fixed by its content/width */
.item { flex: 0 0 4rem; } /* exactly 4rem, never grow or shrink */
.item { flex: 1 1 12rem; }/* start at 12rem, grow or shrink as needed */
```

### The min-width gotcha
Flex items have `min-width: auto` by default: they won't shrink below their content's size. Long unbroken text (an item name, a URL) then overflows the container. The fix:

```css
.item { min-width: 0; }   /* allow shrinking, then truncate the text inside */
```

Remember this. It catches out every developer at least once.

## Patterns

### Centre anything
```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### App header: logo left, actions right
```html
<header class="app-header">
  <h1 class="logo">Hearthwild</h1>
  <div class="actions">
    <button type="button">🔔</button>
    <button type="button">⚙️</button>
  </div>
</header>
```
```css
.app-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }
.actions { display: flex; gap: 0.5rem; }
```
An alternative to `space-between` is `margin-left: auto` on the item that should be pushed right. An auto margin absorbs all the free space.

### Mobile bottom tab bar (equal-width tabs)
```css
.tab-bar { display: flex; }
.tab-bar a {
  flex: 1;                         /* every tab gets an equal share */
  display: flex;
  flex-direction: column;          /* icon above label */
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0;
  min-height: 3.5rem;              /* a big touch target */
}
```

### A skill row: icon, info that stretches, level
```css
.skill-row { display: flex; align-items: center; gap: 0.75rem; }
.skill-row .icon { flex: none; width: 2.5rem; height: 2.5rem; }
.skill-row .info { flex: 1; min-width: 0; }   /* takes the remaining space, can shrink */
.skill-row .level { flex: none; font-variant-numeric: tabular-nums; }
```

`font-variant-numeric: tabular-nums` makes every digit the same width, so a ticking number doesn't wobble. In an idle game, where numbers change constantly, this is a must.

### Sticky footer: content fills the screen
```css
body { min-height: 100dvh; display: flex; flex-direction: column; }
main { flex: 1; }   /* pushes the footer to the bottom */
```

## Ordering
`order: -1` moves an item visually without changing the HTML. Use it sparingly: keyboard and screen-reader order still follows the HTML, and a mismatch is an accessibility problem.

## Check your understanding

1. In a `flex-direction: column` container, which property centres items horizontally?
2. Three items with `flex: 1` in a 600px container (no gap). How wide is each?
3. A long item name pushes the layout wider than the screen. What CSS fixes it?
4. How do you push one item in a flex row all the way to the right?

<details><summary>Answers</summary>

1. `align-items: center`. In a column, horizontal is the **cross** axis.
2. 200px.
3. `min-width: 0` on the flex item (plus `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on the text if you want truncation).
4. `margin-left: auto` on that item (or `justify-content: space-between` if there are only two groups).
</details>

## Further reading
- MDN: [Flexbox](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox)
- CSS-Tricks: *"A Complete Guide to Flexbox"*. Keep it open while you work.
- Josh Comeau: *"An Interactive Guide to Flexbox"*

**Practice:** Flexbox Froggy (flexboxfroggy.com), all 24 levels.

---
[← Box model, display & positioning](02-box-model-display-and-positioning.md) · [Module overview](README.md) · [Next: Grid →](04-grid.md)
