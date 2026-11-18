# 07.6 · Timers & stale closures

> ⏱ 2.5 hours · Module 07 · State & Effects

## What you'll learn
- Why intervals in React so often "freeze" or "reset", explained step by step
- Fix 1: updater functions
- Fix 2: restarting the effect with correct dependencies (and why that's sometimes wrong)
- Fix 3: the **latest-ref pattern**, which is how `useInterval` works
- `useEffectEvent`: React's built-in answer to the problem
- Why timers should measure time with timestamps

---

You now have every piece you need (closures from 01.2, timers from 01.4, snapshots from 07.1, effects from 07.4) to understand the bug that has confused React developers more than any other.

## The bug

```tsx
function Ticker() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTicks(ticks + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);   // "run once"

  return <p>{ticks}</p>;
}
```

It shows 0, then 1, then… **stays at 1 forever.** Why?

1. **Render 1**: `ticks` is `0`. The effect runs once and creates an interval whose callback **closes over render 1's `ticks`**, which is `0`.
2. After one second the callback runs `setTicks(0 + 1)`. React re-renders.
3. **Render 2**: `ticks` is `1`. But the effect has `[]`, so it **doesn't run again**, and the interval still holds the callback from render 1.
4. Every second after that: `setTicks(0 + 1)` → `1`. React sees the same value and does nothing.

```
render 1: ticks=0 ──► interval callback captures ticks=0 ──┐
render 2: ticks=1                                           │  callback runs forever
render 3: ticks=1  ◄── setTicks(0 + 1) = 1 ─────────────────┘  with ticks = 0
```

This is a **stale closure**: the callback is stuck with values from the render that created it. The lint rule would have warned you: *"React Hook useEffect has a missing dependency: 'ticks'"*.

## Fix 1: updater functions (best when it fits)

If the callback only needs the previous state to compute the next state, use an updater. It doesn't read `ticks` from the closure at all:

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setTicks((t) => t + 1);   // React passes the LATEST value
  }, 1000);
  return () => clearInterval(id);
}, []);   // ✅ no reactive values used, so [] is honest
```

## Fix 2: add the dependency (correct, but with a cost)

```tsx
useEffect(() => {
  const id = setInterval(() => setTicks(ticks + 1), 1000);
  return () => clearInterval(id);
}, [ticks]);
```

This is *correct*: whenever `ticks` changes, the old interval is cleared and a new one created with a fresh closure. But the interval is **torn down and recreated every tick**. For a 1-second ticker that's harmless-ish. For a callback that depends on fast-changing values, constantly resetting the timer **resets its countdown**: if a value changes every 300 ms and the interval is 1000 ms, the interval *never fires at all*.

## Fix 3: the latest-ref pattern

What we really want is an interval that runs on a **stable schedule**, but whose callback always sees the **latest** props and state. A ref gives us exactly that (07.3):

```tsx
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // 1. After every render, store the latest callback in the ref.
  useEffect(() => {
    savedCallback.current = callback;
  });

  // 2. Set up the interval once per delay; it calls whatever is in the ref.
  useEffect(() => {
    if (delay === null) return;                 // null pauses the interval
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

Now:
- the **interval** only restarts when `delay` changes (or is paused with `null`)
- the **callback** is always the one from the latest render, so it sees fresh state and props

```tsx
function Woodcutter({ bonus }: { bonus: number }) {
  const [logs, setLogs] = useState(0);
  const [isChopping, setIsChopping] = useState(true);

  useInterval(() => {
    setLogs(logs + 1 + bonus);   // reads the CURRENT logs and bonus, with no stale closure
  }, isChopping ? 1000 : null);  // pass null to pause

  return (
    <>
      <p>{logs} logs</p>
      <button onClick={() => setIsChopping((c) => !c)}>{isChopping ? 'Stop' : 'Start'}</button>
    </>
  );
}
```

You'll implement `useInterval` yourself in exercise 07-03. The pattern was popularised by Dan Abramov's article *"Making setInterval Declarative with React Hooks"*, which is worth reading.

## `useEffectEvent`: the built-in version

The problem "an effect needs to read the latest value without re-running when it changes" is common enough that React added a hook for it, **`useEffectEvent`** (stable in React 19.2):

```tsx
import { useEffect, useEffectEvent } from 'react';

function useInterval(callback: () => void, delay: number | null) {
  const onTick = useEffectEvent(callback);   // always calls the latest callback

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => onTick(), delay);
    return () => clearInterval(id);
  }, [delay]);                               // onTick is deliberately NOT a dependency
}
```

An "effect event" is a function that **reads the latest props and state but isn't reactive**, so changes to them don't re-run the effect. Rules: only call it from inside effects, never during render, and don't pass it to other components. Under the hood it's the latest-ref pattern, made official and lint-aware.

**Learn the ref version first**, because it's what you'll find in most existing codebases and it's what `useEffectEvent` does internally. Then prefer `useEffectEvent` in new code.

## Don't trust tick counts

Remember lesson 01.4: browsers throttle background timers and drift accumulates. A `useInterval(tick, 1000)` that adds "1 second of progress" per call **loses time** when the tab is in the background, and the idle game player gets cheated.

Measure elapsed time instead:

```tsx
const lastTick = useRef(performance.now());

useInterval(() => {
  const now = performance.now();
  const deltaMs = now - lastTick.current;
  lastTick.current = now;
  advanceGame(deltaMs);        // advance by REAL elapsed time
}, 100);
```

This is the seed of your game loop. In Module 13 you'll build a proper fixed-timestep loop around it, and in Module 14 you'll move the loop **outside React** entirely, so React only renders the state, never drives it.

## Stale closures beyond timers

The same bug appears anywhere a long-lived callback is created during one render and called later:
- `addEventListener` in an effect with `[]` that reads state
- WebSocket `onmessage` handlers
- third-party library callbacks
- `setTimeout` inside an async function

The same three fixes apply: **updater functions**, **honest dependencies**, or **latest-ref / `useEffectEvent`**.

## Check your understanding

1. Explain in your own words why the first `Ticker` gets stuck at 1.
2. Why does `useInterval` store the callback in a ref instead of listing it as a dependency?
3. When is Fix 1 (an updater) not enough?
4. Your interval callback reads `bonus` (a prop) and calls `setLogs`. Which fixes work?
5. Why should a game tick use `performance.now()` deltas instead of assuming each call is exactly `delay` ms?

<details><summary>Answers</summary>

1. The interval's callback was created during the first render and closed over `ticks = 0`. The effect never re-ran (`[]`), so the callback keeps computing `0 + 1`.
2. The callback is a new function every render. As a dependency, it would tear down and restart the interval every render, resetting the timer. The ref lets the interval call the latest callback without restarting.
3. When the callback needs **other** reactive values (props, other state, context) besides the previous value of the state it's setting. An updater only gives you that one state's latest value.
4. The latest-ref pattern / `useEffectEvent` (reads the latest `bonus` without restarting). Adding `bonus` as a dependency also works but restarts the interval whenever `bonus` changes. An updater alone (`setLogs((l) => l + 1 + bonus)`) still reads a stale `bonus`.
5. Timers drift and are heavily throttled in background tabs, so calls don't arrive exactly `delay` ms apart. Using real elapsed time keeps progress accurate.
</details>

## Further reading
- Dan Abramov: *"Making setInterval Declarative with React Hooks"* (overreacted.io)
- react.dev: [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects) (useEffectEvent)
- react.dev: [`useEffectEvent` reference](https://react.dev/reference/react/useEffectEvent)

**Practice:** exercise `07-03` use-interval → `npm run watch 07-03`

---
[← You might not need an effect](05-you-might-not-need-an-effect.md) · [Module overview](README.md) · [Next: Custom hooks →](07-custom-hooks.md)
