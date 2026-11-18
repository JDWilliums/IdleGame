# 09.4 · Error boundaries, Suspense & portals

> ⏱ 2.5 hours · Module 09 · React + TypeScript Patterns & Performance

## What you'll learn
- Error boundaries: stopping one broken component from blanking the whole app
- `Suspense` and `lazy()`: loading code (and data) declaratively
- Portals: rendering outside the parent DOM node
- Building an accessible modal: focus management, Escape, the backdrop and `inert`

---

## Error boundaries

By default, if any component **throws during rendering**, React unmounts the **entire** app, and the player sees a white screen. An **error boundary** catches errors in its subtree and shows a fallback instead.

Error boundaries are one of the few things that still need a **class component** (there's no hook equivalent yet):

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { fallback: (error: Error, reset: () => void) => ReactNode; children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };                         // render the fallback on the next render
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, info.componentStack);  // send to your error tracker (lesson 20.5)
  }

  reset = () => this.setState({ error: null });

  override render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset);
    return this.props.children;
  }
}
```

Most teams use the small **`react-error-boundary`** package instead of writing their own: `<ErrorBoundary FallbackComponent={…} onReset={…}>`.

### Where to put them
At **several levels**, so a failure is contained:

```tsx
<ErrorBoundary fallback={(e) => <FullPageError error={e} />}>        {/* last resort */}
  <AppShell>
    <ErrorBoundary fallback={(e, reset) => <PanelError onRetry={reset} />}>
      <CombatScreen />                                                {/* a broken combat UI… */}
    </ErrorBoundary>
    <ErrorBoundary fallback={…}>
      <Bank />                                                        {/* …doesn't take the bank down */}
    </ErrorBoundary>
  </AppShell>
</ErrorBoundary>
```

### What they don't catch
- errors in **event handlers**: use `try/catch` there and set error state
- errors in **async code** (`setTimeout`, promise callbacks, effects that fetch)
- errors in the boundary itself

> 🧠 In your game, **the engine and the save system must never crash the UI**, and a UI crash must never corrupt the save. A top-level boundary that keeps autosave running, plus a "Something went wrong. Your progress is safe. Reload?" fallback, is a good design.

## `lazy()` and `Suspense`: code splitting

Big apps shouldn't make players download every screen up front. `lazy()` loads a component's code **on first render**, using dynamic `import()` (01.6):

```tsx
import { lazy, Suspense } from 'react';

const CombatScreen = lazy(() => import('./features/combat/CombatScreen'));
// lazy() needs a module with a DEFAULT export (one of the places default exports are required)

function App() {
  return (
    <Suspense fallback={<Spinner label="Loading combat…" />}>
      {screen === 'combat' && <CombatScreen />}
    </Suspense>
  );
}
```

`Suspense` shows the `fallback` while anything inside it is "suspended" (waiting). The bundler puts `CombatScreen` in its own chunk, which the browser downloads only when needed.

### Suspense for data
Suspense also works with data, when a library integrates with it: TanStack Query's `useSuspenseQuery`, React Router loaders, or React 19's `use(promise)`:

```tsx
function Leaderboard({ promise }: { promise: Promise<Row[]> }) {
  const rows = use(promise);      // suspends until the promise resolves
  return <Table rows={rows} />;
}
```

The key ideas:
- **Suspense handles the loading state** declaratively, the way error boundaries handle the error state.
- **Placement decides what shows a spinner.** One boundary around everything means one spinner. Several boundaries let parts appear independently.
- Pair Suspense with an error boundary for rejected promises.

You'll use Suspense with TanStack Query in lesson 10.4.

## Portals

A portal renders children into a **different DOM node**, typically the end of `<body>`, while keeping them in the same place in the **React tree**:

```tsx
import { createPortal } from 'react-dom';

function Toast({ message }: { message: string }) {
  return createPortal(
    <div role="status" className="toast">{message}</div>,
    document.body,
  );
}
```

Why? Remember lesson 04.2: a parent with `overflow: hidden`, a `transform` or a `z-index` stacking context can **clip or bury** an overlay. Rendering at the end of `<body>` escapes all of that.

What stays the same:
- **Context still works**: the portal's children can read providers from their React parent.
- **Events bubble through the React tree**, not the DOM tree: a click in a portal bubbles to the React parent's `onClick`.

Use portals for modals, toasts, tooltips, popovers and dropdown menus.

## An accessible modal

Modals are among the hardest components to get right, and among the most common. Here's the checklist (from the WAI-ARIA Dialog pattern):

1. `role="dialog"` and `aria-modal="true"`, with an accessible name (`aria-labelledby` pointing at the title).
2. **Move focus into the dialog** when it opens (to the first focusable element, or the dialog itself).
3. **Trap focus**: Tab and Shift+Tab cycle within the dialog.
4. **Escape closes it.**
5. **Restore focus** to the element that opened it when it closes.
6. The page behind is **inert**: not clickable, not focusable, hidden from screen readers.
7. Clicking the **backdrop** closes it (usually).
8. Background scrolling is prevented.

### Option A: the native `<dialog>` element
Modern browsers give you most of this for free:

```tsx
function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();   // modal: focus trapping, Escape, inert page, top layer
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} aria-labelledby="modal-title" onClose={onClose}>
      <h2 id="modal-title">{title}</h2>
      {children}
      <button type="button" onClick={onClose}>Close</button>
    </dialog>
  );
}
```

`showModal()` renders in the browser's **top layer** (above everything, no portal needed), makes the rest of the page inert, handles Escape, and restores focus on close. This is a great choice for real apps.

### Option B: build it yourself (the exercise)
Doing it by hand once teaches you focus management, which you'll need for menus, popovers and custom widgets. In exercise 09-03 you'll build a modal with a portal that:
- renders into `document.body` with `role="dialog"`, `aria-modal` and a labelled title
- focuses the first focusable element when it opens
- closes on Escape and on backdrop click (but not on clicks inside the dialog)
- restores focus to the opener when it closes
- traps Tab inside

A Tab trap in a nutshell:

```tsx
function handleKeyDown(e: React.KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const focusables = dialogRef.current!.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
}
```

> In production you'd use native `<dialog>` or a well-tested library (Radix Dialog, React Aria). Building one yourself is how you learn to *evaluate* those libraries and fix them when they misbehave.

## Check your understanding

1. A button's `onClick` throws. Does the nearest error boundary catch it?
2. Why does `lazy()` need a default export?
3. A click inside a portal-rendered modal: does it bubble to the `onClick` of the component that rendered the modal?
4. List four requirements of an accessible modal.
5. What does `dialog.showModal()` give you that `dialog.show()` doesn't?

<details><summary>Answers</summary>

1. No. Error boundaries only catch errors during rendering, lifecycle methods and constructors. Use `try/catch` in the handler.
2. `lazy` expects the promise from `import()` to resolve to a module whose `default` export is the component. That's simply the contract it was designed with.
3. Yes. Events bubble through the React component tree, regardless of where the DOM node lives.
4. Any four of: role="dialog" + aria-modal + an accessible name, focus moves in on open, focus is trapped, Escape closes it, focus is restored on close, the background is inert, backdrop click closes it, background scroll is locked.
5. Modal behaviour: the top layer, the rest of the page made inert, focus containment, the Escape key, and the `::backdrop` pseudo-element.
</details>

## Further reading
- react.dev: [Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- react.dev: [`lazy`](https://react.dev/reference/react/lazy), [`<Suspense>`](https://react.dev/reference/react/Suspense), [`createPortal`](https://react.dev/reference/react-dom/createPortal)
- WAI-ARIA APG: [Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- MDN: [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)

**Practice:** exercise `09-03` accessible-modal → `npm run watch 09-03`

---
[← Composition patterns](03-composition-patterns.md) · [Module overview](README.md) · [Next: Performance →](05-performance.md)
