# 11.3 · Design tokens & theming

> ⏱ 2 hours · Module 11 · Styling React Apps

## What you'll learn
- Semantic tokens in Tailwind v4, so themes swap with a few lines of CSS
- A light/dark/system theme switcher in React
- Avoiding the "flash of wrong theme" on load
- Colour, contrast and accessibility checks
- Giving your game a visual identity

---

## Semantic tokens, revisited

In 04.6 you learned: **components use semantic tokens** (`surface`, `text-muted`, `accent`), and **themes reassign them**. In Tailwind v4, that looks like this:

```css
/* src/index.css */
@import 'tailwindcss';

/* 1. Tell Tailwind about the semantic tokens; their values come from CSS variables */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-text: var(--text);
  --color-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-border: var(--border);
  --color-danger: var(--danger);
}

/* 2. Light theme (default) */
:root {
  --bg: oklch(0.985 0.01 85);
  --surface: oklch(1 0 0);
  --text: oklch(0.22 0.02 60);
  --text-muted: oklch(0.5 0.02 60);
  --accent: oklch(0.55 0.13 150);
  --border: oklch(0.9 0.015 80);
  --danger: oklch(0.55 0.2 25);
  color-scheme: light;
}

/* 3. Dark theme */
:root[data-theme='dark'] {
  --bg: oklch(0.18 0.01 70);
  --surface: oklch(0.23 0.012 70);
  --text: oklch(0.94 0.01 85);
  --text-muted: oklch(0.7 0.015 80);
  --accent: oklch(0.7 0.14 150);
  --border: oklch(0.32 0.015 70);
  --danger: oklch(0.68 0.18 25);
  color-scheme: dark;
}

/* 4. Manual override for the dark: variant */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

Components use only the semantic names:

```tsx
<div className="bg-surface text-text ring-1 ring-border">
  <p className="text-muted">Level 12</p>
  <button className="bg-accent text-white">Train</button>
</div>
```

Switching theme means changing one attribute on `<html>`. You don't need `dark:` variants everywhere, because the tokens themselves change.

> `oklch()` is a modern colour format where lightness is perceptually even, which makes it much easier to build consistent light/dark palettes. It's supported in all modern browsers, and Tailwind v4's default palette uses it.

## The theme switcher

Three options: **light**, **dark** and **system** (follow the OS).

```tsx
type ThemePreference = 'light' | 'dark' | 'system';

function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref !== 'system') return pref;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [preference, setPreference] = useLocalStorage<ThemePreference>('theme', 'system');  // your hook from 07-04!

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(preference);
    };
    apply();
    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);          // follow live OS changes
    return () => media.removeEventListener('change', apply);
  }, [preference]);

  return { preference, setPreference };
}
```

Look at what's in there: an effect synchronising with an external system (the DOM attribute and a media query), with cleanup. That's Module 07 in action.

## Avoiding the flash of the wrong theme

React mounts *after* the HTML and CSS load. A player with dark mode saved sees a **white flash** first, then dark. On a phone at night, that's unpleasant.

The fix is a tiny **blocking inline script** in `index.html`'s `<head>` that sets the attribute before anything paints:

```html
<head>
  <script>
    (function () {
      try {
        var pref = JSON.parse(localStorage.getItem('theme') || '"system"');
        var dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      } catch (e) {}
    })();
  </script>
  …
</head>
```

This is one of the few times a blocking script in `<head>` is the right call: it's tiny and it prevents a visible glitch. (If you add a Content-Security-Policy later, inline scripts need a hash or nonce, covered in lesson 17.6.)

Also set `<meta name="theme-color">` so the mobile browser's toolbar matches. You can update it from `useTheme` too.

## Colour and accessibility

- **Contrast**: normal text needs at least **4.5:1** against its background, and large text (≥ 24px, or 19px bold) at least 3:1 (WCAG AA). Check your *muted* text in **both** themes, because it's the usual failure. DevTools shows the contrast ratio in the colour picker, and Lighthouse flags failures.
- **Don't rely on colour alone**: "low HP" should also show a number or an icon, and "locked" should also show a lock icon and text.
- **Dark mode isn't just inverted colours**: use slightly lighter surfaces for elevation (instead of shadows) and avoid pure black (`#000`) behind white text, which causes eye strain and "smearing" on OLED screens.
- **Focus rings** must be visible in both themes.

## A visual identity for your game

You don't need to be a designer to make something that looks good:
1. **Pick one accent colour** that suits your theme (forest green, ember orange…) plus neutrals. Restraint looks professional.
2. **Use the spacing scale consistently.** Inconsistent spacing is the biggest giveaway of an amateur UI.
3. **Pick one typeface** (the system stack is fine, or one Google Font for headings) and two or three sizes.
4. **Icons**: one consistent set. Use emoji for prototyping, then an SVG icon set like Lucide or game-icons.net (check its licence: CC BY 3.0, which requires attribution).
5. **Steal like an artist**: study the *layouts* of idle games you enjoy (how they show progress, how dense the screens are). Don't copy their art or branding.

## Do it (in `vite-sandbox`)
- [ ] Set up semantic tokens and light/dark themes as above.
- [ ] Build `useTheme` with light/dark/system and a three-way switcher (a radio group is the accessible choice).
- [ ] Add the inline script and confirm there's no flash when you reload in dark mode (throttle the network to see it clearly).
- [ ] Check the contrast of your muted text in both themes with DevTools.

## Check your understanding

1. Why do semantic tokens mean you rarely need `dark:` utilities?
2. Why must the theme be applied before React loads?
3. What minimum contrast ratio does normal-sized body text need?
4. Why follow `matchMedia` changes when the preference is "system"?

<details><summary>Answers</summary>

1. Components reference tokens like `bg-surface`. The dark theme changes what the tokens *resolve to*, so every component updates without per-component dark styles.
2. The HTML and CSS paint before the JS bundle runs. If React applies the theme, the first paint uses the default theme, and the user sees a flash.
3. 4.5:1 (WCAG AA).
4. The OS can switch between light and dark while the app is open (automatic sunset switching, for example), and "system" should follow it live.
</details>

## Further reading
- Tailwind docs: [Theme variables](https://tailwindcss.com/docs/theme), and "Using CSS variables"
- web.dev: [prefers-color-scheme](https://web.dev/articles/prefers-color-scheme)
- WebAIM: [Contrast Checker](https://webaim.org/resources/contrastchecker/)

---
[← Tailwind CSS](02-tailwind-css.md) · [Module overview](README.md) · [Next: Accessible components & motion →](04-accessible-components-and-motion.md)
