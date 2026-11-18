# 04.2 · Box model, display & positioning

> ⏱ 2 hours · Module 04 · HTML & CSS, Mobile-First

## What you'll learn
- How CSS decides which rule wins: the cascade, specificity and inheritance
- The box model and `box-sizing`
- `display`: block, inline, inline-block, none, and the layout modes
- Units: `px`, `rem`, `em`, `%`, `vw`/`vh`/`dvh`, `ch`
- Positioning, `z-index` and stacking contexts
- Overflow and scrolling

---

## How CSS decides what applies

```css
selector { property: value; }
```

When several rules target the same element and property, the browser picks a winner:

1. **Importance and origin**: `!important` beats normal declarations. *Don't use `!important` to win fights.* Fix the specificity instead.
2. **Cascade layers** (`@layer`), covered in lesson 04.6.
3. **Specificity**: more specific selectors win.
4. **Order**: if everything else is equal, the later rule wins.

### Specificity, roughly

| Selector | Specificity (id, class, element) |
|---|---|
| `p` | 0,0,1 |
| `.card` | 0,1,0 |
| `.card p` | 0,1,1 |
| `.card.active` | 0,2,0 |
| `#hud` | 1,0,0 |
| `style="..."` inline | beats all of the above |

Compare left to right: one id beats any number of classes. **Keep specificity low and flat**, mostly single classes, so styles are easy to override. Avoid styling by id.

### Inheritance
Some properties (`color`, `font-*`, `line-height`) are **inherited** by children, and most layout properties (`margin`, `border`, `width`) aren't. That's why setting `font-family` on `body` styles the whole page.

## The box model

Every element is a box:

```
┌──────────────── margin ────────────────┐
│  ┌──────────── border ──────────────┐  │
│  │  ┌───────── padding ──────────┐  │  │
│  │  │                            │  │  │
│  │  │          content           │  │  │
│  │  │                            │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

By default (`box-sizing: content-box`), `width` sets only the **content** size, and padding and border are added on top. So `width: 200px; padding: 20px` is 240px wide on screen. That's confusing, so everyone uses:

```css
*, *::before, *::after {
  box-sizing: border-box;   /* width includes padding and border */
}
```

Put this at the top of every stylesheet.

### Margins
- `margin: 0 auto` centres a block element horizontally (if it has a width).
- **Vertical margins collapse**: two stacked paragraphs with `margin: 16px` have 16px between them, not 32. This doesn't happen inside flex and grid containers, which is one reason modern layouts use `gap` instead of margins.

## `display`

| Value | Behaviour |
|---|---|
| `block` | starts on a new line and fills the available width (`div`, `p`, `section`, `h1`) |
| `inline` | flows within text; **width/height and vertical margins are ignored** (`span`, `a`, `strong`) |
| `inline-block` | flows inline but respects width, height and padding |
| `none` | removed from layout completely (and from the accessibility tree) |
| `flex` / `inline-flex` | flexbox container (04.3) |
| `grid` / `inline-grid` | grid container (04.4) |

`visibility: hidden` hides an element but **keeps its space**. `display: none` removes it.

## Units

| Unit | Relative to | Use for |
|---|---|---|
| `px` | a CSS pixel (not a physical pixel) | borders, small fixed details |
| `rem` | the **root** font size (usually 16px) | font sizes, spacing. **Respects the user's font-size setting** |
| `em` | the **current element's** font size | padding that scales with text (buttons) |
| `%` | the parent's size (for widths) | fluid widths |
| `vw` / `vh` | 1% of viewport width/height | full-screen sections |
| `dvh` / `svh` / `lvh` | dynamic / small / large viewport height | full-height **mobile** layouts (04.5) |
| `ch` | the width of the "0" character | readable line lengths (`max-width: 65ch`) |

> 🧠 Prefer `rem` for font sizes and spacing. Users with low vision often increase their browser's default font size, and `px` font sizes ignore that.

## Positioning

```css
.static   { position: static; }   /* default: normal flow; top/left do nothing */
.relative { position: relative; top: 4px; }  /* nudged from its normal spot; its space is kept */
.absolute { position: absolute; top: 0; right: 0; }  /* out of flow; relative to the nearest
                                                       positioned ancestor */
.fixed    { position: fixed; bottom: 0; left: 0; right: 0; }  /* relative to the viewport */
.sticky   { position: sticky; top: 0; }  /* normal flow, then sticks when scrolled to top: 0 */
```

The classic pattern is a badge in the corner of a card:

```css
.skill-card { position: relative; }        /* becomes the reference box */
.skill-card .level-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}
```

`inset: 0` is shorthand for `top: 0; right: 0; bottom: 0; left: 0`, which is handy for overlays.

### `z-index` and stacking contexts
`z-index` controls which positioned elements appear on top. The confusing part is **stacking contexts**: certain properties (`position` + `z-index`, `opacity < 1`, `transform`, `filter`, `isolation: isolate`) create a new stacking context. A child can never escape its parent's context, so `z-index: 9999` inside a context with `z-index: 1` still sits below a sibling with `z-index: 2`.

That's why modals and toasts are usually rendered at the **end of `<body>`** (React portals, lesson 09.4), outside any stacking contexts.

Tip: use a small, documented scale (`--z-dropdown: 10; --z-modal: 100; --z-toast: 1000;`) instead of random numbers.

## Overflow and scrolling

```css
.log {
  max-height: 12rem;
  overflow-y: auto;          /* show a scrollbar only when needed */
  overscroll-behavior: contain;  /* stops scroll "leaking" to the page on mobile */
}
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;   /* "Very long item na…" */
}
```

## A sensible reset

Start every project with something like this:

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { min-height: 100dvh; line-height: 1.5; -webkit-font-smoothing: antialiased; }
img, picture, svg, video, canvas { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }   /* form controls don't inherit fonts by default! */
p, h1, h2, h3 { overflow-wrap: break-word; }
```

## Check your understanding

1. `.card p` vs `p.highlight`: which has higher specificity?
2. An element has `width: 300px; padding: 20px; border: 2px solid` with `box-sizing: border-box`. How wide is it on screen?
3. Why does `width: 100px` do nothing on a `<span>`?
4. An absolutely positioned badge appears in the corner of the *page* instead of its card. What's missing?
5. Your modal has `z-index: 9999` but appears *behind* a header with `z-index: 10`. What's the likely cause?

<details><summary>Answers</summary>

1. They're equal (0,1,1), so whichever comes later wins.
2. 300px. Padding and border are included.
3. `<span>` is `inline`, and inline elements ignore width and height. Use `inline-block`, `block`, or make it a flex/grid item.
4. The card needs `position: relative` (or any non-static position) to become the badge's containing block.
5. The modal is inside an element that creates a stacking context with a lower z-index than the header, for example a parent with a `transform` or its own `z-index`. Render the modal at the end of `<body>`.
</details>

## Further reading
- MDN: [The box model](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model)
- MDN: [Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity)
- MDN: [Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context)
- Josh Comeau: *"A Modern CSS Reset"* and *"What The Heck, z-index??"*. Both are excellent.

---
[← Semantic HTML & accessibility](01-semantic-html-and-accessibility.md) · [Module overview](README.md) · [Next: Flexbox →](03-flexbox.md)
