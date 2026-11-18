# 07.4 · Effects & synchronization

> ⏱ 3 hours · Module 07 · State & Effects

## What you'll learn
- What effects are *for*: synchronising with systems outside React
- `useEffect` setup, cleanup and dependency arrays
- The effect lifecycle: thinking in "start and stop synchronising", not "mount and unmount"
- Why StrictMode runs effects twice, and what that tells you
- Dependencies are not a choice: they come from your code
- Common effect patterns: subscriptions, timers, document title, storage, data fetching

---

## Two kinds of logic in a component

1. **Rendering code** turns props and state into JSX. It must be pure.
2. **Event handlers** respond to a specific user action (a click, a submit). They can have side effects.

But some side effects aren't caused by a particular event. They're caused by **rendering itself**: "while this component is on screen, it should be connected to X". Examples:
- subscribe to the `visibilitychange` event while the game is mounted
- keep `document.title` in sync with the player's gold
- keep a WebSocket connection to the chat room the player is viewing
- run an interval while an action is active

That's what **effects** are for: **synchronising your component with an external system** (anything outside React: browser APIs, timers, network, storage, third-party libraries).

## `useEffect`

```tsx
import { useEffect } from 'react';

useEffect(() => {
  // setup: start synchronising
  return () => {
    // cleanup: stop synchronising (optional)
  };
}, [/* dependencies */]);
```

Effects run **after** React commits the render to the screen, so they never block painting.

### Example: document title
```tsx
function GoldTitle({ gold }: { gold: number }) {
  useEffect(() => {
    document.title = `${gold.toLocaleString()} gold · Hearthwild`;
  }, [gold]);
  return null;
}
```

### Example: a subscription with cleanup
```tsx
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);           // setup
    return () => window.removeEventListener('resize', handleResize);  // cleanup
  }, []);

  return width;
}
```

Look familiar? It's the **"setup returns cleanup"** pattern from exercise 03-03. React calls your cleanup for you at the right times.

## The dependency array

| Form | Runs setup… |
|---|---|
| `useEffect(fn)` | after **every** render |
| `useEffect(fn, [])` | after the **first** render only |
| `useEffect(fn, [a, b])` | after the first render, and after any render where `a` or `b` changed (`Object.is`) |

When dependencies change, React runs the **cleanup from the previous effect first**, then the new setup. When the component unmounts, it runs the last cleanup.

```
mount        → setup(a=1)
a changes    → cleanup(a=1) → setup(a=2)
a changes    → cleanup(a=2) → setup(a=3)
unmount      → cleanup(a=3)
```

### Dependencies are not a choice
**Every reactive value the effect uses must be in the array.** Reactive values are props, state, and anything computed from them during render. You don't "choose" dependencies: you write the effect's code, and the code determines them. The `exhaustive-deps` lint rule (05.4) checks this for you.

```tsx
function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, []);            // ❌ lint: missing dependency 'roomId'
  // Bug: switching rooms keeps you connected to the FIRST room forever.
}
```

With `[roomId]`, switching rooms disconnects from the old one and connects to the new one, which is exactly right.

If you think "but I don't *want* it to re-run when X changes", **change the code** so it doesn't need X (07.5, 07.6), rather than lying about the dependencies. Lying causes stale-closure bugs.

### Values that don't need to be dependencies
- **State setters** (`setGold`) are stable, so you can include or omit them.
- **Refs** (`ref.current` is read at the time, and the ref object itself is stable).
- Anything defined **outside** the component (module constants, imported functions).

## Think in synchronisation, not lifecycles

Old React (class components) taught "do this on mount, that on unmount". With effects, think instead:

> **"How do I start synchronising with X? How do I stop?"**

Then React calls start and stop as often as needed: on mount, on dependency changes, on unmount. If your setup and cleanup are symmetrical, your effect is correct no matter how many times it runs.

## StrictMode's double run

In development, StrictMode **mounts, unmounts and immediately re-mounts** every component, so your effects run `setup → cleanup → setup`:

```
setup  (connect)
cleanup (disconnect)   ← StrictMode stress test
setup  (connect)
```

If that breaks your app (two connections, a doubled interval, a duplicated log entry), **your cleanup is missing or incomplete**. Fix the cleanup, don't remove StrictMode. Users will trigger the same sequence in production by navigating away and back.

## Fetching data in an effect

```tsx
function Leaderboard({ skill }: { skill: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let ignore = false;                       // guard against stale responses
    fetch(`/api/leaderboard?skill=${skill}`)
      .then((r) => r.json())
      .then((data: Row[]) => {
        if (!ignore) setRows(data);           // only apply if this effect is still current
      });
    return () => {
      ignore = true;                          // cleanup: ignore the result if skill changed
    };
  }, [skill]);
  …
}
```

Without the `ignore` flag, switching quickly from "fishing" to "mining" could show fishing's results if that request is slower. That's a **race condition**. Lesson 10.3 covers fetching in depth (with `AbortController`), and lesson 10.4 shows TanStack Query, which handles all of this for you. **In real apps, prefer a data-fetching library over raw effects.**

## Effects are an escape hatch

Effects step *outside* React's model, so use them **only for synchronising with external systems**. If no external system is involved, you probably don't need one. The next lesson is all about this, and it's where most beginners write unnecessary and buggy effects.

## `useLayoutEffect` (rarely)

`useLayoutEffect` runs *before* the browser paints. Use it only when you must measure the DOM and adjust before the user sees anything (to avoid a visual flicker), e.g. positioning a tooltip. It blocks painting, so prefer `useEffect`.

## ⚠️ Common mistakes

```tsx
// 1. Missing cleanup → leaks and double handlers
useEffect(() => { window.addEventListener('keydown', onKey); }, []);

// 2. Object/array/function dependencies that are recreated every render → runs every render
const options = { skill };                         // a new object every render
useEffect(() => { … }, [options]);                 // ❌ always "changed"
useEffect(() => { … }, [skill]);                   // ✅ depend on the primitive

// 3. setState in an effect that depends on that state → an infinite loop
useEffect(() => { setCount(count + 1); }, [count]);

// 4. async effect function (it returns a Promise, not a cleanup)
useEffect(async () => { … }, []);                  // ❌
useEffect(() => { async function load() { … } load(); }, []);   // ✅
```

## Check your understanding

1. What's an effect *for*, in one sentence?
2. In what order do setup and cleanup run when a dependency changes?
3. Your effect subscribes to `visibilitychange`. In development you see two handlers firing. What's wrong?
4. An effect uses `skillId` from props but has `[]` as dependencies. What bug can happen?
5. Why can't the effect callback itself be `async`?

<details><summary>Answers</summary>

1. To synchronise a component with a system outside React (browser APIs, timers, the network, storage, third-party code).
2. The previous effect's cleanup runs first, then the new setup.
3. The cleanup is missing, so StrictMode's setup → cleanup → setup leaves two listeners. Return a function that removes the listener.
4. A stale closure: the effect keeps using the first `skillId`, so changing the skill doesn't re-synchronise.
5. An async function returns a Promise, but React expects the effect to return either nothing or a cleanup function. Define an async function inside and call it.
</details>

## Further reading
- react.dev: [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
- react.dev: [Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects)
- react.dev: [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)

---
[← Refs](03-refs.md) · [Module overview](README.md) · [Next: You might not need an effect →](05-you-might-not-need-an-effect.md)
