# 07.3 · Refs

> ⏱ 1.5 hours · Module 07 · State & Effects

## What you'll learn
- `useRef`: a box that persists between renders without causing them
- Refs vs state: when to use which
- Accessing DOM elements (focus, scroll, measure)
- Passing refs to your own components (React 19's `ref` as a prop)
- The rules: don't read or write refs during render

---

## A box React doesn't watch

```tsx
import { useRef } from 'react';

const ref = useRef(0);   // { current: 0 }
ref.current = 5;         // mutate freely. React doesn't re-render
```

`useRef` returns the **same object** on every render, and you can mutate its `current` property whenever you like. Changing it **doesn't trigger a re-render**.

Think of a ref as a **secret pocket** on the component: it persists like state, but React doesn't look inside it.

## Refs vs state

| | `useState` | `useRef` |
|---|---|---|
| Persists across renders | ✅ | ✅ |
| Changing it re-renders | ✅ | ❌ |
| Value during a render | a fixed snapshot | whatever was last written (it's mutable) |
| Use for | anything **shown on screen** | values used only in **event handlers or effects** |

The test is simple: **does the rendered output depend on this value?** If yes, it's state. If not, it can be a ref.

Good uses for refs:
- **timer ids** (`setInterval`'s return value), so you can clear them later
- the **latest value of a callback or state**, readable from a long-lived closure (07.6, this is the key to `useInterval`)
- **DOM elements**
- "has this happened yet?" flags that don't affect the UI
- previous values, for comparison

### Example: a stopwatch
```tsx
function Stopwatch() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleStart() {
    setStartTime(Date.now());
    setNow(Date.now());
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setNow(Date.now()), 100);
  }

  function handleStop() {
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  const seconds = startTime !== null && now !== null ? (now - startTime) / 1000 : 0;  // derived!

  return (
    <>
      <p>{seconds.toFixed(1)}s</p>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
    </>
  );
}
```

- `startTime` and `now` are **state**, because they're shown (via `seconds`).
- The interval id is a **ref**: it's needed by handlers, never shown, and changing it shouldn't re-render.

## DOM refs

Pass a ref object to a JSX element's `ref` prop, and React puts the DOM node into `ref.current` after mounting:

```tsx
function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input ref={inputRef} type="search" aria-label="Search bank" />
      <button type="button" onClick={() => inputRef.current?.focus()}>
        Search
      </button>
    </>
  );
}
```

Common DOM tasks that need refs:
- **focus management**: focusing an input, or moving focus into a modal (lesson 09.4)
- **scrolling**: `el.scrollIntoView()`, or keeping an activity log scrolled to the bottom
- **measuring**: `el.getBoundingClientRect()`
- integrating **non-React libraries** (charts, canvas drawing)
- **direct style updates for very fast animations**, which skip React rendering entirely. You'll use this for smooth progress bars in lesson 14.3.

`ref.current` is `null` during the first render (the DOM doesn't exist yet) and after unmount, so use `?.`.

### Passing refs to your own components
In React 19, `ref` is a normal prop for function components:

```tsx
import type { ComponentProps } from 'react';

function TextField(props: ComponentProps<'input'>) {   // includes `ref`
  return <input className="text-field" {...props} />;
}

const ref = useRef<HTMLInputElement>(null);
<TextField ref={ref} />
```

> In older codebases (React ≤ 18) you'll see `forwardRef(...)` wrapping components to do this. It still works, but it's no longer needed.

### Ref callbacks
Instead of an object, `ref` can be a function, which React calls with the node (and in React 19 it can return a cleanup function). It's useful for lists of refs or for measuring:

```tsx
<li ref={(node) => { if (node) map.set(item.id, node); return () => map.delete(item.id); }} />
```

## The rule: no refs during render

**Don't read or write `ref.current` during rendering** (except for one-time lazy initialisation):

```tsx
function Bad() {
  const renders = useRef(0);
  renders.current++;                     // ❌ writing during render
  return <p>Rendered {renders.current} times</p>;  // ❌ reading during render: it won't update reliably
}
```

React doesn't know about ref changes, so the rendered output would be unpredictable, and the React Compiler assumes you follow this rule. Read and write refs in **event handlers and effects**. If it's shown on screen, it's state.

## Check your understanding

1. You need to remember a `setInterval` id so a Stop button can clear it. State or ref? Why?
2. Why is `ref.current` null on the first render of `<input ref={inputRef} />`?
3. A component shows "You've clicked N times". State or ref for N?
4. What changed about passing refs to custom components in React 19?

<details><summary>Answers</summary>

1. A ref. It's only used in handlers, it's never displayed, and changing it shouldn't cause a re-render.
2. React assigns the DOM node during the *commit* phase, after the first render has run. During render the element doesn't exist yet.
3. State. It's displayed, so changes must trigger re-renders.
4. `ref` is now a regular prop for function components, so `forwardRef` isn't needed.
</details>

## Further reading
- react.dev: [Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)
- react.dev: [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)

---
[← Structuring & lifting state](02-structuring-and-lifting-state.md) · [Module overview](README.md) · [Next: Effects & synchronization →](04-effects-and-synchronization.md)
