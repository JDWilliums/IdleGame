# 07.7 · Custom hooks

> ⏱ 2 hours · Module 07 · State & Effects

## What you'll learn
- What a custom hook is: a function that uses hooks
- Extracting logic out of components
- Hooks share **logic**, not **state**
- Designing hook APIs, and typing them
- Building `useLocalStorage`, a hook your game will use
- When *not* to make a custom hook

---

## Functions that use hooks

A **custom hook** is a function whose name starts with `use` and which calls other hooks. That's all it is. It lets you pull stateful logic out of a component and reuse it.

Before:

```tsx
function StatusBar() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return <span>{isOnline ? '🟢 Online' : '🔴 Offline — saving locally'}</span>;
}
```

After:

```tsx
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return isOnline;
}

function StatusBar() {
  const isOnline = useOnlineStatus();
  return <span>{isOnline ? '🟢 Online' : '🔴 Offline — saving locally'}</span>;
}
```

The component now reads like a description of *what* it needs, and the *how* lives in the hook.

## Hooks share logic, not state

```tsx
function A() { const online = useOnlineStatus(); … }
function B() { const online = useOnlineStatus(); … }
```

`A` and `B` each get their **own** `useState` and their **own** event listeners. Calling a custom hook is like pasting its body into the component. If you need components to share the same *state*, lift it up (07.2), use context (08.2) or use a store (08.5).

## Why the `use` prefix?
- It tells React's lint rules to check the Rules of Hooks inside the function.
- It tells readers "this function may hold state and effects, so call it at the top level".

A function that doesn't call any hooks shouldn't start with `use`. Make it a plain function: `getLevel(xp)`, not `useLevel(xp)`.

## Designing a hook's API

Return whatever is most convenient for callers:

```tsx
const isOnline = useOnlineStatus();                       // a single value
const [value, setValue] = useLocalStorage('volume', 0.8); // a tuple, like useState (renameable)
const { data, error, isLoading } = useFetch(url);         // an object, for many named values
```

Type the parameters and return values explicitly for exported hooks:

```tsx
export function useToggle(initial = false): [boolean, () => void] {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((o) => !o), []);
  return [on, toggle];
}
```

(`useCallback` keeps `toggle` the same function across renders, so callers can safely put it in dependency arrays. It's covered properly in 09.5.)

> TypeScript tip: returning `[on, toggle]` without an annotation infers `(boolean | (() => void))[]`, an array of a union, which isn't what you want. Annotate the tuple type, or add `as const`.

## Building `useLocalStorage`

This hook keeps a piece of state in sync with `localStorage`, so it survives reloads. Your game's settings (volume, theme) will use something like it. Let's design it:

```tsx
const [volume, setVolume] = useLocalStorage('settings.volume', 0.8);
```

Requirements and the reasoning behind them:

1. **Initial value**: read from `localStorage` once, using a lazy initializer so it doesn't re-read every render. If there's nothing stored, use the default.
2. **Parse safely**: stored values are strings, so `JSON.parse` them in a `try/catch`, because a corrupted value shouldn't crash the app (lesson 02.7).
3. **Write when the value changes**: an **effect** is right here, because `localStorage` is an external system.
4. **Handle write failures**: `setItem` can throw (quota exceeded, private mode). Catch it.
5. **Support updater functions**, like `useState` does: `setCount((c) => c + 1)`.
6. **Optional:** sync **across tabs** via the `storage` event (lesson 03.3).

```tsx
function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readStored(key, initialValue));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable: keep working in memory
    }
  }, [key, value]);

  return [value, setValue] as const;
}
```

That's the core. Exercise 07-04 adds cross-tab syncing, key changes and a validator instead of the `as T` cast, so you'll write the complete, production-quality version yourself.

> **Why `as T` is a smell here:** `JSON.parse` returns `any`, and casting it to `T` trusts whatever is in storage. The exercise has you accept an optional `validate: (value: unknown) => value is T` (a type guard, 02.3) so corrupted values fall back to the default.

## When not to write a custom hook

- **Don't wrap a single `useState`** just to rename it. It adds indirection for no benefit.
- **Avoid "lifecycle" hooks** like `useMount(fn)` or `useUpdateEffect(fn)`. They encourage lifecycle thinking instead of synchronisation thinking (07.4), and they hide missing dependencies.
- **Good custom hooks are concrete**: `useOnlineStatus`, `useInterval`, `useLocalStorage`, `useGameLoop`, `useMediaQuery`. A good test is whether the name describes a real-world concept.

## Testing hooks
Hooks are tested through a component, or with Testing Library's `renderHook`:

```tsx
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useToggle());
act(() => result.current[1]());          // call toggle
expect(result.current[0]).toBe(true);
```

`act()` makes sure React has processed state updates before you assert. The exercises in this module use exactly this. Have a look at their test files.

## Check your understanding

1. What two things make a function a custom hook?
2. Two components call `useOnlineStatus()`. How many `online` event listeners are registered?
3. Why does `useLocalStorage` use an effect to write but a lazy initializer to read?
4. Should a function that formats a number as gold be called `useGoldFormat`? Why?
5. What's wrong with `const [on, toggle] = useToggle()` if `useToggle` returns `[on, toggle]` without a type annotation?

<details><summary>Answers</summary>

1. Its name starts with `use`, and it calls at least one other hook.
2. Two `online` listeners (and two `offline`). Each call has its own effect.
3. Reading happens once to initialise state, and a lazy initializer does exactly that without re-reading on every render. Writing must happen whenever the value changes, which means synchronising with an external system, so it's an effect.
4. No. It doesn't use any hooks. Make it a plain function like `formatGold(n)`.
5. TypeScript infers an array of a union (`(boolean | (() => void))[]`), so `on` is typed `boolean | (() => void)`, not `boolean`. Annotate the return type as a tuple or use `as const`.
</details>

## Further reading
- react.dev: [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- Testing Library: [`renderHook`](https://testing-library.com/docs/react-testing-library/api#renderhook)

**Practice:** exercises `07-04` use-local-storage and `07-05` countdown-timer

---
[← Timers & stale closures](06-timers-and-stale-closures.md) · [Module overview](README.md) · [Next module: Managing Complex State →](../08-complex-state/README.md)
