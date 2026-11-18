# 06.2 · JSX & components

> ⏱ 90 min · Module 06 · React Fundamentals

## What you'll learn
- What JSX compiles to, so it stops feeling like magic
- JSX rules: one root, fragments, `className`, camelCase, `{}` expressions
- Writing function components
- Purity: why rendering must have no side effects
- Mounting React into the page, and `StrictMode`

---

## JSX is JavaScript

JSX looks like HTML, but it's **syntax for function calls**. This:

```tsx
const el = <button className="btn" disabled={gold < 10}>Buy</button>;
```

compiles (with the React 17+ "automatic runtime") to roughly:

```js
import { jsx } from 'react/jsx-runtime';
const el = jsx('button', { className: 'btn', disabled: gold < 10, children: 'Buy' });
```

The result is a plain JavaScript **object** called a *React element*: a lightweight description of what you want on screen.

```js
{ type: 'button', props: { className: 'btn', disabled: false, children: 'Buy' } }
```

Because JSX is just expressions that produce objects, you can store it in variables, return it from functions, put it in arrays and pass it as props.

## JSX rules

### 1. Return a single root (or use a fragment)
```tsx
// ❌ two roots: a function can't return two values
return <h1>Bank</h1><ul>…</ul>;

// ✅ a fragment groups them without adding a DOM element
return (
  <>
    <h1>Bank</h1>
    <ul>…</ul>
  </>
);
```

### 2. Close every tag
`<img />`, `<input />`, `<br />`, and self-close components with no children: `<GoldDisplay />`.

### 3. Attributes are camelCase, and some are renamed
| HTML | JSX |
|---|---|
| `class` | `className` (`class` is a reserved word in JS) |
| `for` | `htmlFor` |
| `onclick` | `onClick` |
| `tabindex` | `tabIndex` |
| `style="color: red"` | `style={{ color: 'red' }}` (an object, with camelCase properties) |
| `aria-label`, `data-id` | unchanged (`aria-*` and `data-*` keep their dashes) |

### 4. `{}` embeds any JavaScript **expression**
```tsx
<p>{player.name} has {gold.toLocaleString()} gold</p>
<p>Level {Math.floor(xp / 100) + 1}</p>
<img src={item.iconUrl} alt={item.name} />
<div className={isActive ? 'card card--active' : 'card'} />
```

Expressions only. Statements like `if`, `for` or `const` aren't allowed inside `{}`. Use ternaries, `&&`, `.map()`, or compute values *before* the `return` (lesson 06.4).

### 5. What renders
- strings and numbers render as text
- `null`, `undefined`, `true` and `false` render **nothing**
- arrays render each element (lists, 06.4)
- **objects can't be rendered directly**: `{player}` throws *"Objects are not valid as a React child"*. Render a property instead (`{player.name}`).

### 6. Text is escaped automatically
```tsx
const name = '<img src=x onerror=alert(1)>';
<p>{name}</p>   // shows the literal text. React escapes it, so there's no XSS (lesson 03.3)
```

## Function components

A component is a **function** that takes a **props object** and returns JSX:

```tsx
type GoldDisplayProps = { amount: number };

export function GoldDisplay({ amount }: GoldDisplayProps) {
  return (
    <span className="gold" aria-label={`${amount} gold`}>
      🪙 {amount.toLocaleString()}
    </span>
  );
}
```

Use it like an HTML tag:

```tsx
<GoldDisplay amount={1250} />
```

Rules:
- **Names start with a capital letter.** `<goldDisplay>` would be treated as an unknown HTML tag.
- **Return JSX, `null` (render nothing), a string, a number, or a fragment.**
- **Define components at the top level of a module**, never inside another component. A component defined inside another is recreated on every render, so React sees a *new type* each time and throws away its state (lesson 06.6).
- **One main component per file** is the usual convention: `SkillCard.tsx` exports `SkillCard`. Small helpers used only by that component can live in the same file.

## Components must be pure

React assumes your component is a **pure function** of its props, state and context:

1. **Same inputs → same output.** Rendering with the same props twice gives the same JSX.
2. **No side effects during render.** Don't mutate external variables, start timers, fetch data, write to `localStorage` or touch the DOM *while rendering*.

```tsx
let renderCount = 0;
function Bad({ gold }: { gold: number }) {
  renderCount++;                         // ❌ mutating outside state during render
  localStorage.setItem('gold', String(gold));  // ❌ a side effect during render
  return <span>{gold}</span>;
}
```

Why so strict? React may render a component **more than once**, render in the background and throw the result away, or render components out of order. (Concurrent features such as transitions rely on this.) Side effects during render then happen at unpredictable times, or several times over.

So where *do* side effects go?
- **In event handlers**, when the user *does* something (lesson 06.5). Most side effects belong here.
- **In effects** (`useEffect`), for synchronising with external systems (lesson 07.4).

Creating and mutating **local** variables inside render is completely fine. Only things that existed before the render must be left untouched.

## Mounting React

`index.html` has an empty `<div id="root">`. `main.tsx` hands it to React:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

From then on React owns everything inside `#root`. Don't edit that DOM yourself.

### `StrictMode`
In **development only**, `StrictMode` helps you find bugs by:
- **rendering every component twice**, to expose impure render logic
- **running effects twice** (setup → cleanup → setup), to expose missing cleanup (lesson 07.4)
- warning about deprecated APIs

If something happens "twice" in development, StrictMode is usually why, and it's showing you a real bug in waiting. It has **no effect in production builds**. Keep it on.

## Organising files

A common structure, which you'll refine in lesson 19.3:

```
src/
  main.tsx
  App.tsx
  components/          ← reusable UI pieces: Button, ProgressBar, Modal
  features/
    skills/            ← feature folders: everything about skills together
      SkillCard.tsx
      SkillGrid.tsx
      skills-data.ts
    bank/
      BankGrid.tsx
```

## Check your understanding

1. What does `<SkillCard level={5} />` turn into after compilation, roughly?
2. Why `className` instead of `class`?
3. Name two things that are fine to do during render and two that aren't.
4. Why does React double-render in development, and does it happen in production?
5. Why must you never define a component inside another component?

<details><summary>Answers</summary>

1. A call like `jsx(SkillCard, { level: 5 })`, which produces an element object `{ type: SkillCard, props: { level: 5 } }`.
2. JSX is JavaScript, and `class` is a reserved keyword there. The DOM property is also called `className`.
3. Fine: computing values from props and state, creating local variables and arrays, calling pure helper functions. Not fine: mutating external variables or props, starting timers, fetching, writing to `localStorage`, touching the DOM.
4. `StrictMode` double-invokes renders and effects to surface impure code and missing cleanup. It only happens in development.
5. The inner component would be a brand-new function on every render, so React treats it as a different type, unmounts and remounts it, and loses its state and DOM each time.
</details>

## Further reading
- react.dev: [Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)
- react.dev: [JavaScript in JSX with Curly Braces](https://react.dev/learn/javascript-in-jsx-with-curly-braces)
- react.dev: [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)

---
[← Thinking in React](01-thinking-in-react.md) · [Module overview](README.md) · [Next: Props, children & composition →](03-props-children-and-composition.md)
