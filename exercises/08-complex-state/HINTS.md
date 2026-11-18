# Hints · Module 08

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 08-01 · inventory-reducer

<details><summary>Level 1 · Nudge</summary>

Write two helpers first: `withLog(log, entry)` (prepend, keep 5) and `removeItems(items, id, qty)`, which returns a new items object or `null` if there aren't enough. Three of the cases become one-liners.
</details>

<details><summary>Level 2 · Direction</summary>

- `withLog`: `[entry, ...log].slice(0, 5)`.
- `removeItems`: if `have < qty` return `null`. If `have === qty`, use rest destructuring to drop the key. Otherwise spread with the new count.
- `soldAll`: loop over `Object.entries(state.items)`. Items with a price add to `total`, and items without one go into a `kept` object. If nothing was sold, return `state`.
- In the component: `const [state, dispatch] = useReducer(bankReducer, initial);`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

How do you know "nothing was sold" in `soldAll`? Compare `Object.keys(kept).length` with `Object.keys(state.items).length`. If they're equal, every stack was kept.

The "Sell 1" button needs a price. With `noUncheckedIndexedAccess`, `prices[itemId]` is `number | undefined`, so disable the button when it's `undefined`, and only dispatch when it isn't (`price !== undefined && dispatch(...)`).
</details>

---

## 08-02 · settings-context

<details><summary>Level 1 · Nudge</summary>

Two `createContext<... | null>(null)` calls, one `useState` in the provider, and one `useMemo` for the actions.
</details>

<details><summary>Level 2 · Direction</summary>

- The provider renders `<ActionsContext value={actions}><SettingsContext value={settings}>{children}</SettingsContext></ActionsContext>`.
- Each action uses the **updater form** of `setSettings`, e.g. `setSettings((s) => ({ ...s, volume: clamp(v) }))`. Because of that, the actions don't depend on `settings`, so `useMemo` can keep them stable.
- Each hook: `const ctx = useContext(X); if (ctx === null) throw new Error('…'); return ctx;`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why does `ResetButton` not re-render? It's passed as `children` to the provider, so it isn't re-rendered just because the provider re-renders (it's the same element object from the parent). It only re-renders if a context it **reads** changes, and the actions context value is memoised. If your actions were created inline (`const actions = { … }`) without `useMemo`, the value would be new on every provider render, and the Profiler test would fail. Try it to see.

`useMemo(..., [initial])`: `reset` needs `initial`, so it's a dependency. It's stable as long as the parent passes a stable `initial`.
</details>

---

## 08-03 · build-your-own-store

<details><summary>Level 1 · Nudge</summary>

`createStore` is lesson 08.5's code almost exactly, with a closure (`let state`) and a `Set` of listeners. `useStore` is one line with `useSyncExternalStore`.
</details>

<details><summary>Level 2 · Direction</summary>

- `setState`: resolve the value (call it if it's a function), compare with `Object.is`, store it, and notify.
- `useStore`: `useSyncExternalStore(store.subscribe, () => selector(store.getState()))`.
- `shallowEqual`: `Object.is` first. Then both must be non-null objects with the same number of keys, and every key of `a` must be `Object.is`-equal in `b`.
- `useStoreShallow`: keep the last result in a `useRef`. In `getSnapshot`, compute the next result. If it's `shallowEqual` to the cached one, return the cached one, otherwise cache and return the new one.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why does `useStore(store, (s) => ({ gold: s.gold }))` loop forever? `getSnapshot` returns a brand-new object every call, so React compares old with new, sees a difference, re-renders, calls `getSnapshot` again, and gets another new object. The cache in `useStoreShallow` breaks the loop by returning the *same* object when the contents haven't changed.

Typing the updater check: `typeof next === 'function' ? (next as (prev: T) => T)(state) : next`. The cast is needed because TypeScript can't rule out `T` itself being a function type.
</details>

---

## 08-04 · zustand-shop

<details><summary>Level 1 · Nudge</summary>

`createStore<ShopState>()((set, get) => ({ ...state, ...actions }))` from `'zustand/vanilla'`, and `useStore(store, selector)` from `'zustand'`.
</details>

<details><summary>Level 2 · Direction</summary>

- `set((s) => ({ gold: s.gold + amount }))` merges, so you only return the fields that change.
- `buy` needs `get()` to read the current state and **return** a boolean.
- `selectCanAfford(itemId)` returns a function: `(state) => state.gold >= PRICES[itemId] && !state.owned.includes(itemId)`. You can reuse it inside `buy`.
- `OwnedCount` selects a **number** (`selectOwnedCount`), so gold changes don't affect it.
</details>

<details><summary>Level 3 · Walkthrough</summary>

`buy`:
```
buy: (itemId) => {
  if (!selectCanAfford(itemId)(get())) return false;
  set((s) => ({ gold: s.gold - PRICES[itemId], owned: [...s.owned, itemId] }));
  return true;
},
```
Remember the extra `()` after `createStore<ShopState>`. It's how Zustand's TypeScript types are designed.
</details>
