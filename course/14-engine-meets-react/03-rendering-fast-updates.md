# 14.3 · Rendering fast updates

> ⏱ 2.5 hours · Module 14 · Connecting the Engine to React

## What you'll learn
- A render budget for a ticking game on a phone
- Strategy 1: narrow selectors and small "leaf" subscribers
- Strategy 2: **transient updates**, writing to the DOM via refs without re-rendering
- Strategy 3: CSS animations driven by start time and duration
- Throttling UI updates, and batching events into toasts
- Measuring all of it

---

## The budget

At 10 ticks a second while an action runs, every subscribed component re-runs its selector 10 times a second, forever. On a mid-range phone:
- **A selector run**: microseconds. Fine.
- **A re-render of a small leaf component**: around 0.1 ms. Fine.
- **A re-render of a big subtree** (bank grid, skill list): several ms, ten times a second. That's noticeable battery drain and occasional jank.

The goal is that **a tick re-renders as little as possible**: ideally only the things that actually changed on screen, and for a progress bar, ideally *nothing*.

## Strategy 1: narrow selectors, small leaves

Push subscriptions **down** to the smallest component that displays the value:

```tsx
// ❌ the panel subscribes to progress, so the whole panel re-renders 10×/s
function ActionPanel() {
  const progress = useGame(selectProgressMs);
  return (
    <section>
      <ActionArt />          {/* re-renders for nothing */}
      <ActionDescription />  {/* re-renders for nothing */}
      <ProgressBar value={progress} />
    </section>
  );
}

// ✅ only the bar subscribes
function ActionPanel() {
  return (
    <section>
      <ActionArt />
      <ActionDescription />
      <ActionProgressBar />  {/* the only thing that ticks */}
    </section>
  );
}
```

Combine this with:
- **selectors that return primitives or stable references** (14.2)
- **`memo`** for list items, so one item changing doesn't re-render all of them (09.5)

## Strategy 2: transient updates (no re-render at all)

For values that change **every tick or every frame** and only affect *visuals*, you can skip React rendering entirely: subscribe to the store **outside** of render and write to the DOM through a ref.

```tsx
function ActionProgressBar() {
  const fillRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (s: GameStoreState) => {
      const fraction = selectProgressFraction(s);
      fillRef.current?.style.setProperty('--progress', String(fraction));
      barRef.current?.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
    };
    apply(gameStore.getState());                  // initial paint
    return gameStore.subscribe(apply);            // returns the unsubscribe → cleanup
  }, []);

  return (
    <div ref={barRef} role="progressbar" aria-label="Action progress" aria-valuemin={0} aria-valuemax={100}>
      <div ref={fillRef} className="h-full origin-left bg-accent" style={{ transform: 'scaleX(var(--progress))' }} />
    </div>
  );
}
```

This is Zustand's documented **"transient updates"** pattern. The component renders **once**, and then the store pushes values straight to the DOM. It's an *effect* (07.4): synchronising an external system (the store) with another external system (the DOM node), with cleanup. Legitimate, and very fast.

Use it sparingly, only for hot paths like progress bars and ticking counters. Everything else should render normally, because it's easier to reason about.

> **Accessibility:** screen readers don't need ten updates a second. Updating `aria-valuenow` in whole percent (as above) is fine, or announce only completions via an `aria-live` region.

## Strategy 3: let CSS animate

A repeating action has a known **start time** and **duration**. A CSS animation can run the bar by itself:

```tsx
function CssProgressBar({ cycleStartedAt, durationMs, paused }: Props) {
  const elapsed = Date.now() - cycleStartedAt;              // where we are right now
  return (
    <div className="bar">
      <div
        key={cycleStartedAt}                                // a new cycle restarts the animation
        className="fill"
        style={{
          animation: `fill ${durationMs}ms linear forwards`,
          animationDelay: `-${elapsed}ms`,                   // a negative delay jumps into the middle!
          animationPlayState: paused ? 'paused' : 'running',
        }}
      />
    </div>
  );
}
```

- The browser animates on the **compositor** at the full refresh rate, with zero JavaScript per frame.
- React renders **once per cycle** (when `cycleStartedAt` changes), which is every few seconds.
- A **negative `animation-delay`** starts the animation partway through, which is perfect for resuming after a reload or a tab switch.

The catch is that the store needs to expose `cycleStartedAt` (derivable as `now − progressMs` at the moment a cycle starts), and the CSS clock and the engine clock can drift slightly apart. Resync whenever the cycle restarts and it's invisible.

## Comparison

| | React state per tick | Transient (ref + subscribe) | CSS animation |
|---|---|---|---|
| Re-renders | 10/s | 0 | ~1 per cycle |
| Smoothness | steps at 10 Hz (CSS `transition` can smooth it) | steps at the tick rate, or smooth with rAF | full refresh rate |
| Complexity | lowest | medium | medium |
| Accuracy | exact | exact | small drift, resynced each cycle |

For your capstone, use the **transient** bar (exercise 14-02) or the **CSS** one. Both are fine, so pick one and be able to explain why in an interview.

## Throttling and batching

- **Numbers that tick**: a gold counter updating 10 times a second is fine (a small leaf). But a "gold per hour" stat that's expensive to compute can update once a second: `useThrottledValue(value, 1000)`.
- **Events into toasts**: ten `itemsGained` events in a second should become one toast ("+10 Oak Logs"), not ten. Buffer events for ~500 ms and merge by item.
- **Offline catch-up** produces one huge batch of events. Summarise it into the "While you were away" modal instead of a flood of toasts.

## Measure

1. React DevTools Profiler → record 5 seconds of an action running → look at **commits per second** and **what rendered**. Aim for only the leaf components.
2. Turn on "Highlight updates when components render" and watch the screen: only the bar and the counters should flash.
3. The Performance panel with 4× CPU throttling: no long tasks during normal play.
4. A real phone: is it still smooth, and does the phone get warm?

## Check your understanding

1. Why move a subscription from a panel down into its progress bar component?
2. In the transient pattern, why does `useEffect` return `gameStore.subscribe(apply)`?
3. How does a negative `animation-delay` help resume a progress bar after a reload?
4. Ten `itemsGained` events arrive within half a second. What should the UI show?

<details><summary>Answers</summary>

1. Then only the bar re-renders on each tick. The panel and its other children stay untouched, which cuts the render work per tick dramatically.
2. `subscribe` returns an unsubscribe function, and returning it from the effect makes it the cleanup, so the listener is removed on unmount (no leaks, and no writes to dead DOM nodes).
3. It starts the animation already partway through, at the point that matches the elapsed progress, so the bar shows the correct position immediately instead of restarting from 0.
4. One merged toast (for example "+10 Oak Logs"), produced by buffering events briefly and grouping them by item.
</details>

## Further reading
- Zustand docs: "Transient updates" (the `subscribe` + ref pattern)
- MDN: [`animation-delay`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-delay) (negative values)
- web.dev: [Animations and performance](https://web.dev/articles/animations-guide)

**Practice:** exercise `14-02` smooth-progress-bar → `npm run watch 14-02`

---
[← Building the game store](02-building-the-game-store.md) · [Module overview](README.md) · [Next: Page lifecycle & multiple tabs →](04-page-lifecycle-and-multiple-tabs.md)
