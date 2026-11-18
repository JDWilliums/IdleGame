# 11.4 · Accessible components & motion

> ⏱ 2.5 hours · Module 11 · Styling React Apps

## What you'll learn
- Why you shouldn't hand-build every complex widget, and what to use instead
- Headless libraries (Radix, React Aria, Base UI) and the shadcn/ui model
- Motion with purpose: durations, easing, and what to animate
- CSS transitions and keyframes, the View Transitions API, and the `motion` library
- Reduced motion
- "Game feel": feedback that makes an idle game satisfying

---

## Don't hand-build everything

In 09.3 and 09.4 you built tabs and a modal by hand, and found out how much is involved: roles, keyboard handling, focus traps, focus restoration. Menus, comboboxes, date pickers, tooltips, popovers and sliders are each **harder** still: positioning near screen edges, touch versus mouse behaviour, screen reader quirks.

Professional teams use **headless component libraries**: tested behaviour and accessibility, with styling left to you.

| Library | Notes |
|---|---|
| **Radix UI Primitives** | very popular, and the base of shadcn/ui. `<Dialog.Root>`, `<DropdownMenu.Trigger>`… |
| **React Aria** (Adobe) | the most rigorous accessibility and internationalisation work. Both hooks (`useButton`) and components |
| **Base UI** | from the makers of Radix and MUI. A modern successor in the same style |
| **Headless UI** | from the Tailwind team, smaller in scope |

```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger className="btn">Open shop</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
    <Dialog.Content className="fixed inset-x-4 top-1/4 rounded-xl bg-surface p-6">
      <Dialog.Title>Village shop</Dialog.Title>
      <Dialog.Description>Spend your hard-earned gold.</Dialog.Description>
      …
      <Dialog.Close className="btn">Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Everything you built in exercise 09-03 (portal, focus trap, Escape, restoring focus, ARIA) comes built in. Now you know what it's doing for you.

### shadcn/ui
**shadcn/ui** isn't a dependency. It's a CLI that **copies** well-designed component source code (Radix + Tailwind + `cn()`) **into your project**. You own the code and can change anything. It's extremely popular and appears in a lot of job codebases. Try it: `npx shadcn@latest init` in a Vite project, then `npx shadcn@latest add button dialog`.

> For the capstone, you can use Radix, React Aria or shadcn/ui for complex widgets, or build simple ones yourself. Either way, test them with the keyboard and a screen reader (21.4).

## Motion with purpose

Motion in UI should **communicate**, not decorate:
- **Feedback**: "your tap registered" (a button press scale, a ripple)
- **Continuity**: "this panel came from that button" (a sheet sliding up from the bottom)
- **Attention**: "something changed" (a level-up badge pulsing once)
- **State**: "this is in progress" (a progress bar filling)

Guidelines:
- **Duration**: 100–200 ms for small feedback, 200–400 ms for panels and transitions. Anything longer feels sluggish.
- **Easing**: `ease-out` for things entering (fast start, gentle stop), `ease-in` for things leaving, and `linear` *only* for continuous progress (a progress bar fill must be linear, or it looks wrong).
- **Animate `transform` and `opacity`** (03.1): they're compositor-friendly. Avoid animating `width`, `height`, `top` or `left`.

## CSS transitions and keyframes

```css
.button { transition: transform 120ms ease-out, background-color 150ms ease; }
.button:active { transform: scale(0.96); }

@keyframes float-up {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-2rem); }
}
.loot-popup { animation: float-up 800ms ease-out forwards; }
```

In Tailwind: `transition active:scale-95 duration-150 ease-out`, and custom keyframes go in `@theme`:

```css
@theme {
  --animate-float-up: float-up 800ms ease-out forwards;
  @keyframes float-up {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-2rem); }
  }
}
```

→ `className="animate-float-up"`.

### Progress bars: let CSS do the work
For a 3-second action, you *could* update React state 60 times a second to move the bar. That costs a lot for something CSS can do on its own:

```tsx
// Restart a CSS animation for each new action cycle by changing the key
<div key={cycleStartedAt} className="h-full origin-left bg-accent" style={{ animation: `fill ${durationMs}ms linear forwards` }} />
```

```css
@keyframes fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
```

The browser animates smoothly at the screen's refresh rate while React stays idle. Lesson 14.3 compares this approach with a `requestAnimationFrame` loop.

## Exit animations and layout animations

CSS can't easily animate an element **leaving** the DOM, because React removes it immediately. Options:
- **The `motion` library** (formerly Framer Motion), the most popular React animation library:
  ```tsx
  import { AnimatePresence, motion } from 'motion/react';

  <AnimatePresence>
    {toast && (
      <motion.div
        key={toast.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {toast.message}
      </motion.div>
    )}
  </AnimatePresence>
  ```
  It also handles **layout animations** (`<motion.li layout>` smoothly animates list reorders) and gestures.
- **The View Transitions API**: the browser snapshots the old and new UI and cross-fades or morphs between them (`document.startViewTransition(() => …)`). React has been adding first-class support for it, so check the React docs for the current status.

## Reduced motion

Some people get dizzy or nauseous from motion (vestibular disorders). Operating systems have a "reduce motion" setting, and you must respect it:

```css
@media (prefers-reduced-motion: reduce) {
  .loot-popup { animation: none; }
}
```

```tsx
<div className="motion-safe:animate-float-up" />        // only animate when motion is OK
```

```ts
import { useReducedMotion } from 'motion/react';
const reduce = useReducedMotion();
```

"Reduced" doesn't mean "none". Fades are usually fine. Avoid large movement, parallax, zooming and spinning. Keep **essential** motion (a progress bar showing progress), but avoid bouncing or shaking it. Add a "Reduce motion" toggle to your game's settings too (you did in 08-02).

## Game feel ("juice")

Idle games live or die by how satisfying the feedback loop feels. Cheap, effective touches:
- **Numbers that tick up** smoothly instead of jumping (with `tabular-nums` so they don't wobble!)
- **"+1 Oak Log" popups** floating up from the action
- **A tiny pulse** on the bank tab when an item is added
- **Level-up moments**: a toast, a brief glow, a sound (with a mute setting)
- **Haptics** on Android: `navigator.vibrate?.(10)` on important taps. (iOS Safari doesn't support it, so always feature-detect.)
- **Pressed states** on every button (`active:scale-95`), because mobile users need to *feel* the tap

Keep juice **subtle and optional**, and test it on a real phone (05.3), since animations that are smooth on a laptop can stutter on a mid-range Android.

## Do it (in `vite-sandbox`)
- [ ] Install Radix Dialog (or use shadcn/ui) and rebuild your 09-03 modal with it. Compare the code.
- [ ] Make a CSS-driven progress bar for a repeating 3-second action, restarted with `key`.
- [ ] Make a "+1" floating popup with `@keyframes`, plus a reduced-motion fallback.
- [ ] Use `motion`'s `AnimatePresence` for a toast that animates out.
- [ ] Emulate `prefers-reduced-motion` in DevTools (Rendering tab) and check everything still works.

## Check your understanding

1. What does a headless library give you that your hand-built modal from 09-03 might lack?
2. Which easing should a progress bar use, and why?
3. Why use a CSS animation for an action's progress bar instead of updating state every frame?
4. What's the difference between "reduced motion" and "no motion"?

<details><summary>Answers</summary>

1. Battle-tested edge cases: screen reader quirks across browsers, scroll locking, nested dialogs, touch handling, portals and stacking, and focus behaviour in unusual situations, all maintained and tested by others.
2. `linear`. Progress represents time passing at a constant rate, and easing would make the bar's speed misrepresent the actual progress.
3. The browser animates it on the compositor at full frame rate without running JavaScript or re-rendering React, which is smoother and much cheaper on battery and CPU.
4. Reduced motion removes or minimises non-essential and large movement (parallax, zooms, bounces) but keeps gentle feedback like fades and essential progress indicators.
</details>

## Further reading
- Radix Primitives: https://www.radix-ui.com/primitives · React Aria: https://react-spectrum.adobe.com/react-aria/ · shadcn/ui: https://ui.shadcn.com
- Motion: https://motion.dev (React docs)
- web.dev: [prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)
- Talk: *"Juice it or lose it"* (Martin Jonasson and Petri Purho). A classic on game feel.

---
[← Design tokens & theming](03-design-tokens-and-theming.md) · [Module overview](README.md) · [Next module: Testing →](../12-testing/README.md)
