# 04.4 · Grid

> ⏱ 2 hours · Module 04 · HTML & CSS, Mobile-First

## What you'll learn
- Two-dimensional layout with CSS Grid
- `grid-template-columns`/`rows`, the `fr` unit, `repeat()` and `minmax()`
- Responsive grids with **no media queries** (`auto-fill` and `auto-fit`)
- Named grid areas for page layouts
- Grid vs Flexbox: when to use which

---

## Two-dimensional layout

Grid controls **rows and columns at the same time**. Use it for page layouts, card galleries, inventories and dashboards.

```css
.bank {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;   /* three equal columns */
  gap: 0.5rem;                           /* row and column gap */
}
```

Children are placed into cells automatically, left to right and top to bottom.

## The `fr` unit

`fr` means "a fraction of the remaining space":

```css
grid-template-columns: 2fr 1fr;            /* first column twice as wide as the second */
grid-template-columns: 16rem 1fr;          /* fixed sidebar, fluid content */
grid-template-columns: repeat(4, 1fr);     /* four equal columns */
```

## `minmax()` and the responsive grid

This is the most useful line of CSS in this module:

```css
.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 1rem;
}
```

Read it as: *"create as many columns as fit, each at least 10rem wide; share the leftover space equally."* On a phone you get 1–2 columns, on a tablet 3–4, on a desktop 6+, with **no media queries**. Perfect for your game's skill cards and bank slots.

- `auto-fill` keeps empty column tracks when there are few items (the items stay their natural size).
- `auto-fit` collapses empty tracks, so a few items stretch to fill the row.

To avoid overflow on very narrow screens, use `minmax(min(10rem, 100%), 1fr)`.

### Square inventory slots
```css
.bank {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr));
  gap: 0.25rem;
}
.bank-slot { aspect-ratio: 1; }   /* always square, whatever the width */
```

## Placing items

```css
.featured {
  grid-column: span 2;      /* take two columns */
}
.full-width {
  grid-column: 1 / -1;      /* from the first line to the last line: the whole row */
}
```

Grid lines are numbered from 1, and `-1` is the last line.

## Named areas: page layouts

```css
.app {
  display: grid;
  min-height: 100dvh;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header"
    "main"
    "tabbar";
}
.app-header { grid-area: header; }
.app-main   { grid-area: main; overflow-y: auto; }
.app-tabbar { grid-area: tabbar; }
.app-sidebar { display: none; }

@media (min-width: 64rem) {                 /* desktop: sidebar replaces the tab bar */
  .app {
    grid-template-columns: 15rem 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      "sidebar header"
      "sidebar main";
  }
  .app-sidebar { display: block; grid-area: sidebar; }
  .app-tabbar  { display: none; }
}
```

The template reads like a picture of the layout. Changing the layout per breakpoint means rewriting a few strings, without touching the HTML. This is exactly the shape of your project P1 and your game.

## Alignment in grid

```css
.grid {
  justify-items: center;   /* horizontal alignment inside each cell */
  align-items: center;     /* vertical alignment inside each cell */
  place-items: center;     /* both at once */
}
.cell { justify-self: end; align-self: start; }  /* override one item */
```

The shortest way to centre something:

```css
.center { display: grid; place-items: center; }
```

## Subgrid

When cards in a row have different amounts of text, their buttons don't line up. `subgrid` lets children share the parent grid's rows:

```css
.card-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 1rem; }
.card { display: grid; grid-row: span 3; grid-template-rows: subgrid; }  /* title / body / button rows align */
```

## Grid vs Flexbox

| Use **Flexbox** when… | Use **Grid** when… |
|---|---|
| content flows in one direction | you need rows *and* columns |
| item sizes come from their content | the layout defines the sizes |
| toolbars, nav bars, button groups, a card's insides | page layouts, galleries, inventories, dashboards |

They combine naturally: a **grid** of cards, where each card uses **flex** inside.

## Check your understanding

1. What does `repeat(auto-fill, minmax(10rem, 1fr))` do as the screen widens?
2. How do you make one grid item span the entire row?
3. Which is simpler for a toolbar with a title on the left and three buttons on the right: grid or flex?
4. What's the difference between `auto-fill` and `auto-fit`?

<details><summary>Answers</summary>

1. It fits as many columns of at least 10rem as possible, and each column grows equally to fill the leftover space. More screen means more columns.
2. `grid-column: 1 / -1`.
3. Flex, because it's one-dimensional and content-sized.
4. `auto-fill` keeps empty tracks, so items stay their minimum-ish width. `auto-fit` collapses empty tracks, so items stretch to fill the row when there are only a few.
</details>

## Further reading
- MDN: [Grids](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids)
- CSS-Tricks: *"A Complete Guide to CSS Grid"*
- Josh Comeau: *"An Interactive Guide to CSS Grid"*

**Practice:** Grid Garden (cssgridgarden.com), all 28 levels.

---
[← Flexbox](03-flexbox.md) · [Module overview](README.md) · [Next: Responsive, mobile-first design →](05-responsive-mobile-first-design.md)
