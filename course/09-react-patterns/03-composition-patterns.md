# 09.3 · Composition patterns

> ⏱ 2.5 hours · Module 09 · React + TypeScript Patterns & Performance

## What you'll learn
- Slots: passing UI into named props
- Compound components that share state through context
- Render props and function-as-children
- Headless components and hooks: logic without UI
- How to choose a component API

---

## Why patterns?

A component's **API** is the set of props it takes. A good API is easy to use correctly, hard to misuse, and flexible enough for the next feature without needing a rewrite. These patterns are how experienced React developers achieve that. You'll see all of them in libraries (Radix, Headless UI, React Aria, TanStack) and in real codebases.

## 1. Slots

Pass pieces of UI as props (you met this in 06.3):

```tsx
type PanelProps = { header: ReactNode; actions?: ReactNode; children: ReactNode };

function Panel({ header, actions, children }: PanelProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        {header}
        {actions && <div className="panel__actions">{actions}</div>}
      </div>
      <div className="panel__body">{children}</div>
    </section>
  );
}

<Panel header={<h2>Bank</h2>} actions={<SellAllButton />}>
  <BankGrid />
</Panel>
```

It's simple and explicit, so use it first.

## 2. Compound components

A group of components that **work together**, sharing implicit state through context:

```tsx
<Tabs defaultValue="skills">
  <TabList aria-label="Game sections">
    <Tab value="skills">Skills</Tab>
    <Tab value="bank">Bank</Tab>
    <Tab value="shop">Shop</Tab>
  </TabList>
  <TabPanel value="skills"><SkillsScreen /></TabPanel>
  <TabPanel value="bank"><BankScreen /></TabPanel>
  <TabPanel value="shop"><ShopScreen /></TabPanel>
</Tabs>
```

The caller controls **structure and content**: they can put the tab list anywhere, add icons, or wrap tabs in tooltips. The components handle **state and behaviour**: which tab is active, keyboard navigation and ARIA attributes. Compare that with the configuration alternative:

```tsx
<Tabs tabs={[{ id: 'skills', label: 'Skills', content: <SkillsScreen /> }, …]} />  // rigid
```

### How it works
```tsx
type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;                     // for generating linked ids
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <Tabs>`);
  return ctx;
}

export function Tabs({ defaultValue, children }: { defaultValue: string; children: ReactNode }) {
  const [value, setValue] = useState(defaultValue);
  const baseId = useId();
  return <TabsContext value={{ value, setValue, baseId }}>{children}</TabsContext>;
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabsContext('Tab');
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => ctx.setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabsContext('TabPanel');
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" id={`${ctx.baseId}-panel-${value}`} aria-labelledby={`${ctx.baseId}-tab-${value}`}>
      {children}
    </div>
  );
}
```

The ARIA roles (`tablist`, `tab`, `tabpanel`) and linked ids make it accessible. The **WAI-ARIA Authoring Practices** describe exactly how each widget should behave with a keyboard. For tabs: arrow keys move between tabs, and only the selected tab is in the Tab order ("roving tabindex"). You'll implement all of this in exercise 09-02.

Supporting **controlled** use is a nice touch: accept optional `value` + `onValueChange` props alongside `defaultValue`.

## 3. Render props

Pass a **function** that returns UI, so the component can give the caller data:

```tsx
type CountdownProps = { durationMs: number; children: (msLeft: number) => ReactNode };

function Countdown({ durationMs, children }: CountdownProps) {
  const msLeft = useCountdown(durationMs);
  return <>{children(msLeft)}</>;
}

<Countdown durationMs={5000}>
  {(ms) => <span>{(ms / 1000).toFixed(1)}s</span>}
</Countdown>
```

Render props were everywhere before hooks. Today a custom hook (`useCountdown`) usually does the same job more simply, but you'll still see render props in libraries (e.g. `renderItem` on lists, and virtualisation libraries) and in older code.

## 4. Headless components and hooks

**Headless** means "all of the behaviour, none of the styling". The logic lives in a hook, and *you* render whatever markup and styles you want:

```tsx
function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  const id = useId();
  return {
    open,
    toggle: () => setOpen((o) => !o),
    close: () => setOpen(false),
    buttonProps: { 'aria-expanded': open, 'aria-controls': id, onClick: () => setOpen((o) => !o) },
    panelProps: { id, hidden: !open },
  };
}

function ItemDetails({ item }: { item: Item }) {
  const d = useDisclosure();
  return (
    <>
      <button type="button" className="fancy" {...d.buttonProps}>{item.name}</button>
      <div className="stats" {...d.panelProps}>{item.description}</div>
    </>
  );
}
```

This is how libraries like **TanStack Table**, **Downshift**, **React Aria** and **Headless UI** work. It's very popular because design teams want full control over markup and styling, and accessibility logic is hard to get right, so it should be written once and reused.

## Choosing an API

| Situation | Pattern |
|---|---|
| a layout with a few insertable areas | **slots** (props of type `ReactNode`) |
| a group of parts the caller arranges (tabs, menus, accordions, forms) | **compound components** |
| the caller decides how each item/state renders | **render props** (`renderItem`) |
| reusable behaviour with fully custom markup | **headless hook** |
| simple and fixed | plain props. Don't over-engineer! |

The guiding principle is **inversion of control**: hand control to the caller where they need flexibility, and keep it where consistency matters (accessibility, state rules).

## Check your understanding

1. What's the advantage of `<Tabs><TabList><Tab/></TabList><TabPanel/></Tabs>` over `<Tabs tabs={[...]} />`?
2. How do compound components share state without props?
3. What does "headless" mean?
4. When is a render prop better than a custom hook?

<details><summary>Answers</summary>

1. The caller controls structure, placement and content (icons, wrappers, extra elements), while the component still manages state, keyboard behaviour and ARIA. It's far more flexible without new props for every variation.
2. Through a context created by the parent component, read with a custom hook by the children (which throws when they're used outside the parent).
3. A component or hook that provides behaviour, state and accessibility, but no markup or styles. The consumer renders the UI.
4. When the component also renders structure around the caller's content (a list or virtualiser rendering many items, each through `renderItem`), or when you need per-item rendering decisions inside the component's own loop.
</details>

## Further reading
- WAI-ARIA Authoring Practices Guide: [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (browse the other patterns too)
- Kent C. Dodds: *"Compound Components with React Hooks"*
- react.dev: [Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)

**Practice:** exercise `09-02` compound-tabs → `npm run watch 09-02`

---
[← Generic & polymorphic components](02-generic-and-polymorphic-components.md) · [Module overview](README.md) · [Next: Error boundaries, Suspense & portals →](04-error-boundaries-suspense-and-portals.md)
