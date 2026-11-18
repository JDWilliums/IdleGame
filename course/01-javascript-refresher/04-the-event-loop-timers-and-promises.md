# 01.4 · The event loop, timers & promises

> ⏱ 90 min · Module 01 · JavaScript You'll Use Every Day

## What you'll learn
- How single-threaded JavaScript handles many things "at once"
- The call stack, the task queue and the microtask queue, and the order they run in
- Why timers are **unreliable clocks** (very important for an idle game)
- `requestAnimationFrame`, and why it stops in background tabs
- Promises: what they are, how to create them, and combinators like `Promise.all`

---

## One thread, one thing at a time

JavaScript in the browser runs on **one main thread**. It can only execute one piece of code at a time. While your code runs, the browser can't run other JavaScript, respond to clicks or (mostly) repaint the screen.

So how does `setTimeout`, `fetch` or a click handler work? Through the **event loop**.

```
            ┌──────────────────────┐
            │      Call stack      │  ← code currently running
            └──────────▲───────────┘
                       │ when the stack is EMPTY, the loop:
                       │  1. runs ALL microtasks
                       │  2. (maybe) renders a frame
                       │  3. runs ONE task, then repeats
 ┌─────────────────────┴───┐   ┌───────────────────────────┐
 │  Microtask queue        │   │  Task queue (macrotasks)  │
 │  promise callbacks,     │   │  setTimeout, setInterval, │
 │  queueMicrotask, await  │   │  events (click), I/O      │
 └─────────────────────────┘   └───────────────────────────┘
        ▲                              ▲
        └──── the browser's Web APIs (timers, network, DOM events)
              do the waiting OUTSIDE your JavaScript, then queue callbacks
```

The rules:
1. Run the current synchronous code until the call stack is empty.
2. Run **every** queued microtask (including ones added by other microtasks).
3. The browser may render (style, layout, paint), and `requestAnimationFrame` callbacks run just before it does.
4. Take **one** task from the task queue and run it. Go back to step 2.

### Predict the output

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
queueMicrotask(() => console.log('D'));
console.log('E');
```

<details><summary>Answer</summary>

`A, E, C, D, B`. `A` and `E` are synchronous. `C` and `D` are microtasks, which run as soon as the stack empties. `B` is a task, and even with `0` ms it has to wait for the next turn of the loop.
</details>

## Blocking the thread

Because there's one thread, a long synchronous computation **freezes everything**:

```js
button.onclick = () => {
  const end = Date.now() + 3000;
  while (Date.now() < end) {}   // 3 seconds of busy waiting
  // the page is completely frozen: no clicks, no scrolling, no animations
};
```

> 🧠 Your game's offline progress calculation (lesson 13.8) could easily simulate 8 hours of ticks when a player returns. If you do that naively in a loop on the main thread, the page freezes on load. You'll learn to calculate it cleverly instead, or move it into a Web Worker (lesson 14.5).

## Timers are not clocks

```js
setTimeout(fn, 1000);   // "run fn after AT LEAST 1000ms, when the thread is free"
setInterval(fn, 1000);  // "try to run fn roughly every 1000ms"
```

The delay is a **minimum, not a guarantee**:
- If the thread is busy, the callback waits.
- Browsers **throttle timers in background tabs**. Chrome limits them to about once per second, and after the tab has been hidden for several minutes, to about **once per minute**. Mobile browsers often **freeze the page completely** when you switch apps.
- Deeply nested timers are clamped to at least 4 ms.
- `setInterval` **drifts**: small delays accumulate.

So here's the most important rule for idle game programming:

> **Never count ticks to measure time. Always measure time with timestamps.**

```js
// ❌ Breaks when the tab is in the background: 60 ticks ≠ 60 seconds
let secondsPlayed = 0;
setInterval(() => { secondsPlayed += 1; }, 1000);

// ✅ Works no matter how irregular the ticks are
let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const deltaMs = now - last;    // however long it ACTUALLY was
  last = now;
  update(deltaMs);               // advance the game by real elapsed time
}, 1000);
```

`performance.now()` gives a high-precision, **monotonic** timestamp (it never jumps backwards when the system clock changes), which is ideal for measuring durations within a session. `Date.now()` gives wall-clock time (milliseconds since 1970). You need that to measure time **across sessions**, for example "the player was away for 6 hours". You'll build both in Module 13.

Clean up timers when you're done with them:

```js
const id = setInterval(tick, 100);
clearInterval(id);   // forgetting this is a classic memory leak and double-speed bug
```

## `requestAnimationFrame`

`requestAnimationFrame(cb)` asks the browser to call `cb` right before the next repaint, usually 60 times a second (or 120 on fast displays). It's the right tool for smooth **visual** updates like animations and progress bars.

```js
function frame(timestamp) {
  draw(timestamp);
  requestAnimationFrame(frame);   // schedule the next frame
}
requestAnimationFrame(frame);
```

But rAF **stops entirely when the tab is hidden**. That's good for battery, but it means rAF alone can't drive game logic in an idle game. Lesson 13.4 shows how to combine the two: game logic on a timer driven by timestamps, and visuals on rAF.

## Promises

A **Promise** represents a value that will be available later. It's always in one of three states:

```
pending ──► fulfilled (has a value)
        └─► rejected  (has a reason, usually an Error)
```

Once settled, it never changes state again.

### Consuming promises

```js
fetch('/api/save')
  .then((response) => response.json())   // each .then returns a NEW promise
  .then((save) => console.log(save))
  .catch((error) => console.error(error)) // catches a rejection from any step above
  .finally(() => hideSpinner());          // runs either way
```

### Creating promises
Usually you consume promises that APIs give you, but wrapping a callback API is a common task:

```js
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);   // resolve when the timer fires
  });
}
sleep(500).then(() => console.log('half a second later'));
```

`resolve(value)` fulfils the promise, and `reject(error)` rejects it. Only the first call counts.

### Combinators

| Combinator | Resolves when… | Rejects when… |
|---|---|---|
| `Promise.all([...])` | **all** fulfil (array of values, **in input order**) | **any** rejects (fails fast) |
| `Promise.allSettled([...])` | all settle (array of `{status, value/reason}`) | never |
| `Promise.race([...])` | the **first** settles (fulfil or reject) | the first settles with a rejection |
| `Promise.any([...])` | the **first fulfils** | all reject |

```js
// Load three things in parallel; total time ≈ the slowest one, not the sum
const [profile, save, leaderboard] = await Promise.all([
  getProfile(), getSave(), getLeaderboard(),
]);
```

`Promise.race` is how you build timeouts, and you'll do exactly that in exercise 01-04.

## ⚠️ Common mistakes

```js
// 1. Forgetting to return inside .then: the next .then gets undefined
fetch(url).then((r) => { r.json(); }).then((data) => data /* undefined! */);

// 2. A promise with no .catch: an "Unhandled promise rejection" error in the console
// 3. Assuming setTimeout(fn, 0) runs "immediately". It runs after all sync code AND microtasks
// 4. Using setInterval tick counts as a clock (see above)
// 5. Forgetting clearInterval: two intervals running = double-speed game
```

## Check your understanding

1. What's the difference between the task queue and the microtask queue? Which empties first?
2. A player leaves your game in a background tab for 10 minutes. Your `setInterval(tick, 100)` was adding 0.1 s of progress per tick. Roughly how much progress do they get, and how should you fix it?
3. When should you use `requestAnimationFrame` instead of `setInterval`?
4. `Promise.all([a, b, c])`: if `b` rejects after 1 s and `c` takes 5 s, when does the `Promise.all` reject?

<details><summary>Answers</summary>

1. Tasks are things like timers and events, and one runs per loop turn. Microtasks are promise callbacks and `queueMicrotask`, and **all** of them run as soon as the call stack empties, before the next task. Microtasks go first.
2. Far less than 10 minutes, perhaps a few seconds' worth, because the timer is throttled to once per second or even once per minute. Fix: compute the elapsed time from timestamps on each tick (and on return), and advance the game by the real elapsed time.
3. For visual updates that should be smooth and in sync with the screen's refresh (animations, progress bars). Not for game logic that must keep running in the background.
4. After about 1 s, as soon as `b` rejects. `Promise.all` fails fast. (`c` keeps running, but its result is ignored.)
</details>

## Further reading
- MDN: [The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop)
- MDN: [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- MDN: [`setTimeout`: reasons for delays longer than specified](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#reasons_for_delays_longer_than_specified)
- Video: Jake Archibald, *"In The Loop"* (JSConf). A brilliant visual explanation of tasks, microtasks and rendering. Search for it on YouTube.

---
[← Array & object power tools](03-arrays-and-objects-power-tools.md) · [Module overview](README.md) · [Next: async/await & error handling →](05-async-await-and-errors.md)
