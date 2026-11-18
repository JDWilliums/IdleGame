# Hints · Module 09

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 09-01 · generic-select-list

<details><summary>Level 1 · Nudge</summary>

- `type SelectListProps<T> = { … }` and `function SelectList<T>(props: SelectListProps<T>)`.
- Keep an array of refs to the option elements so you can `.focus()` them.
- Work out which index gets `tabIndex={0}`.
</details>

<details><summary>Level 2 · Direction</summary>

- Replace every `unknown` with `T` (and `T | null` for `selected`).
- `const selectedIndex = items.findIndex((i) => getKey(i) === selectedKey)`. The focusable index is `selectedIndex`, or `0` if it's `-1`.
- `optionRefs = useRef<Array<HTMLDivElement | null>>([])`, then on each option: `ref={(node) => { optionRefs.current[index] = node; }}`.
- In `onKeyDown`, map the key to a target index, `preventDefault()`, call `onSelect(items[target])`, and focus `optionRefs.current[target]`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

Key → index table:
```
const last = items.length - 1;
const targets: Record<string, number> = {
  ArrowDown: Math.min(index + 1, last),
  ArrowUp: Math.max(index - 1, 0),
  Home: 0,
  End: last,
};
const next = targets[event.key];
if (next === undefined) return;
```
Why does the ref callback return nothing? A ref callback that returns a value is treated as a cleanup function in React 19. Using braces `{ … }` makes sure you don't accidentally return the assignment.

Early return for no items: put it **after** the `useRef` call (hooks must be unconditional).
</details>

---

## 09-02 · compound-tabs

<details><summary>Level 1 · Nudge</summary>

A context holding `{ value, select, baseId }`. Each part calls a `useTabsContext('Tab')` hook that throws with the component's name.
</details>

<details><summary>Level 2 · Direction</summary>

- Controlled vs uncontrolled: `const isControlled = props.value !== undefined; const value = isControlled ? props.value : internalValue;`. In `select(next)`, only update internal state when uncontrolled, and always call `onValueChange?.(next)`.
- Ids: `useId()` in `Tabs`, then `${baseId}-tab-${value}` and `${baseId}-panel-${value}`.
- `Tab` puts `data-value={value}` on its button so `TabList` can read it.
- `TabList` holds a ref to the tablist div and handles `onKeyDown` there. Keyboard events from the focused tab bubble up to it.
</details>

<details><summary>Level 3 · Walkthrough</summary>

In `TabList`'s key handler:
1. `const tabs = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);`
2. `const current = tabs.findIndex((t) => t === document.activeElement);`
3. Work out the next index with wrapping: `current === last ? 0 : current + 1` and `current === 0 ? last : current - 1`.
4. `select(target.dataset.value)` and `target.focus()`, after `event.preventDefault()`.

Why does the "outside `<Tabs>`" test print errors? React logs thrown render errors to the console. The test silences `console.error` to keep the output clean.
</details>

---

## 09-03 · accessible-modal

<details><summary>Level 1 · Nudge</summary>

- `createPortal(jsx, document.body)`.
- One effect, keyed on `open`, that focuses in and returns a cleanup that restores focus.
- `onKeyDown` on the dialog for Escape and Tab.
- `event.target === event.currentTarget` on the backdrop.
</details>

<details><summary>Level 2 · Direction</summary>

- In the effect: remember `document.activeElement` **before** moving focus, then focus `dialogRef.current.querySelector(FOCUSABLE)`. The cleanup focuses the remembered element.
- Return `null` early when `!open`, but only *after* all the hooks.
- Tab trap: get all focusables, and if Shift+Tab is pressed on the first, `preventDefault()` and focus the last (and the reverse for Tab on the last).
</details>

<details><summary>Level 3 · Walkthrough</summary>

Why does restoring focus work when the modal closes? When `open` becomes `false`, React runs the **cleanup** of the effect from when `open` was `true`, and that cleanup closed over `previouslyFocused`. The same cleanup also runs if the whole modal unmounts. "Setup returns cleanup" again!

Why `event.target === event.currentTarget` for the backdrop? A click inside the dialog bubbles up to the backdrop's `onClick` too. `currentTarget` is the backdrop (the element whose handler is running), and `target` is where the click actually started. They're only equal when the click landed on the backdrop itself.
</details>

---

## 09-04 · render-performance

<details><summary>Level 1 · Nudge</summary>

There are five reasons for wasted renders in the starter code. Look for: a new array each render, an expensive call each render, an inline callback, components that aren't memoised, and a prop that changes for *every* row when only two rows change.
</details>

<details><summary>Level 2 · Direction</summary>

- `SKILLS.filter(...)` creates a new array every render, so it should be `useMemo` (or a module-level constant).
- `expensiveTotalLevel(unlocked)` should be `useMemo`.
- `onSelect={(id) => setSelectedId(id)}` should be `useCallback`.
- Wrap `SkillList`, `SkillRow` and `TickCounter` in `memo`.
- `SkillRow` gets `selectedId` (the same value for every row, and it changes for every row when you select). Pass `selected: boolean` instead.
</details>

<details><summary>Level 3 · Walkthrough</summary>

After the fixes, walk through a "Tick" click:
1. `GameScreen` re-renders (its `ticks` changed).
2. `TickCounter` gets a new `ticks`, so it re-renders. ✅
3. `SkillList`'s props: `skills` (the same memoised array), `selectedId` (unchanged) and `onSelect` (the same `useCallback`) are all equal, so `memo` skips it, and its rows too. ✅

Then selecting Mining after Fishing: `SkillList` gets a new `selectedId`, so it re-renders. Each row gets `selected = skill.id === selectedId`, which changes only for fishing (true → false) and mining (false → true), so only those two rows re-render. ✅

Bonus: try enabling the React Compiler in your `vite-sandbox` and see how much of this it does for you.
</details>
