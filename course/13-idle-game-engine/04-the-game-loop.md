# 13.4 · The game loop

> ⏱ 2.5 hours · Module 13 · The Idle Game Engine

## What you'll learn
- What a game loop does, and why idle games need an unusual one
- Variable vs fixed timestep, and the accumulator pattern
- The spiral of death, and capping catch-up
- Separating update (logic) from render (visuals)
- Scheduling: `setInterval`, `requestAnimationFrame`, background tabs and sleeping phones
- Making the loop testable with an injected clock

---

## The job of a game loop

```
while (game is running) {
  measure how much time passed
  update the simulation by that much
  draw the result
}
```

Action games run this 60+ times a second. An idle game is different:
- **The logic is slow and coarse**: actions take seconds, so updating 10 times a second (every 100 ms) is plenty.
- **The visuals can be smooth anyway**: progress bars animate with CSS (11.4) or rAF between logic updates.
- **The loop has to survive being paused**: background tabs throttle timers (01.4), phones freeze pages when you switch apps, and laptops sleep. When the loop wakes up, it must catch up correctly.

## Variable timestep: simple but fragile

```ts
let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt = now - last;
  last = now;
  state = tick(state, dt);       // advance by however long it actually was
}, 100);
```

It handles irregular timing, but it has problems:
- **Non-determinism**: a 100 ms tick and two 50 ms ticks can produce slightly different results (floating point, ordering), so behaviour depends on frame timing, which makes bugs hard to reproduce.
- **Huge steps**: after the laptop sleeps for an hour, `dt` is 3,600,000 ms. Logic written for small steps can break (and this is really an offline progress problem, 13.8).

## Fixed timestep with an accumulator

The standard solution (from Glenn Fiedler's famous article *"Fix Your Timestep!"*): bank the real elapsed time, then advance the simulation in **equal-sized steps**:

```ts
const STEP_MS = 100;
let accumulator = 0;
let last = now();

function frame() {
  const current = now();
  accumulator += current - last;
  last = current;

  while (accumulator >= STEP_MS) {
    state = tick(state, STEP_MS);    // ALWAYS exactly 100ms
    accumulator -= STEP_MS;
  }
  render(state, accumulator / STEP_MS);   // alpha: how far between steps we are (0..1)
}
```

```
real time:  |--130ms--|--70ms--|----250ms----|
accumulator: 130→30    100→0    250→50
steps:        1          1         2
```

Benefits:
- **Deterministic**: the same steps always give the same result, whatever the frame rate.
- **Testable**: `tick` is always called with the same `dt`.
- **Leftover time isn't lost**: it stays in the accumulator for the next frame.

## The spiral of death

What if a frame arrives after a **long** gap (a background tab running at one frame per minute)? The `while` loop would run 600 steps at once. And what if each step is slow? Then the frame takes longer, so the next frame has even more to catch up on, and so on, until the page freezes. That's the **spiral of death**.

The fix is to **cap steps per frame**:

```ts
const MAX_STEPS_PER_FRAME = 50;      // at most 5s of simulation per frame

let steps = 0;
while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
  state = tick(state, STEP_MS);
  accumulator -= STEP_MS;
  steps++;
}
if (steps === MAX_STEPS_PER_FRAME && accumulator >= STEP_MS) {
  const dropped = accumulator - (accumulator % STEP_MS);
  accumulator %= STEP_MS;            // drop the excess whole steps (keep the fraction)
  onLargeGap(dropped);               // hand it to offline progress instead (13.8)
}
```

That last line is the key idea for idle games: **the loop handles short gaps itself, and long gaps go to the offline progress calculator**, which computes the result in one go instead of simulating it step by step.

## Update vs render

- **Update** (logic): fixed steps, deterministic, pure (`tick`).
- **Render** (visuals): whenever the screen can show a frame.

In an action game, render interpolates positions between steps using `alpha`. In an idle game, the main use of `alpha` is smooth progress bars: `displayedProgress = progressMs + alpha * STEP_MS`. Often the CSS animation trick (11.4) is simpler. Lesson 14.3 compares the options.

## Scheduling: who calls `frame()`?

| Scheduler | Rate | In a background tab | Good for |
|---|---|---|---|
| `requestAnimationFrame` | the display rate (60–120 Hz) | **stops completely** | smooth visuals |
| `setInterval(frame, 100)` | ~10 Hz | throttled to about 1 Hz, then about 1 per minute | logic that should keep going |
| a Web Worker timer | ~10 Hz | throttled less aggressively in some browsers | heavier simulations (14.5) |
| none (the page is frozen) | 0 | mobile: the app is backgrounded | → offline progress on return |

A robust idle game setup:
1. **Logic**: `setInterval(frame, 100)` with a fixed-step accumulator, capped catch-up, and large gaps handed to offline progress.
2. **Visuals**: CSS animations or rAF, only while visible.
3. **On `visibilitychange` → visible**, and on load: run offline progress for the time since `lastUpdatedAt` (13.8).
4. **On `visibilitychange` → hidden**: save (13.10).

Because the logic uses **timestamps**, the result is the same however erratic the scheduling. A player who leaves the tab in the background for an hour gets exactly an hour of progress, partly from throttled ticks and partly from offline catch-up.

> `performance.now()` is monotonic and precise, so use it for measuring gaps **within a session**. `Date.now()` is wall-clock time, so use it for `lastUpdatedAt` **across sessions**. Wall-clock time can jump (when the user changes the clock, or on DST/NTP corrections), and lesson 18.4 deals with that.

## Make it testable

Inject the clock and expose `frame()`, so tests drive time manually with no real timers:

```ts
const loop = createGameLoop({
  stepMs: 100,
  maxStepsPerFrame: 50,
  now: () => fakeNow,                // the test controls time
  update: (dt) => (state = tick(state, dt)),
  onDroppedTime: (ms) => offline.push(ms),
});
loop.start();
fakeNow += 250; loop.frame();        // → exactly 2 updates, with 50ms left in the accumulator
```

The real app connects `frame` to `setInterval`. Tests call it directly. You'll build exactly this in exercise 13-03.

## Check your understanding

1. Why is a fixed timestep deterministic while a variable one isn't?
2. Real elapsed times are 130, 70 and 250 ms with a 100 ms step. How many updates happen in each frame, and what's left in the accumulator?
3. What's the spiral of death, and how does capping prevent it?
4. Why is `setInterval` used for logic instead of `requestAnimationFrame`?
5. Which clock should `lastUpdatedAt` use, and which should measure frame gaps?

<details><summary>Answers</summary>

1. With a fixed timestep, every update advances by the same `dt`, so the sequence of updates (and its results) depends only on total time, not on how the frames happened to be spread out.
2. 1 (30 left), then 1 (0 left), then 2 (50 left).
3. When catching up takes longer than real time, the backlog keeps growing and the page freezes. Capping steps per frame bounds the work. The excess is dropped from the loop and handed to offline progress, which calculates it efficiently.
4. rAF stops completely in background tabs, so logic would halt. Timers keep firing (throttled), and with timestamp-based catch-up the progress stays correct.
5. `Date.now()` (wall clock) for `lastUpdatedAt`, because it has to work across sessions and reloads. `performance.now()` (monotonic) for gaps within a session.
</details>

## Further reading
- Glenn Fiedler: *"Fix Your Timestep!"* (gafferongames.com), the classic article
- Game Programming Patterns: [Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
- Chrome developers blog: *"Heavy throttling of chained JS timers"* (background tab throttling details)

**Practice:** exercise `13-03` fixed-timestep-loop → `npm run watch 13-03`

---
[← Designing game state](03-designing-game-state.md) · [Module overview](README.md) · [Next: Actions & ticks →](05-actions-and-ticks.md)
