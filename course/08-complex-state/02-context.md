# 08.2 · Context

> ⏱ 2 hours · Module 08 · Managing Complex State

## What you'll learn
- Prop drilling, and when it's actually a problem
- Creating, providing and consuming context
- A type-safe context pattern with a custom hook
- How context changes cause re-renders, and how to limit them
- What context is good for, and what it isn't

---

## Prop drilling

Passing props through components that don't use them, just to reach a deeply nested child:

```
App (theme)
 └── Layout (theme)          ← doesn't use theme, just passes it on
      └── Sidebar (theme)    ← doesn't use theme, just passes it on
           └── NavLink (theme)  ← finally uses it
```

A little prop drilling is **fine and explicit**. Two or three levels is normal, and you can see exactly where data comes from. It becomes a problem when lots of components need the same data (theme, current user, settings), or when the middle layers keep changing.

Before reaching for context, try **composition** (lesson 06.3). Often the middle components can take `children`, so the parent renders the deep child directly:

```tsx
<Layout sidebar={<Sidebar><NavLink theme={theme} /></Sidebar>} />
```

## Context: broadcast to a subtree

Context lets a parent make a value available to **every component below it**, at any depth, without passing props.

### 1. Create it
```tsx
import { createContext } from 'react';

type Theme = 'light' | 'dark';
export const ThemeContext = createContext<Theme>('light');   // the default value, used with no provider
```

### 2. Provide it
```tsx
function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  return (
    <ThemeContext value={theme}>          {/* React 19: render the context itself as the provider */}
      <Layout />
    </ThemeContext>
  );
}
```

> In React ≤ 18 (and in plenty of existing code) you'll see `<ThemeContext.Provider value={theme}>`. It does the same thing.

### 3. Consume it
```tsx
import { useContext } from 'react';

function NavLink() {
  const theme = useContext(ThemeContext);   // the value from the nearest provider above
  return <a className={`nav-link nav-link--${theme}`}>…</a>;
}
```

React 19 also has `use(ThemeContext)`, which works the same way but can be called conditionally. `useContext` is still the most common in codebases.

### Nested providers
The **nearest** provider wins, so you can override a value for part of the tree:

```tsx
<ThemeContext value="dark">
  <Game />
  <ThemeContext value="light">
    <PrintableReceipt />      {/* sees 'light' */}
  </ThemeContext>
</ThemeContext>
```

## A type-safe pattern

For context that holds app data (not just a simple value with a sensible default), there's often **no** sensible default. A common, robust pattern:

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

type Settings = { volume: number; theme: Theme };
type SettingsContextValue = {
  settings: Settings;
  setVolume: (volume: number) => void;
  toggleTheme: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ volume: 0.8, theme: 'dark' });

  const value: SettingsContextValue = {
    settings,
    setVolume: (volume) => setSettings((s) => ({ ...s, volume })),
    toggleTheme: () => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
  };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (ctx === null) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
```

Benefits:
- **Consumers never deal with `null`**: the hook narrows the type.
- **Forgetting the provider gives a clear error immediately**, not a confusing `Cannot read properties of null` three files away.
- The context object itself isn't exported, so all access goes through your API.

## How context re-renders

When a provider's `value` changes (by `Object.is`), **every component that reads that context re-renders**, however deep, even if it only uses part of the value.

Two consequences:

### 1. Don't create a new value object on every render without reason
In the example above, `value` is a **new object on every render** of `SettingsProvider`. If the provider re-renders for an unrelated reason (its parent re-rendered), every consumer re-renders too. Memoise it:

```tsx
const value = useMemo<SettingsContextValue>(
  () => ({
    settings,
    setVolume: (volume) => setSettings((s) => ({ ...s, volume })),
    toggleTheme: () => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
  }),
  [settings],
);
```

(`useMemo` is covered properly in 09.5. The React Compiler can do this for you.)

### 2. Split contexts by how often they change
Components that only need the **actions** (`setVolume`) still re-render whenever `settings` changes, because it's the same context. Split them:

```tsx
const SettingsStateContext = createContext<Settings | null>(null);
const SettingsActionsContext = createContext<SettingsActions | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const actions = useMemo<SettingsActions>(() => ({
    setVolume: (volume) => setSettings((s) => ({ ...s, volume })),
    toggleTheme: () => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
  }), []);   // the setters only use setSettings (stable), so they never change

  return (
    <SettingsActionsContext value={actions}>
      <SettingsStateContext value={settings}>{children}</SettingsStateContext>
    </SettingsActionsContext>
  );
}
```

Now a "Mute" button that only calls `useSettingsActions()` never re-renders when the volume changes. You'll do exactly this in exercise 08-02.

> 🧠 **Context is a poor fit for values that change many times per second**, like your game's tick state. Every tick would re-render every consumer. That's what external stores with selectors are for (08.5).

## Good uses for context
- theme, locale, and user settings
- the authenticated user/session (lesson 17.8)
- feature flags
- a service or client instance (an API client, the game engine instance)
- compound components that share internal state (lesson 09.3)

## Not what context is for
- **Avoiding a few levels of props.** Composition or plain props are clearer.
- **High-frequency updates.** Use a store.
- **Server data** (leaderboards, profiles). Use TanStack Query (10.4), which has its own cache.

## Check your understanding

1. What value does `useContext` return if there's no provider above the component?
2. Why does the `useSettings` hook throw instead of returning `null`?
3. A provider's `value={{ user, logout }}` is created inline. What's the performance problem?
4. A "Mute" button only calls `setVolume`. How do you stop it re-rendering every time the volume changes?
5. Should the game's current gold (changing ten times a second) live in context?

<details><summary>Answers</summary>

1. The default value passed to `createContext`.
2. So a missing provider fails immediately and loudly, with a helpful message, and so TypeScript knows the return value is never null.
3. A new object is created on every render of the provider, so every consumer re-renders whenever the provider re-renders, even if `user` didn't change. Memoise it with `useMemo`.
4. Split the actions into their own context with a stable (memoised) value, and have the button consume only the actions context.
5. No. Every consumer would re-render on every change. Use an external store with selectors (08.5, 14.2).
</details>

## Further reading
- react.dev: [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)
- react.dev: [`useContext` reference](https://react.dev/reference/react/useContext), especially "Optimizing re-renders when passing objects and functions"

**Practice:** exercise `08-02` settings-context → `npm run watch 08-02`

---
[← useReducer](01-use-reducer.md) · [Module overview](README.md) · [Next: Reducer + context →](03-reducer-plus-context.md)
