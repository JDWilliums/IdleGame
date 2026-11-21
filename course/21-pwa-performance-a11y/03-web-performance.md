# 21.3 · Web performance

> ⏱ 2.5 hours · Module 21 · PWA, Performance & Accessibility

## What you'll learn
- Core Web Vitals: LCP, INP and CLS, and their targets
- Lab data vs field data, and how to measure each
- Bundle size: measuring it, code splitting and lazy routes
- Fonts and images without layout shift
- Keeping the main thread free for the game loop
- Battery and a game that runs all day

---

## What "fast" means

Google's **Core Web Vitals** measure what users feel:

| Metric | Measures | Good |
|---|---|---|
| **LCP**, Largest Contentful Paint | how quickly the main content appears | ≤ 2.5 s |
| **INP**, Interaction to Next Paint | how quickly the page responds to taps and clicks, across the whole visit | ≤ 200 ms |
| **CLS**, Cumulative Layout Shift | how much things jump around while loading | ≤ 0.1 |

The thresholds apply to the **75th percentile** of real visits: three out of four players should get at least that. For an idle game, **INP** matters most. A player taps "Sell all" and something must visibly happen quickly, even while the game is ticking.

## Lab vs field

- **Lab data**: one controlled test, such as Lighthouse in DevTools or a Performance recording. It's repeatable and great for finding problems. Test with **mobile** settings and CPU throttling, because your laptop is much faster than an average phone.
- **Field data**: measurements from real players' devices. That's the truth, but noisy. The `web-vitals` library reports them:

```ts
import { onCLS, onINP, onLCP } from 'web-vitals';

const report = (metric: { name: string; value: number; rating: string }) =>
  navigator.sendBeacon('/api/vitals', JSON.stringify({ name: metric.name, value: metric.value, rating: metric.rating }));

onLCP(report);
onINP(report);
onCLS(report);
```

Log them on the server (20.5) and look at the 75th percentile. Lab results tell you **why**, field results tell you **whether it matters**.

## Bundle size

Every kilobyte of JavaScript must be downloaded, parsed and executed before the game starts, and phones are slow at the last two. Measure before optimising:

- `vite build` prints each output chunk with its gzip size.
- A bundle visualiser plugin (such as `rollup-plugin-visualizer`) shows what's inside each chunk as a treemap. Look for big surprises: a date library, a whole icon set, a dependency pulled in through `shared` that only the server needs (19.2).

A reasonable target for the initial load of a game like this is a couple of hundred KB of JavaScript, gzipped.

### Code splitting
Routes that aren't needed for the first screen can load later:

```tsx
import { lazy, Suspense } from 'react';

const CombatPage = lazy(() => import('@/features/combat/CombatPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

<Route
  path="/combat"
  element={
    <Suspense fallback={<PageSpinner />}>
      <CombatPage />
    </Suspense>
  }
/>
```

`lazy` needs a module with a **default export**, or a small wrapper (`lazy(() => import('…').then((m) => ({ default: m.CombatPage })))`). The PWA service worker (21.1) precaches every chunk, so lazy routes still work offline.

Don't split everything. Each chunk is another request, and splitting the code the first screen needs only makes the first screen slower.

## Fonts and images

- **Fonts**: self-host them (no third-party request), use `woff2`, load only the weights you use, and use `font-display: swap` so text shows immediately in a fallback font. Preload the one font the first screen needs:
  ```html
  <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />
  ```
- **Images and icons**: SVG for icons; WebP/AVIF for pictures. Always give images `width` and `height` (or a CSS `aspect-ratio`) so the browser reserves the space. Missing dimensions are the most common cause of CLS.
- **Reserve space for late content**: a sync banner that pushes the whole game down 40 px when it appears is a layout shift. Overlay it, or reserve its space.

## The main thread and the game loop

JavaScript in the page runs on **one main thread**, which also handles input and rendering. Any task longer than **50 ms** is a **long task**: taps during it wait, which is bad INP.

Hearthwild's risks, and the fixes you already know:

| Risk | Fix |
|---|---|
| Re-rendering many components on every tick | narrow selectors, transient updates (14.3) |
| A huge offline catch-up computed in one go | closed-form batch maths (13.8): O(1), not one step per tick |
| Saving: `JSON.stringify` of a large state, synchronously | save every few seconds, not every tick (13.10); measure it |
| A long list (the bank with 300 items) | virtualise only if measured slow; `content-visibility: auto` is often enough |
| Heavy simulation | move it to a Web Worker (14.5) |

Use **DevTools → Performance**, recording while you play on a throttled CPU. Long tasks show as red-cornered blocks. Click one to see which functions took the time.

### The React Compiler
React's compiler (version 1.0, released in 2025) automatically memoises components and hooks at build time, removing most of the need for hand-written `memo`, `useMemo` and `useCallback` (09.5). It's worth trying once your app works. Follow the React docs' installation guide for Vite, and measure before and after. It doesn't replace good state design: a selector that returns a new object on every tick still causes work.

## Battery

An idle game might be left open for hours. Be a good citizen:

- **Pause rendering when hidden** (14.4). Nobody needs 60 frames per second in a background tab, and offline progress (13.8) catches up on return.
- Use `requestAnimationFrame` for visual updates (it pauses automatically in background tabs), not a fast `setInterval`.
- Don't animate what isn't changing. A pulsing glow on every button keeps the GPU busy forever.
- Sync on an interval while dirty (18.2), not constantly.

## Check your understanding

1. What do LCP, INP and CLS measure, and what are the "good" thresholds?
2. What's the difference between lab and field data? Why do you need both?
3. How do you find out what's making your bundle big?
4. Why would you lazy-load the combat page but not the skills page?
5. What causes most layout shift, and how do you prevent it?
6. What's a long task, and why does it hurt INP?
7. Name two ways the game should save battery when hidden.

<details><summary>Answers</summary>

1. LCP: when the main content appears (≤ 2.5 s). INP: responsiveness to interactions (≤ 200 ms). CLS: visual stability (≤ 0.1). All are measured at the 75th percentile.
2. Lab data is a controlled, repeatable test that's good for diagnosing. Field data comes from real users' devices and shows what players actually experience. Use the lab to find causes, and the field to decide what matters.
3. Read `vite build`'s chunk sizes, then use a bundle visualiser to see which modules make up each chunk.
4. Combat isn't needed for the first screen, so it can load later. The skills page is the first screen, so splitting it would only add a request.
5. Content arriving without reserved space: images without dimensions, late banners, web fonts swapping. Set dimensions or `aspect-ratio`, overlay or reserve space for late UI, and choose font fallbacks that match.
6. Main-thread work longer than 50 ms. Input events wait until it finishes, so taps feel slow.
7. Any two of: pause rendering and the simulation, and rely on offline catch-up; use `requestAnimationFrame` (which pauses in the background); stop unnecessary animations; sync on an interval rather than constantly.
</details>

## Further reading
- web.dev: "Web Vitals", "Optimize INP", "Optimize CLS"
- Chrome docs: "Analyze runtime performance" (the Performance panel)
- React docs: "React Compiler"

---
[← Mobile polish](02-mobile-polish.md) · [Module overview](README.md) · [Next: Accessibility in depth →](04-accessibility-in-depth.md)
