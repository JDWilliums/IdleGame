# Module 09 · React + TypeScript Patterns & Performance

**Time:** ~14 hours · **Prerequisites:** Modules 06–08, lesson 02.5 (generics)

## Why this module matters
You can now build React apps. This module is about building them the way a strong mid-level developer would: components with precise types, reusable patterns other developers enjoy using (compound components, headless components, slots), graceful failure (error boundaries, Suspense), correct overlays (portals and modals with proper focus handling), and the performance tools you need for a game that updates ten times a second. These topics separate "junior who can build things" from "junior we want to hire".

## Learning objectives
By the end of this module you can:
- type props, events, refs, children and polymorphic components precisely
- write generic components (lists, selects, tables) with full type inference
- design reusable APIs with compound components, slots, render props and headless hooks
- handle errors with error boundaries, load code and data with Suspense, and render overlays with portals
- profile React apps and apply `memo`, `useMemo`, `useCallback`, the React Compiler, transitions and virtualization appropriately

## Lessons
| # | Lesson | Time |
|---|---|---|
| 09.1 | [Typing components](01-typing-components.md) | 2h |
| 09.2 | [Generic & polymorphic components](02-generic-and-polymorphic-components.md) | 2h |
| 09.3 | [Composition patterns](03-composition-patterns.md) | 2.5h |
| 09.4 | [Error boundaries, Suspense & portals](04-error-boundaries-suspense-and-portals.md) | 2.5h |
| 09.5 | [Performance](05-performance.md) | 3h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `09-01` | [generic-select-list](../../exercises/09-react-patterns/01-generic-select-list/exercise.tsx) | 09.2 |
| `09-02` | [compound-tabs](../../exercises/09-react-patterns/02-compound-tabs/exercise.tsx) | 09.3 |
| `09-03` | [accessible-modal](../../exercises/09-react-patterns/03-accessible-modal/exercise.tsx) | 09.4 |
| `09-04` | [render-performance](../../exercises/09-react-patterns/04-render-performance/exercise.tsx) | 09.5 |

Hints: [`exercises/09-react-patterns/HINTS.md`](../../exercises/09-react-patterns/HINTS.md)

## Checkpoint quiz
1. How do you type a component that accepts every prop a native `<button>` accepts, plus your own?
2. What does a generic component like `<List<T>>` give you over `items: unknown[]`?
3. What's a compound component? Give an example from HTML itself.
4. What can't an error boundary catch?
5. Why render a modal through a portal?
6. When does `memo` actually prevent a re-render?
7. Why might `useMemo` make code *slower*?
8. What does the React Compiler do, and what does it require from your code?

<details><summary>Answers</summary>

1. `type Props = ComponentProps<'button'> & { variant?: 'primary' | 'ghost' }`, then spread the rest onto the `<button>`.
2. The relationship between props is preserved: `renderItem` receives a `T`, `onSelect` gets a `T`, and `getKey` is checked against `T`'s shape, all inferred from `items`.
3. Components designed to be used together that share implicit state, like `<Tabs>`, `<TabList>`, `<Tab>` and `<TabPanel>`. HTML's `<select>` + `<option>` and `<ul>` + `<li>` are the classic analogies.
4. Errors in event handlers, in async code (setTimeout, promises), in server rendering, and in the boundary itself. Those need `try/catch` or other handling.
5. To render it at the end of `<body>`, outside any `overflow: hidden` or stacking contexts of its parent, so it always appears on top. React events still bubble through the React tree as normal.
6. When the parent re-renders and **all props are equal** to the previous render (`Object.is`, prop by prop). New objects, arrays or functions passed as props defeat it.
7. It has its own cost (storing values, comparing dependencies) and adds complexity. For cheap computations, that overhead outweighs recomputing.
8. It automatically memoises components and values at build time, so manual `memo`/`useMemo`/`useCallback` are mostly unnecessary. It requires code that follows the Rules of React: pure renders, no mutation of props or state, and hooks called unconditionally.
</details>

## Extra practice
1. **Headless `useCombobox`**: build an autocomplete hook (keyboard navigation, `aria-activedescendant`), then two differently styled components using it.
2. **Virtualise a 10,000-row list** with TanStack Virtual. Compare scroll performance with the plain list in the Performance panel.
3. **Lazy routes.** In `vite-sandbox`, split three "pages" with `lazy()` + `Suspense` and watch the network tab load chunks on demand.

**Next:** [Module 10 · Routing, Forms & Server Data →](../10-routing-forms-data/README.md)
