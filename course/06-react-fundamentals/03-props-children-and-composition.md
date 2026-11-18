# 06.3 · Props, children & composition

> ⏱ 90 min · Module 06 · React Fundamentals

## What you'll learn
- Passing and typing props, with defaults and optional props
- Passing callbacks as props
- `children`, and building wrapper components
- Composition over configuration
- Forwarding props to native elements
- Why props are read-only

---

## Props are a component's arguments

```tsx
type ProgressBarProps = {
  value: number;          // 0..1
  label: string;
  color?: 'green' | 'blue' | 'gold';   // optional
};

export function ProgressBar({ value, label, color = 'green' }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`progress progress--${color}`}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="progress__fill"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

<ProgressBar value={0.6} label="Oak tree progress" />
<ProgressBar value={xp / next} label="Fishing XP" color="blue" />
```

- Destructure props in the parameter list. It reads clearly and lets you set **defaults** (`color = 'green'`).
- Strings can be passed without braces (`label="Oak"`). Everything else needs `{}` (`value={0.6}`, `isActive={true}`).
- A bare attribute means `true`: `<SkillCard isActive />`.

### Typing props
Define a `type ComponentNameProps`. TypeScript then checks every usage:

```tsx
<ProgressBar value="60%" label="x" />    // ❌ Type 'string' is not assignable to type 'number'
<ProgressBar value={0.5} />              // ❌ Property 'label' is missing
<ProgressBar value={0.5} label="x" colour="red" />  // ❌ 'colour' does not exist. Typo caught!
```

That's one of the biggest wins of React + TypeScript: refactoring a component's props shows you every call site that needs updating.

## Callbacks as props

Children communicate *up* by calling functions they were given:

```tsx
type SkillCardProps = {
  name: string;
  level: number;
  isActive: boolean;
  onSelect: () => void;           // convention: event-like props start with "on"
};

function SkillCard({ name, level, isActive, onSelect }: SkillCardProps) {
  return (
    <article className={isActive ? 'skill-card skill-card--active' : 'skill-card'}>
      <h3>{name}</h3>
      <p>Level {level}</p>
      <button type="button" onClick={onSelect}>Train</button>
    </article>
  );
}

// parent
<SkillCard name="Fishing" level={5} isActive={active === 'fishing'} onSelect={() => setActive('fishing')} />
```

Naming conventions: the **prop** is `onSomething` ("what happened"), and the **handler** in the parent is `handleSomething`:

```tsx
function handleSelect(skillId: SkillId) { setActive(skillId); }
<SkillCard onSelect={() => handleSelect('fishing')} … />
```

Callbacks can carry data: `onSell: (itemId: string, quantity: number) => void`.

## `children`

Whatever you put **between** a component's tags arrives as the `children` prop:

```tsx
import type { ReactNode } from 'react';

type CardProps = { title: string; children: ReactNode };

function Card({ title, children }: CardProps) {
  return (
    <section className="card">
      <h2 className="card__title">{title}</h2>
      <div className="card__body">{children}</div>
    </section>
  );
}

<Card title="Recent activity">
  <ul>
    <li>+1 Oak Log</li>
    <li>+25 Woodcutting XP</li>
  </ul>
</Card>
```

`ReactNode` is the type for "anything React can render": elements, strings, numbers, arrays, `null`.

## Composition over configuration

As a component grows, it's tempting to add props for every variation:

```tsx
// ❌ configuration explosion
<Panel
  title="Bank"
  showSearch
  showSort
  headerIcon="🏦"
  headerAction="sellAll"
  footerText="42 items"
  …
/>
```

Instead, **compose**: let callers pass in pieces of UI.

```tsx
// ✅ composition
<Panel
  header={<PanelHeader icon="🏦" title="Bank" action={<SellAllButton />} />}
  footer={<span>42 items</span>}
>
  <BankSearch />
  <BankGrid items={items} />
</Panel>
```

`Panel` just handles layout. It doesn't need to know about banks, search boxes or sell buttons. Props can hold JSX (`header: ReactNode`) as well as `children`. This "slot" pattern keeps components small and reusable. Lesson 09.3 goes further.

## Forwarding props to native elements

A custom `Button` should accept everything a real `<button>` does (`disabled`, `aria-*`, `onClick`, `type`…). Use `ComponentProps` and spread the rest:

```tsx
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`btn btn--${variant} ${className}`} {...rest} />;
}

<Button onClick={sell} disabled={qty === 0} aria-label="Sell all trout">Sell</Button>
```

`{...rest}` passes every other prop through, including `children` and `onClick`. Notice the default `type="button"`, which prevents accidental form submits (lesson 04.1).

## Props are read-only

**Never modify props.** They belong to the parent.

```tsx
function SkillCard(props: SkillCardProps) {
  props.level = props.level + 1;   // ❌ mutating the parent's data. This breaks the one-way flow
  …
}
```

To show something different, compute a new local value (`const displayLevel = …`), or ask the parent to change its state through a callback.

## Passing objects vs flat props

```tsx
<SkillCard skill={skill} />                         // pass the object
<SkillCard name={skill.name} level={skill.level} /> // pass only what's needed
```

Both are fine. Passing only what's needed makes a component easier to reuse and test. Passing the object is shorter when it needs most of the fields. Don't agonise over it; be consistent within a feature.

## Check your understanding

1. How do you give an optional prop a default value?
2. What's the TypeScript type for `children` that can be any renderable content?
3. Why name a prop `onSelect` rather than `select` or `handleSelect`?
4. What does `ComponentProps<'button'>` give you?
5. A child needs to display `level + 1`. Should it modify `props.level`?

<details><summary>Answers</summary>

1. With a default in the destructuring pattern: `function C({ color = 'green' }: Props)`, and mark it optional in the type with `color?:`.
2. `ReactNode`.
3. Convention: `on…` props describe *events the component emits*. The parent names its implementation `handle…`. It also mirrors native props like `onClick`.
4. All the props a native `<button>` accepts (attributes, event handlers, ARIA, `children`), properly typed.
5. No. Props are read-only. Compute `const nextLevel = level + 1` locally.
</details>

## Further reading
- react.dev: [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- react.dev: [Using TypeScript](https://react.dev/learn/typescript)

**Practice:** exercise `06-01` skill-card → `npm run watch 06-01`

---
[← JSX & components](02-jsx-and-components.md) · [Module overview](README.md) · [Next: Lists, keys & conditional rendering →](04-lists-keys-and-conditional-rendering.md)
