# Module 21 · PWA, Performance & Accessibility

**Time:** ~10 hours · **Prerequisites:** Modules 04, 11, 13–14, 18 and 20

## Why this module matters
This is the difference between "a website with a game on it" and a game people keep on their home screen. Installability and offline loading suit an idle game perfectly. Performance decides whether it feels instant on a mid-range phone or sluggish. Accessibility decides whether everyone can play it, and it's also a legal requirement for many products and a frequent interview topic. These are the skills that make reviewers say "this person sweats the details".

## Learning objectives
By the end of this module you can:
- turn a Vite app into an installable, offline-capable PWA with an update prompt
- make a web app feel native on phones: safe areas, viewport units, touch targets and navigation
- measure Core Web Vitals in the lab and the field, and fix bundle, layout-shift and main-thread problems
- build accessible game UI: keyboard access, dialogs, progress bars, live regions, contrast and motion
- test accessibility with axe, a keyboard and a screen reader

## Lessons
| # | Lesson | Time |
|---|---|---|
| 21.1 | [Progressive Web Apps](01-progressive-web-apps.md) | 3h |
| 21.2 | [Mobile polish](02-mobile-polish.md) | 2h |
| 21.3 | [Web performance](03-web-performance.md) | 2.5h |
| 21.4 | [Accessibility in depth](04-accessibility-in-depth.md) | 2.5h |

## Exercises
There are no graded exercises in this module. You apply all of it in milestone C12 (and earlier, wherever it fits). The extra practice below is a dry run on your P2 project.

## Checkpoint quiz
1. Which two pieces turn a site into a PWA?
2. Why must the service worker never cache `/api/save`?
3. You deployed, but players still see the old version. Why, and what should the UI do?
4. Why is `100vh` a problem on phones, and what do you use instead?
5. What's the minimum touch-target size in WCAG 2.2, and what size should you aim for?
6. What are LCP, INP and CLS, with their "good" thresholds?
7. Name two ways an idle game's tick can hurt INP, and the fixes.
8. What does `<dialog>` with `showModal()` handle for you?
9. How should a screen-reader user hear about a level-up, without being flooded by every resource gained?

<details><summary>Answers</summary>

1. A web app manifest and a service worker (over HTTPS).
2. A cached response would show stale data and break the revision logic. Sync must always use the network, and local storage handles offline play.
3. The new service worker waits until old tabs close. Show an "update available" prompt that saves locally, activates the new worker and reloads.
4. It assumes the browser UI is hidden, so content is cut off. Use `100dvh` (or `svh`/`lvh` deliberately).
5. 24×24 CSS pixels. Aim for about 44 px or more.
6. LCP (main content appears) ≤ 2.5 s, INP (responsiveness) ≤ 200 ms, CLS (layout stability) ≤ 0.1, at the 75th percentile.
7. Any two of: re-rendering many components every tick (narrow selectors and transient updates); a big synchronous catch-up (closed-form batch maths); saving too often (save every few seconds); heavy simulation (move it to a worker).
8. Moving focus into the dialog, making the rest of the page inert (a focus trap), closing on Escape, and (in modern browsers) restoring focus when it closes.
9. Through a polite live region that's already in the page, announcing only milestones, throttled and combined, with a setting to choose what's announced.
</details>

## Extra practice
1. **PWA your P2.** Add `vite-plugin-pwa` to your Pocket Forge project (P2) with a manifest, icons and an update prompt. Install it on your phone, turn on airplane mode and open it.
2. **Lighthouse budget.** Run Lighthouse (mobile) on P2 and fix the top three issues. Record the before and after scores in its README.
3. **Keyboard hour.** Play your P2 for ten minutes with only a keyboard. Fix everything that gets in the way.
4. **axe in CI.** Add one `@axe-core/playwright` test to P2's e2e suite, and fix what it finds.

**Next:** [Part 6 · The capstone →](../../capstone/README.md)
