# 06.4 · Lists, keys & conditional rendering

> ⏱ 90 min · Module 06 · React Fundamentals

## What you'll learn
- Rendering arrays with `.map()`
- Keys: what they're for, how to choose them, and the bugs bad keys cause
- Conditional rendering: early returns, ternaries, `&&` (and its `0` trap)
- Preparing data before the `return`

---

## Rendering lists

Arrays of JSX render as siblings. Turn data into elements with `.map()`:

```tsx
type Item = { id: string; name: string; quantity: number };

function BankList({ items }: { items: Item[] }) {
  return (
    <ul className="bank">
      {items.map((item) => (
        <li key={item.id}>
          {item.name} ×{item.quantity}
        </li>
      ))}
    </ul>
  );
}
```

Filter, sort and transform *before* mapping, with everything from lesson 01.3:

```tsx
function BankList({ items, hideEmpty }: { items: Item[]; hideEmpty: boolean }) {
  const visible = items
    .filter((item) => !hideEmpty || item.quantity > 0)
    .toSorted((a, b) => a.name.localeCompare(b.name));   // toSorted: never mutate props!

  return (
    <ul>
      {visible.map((item) => <BankRow key={item.id} item={item} />)}
    </ul>
  );
}
```

## Keys

Every element in a list needs a `key` prop that is **unique among its siblings** and **stable across renders**:

```tsx
{items.map((item) => <BankRow key={item.id} item={item} />)}
```

### Why keys exist
When a list re-renders, React has to match new elements to old ones: *"Is this the same row as before, so I keep its DOM and state? Or a new one?"* Keys are how it knows. Without them it matches by **position**.

### The index-as-key bug
Using the array index as the key (`key={index}`) seems to work, until the list is reordered, filtered or has items inserted. Then React matches by position and **the wrong state ends up attached to the wrong item**:

```
Before (keys 0,1,2):           After removing "Oak" (keys 0,1):
0 → Oak    [sell qty: 5 ]      0 → Willow [sell qty: 5 ]  ← Oak's input state is now on Willow!
1 → Willow [sell qty:   ]      1 → Ash    [sell qty:   ]
2 → Ash    [sell qty:   ]
```

Any per-item state (an input's value, an expanded/collapsed toggle, an animation) moves to whichever item is now at that position.

### Choosing keys
- ✅ An **id from your data** (`item.id`, a database id, a skill id).
- ✅ A stable combination when there's no single id: `` key={`${log.timestamp}-${log.itemId}`} ``, as long as it's unique.
- ⚠️ The index, **only** if the list is static: never reordered, filtered or inserted into.
- ❌ `Math.random()` or `crypto.randomUUID()` *during render*: a new key on every render means React remounts every row, every render.

If your data has no ids, **add them when the data is created** (e.g. `crypto.randomUUID()` when a log entry is pushed), not when it's rendered.

### Keys are not props
A component can't read its own `key`. If the child needs the id, pass it separately: `<Row key={item.id} id={item.id} />`.

### Fragments with keys
When each item renders several siblings, use the long form of the fragment:

```tsx
import { Fragment } from 'react';

{stats.map((stat) => (
  <Fragment key={stat.id}>
    <dt>{stat.label}</dt>
    <dd>{stat.value}</dd>
  </Fragment>
))}
```

## Conditional rendering

### Early return
The clearest option when a whole component depends on a condition:

```tsx
function ActiveActionPanel({ action }: { action: ActiveAction | null }) {
  if (action === null) {
    return <p className="muted">You're idle. Pick a skill to start training!</p>;
  }
  return (
    <section>
      <h2>{action.label}</h2>
      <ProgressBar value={action.progress} label={action.label} />
    </section>
  );
}
```

### Ternary: one thing or another
```tsx
<button type="button" onClick={onToggle}>
  {isActive ? 'Stop' : 'Start'}
</button>

{isLocked ? <LockedBadge level={requiredLevel} /> : <ProgressBar value={progress} label={name} />}
```

### `&&`: something or nothing
```tsx
{isActive && <span className="badge">Active</span>}
```

### ⚠️ The `0 &&` trap
`a && b` evaluates to `a` when `a` is falsy. React renders `false`, `null` and `undefined` as nothing, **but it renders `0` as the text "0"**:

```tsx
{items.length && <BankList items={items} />}
// When the bank is empty this renders a stray "0" on screen!

{items.length > 0 && <BankList items={items} />}   // ✅ a real boolean
{items.length ? <BankList items={items} /> : null} // ✅
```

In an idle game, where `0` is a very common value (0 gold, 0 quantity), this bug shows up constantly. Make conditions explicit booleans.

### Rendering nothing
Return `null` (or `false`) to render nothing:

```tsx
function LevelUpBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return <div role="status">Level up! 🎉</div>;
}
```

### Variables before `return`
For complex logic, compute JSX in variables. It's often clearer than nested ternaries:

```tsx
let content: ReactNode;
if (status === 'loading') content = <Spinner />;
else if (status === 'error') content = <ErrorMessage />;
else content = <BankList items={items} />;

return <Panel title="Bank">{content}</Panel>;
```

Or, with a discriminated union (lesson 02.4), use a `switch` in a small helper component. **Avoid nested ternaries** more than one level deep, because they're very hard to read.

## Check your understanding

1. What two properties must a key have?
2. Describe a bug caused by `key={index}` in a filterable list of items with quantity inputs.
3. What's rendered by `{0 && <p>Hi</p>}`? And by `{false && <p>Hi</p>}`?
4. Why is `key={Math.random()}` bad?
5. Can a component read `props.key`?

<details><summary>Answers</summary>

1. Unique among siblings, and stable across renders (the same item always gets the same key).
2. Type a quantity in row 1's input, then filter so a different item moves into position 1. Its input still shows the text you typed, because React kept the state at that position/key.
3. The text `0`. And nothing.
4. Every render produces new keys, so React unmounts and remounts every item: state is lost, focus is lost, and performance suffers.
5. No. `key` is reserved by React. Pass the value as a separate prop if the component needs it.
</details>

## Further reading
- react.dev: [Rendering Lists](https://react.dev/learn/rendering-lists)
- react.dev: [Conditional Rendering](https://react.dev/learn/conditional-rendering)

**Practice:** exercise `06-02` item-list → `npm run watch 06-02`

---
[← Props, children & composition](03-props-children-and-composition.md) · [Module overview](README.md) · [Next: Events & state →](05-events-and-state.md)
