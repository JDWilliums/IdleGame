# 21.2 · Mobile polish

> ⏱ 2 hours · Module 21 · PWA, Performance & Accessibility

## What you'll learn
- The viewport, safe areas and dynamic viewport units
- Touch targets, hover and pointer media queries
- Stopping the annoying things: zoom on input focus, double-tap delay, pull-to-refresh, accidental text selection
- Mobile navigation patterns for a game
- Testing on real phones

---

Hearthwild is **mobile-first** (04.5): most sessions will be on a phone, one-handed, for two minutes at a time. This lesson covers the details that make a web app feel like an app rather than a website squeezed onto a small screen.

## Viewport and safe areas

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

`viewport-fit=cover` lets the page draw under the notch and the home indicator, which a full-screen PWA needs. Then keep important content out of those areas with **safe-area insets**:

```css
.app-header { padding-top: max(0.75rem, env(safe-area-inset-top)); }
.bottom-nav { padding-bottom: max(0.5rem, env(safe-area-inset-bottom)); }
```

### 100vh is a lie on phones
On mobile browsers, `100vh` is the height *with the address bar hidden*, so a `100vh` layout hides its bottom under the browser UI. Use the dynamic viewport units:

| Unit | Means |
|---|---|
| `dvh` | the current visible height (changes as browser UI shows and hides) |
| `svh` | the smallest it can be (browser UI shown) |
| `lvh` | the largest it can be (browser UI hidden) |

```css
.app { min-height: 100dvh; }
```

## Touch

### Targets
Fingers are much bigger than mouse pointers. WCAG 2.2 sets a minimum of **24×24 CSS pixels** (with spacing). Apple and Google's guidelines recommend about **44–48 px**. Aim for 44 px or more for every button in the game, and leave space between them: "Sell all" right next to "Sell one" is a nasty surprise.

A small icon can still have a big target:

```css
.icon-button { min-width: 44px; min-height: 44px; display: inline-grid; place-items: center; }
```

### Hover doesn't exist
A tooltip that only appears on hover is invisible on a phone. Use media queries to tell what kind of input the device has:

```css
@media (hover: hover) and (pointer: fine) {
  .item:hover .item-tooltip { display: block; }   /* mouse users */
}
```

On touch devices, show the same information on tap (a details sheet) instead. Never put essential information **only** in a hover state.

### Taming the browser
```css
button, .tappable { touch-action: manipulation; }   /* no double-tap-to-zoom delay */
.game-ui { user-select: none; }                      /* long-press doesn't select text on buttons */
html, body { overscroll-behavior-y: contain; }       /* no accidental pull-to-refresh mid-game */
```

Use `user-select: none` only on controls, never on text a player might want to copy (like an exported save code, 13.10).

### Inputs that don't zoom
iOS Safari zooms the page when a focused input's font is smaller than 16 px, and it doesn't zoom back. Keep form fields at `font-size: 1rem` (16 px) or more. Don't disable zooming with `maximum-scale=1`: people with low vision rely on it, and accessibility audits flag it.

Use the right `inputmode` and `type` so phones show the right keyboard: `inputmode="numeric"` for quantities (12-02's quantity box), `type="email"`, and `autocomplete` values for login forms (17.8).

## Navigation for a game

- **Phone**: a **bottom tab bar** (Skills · Bank · Shop · Combat · More) within thumb reach, with the current skill's progress always visible.
- **Tablet and desktop**: the same destinations move into a **sidebar**, and the extra space shows more at once (a skill list beside the skill page).

That's one component tree with CSS deciding the layout (04.5), not two apps. Test the in-between widths too: tablets in portrait, and narrow desktop windows.

## Gestures and feedback

- `navigator.vibrate(10)` gives a tiny buzz on level-up on Android. iOS Safari doesn't support it, so treat it as an optional extra, and respect a "vibration" setting.
- Swipe gestures are nice, but every gesture needs a visible button alternative. They're undiscoverable and hard for some players to perform.
- Respect `prefers-reduced-motion` for anything that moves (11.4, 21.4).

## Testing on real phones

DevTools' device mode is useful for layout, but it isn't a phone. It doesn't have real touch, the real Safari engine, real performance, or the notch. Before C12:

- **Android**: plug the phone in over USB, enable USB debugging, and open `chrome://inspect` on your computer to get full DevTools for the phone's tab.
- **iPhone**: enable Web Inspector in the phone's Safari settings, connect it to a Mac, and use Safari's **Develop** menu.
- **No Mac?** Test on the deployed site with a friend's iPhone, or use a cloud device service. iOS Safari has the most quirks, so don't skip it.
- On your local network, `vite --host` serves the dev server to your phone at your computer's IP address.

Things to check on a real device: the safe areas, the keyboard covering inputs, scrolling inside panels, the installed PWA (21.1), and how it feels to play one-handed for ten minutes.

## Check your understanding

1. What does `viewport-fit=cover` do, and what do you need to use with it?
2. Why prefer `100dvh` over `100vh`?
3. What minimum touch-target size would you aim for, and why?
4. How do you show a tooltip to mouse users without hiding information from touch users?
5. Why does iOS zoom in when you tap some inputs, and how do you prevent it without disabling zoom?
6. How do you debug the game running on an Android phone?

<details><summary>Answers</summary>

1. It lets the page extend under the notch and home indicator. Use `env(safe-area-inset-*)` padding so content isn't hidden behind them.
2. `100vh` on mobile assumes the address bar is hidden, so content gets cut off. `dvh` tracks the actually visible height.
3. About 44 px or more (WCAG 2.2's minimum is 24 px). Fingers are imprecise, and misses on adjacent buttons can be costly.
4. Show it on hover inside `@media (hover: hover) and (pointer: fine)`, and give touch users a tap-to-open details view with the same information.
5. Safari zooms when the input's font size is under 16 px. Use at least `1rem` for inputs. Don't use `maximum-scale=1`.
6. USB debugging, then `chrome://inspect` on the computer to open DevTools for the phone's tab.
</details>

## Further reading
- web.dev: "Accessible tap targets" and "The large, small, and dynamic viewport units"
- MDN: `env()`, `touch-action`, `overscroll-behavior`, `@media (hover)`
- Chrome docs: "Remote debug Android devices"

---
[← Progressive Web Apps](01-progressive-web-apps.md) · [Module overview](README.md) · [Next: Web performance →](03-web-performance.md)
