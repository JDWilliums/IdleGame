# 06.5 · Events & state

> ⏱ 2 hours · Module 06 · React Fundamentals

## What you'll learn
- Handling events in React, with types
- `useState`: giving a component memory
- The Rules of Hooks, and why they exist
- Why local variables don't work as state
- State is per component *instance*
- Controlled inputs (an introduction)

---

## Event handlers

Pass a **function** to an `on…` prop:

```tsx
function SellButton({ itemId, onSell }: { itemId: string; onSell: (id: string) => void }) {
  function handleClick() {
    onSell(itemId);
  }
  return <button type="button" onClick={handleClick}>Sell</button>;
}
```

Inline arrows are common for short handlers:

```tsx
<button type="button" onClick={() => onSell(itemId)}>Sell</button>
```

> ⚠️ Pass the function, don't call it: `onClick={handleClick}` ✅, `onClick={handleClick()}` ❌. The second calls it *during render* and passes its return value. With a state setter inside, that's an infinite render loop.

### The event object
React passes a **synthetic event**, a cross-browser wrapper around the native event with the same API:

```tsx
import type { ChangeEvent, FormEvent, KeyboardEvent, MouseEvent } from 'react';

function handleClick(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.blur();
}
function handleChange(event: ChangeEvent<HTMLInputElement>) {
  console.log(event.target.value);
}
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();         // stop the browser's full-page form submission
}
function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') submit();
}
```

Tip: if you write the handler inline, TypeScript infers the event type for you. Hover over `e` in `onChange={(e) => …}` to see it.

Events bubble in React like in the DOM (lesson 03.3), and `event.stopPropagation()` works. React attaches its listeners at the root, which is event delegation done for you.

## Why local variables aren't enough

```tsx
function GoldCounter() {
  let gold = 0;
  return (
    <button type="button" onClick={() => { gold += 1; console.log(gold); }}>
      Gold: {gold}
    </button>
  );
}
```

Clicking logs 1, 2, 3… but the screen keeps showing **0**. Two reasons:
1. **Changing a local variable doesn't tell React to re-render.**
2. Even if it re-rendered, **every render calls `GoldCounter()` again from scratch**, so `let gold = 0` runs again.

A component needs a way to **remember** a value between renders, and to **trigger** a re-render when it changes. That's `useState`.

## `useState`

```tsx
import { useState } from 'react';

function GoldCounter() {
  const [gold, setGold] = useState(0);   // [current value, setter], with initial value 0

  return (
    <button type="button" onClick={() => setGold(gold + 1)}>
      Gold: {gold}
    </button>
  );
}
```

What happens when you click:
1. `setGold(1)` **stores** the new value and **schedules a re-render**.
2. React calls `GoldCounter()` again. This time `useState(0)` returns **`1`**: React remembers it, and the `0` is only used for the very first render.
3. The new JSX says `Gold: 1`, and React updates that text in the DOM.

```tsx
const [name, setName] = useState('');                  // string
const [isOpen, setIsOpen] = useState(false);           // boolean
const [items, setItems] = useState<Item[]>([]);        // provide the type when it can't be inferred
const [selected, setSelected] = useState<SkillId | null>(null);
```

### Updating objects and arrays: immutably!
Everything from lesson 01.1 applies directly. React compares the old and new values with `Object.is`, so **you must pass a new object or array**, or nothing re-renders:

```tsx
const [bank, setBank] = useState<Record<string, number>>({ oak_log: 3 });

// ❌ mutation: same reference, so React skips the update
bank.oak_log += 1;
setBank(bank);

// ✅ a new object
setBank({ ...bank, oak_log: (bank.oak_log ?? 0) + 1 });

const [log, setLog] = useState<string[]>([]);
setLog([...log, '+1 Oak Log']);              // ✅ add
setLog(log.filter((_, i) => i !== 0));       // ✅ remove the first
```

### Lazy initial state
If computing the initial value is expensive (like parsing a save from `localStorage`), pass a **function**. It only runs on the first render:

```tsx
const [save, setSave] = useState(() => loadSaveFromStorage());   // ✅ runs once
const [save2, setSave2] = useState(loadSaveFromStorage());       // ❌ runs on EVERY render (result ignored after the first)
```

## The Rules of Hooks

Functions starting with `use` are **hooks**. Two rules, enforced by the `rules-of-hooks` lint rule (lesson 05.4):

1. **Only call hooks at the top level** of a component or custom hook: not inside conditions, loops, nested functions or after an early `return`.
2. **Only call hooks from React components or custom hooks**, not from regular functions.

```tsx
function SkillCard({ locked }: { locked: boolean }) {
  if (locked) return <Locked />;      // ❌ early return BEFORE a hook…
  const [open, setOpen] = useState(false);  // …so this hook doesn't run on some renders
}
```

**Why?** React doesn't know your state by name. It tracks hooks by **call order**: "the first `useState` call in this component is slot #1, the second is slot #2…". If a condition skips a hook on some renders, every slot after it shifts and gets the wrong state. Call hooks unconditionally at the top, and branch *after*.

## State is per instance

Each place you render a component gets its **own, independent** state:

```tsx
<GoldCounter />
<GoldCounter />   // clicking one doesn't affect the other
```

State belongs to the *position in the tree*, not to the component function. Lesson 06.6 explains exactly how.

## Controlled inputs (a first look)

To read what the user types, make React the "source of truth" for the input's value:

```tsx
function PlayerNameInput() {
  const [name, setName] = useState('');
  return (
    <label>
      Player name
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <small>{20 - name.length} characters left</small>
    </label>
  );
}
```

This is a **controlled** input: its `value` comes from state, and every keystroke updates state, which re-renders it. You'll go deeper in lesson 10.2.

> If you set `value` without `onChange`, the input becomes read-only and React warns you. Use `defaultValue` for an uncontrolled input.

## Check your understanding

1. What's the difference between `onClick={save}` and `onClick={save()}`?
2. Why does a `let` variable inside a component lose its value?
3. After `setGold(gold + 1)`, when does the component see the new value?
4. Why must hooks not be called inside an `if`?
5. Write the state and the click handler to add `'trout'` to a `string[]` state called `catches`.

<details><summary>Answers</summary>

1. `onClick={save}` passes the function to call later. `onClick={save()}` calls it immediately during render and passes its return value.
2. Each render is a new call of the component function, so the variable is re-created from its initial value. It also never triggered a re-render.
3. On the **next** render. The current render's `gold` is a fixed snapshot (more in 07.1).
4. React identifies hooks by call order. Skipping one on some renders shifts every later hook onto the wrong stored state.
5. `const [catches, setCatches] = useState<string[]>([]);` and `onClick={() => setCatches([...catches, 'trout'])}`.
</details>

## Further reading
- react.dev: [Responding to Events](https://react.dev/learn/responding-to-events)
- react.dev: [State: A Component's Memory](https://react.dev/learn/state-a-components-memory)
- react.dev: [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)

**Practice:** exercise `06-03` counter-and-toggle → `npm run watch 06-03`

---
[← Lists, keys & conditional rendering](04-lists-keys-and-conditional-rendering.md) · [Module overview](README.md) · [Next: How React renders →](06-how-react-renders.md)
