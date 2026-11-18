# 06.6 · How React renders

> ⏱ 2 hours · Module 06 · React Fundamentals

## What you'll learn
- The three phases: trigger → render → commit
- What actually happens in a render, and why it isn't a DOM update
- When components re-render, and the cascade to children
- Reconciliation: how React matches old and new trees
- When state is preserved and when it's reset, and using `key` to reset deliberately
- A preview of React's performance tools

---

You've been told "state changes cause re-renders". Now let's be precise, because this mental model is what separates people who use React from people who *understand* it. It's also exactly what interviewers probe.

## Trigger → render → commit

Think of React as a kitchen:

1. **Trigger**: an order comes in.
   - The **initial render** (`createRoot(...).render(<App />)`).
   - A component's **state is updated** (`setGold(...)`).
2. **Render**: React **calls your component functions** to find out what the UI should look like now.
   - On the first render, it calls the root component.
   - On re-renders, it calls the component whose state changed, **and then all of its children, recursively**.
3. **Commit**: React compares the result with the previous render and **applies the minimal set of changes to the real DOM**.

Then the browser paints.

> 🧠 **"Rendering" means calling your function. It isn't the same as updating the DOM.** A component can render a hundred times without React touching the DOM, if the output doesn't change. Rendering is usually cheap. DOM changes and layout are the expensive part.

## Re-render cascades

When a component re-renders, **all of its descendants re-render too**, by default, whether or not their props changed:

```tsx
function App() {
  const [gold, setGold] = useState(0);
  return (
    <>
      <Header gold={gold} />        {/* re-renders: it receives gold */}
      <SkillGrid />                 {/* ALSO re-renders, even with no props! */}
      <button onClick={() => setGold(gold + 1)}>+1</button>
    </>
  );
}
```

Why? React can't know `SkillGrid` doesn't depend on something that changed, and it's usually fast enough not to matter. When it *does* matter (an idle game updating ten times a second!), you have tools:
- **move state down** so fewer components are below it (lesson 07.2)
- **pass children** instead of rendering them inside the stateful component (09.5)
- **`memo`** to skip re-rendering when props are unchanged (09.5)
- the **React Compiler**, which memoises automatically (09.5)
- **subscribe to just the slice you need** from a store (08.5, 14.3)

Don't optimise prematurely, but *do* keep this cascade in mind when you design where state lives.

## Reconciliation: comparing trees

After a render, React has a new tree of elements. It compares it with the previous tree to decide what to change. The rules are simple:

1. **Different element type at the same position** → tear down the old subtree completely (DOM *and state*) and build the new one.
   ```tsx
   {isLoading ? <Spinner /> : <BankGrid />}   // switching destroys one and creates the other
   ```
2. **Same type at the same position** → keep the DOM node and component instance (**state is preserved**), and update only the props or attributes that changed.
3. **Lists** → match children by **key** (lesson 06.4).

## State lives in the tree

This is the subtle part: **state isn't stored "in" your component function. React stores it at that component's *position* in the tree.**

```tsx
function Game() {
  const [showFishing, setShowFishing] = useState(true);
  return (
    <div>
      {showFishing ? <SkillPanel skill="fishing" /> : <SkillPanel skill="mining" />}
    </div>
  );
}
```

Toggle `showFishing`: `SkillPanel` is the **same type at the same position**, so React **keeps its state**. If `SkillPanel` had an expanded/collapsed toggle, it would *stay* expanded when you switch from fishing to mining. Often that's not what you want.

### Resetting state with `key`
Give it a key that changes with the identity of what it shows:

```tsx
<SkillPanel key={skill} skill={skill} />
```

A different key means a **different component** to React: the old instance is unmounted (its state destroyed) and a fresh one is mounted. This is the idiomatic way to reset a component's state. Common uses: switching between different players' profiles, items or skills; resetting a form after submission.

### Don't define components inside components
Now you can see why (lesson 06.2):

```tsx
function Bank() {
  function Row() { return <li>…</li>; }   // ❌ a NEW function (a new type) every render
  return <ul><Row /></ul>;                 // so React remounts Row every time and loses its state
}
```

## Batching

React **batches** state updates: several `setX` calls in the same event handler cause **one** re-render, not several:

```tsx
function handleSellAll() {
  setBank({});
  setGold(gold + total);
  setLog([...log, 'Sold everything']);
  // → ONE re-render with all three changes
}
```

This applies to updates in timeouts, promises and native events too (React 18+ "automatic batching").

## StrictMode, revisited

In development, StrictMode renders each component **twice** and discards the first result. If your component is pure, you'll never notice. If it mutates something during render, you'll see the effect doubled, and that's StrictMode doing its job.

## Seeing renders

- **React DevTools → Profiler** records renders and shows *why* each component rendered.
- **React DevTools settings → "Highlight updates when components render"** flashes components as they render.
- A quick hack: `console.count('SkillGrid render')` in the component body.

Try it in `vite-sandbox`: put two counters side by side, one in a parent and one in a child, and watch what re-renders when each changes.

## The React Compiler (a preview)

The **React Compiler** is an official build-time tool (stable since late 2025) that analyses your components and automatically memoises them, so a parent re-rendering doesn't needlessly re-render children whose inputs didn't change. It only works correctly if your components **follow the rules**: pure renders, no mutation, hooks at the top level. That's one more reason those rules matter. You'll set it up in lesson 09.5.

## Check your understanding

1. What are the three phases of a React update?
2. A component re-renders but its output is identical. What happens to the DOM?
3. `App` has state and renders `<Header />` (no props). When App's state changes, does Header re-render?
4. `{tab === 'bank' ? <List items={bank} /> : <List items={shop} />}`. Is `List`'s internal state (e.g. a scroll position or search text) kept when switching tabs? How would you reset it?
5. Three `setState` calls in one click handler cause how many re-renders?

<details><summary>Answers</summary>

1. Trigger (initial render or state update), render (React calls your components), commit (React applies the DOM changes).
2. Nothing. React compares the output and makes no DOM changes.
3. Yes. By default all children re-render when their parent does (unless memoised).
4. Kept: it's the same component type at the same position. Add `key={tab}` so React treats each tab's list as a different instance.
5. One. React batches them.
</details>

## Further reading
- react.dev: [Render and Commit](https://react.dev/learn/render-and-commit)
- react.dev: [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state). Read this one carefully.
- Mark Erikson: *"A (Mostly) Complete Guide to React Rendering Behavior"*, the definitive deep dive.

**Practice:** exercise `06-04` filterable-inventory → `npm run watch 06-04`

---
[← Events & state](05-events-and-state.md) · [Module overview](README.md) · [Next module: State & Effects →](../07-state-and-effects/README.md)
