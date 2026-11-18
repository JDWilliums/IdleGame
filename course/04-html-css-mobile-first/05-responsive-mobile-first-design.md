# 04.5 · Responsive, mobile-first design

> ⏱ 2.5 hours · Module 04 · HTML & CSS, Mobile-First

## What you'll learn
- What "mobile-first" means, and why it produces better CSS
- Media queries: width, hover/pointer, reduced motion, colour scheme
- Fluid typography and spacing with `clamp()`
- Container queries: components that respond to *their own* size
- Mobile realities: dynamic viewport units, safe areas, touch targets, tap delay, zoom on input focus
- Testing on real devices

---

## Mobile-first

**Mobile-first** means writing your base CSS for the **smallest** screen, then using `min-width` media queries to add layout as space allows:

```css
/* Base: phones */
.skill-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }

/* Tablets and up */
@media (min-width: 40rem) {
  .skill-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 64rem) {
  .skill-grid { grid-template-columns: repeat(4, 1fr); }
}
```

Why start small?
- **Small screens are the hardest constraint.** Designing for them first forces you to prioritise what matters. Adding space is easy; cramming a desktop design into a phone isn't.
- **The CSS is simpler.** Mobile layouts are usually single-column (block flow does most of the work), and desktop *adds* columns. Desktop-first tends to mean writing lots of overrides to undo things.
- **Most web traffic is mobile**, and an idle game is something people check on their phone throughout the day.

### Choosing breakpoints
Don't target specific devices (they change every year). Add a breakpoint **where your layout starts to look wrong** as you widen the browser. Common starting points: `40rem` (640px), `48rem` (768px), `64rem` (1024px), `80rem` (1280px). Using `rem` in media queries means they respect the user's font size.

Newer range syntax, supported in all modern browsers:

```css
@media (width >= 64rem) { … }
@media (40rem <= width < 64rem) { … }
```

## Not just width: capability queries

```css
/* Devices with a mouse or trackpad: add hover effects */
@media (hover: hover) and (pointer: fine) {
  .skill-card:hover { transform: translateY(-2px); }
}

/* Touch devices: bigger targets */
@media (pointer: coarse) {
  .icon-button { min-width: 3rem; min-height: 3rem; }
}

/* Users who asked their OS for less motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* System dark mode (more in 04.6) */
@media (prefers-color-scheme: dark) { … }
```

> 🧠 **Hover doesn't exist on touch screens.** Never hide important information or actions behind `:hover` alone (tooltips with item stats, for example). On mobile, use a tap-to-open details panel instead.

## Fluid sizing with `clamp()`

`clamp(MIN, PREFERRED, MAX)` picks the preferred value, limited to a range:

```css
h1 {
  font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem);  /* grows with the viewport, within limits */
}
.page {
  padding-inline: clamp(1rem, 4vw, 3rem);
}
.content {
  width: min(100% - 2rem, 70rem);                /* full width with a margin, capped at 70rem */
  margin-inline: auto;
}
```

These often remove the need for breakpoints entirely.

## Container queries

Media queries respond to the **viewport**. But a skill card might sit in a narrow sidebar on desktop and a wide main column on a tablet. **Container queries** let a component respond to its **own container's** size:

```css
.card-slot {
  container-type: inline-size;    /* this element becomes a size container */
}

.skill-card { display: flex; flex-direction: column; }

@container (min-width: 22rem) {
  .skill-card { flex-direction: row; }   /* lay out horizontally when the CARD has room */
}
```

This makes components truly reusable, and it fits well with React components. Container queries are supported in all modern browsers.

## Mobile realities

### Viewport height units
On mobile, browser toolbars slide in and out as you scroll, so "the viewport height" isn't a single value:

| Unit | Meaning |
|---|---|
| `100vh` | the *largest* viewport (toolbars hidden). Content at the bottom can end up **behind the toolbar** |
| `100svh` | the *smallest* viewport (toolbars shown). Always fully visible |
| `100lvh` | the largest viewport |
| `100dvh` | **dynamic**: updates as toolbars move |

Use `100dvh` (or `svh`) for app shells, like your game's full-screen layout.

### Safe areas (notches, home indicators)
With `viewport-fit=cover` (see the meta tag in 04.1), your page draws edge to edge, *under* the notch and the home indicator. Pad important UI using the safe-area environment variables:

```css
.app-tabbar {
  padding-bottom: env(safe-area-inset-bottom);   /* clear the iPhone home indicator */
}
.app-header {
  padding-top: env(safe-area-inset-top);
}
```

### Touch targets
Fingers are much less precise than a mouse pointer. Make tappable things **at least 44×44 CSS pixels**, with space between them. Small icon buttons are the usual offenders, so give them padding even if the icon itself is small.

### Inputs zooming on focus (iOS)
iOS Safari zooms the page when you focus an input whose font size is **under 16px**. Make form inputs `font-size: 1rem` (16px) or larger. **Don't disable zoom** with `user-scalable=no`: that's an accessibility failure.

### Tap highlight and double-tap
```css
button { touch-action: manipulation; }   /* removes double-tap-to-zoom delay on buttons */
.tab { -webkit-tap-highlight-color: transparent; }  /* if you provide your own pressed state */
```

### Preventing accidental text selection on game buttons
Rapidly tapping game buttons can select text and pop up the iOS copy menu:

```css
.game-button { user-select: none; -webkit-user-select: none; }
```

Use it only on controls, never on content people might want to copy.

### Scrolling inside panels
```css
.panel {
  overflow-y: auto;
  overscroll-behavior: contain;       /* don't scroll the page behind when you reach the end */
  -webkit-overflow-scrolling: touch;  /* legacy iOS momentum scrolling; harmless */
}
```

## Responsive images

```html
<img
  src="banner-800.webp"
  srcset="banner-400.webp 400w, banner-800.webp 800w, banner-1600.webp 1600w"
  sizes="(min-width: 64rem) 50vw, 100vw"
  alt="The village of Hearthwild"
  width="800" height="400"
  loading="lazy"
/>
```

The browser picks the smallest file that looks sharp on this screen. For game icons, inline **SVG** is usually best, since it's crisp at any size and tiny.

## Testing

1. **DevTools device toolbar** for quick checks at 360, 390 and 430px widths and in landscape.
2. **Your real phone.** Run the dev server with `--host` (lesson 05.3) and open `http://<your-computer's-ip>:5173` on your phone over the same Wi-Fi. Real devices reveal things emulators don't: the actual toolbar behaviour, touch precision, performance, and fonts.
3. **Zoom to 200%** on desktop. Does the layout still work?
4. **Rotate** the phone.

## Check your understanding

1. Write the media query that applies styles only on screens at least 48rem wide.
2. Why can `height: 100vh` hide your bottom tab bar on iOS?
3. When would a container query be better than a media query?
4. Your item tooltips only appear on `:hover`. What's the problem on phones, and what's the fix?
5. Why should form inputs on mobile have `font-size` of at least 16px?

<details><summary>Answers</summary>

1. `@media (min-width: 48rem) { … }` (or `@media (width >= 48rem)`).
2. `100vh` is the *large* viewport height, so with the browser toolbar visible, the bottom part of a 100vh layout sits behind it. Use `100dvh` and `env(safe-area-inset-bottom)`.
3. When the component's layout should depend on the space it's been given rather than the screen width, e.g. a card that appears in both a narrow sidebar and a wide grid.
4. Touch devices have no hover, so the information is unreachable. Show the details on tap (a details panel, popover or bottom sheet), and use `@media (hover: hover)` to add hover enhancements only where they work.
5. iOS Safari auto-zooms when focusing inputs smaller than 16px, which disorients users.
</details>

## Further reading
- MDN: [Responsive design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- MDN: [Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- web.dev: [Learn Responsive Design](https://web.dev/learn/design) (a free course)
- MDN: [`env()`](https://developer.mozilla.org/en-US/docs/Web/CSS/env)

---
[← Grid](04-grid.md) · [Module overview](README.md) · [Next: CSS architecture, variables & theming →](06-css-architecture-variables-and-theming.md)
