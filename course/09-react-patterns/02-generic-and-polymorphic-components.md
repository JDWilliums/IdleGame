# 09.2 · Generic & polymorphic components

> ⏱ 2 hours · Module 09 · React + TypeScript Patterns & Performance

## What you'll learn
- Generic components: `<List<T>>`, `<Select<T>>`, `<Table<T>>`, with inference
- Constraining type parameters, e.g. items must have an id
- Typed `getKey` / `getLabel` accessor props
- Polymorphic components (`as` props), and why they're tricky
- When generics make a component worse

---

## The problem

You want one reusable list component for skills, items, monsters and log entries:

```tsx
// ❌ untyped: renderItem gets `unknown`, and every caller has to cast
type ListProps = {
  items: unknown[];
  renderItem: (item: unknown) => ReactNode;
};
```

## Generic components

Components are functions, so they can be generic too (02.5):

```tsx
type ListProps<T> = {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyMessage?: ReactNode;
};

export function List<T>({ items, getKey, renderItem, emptyMessage = 'Nothing here' }: ListProps<T>) {
  if (items.length === 0) return <p>{emptyMessage}</p>;
  return (
    <ul>
      {items.map((item) => (
        <li key={getKey(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

`T` is inferred from `items`, so the callbacks are typed automatically:

```tsx
<List
  items={skills}                       // T = Skill
  getKey={(s) => s.id}                 // s: Skill ✅
  renderItem={(s) => <SkillRow skill={s} />}
/>

<List items={logEntries} getKey={(e) => e.id} renderItem={(e) => e.message} />   // T = LogEntry
```

> **Arrow-function generics in `.tsx`:** `const List = <T,>(props: ListProps<T>) => …` needs the trailing comma, or the parser reads `<T>` as a JSX tag. Function declarations (`function List<T>(…)`) avoid the issue.

## Constraints

If the component *needs* something from T, constrain it:

```tsx
type Identified = { id: string };

function List<T extends Identified>({ items, renderItem }: { items: readonly T[]; renderItem: (item: T) => ReactNode }) {
  return <ul>{items.map((item) => <li key={item.id}>{renderItem(item)}</li>)}</ul>;
}
```

Now `getKey` isn't needed. The trade-off is that the component works **only** with items that have an `id`. Accessor props (`getKey`) are more flexible, and constraints are simpler. Both are common.

## A generic, controlled select

Here selection state comes from the parent (controlled, 07.2), and the value is the **item itself**, not a string:

```tsx
type SelectListProps<T> = {
  label: string;
  items: readonly T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  selected: T | null;
  onSelect: (item: T) => void;
};

export function SelectList<T>({ label, items, getKey, getLabel, selected, onSelect }: SelectListProps<T>) {
  const selectedKey = selected === null ? null : getKey(selected);
  return (
    <div role="listbox" aria-label={label}>
      {items.map((item) => {
        const key = getKey(item);
        const isSelected = key === selectedKey;
        return (
          <div
            key={key}
            role="option"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(item)}
          >
            {getLabel(item)}
          </div>
        );
      })}
    </div>
  );
}

// usage: onSelect receives a fully typed Monster
<SelectList label="Choose an enemy" items={monsters} getKey={(m) => m.id} getLabel={(m) => m.name}
            selected={target} onSelect={setTarget} />
```

In exercise 09-01 you'll build this with **keyboard support** (arrow keys, Home/End), which is what makes a custom listbox accessible.

## Polymorphic components (`as` prop)

Design systems often have components that can render as different elements:

```tsx
<Text as="h2" size="lg">Skills</Text>
<Text as="label" htmlFor="name">Name</Text>
<Text>Default paragraph</Text>
```

Typing this properly means the props must change with `as` (`htmlFor` is only valid when `as="label"`):

```tsx
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type TextProps<E extends ElementType> = {
  as?: E;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'size' | 'children'>;

export function Text<E extends ElementType = 'p'>({ as, size = 'md', ...rest }: TextProps<E>) {
  const Component = as ?? 'p';
  return <Component className={`text text--${size}`} {...rest} />;
}
```

It works, but polymorphic types get complex quickly (refs, conflicting props), and they're a common source of TypeScript performance problems. Many libraries (Radix, shadcn/ui) prefer an **`asChild`** pattern instead: the component merges its props into its single child element:

```tsx
<Button asChild>
  <a href="/shop">Visit shop</a>     {/* renders an <a> with the Button's classes and behaviour */}
</Button>
```

You'll *use* these patterns far more than you'll *write* them. Know how to read them.

## When generics hurt

- If a component only ever works with one type, **don't** make it generic.
- If the generic parameters need more than a couple of seconds to understand, split the component or simplify the API.
- Generics with many accessor props (`getKey`, `getLabel`, `getIcon`, `getDisabled`...) can be a sign that callers should pass `renderItem` instead.

## Check your understanding

1. In `<List items={skills} renderItem={(s) => …} />`, how does TypeScript know the type of `s`?
2. Why does `const List = <T>(props: Props<T>) => …` fail in a `.tsx` file?
3. What's the trade-off between `T extends { id: string }` and a `getKey` prop?
4. What problem does `asChild` solve compared with an `as` prop?

<details><summary>Answers</summary>

1. `T` is inferred from the `items` prop (`Skill[]`, so `T = Skill`), and `renderItem`'s parameter is typed `T`.
2. The parser sees `<T>` as the start of a JSX element. Write `<T,>` or use a `function` declaration.
3. The constraint is simpler but only works with items that already have `id: string`. `getKey` works with any shape but adds a prop.
4. It avoids complex polymorphic typing: the child element keeps its own correct props and types, and the component just adds behaviour and styling.
</details>

## Further reading
- React TypeScript Cheatsheet: "Generic Components" and "Polymorphic Components"
- Radix UI docs: [Composition / asChild](https://www.radix-ui.com/primitives/docs/guides/composition)

**Practice:** exercise `09-01` generic-select-list → `npm run watch 09-01`

---
[← Typing components](01-typing-components.md) · [Module overview](README.md) · [Next: Composition patterns →](03-composition-patterns.md)
