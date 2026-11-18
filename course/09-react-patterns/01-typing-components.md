# 09.1 · Typing components

> ⏱ 2 hours · Module 09 · React + TypeScript Patterns & Performance

## What you'll learn
- The React types you'll use every day: `ReactNode`, `ComponentProps`, event types, `CSSProperties`
- Extending native element props safely
- Discriminated union props (variants with different required props)
- Typing `useState`, `useRef`, `useReducer` and context
- What *not* to do: `React.FC`, `any`, over-annotation

---

## The everyday types

```tsx
import type {
  ReactNode,          // anything renderable: elements, strings, numbers, null, arrays
  ComponentProps,     // props of an intrinsic element or a component
  CSSProperties,      // the type of the style prop
  MouseEvent, ChangeEvent, FormEvent, KeyboardEvent,  // events
  Dispatch, SetStateAction,                          // the type of a useState setter
} from 'react';
```

### Props and children
```tsx
type CardProps = {
  title: string;
  children: ReactNode;          // required children
  footer?: ReactNode;           // an optional slot
};

function Card({ title, children, footer }: CardProps) { … }
```

> **About `React.FC`:** older code often writes `const Card: React.FC<CardProps> = (…) => …`. It's not wrong, but it adds nothing, and older versions implicitly added `children`. Modern style is a plain function with typed props, which is what this course uses.

### Events
Let inference do the work inline:

```tsx
<input onChange={(e) => setName(e.target.value)} />   // e: ChangeEvent<HTMLInputElement>
```

When you extract a handler, annotate the event:

```tsx
function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') submit();
}
```

Or type the handler as a whole using the prop's own type:

```tsx
const handleClick: ComponentProps<'button'>['onClick'] = (e) => { … };
```

### Styles
```tsx
const barStyle: CSSProperties = { width: `${percent}%`, transition: 'width 100ms linear' };

// CSS custom properties need a little help:
const style = { '--progress': fraction } as CSSProperties;
```

## Extending native elements

A design-system component should accept everything its underlying element does:

```tsx
type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cx('btn', `btn--${variant}`, `btn--${size}`, className)} {...rest} />;
}
```

`ComponentProps<'button'>` includes `ref` in React 19, so refs pass through automatically.

### Omitting or overriding props
```tsx
// Our onChange gives the value, not the event
type NumberInputProps = Omit<ComponentProps<'input'>, 'onChange' | 'type' | 'value'> & {
  value: number;
  onChange: (value: number) => void;
};
```

### Props of another component
```tsx
type SkillCardProps = ComponentProps<typeof SkillCard>;   // reuse its props type without exporting it
```

## Discriminated union props

When different variants need different props, use a union, exactly like 02.4:

```tsx
type NotificationProps =
  | { kind: 'levelUp'; skillName: string; level: number }
  | { kind: 'itemFound'; itemName: string; quantity: number }
  | { kind: 'error'; message: string; onRetry: () => void };

function Notification(props: NotificationProps) {
  switch (props.kind) {
    case 'levelUp':  return <p>🎉 {props.skillName} reached level {props.level}!</p>;
    case 'itemFound': return <p>+{props.quantity} {props.itemName}</p>;
    case 'error':    return <p>{props.message} <button onClick={props.onRetry}>Retry</button></p>;
  }
}

<Notification kind="error" message="Sync failed" />   // ❌ onRetry is required for errors
```

> Destructure *after* narrowing (or not at all), because destructuring in the parameter list loses the link between `kind` and the other props.

Another common case: "either `href` or `onClick`":

```tsx
type ActionProps =
  | ({ href: string } & ComponentProps<'a'>)
  | ({ href?: never } & ComponentProps<'button'>);
```

`href?: never` means the button variant can't have an `href`.

## Typing hooks

### `useState`
```tsx
const [count, setCount] = useState(0);                       // inferred: number
const [user, setUser] = useState<User | null>(null);         // must annotate: null alone infers `null`
const [items, setItems] = useState<Item[]>([]);              // must annotate: [] infers never[]
const [status, setStatus] = useState<'idle' | 'saving'>('idle');  // otherwise it's widened to string
```

Passing a setter as a prop:

```tsx
type Props = { setVolume: Dispatch<SetStateAction<number>> };   // accepts a value OR an updater
// or, more commonly and decoupled from React:
type Props2 = { onVolumeChange: (volume: number) => void };
```

### `useRef`
```tsx
const inputRef = useRef<HTMLInputElement>(null);                      // DOM ref: starts null
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null); // mutable value
const countRef = useRef(0);                                           // inferred: number
```

### `useReducer`
Type the reducer, and the hook infers the rest:

```tsx
function reducer(state: BankState, action: BankAction): BankState { … }
const [state, dispatch] = useReducer(reducer, initialBank);   // dispatch: Dispatch<BankAction>
```

### Context
```tsx
const GameContext = createContext<GameStore | null>(null);   // null default + throwing hook (08.2)
```

## What not to do

```tsx
// ❌ any: switches off everything you've learned
function List(props: any) { … }

// ❌ over-annotating what's obvious
const name: string = 'Ava';
const total: number = items.reduce((s: number, i: Item): number => s + i.qty, 0);

// ❌ typing children as JSX.Element: it rejects strings, arrays and null
type Props = { children: JSX.Element };   // use ReactNode

// ❌ `as` to silence prop errors. Fix the types instead.
<SkillCard {...(data as SkillCardProps)} />
```

## Check your understanding

1. How do you type `children` so it accepts text, elements, arrays and `null`?
2. How do you build a `TextField` that accepts all `<input>` props except `type`?
3. Why does `useState(null)` need a type argument?
4. A `Notification` with `kind: 'error'` must have `onRetry`. How do you enforce that?

<details><summary>Answers</summary>

1. `children: ReactNode`.
2. `type TextFieldProps = Omit<ComponentProps<'input'>, 'type'>`, then spread the rest onto `<input type="text" {...rest} />`.
3. From `null` alone, TS infers the state type as `null`, so you could never set it to a real value. Use `useState<User | null>(null)`.
4. Make the props a discriminated union on `kind`, where the `'error'` member requires `onRetry`.
</details>

## Further reading
- react.dev: [Using TypeScript](https://react.dev/learn/typescript)
- React TypeScript Cheatsheet: https://react-typescript-cheatsheet.netlify.app (the community reference)

---
[Module overview](README.md) · [Next: Generic & polymorphic components →](02-generic-and-polymorphic-components.md)
