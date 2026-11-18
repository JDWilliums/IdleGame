# 09.5 · Performance

> ⏱ 3 hours · Module 09 · React + TypeScript Patterns & Performance

## What you'll learn
- How to find performance problems: measure first
- Cheap structural fixes: move state down, lift content up
- `memo`, `useMemo` and `useCallback`: what they do and when they're worth it
- The React Compiler
- Keeping the UI responsive with `useTransition` and `useDeferredValue`
- Virtualising long lists

---

## Rule zero: measure first

Most React apps are fast enough without any optimisation. Premature memoisation adds complexity and often doesn't help. Before optimising:

1. **Notice a real problem**: janky scrolling, slow typing, or a laggy tap on a phone.
2. **Measure** with React DevTools' **Profiler**: record the interaction and see which components rendered, how long each took, and *why* ("props changed", "parent rendered", "hook changed").
3. Use the browser **Performance** panel (05.5) for long tasks, layout and paint.
4. **Test on a slow device**, or use CPU throttling (4× or 6× slowdown in DevTools). Your laptop is much faster than an average phone.

> 🧠 An idle game is a stress test: the state changes **ten or more times a second**, forever. A small amount of wasted rendering, multiplied by every tick, becomes real battery drain on a phone. That's why this lesson matters for your capstone.

## Structural fixes (try these first)

### 1. Move state down
```tsx
// ❌ typing in the search box re-renders the whole bank page, including a 500-item grid
function BankPage() {
  const [query, setQuery] = useState('');
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ExpensiveGrid />
    </>
  );
}

// ✅ the state lives in the component that uses it
function BankPage() {
  return (
    <>
      <SearchBox />          {/* has its own query state */}
      <ExpensiveGrid />      {/* no longer re-renders on keystrokes */}
    </>
  );
}
```

### 2. Lift content up (pass `children`)
A component that re-renders often (like a ticking progress panel) can wrap expensive content without re-rendering it, if that content comes in as `children`:

```tsx
function TickingPanel({ children }: { children: ReactNode }) {
  const progress = useGameStore((s) => s.progress);   // re-renders 10×/second
  return (
    <div>
      <ProgressBar value={progress} />
      {children}             {/* the SAME element object from the parent, so React skips it */}
    </div>
  );
}

<TickingPanel>
  <SkillDescription />       {/* created by the parent, which doesn't tick */}
</TickingPanel>
```

### 3. Subscribe to less
With stores, select **only what you render** (08.5). `useGameStore((s) => s.skills.fishing.level)` instead of `useGameStore((s) => s.skills)`.

## `memo`: skip re-rendering when props are equal

```tsx
import { memo } from 'react';

const SkillCard = memo(function SkillCard({ skill, onSelect }: SkillCardProps) {
  …
});
```

When the parent re-renders, a memoised component compares each new prop with the old one (`Object.is`). If **all** are equal, React reuses the previous result and skips rendering it and its children.

The catch: **new objects, arrays and functions break it**:

```tsx
function SkillGrid({ skills }: { skills: Skill[] }) {
  const [active, setActive] = useState<SkillId | null>(null);
  return skills.map((s) => (
    <SkillCard
      key={s.id}
      skill={s}                              // ✅ the same object each render (from state)
      style={{ margin: 4 }}                  // ❌ a NEW object each render, so memo is useless
      onSelect={() => setActive(s.id)}       // ❌ a NEW function each render, so memo is useless
    />
  ));
}
```

## `useCallback` and `useMemo`: stable references

```tsx
const handleSelect = useCallback((id: SkillId) => setActive(id), []);   // the same function across renders
const cardStyle = useMemo(() => ({ margin: 4 }), []);                   // the same object across renders
const sorted = useMemo(() => skills.toSorted(bySkillLevel), [skills]);  // cache an expensive computation
```

- `useMemo(fn, deps)` caches the **result** of `fn` until a dependency changes.
- `useCallback(fn, deps)` caches the **function itself** (it's `useMemo(() => fn, deps)`).

Now the memoised child receives stable props:

```tsx
<SkillCard key={s.id} skill={s} onSelect={handleSelect} />   // and SkillCard calls onSelect(skill.id)
```

### When they're worth it
- ✅ passing callbacks or objects to **`memo` components** or to **dependency arrays** (effects, other memos, store selectors)
- ✅ **measurably expensive** computations (sorting or filtering thousands of items, heavy maths)
- ❌ cheap computations: the memo bookkeeping costs more than it saves
- ❌ "just in case" everywhere: it adds noise and dependency bugs

## The React Compiler

All that manual memoisation is tedious and easy to get wrong. The **React Compiler** (stable since late 2025) is a build-time plugin that **automatically memoises** components, values and callbacks wherever it's safe, making `memo`/`useMemo`/`useCallback` largely unnecessary.

Enabling it in a Vite app:

```bash
npm install -D babel-plugin-react-compiler
```

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({ babel: { plugins: ['babel-plugin-react-compiler'] } }),
  ],
});
```

(Check the React Compiler docs for the current recommended setup with your Vite plugin version, since the integration details have been evolving.)

The compiler relies on your code **following the Rules of React**: pure rendering, no mutation of props or state, hooks at the top level, and no reading refs during render. Code that breaks the rules is skipped (left un-optimised). The React hooks lint plugin reports these violations. One more reason the rules in Module 07 matter!

**Should you still learn `memo`/`useMemo`/`useCallback`?** Yes:
- most existing codebases use them, and many don't use the compiler yet
- you need to understand *what* the compiler does in order to debug it
- they still come up in interviews ("When would you use `useCallback`?")

## Responsiveness: `useTransition` and `useDeferredValue`

Some updates are **urgent** (typing, clicking) and some can wait (re-filtering a big list). React can render non-urgent updates in the background and interrupt them when something urgent happens.

```tsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);              // lags behind during heavy renders
const results = useMemo(() => filterItems(allItems, deferredQuery), [deferredQuery]);

<input value={query} onChange={(e) => setQuery(e.target.value)} />   {/* stays responsive */}
<ItemGrid items={results} />                                           {/* catches up */}
```

```tsx
const [isPending, startTransition] = useTransition();

function selectTab(tab: Tab) {
  startTransition(() => setTab(tab));    // rendering the new tab can be interrupted
}
{isPending && <Spinner />}
```

## Lists: virtualisation

Rendering 5,000 bank items means 5,000 DOM nodes, which is slow to render, slow to scroll and heavy on memory. **Virtualisation** renders only the rows that are visible, plus a small buffer:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
// renders ~20 rows at a time, however long the list is
```

Use it when a list can grow to hundreds or thousands of rows (a huge bank, a long combat log). For under ~100 simple rows it's usually unnecessary.

## Other wins
- **Keys**: stable keys avoid remounting rows (06.4).
- **Code splitting** with `lazy()` (09.4) for screens not needed at first load.
- **Avoid layout thrashing**: animate `transform`/`opacity`, not `width`/`top` (03.1, 11.4).
- **Throttle visual updates**: a progress bar doesn't need React to re-render 60 times a second. Lesson 14.3 shows how to animate it with CSS or direct DOM updates while React renders at a calmer rate.

## Check your understanding

1. Typing in a search box lags because a big grid re-renders on every keystroke. Name two fixes that don't involve `memo`.
2. A `memo` component still re-renders every time its parent does. What's the most likely cause?
3. When is `useMemo` *not* worth it?
4. What does the React Compiler need from your code to work?
5. What's the difference between `useDeferredValue` and debouncing?

<details><summary>Answers</summary>

1. Move the search state down into a `SearchBox` component. Or use `useDeferredValue` so the grid renders with a deferred query. (Virtualising the grid also helps.)
2. One of its props is a new object, array or function on every render (an inline `style`, `{...}`, `[]` or an arrow function).
3. When the computation is cheap, or when the result isn't passed somewhere that cares about reference stability. The overhead and the complexity then outweigh the benefit.
4. Code that follows the Rules of React: pure renders, no mutation of props or state, hooks called unconditionally at the top level, and no reading or writing refs during render.
5. Debouncing waits a fixed time before updating at all. `useDeferredValue` updates as soon as React has spare time, interruptibly, with no arbitrary delay, so it's as fast as the device allows.
</details>

## Further reading
- react.dev: [`memo`](https://react.dev/reference/react/memo), [`useMemo`](https://react.dev/reference/react/useMemo), [`useCallback`](https://react.dev/reference/react/useCallback). Each has a great "Should you add it everywhere?" section.
- react.dev: [React Compiler](https://react.dev/learn/react-compiler)
- react.dev: [`useTransition`](https://react.dev/reference/react/useTransition), [`useDeferredValue`](https://react.dev/reference/react/useDeferredValue)
- Kent C. Dodds: *"Before You memo()"*

**Practice:** exercise `09-04` render-performance → `npm run watch 09-04`

---
[← Error boundaries, Suspense & portals](04-error-boundaries-suspense-and-portals.md) · [Module overview](README.md) · [Next module: Routing, Forms & Server Data →](../10-routing-forms-data/README.md)
