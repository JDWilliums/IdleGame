# Hints · Module 06

Open **one level at a time**. Give each level a real attempt before opening the next.

> **Testing Library tips:** `getByRole('button', { name: 'Train' })` finds a `<button>` whose *accessible name* (its text, or `aria-label`) is "Train". If a test says it can't find an element, it prints the whole rendered DOM. Scroll up in the output and look at what you actually rendered.

---

## 06-01 · skill-card

<details><summary>Level 1 · Nudge</summary>

- Destructure props with defaults in the parameter list.
- `useId()` gives you an id string for `aria-labelledby`.
- Use a ternary to choose between `MAX` and the progress section.
- `&&` for the badge.
</details>

<details><summary>Level 2 · Direction</summary>

- `const headingId = useId();` at the top, then `<article aria-labelledby={headingId}>` and `<h3 id={headingId}>`.
- Work out the button label *before* the `return`: locked → `'Locked'`, active → `'Stop'`, else `'Train'`.
- The `<progress>` needs `aria-label={\`${name} XP\`}` for the test to find it by name.
- The XP text uses `xp.toLocaleString('en-US')`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

```
const isMaxed = level >= maxLevel;
…
{isMaxed ? <p>MAX</p> : (
  <>
    <progress aria-label={…} value={xp} max={xpForNext} />
    <p>{format(xp)} / {format(xpForNext)} XP</p>
  </>
)}
<button type="button" onClick={onSelect} disabled={isLocked}>{buttonLabel}</button>
```
A disabled button doesn't fire click events, so the "locked" test passes automatically.
</details>

---

## 06-02 · item-list

<details><summary>Level 1 · Nudge</summary>

- `filter` → `toSorted` → `map`.
- `key={item.id}`.
- Check `visible.length === 0` *before* rendering the list.
- Pluralise with a small helper function.
</details>

<details><summary>Level 2 · Direction</summary>

- Build `visible` before the `return`. If it's empty, `return <p>{emptyMessage}</p>`.
- Inside the `map`, use a ternary on `item.quantity > 0` to pick the text.
- `BankSummary`: return early for the empty case. Otherwise compute `total` with `reduce` and render the two pluralised parts.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- `const plural = (n: number, word: string) => \`${n} ${word}${n === 1 ? '' : 's'}\`;`
- The text must be exactly `3 stacks · 34 items`. Watch spaces in JSX: `{plural(a, 'stack')} · {plural(b, 'item')}` renders correctly because the ` · ` between the braces is literal text.
- Why does `.sort()` throw here? The test froze the array, and `sort` mutates in place. `toSorted` returns a copy.
</details>

---

## 06-03 · counter-and-toggle

<details><summary>Level 1 · Nudge</summary>

One `useState` per component. `disabled={...}` on the spend button. `role="switch"` and `aria-checked`. `aria-expanded`.
</details>

<details><summary>Level 2 · Direction</summary>

- `GoldCounter`: `const [gold, setGold] = useState(initialGold);`. Each button calls `setGold` with a new number.
- `Toggle`: inside the click handler, compute `const next = !on;` **once**, then `setOn(next)` and `onChange?.(next)`. Don't call `onChange(on)`, because `on` is still the *old* value during this render.
- `Disclosure`: `{open && <div>{children}</div>}`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

`<output>` has the ARIA role `status`, which is why the test queries `getByRole('status', { name: 'Gold' })`. The `aria-label="Gold"` gives it that name.

Why does `onChange?.(next)` use `?.`? `onChange` is optional, so `?.()` only calls it if it exists.
</details>

---

## 06-04 · filterable-inventory

<details><summary>Level 1 · Nudge</summary>

Three pieces of state: `search`, `category`, `sort`. Everything else (the filtered and sorted list and the counts) is computed during render.
</details>

<details><summary>Level 2 · Direction</summary>

- Controlled inputs: `value={search}` + `onChange={(e) => setSearch(e.target.value)}`. The same goes for both selects.
- A `<label>` *wrapping* its control gives the control its accessible name, so no `id`/`htmlFor` is needed.
- `<input type="search">` has the role `searchbox`, and `<select>` has the role `combobox`.
- Compute `visible` with two filters and one `toSorted`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- Case-insensitive match: compare `item.name.toLowerCase().includes(search.trim().toLowerCase())`.
- Comparator: `sort === 'name' ? a.name.localeCompare(b.name) : b.quantity - a.quantity`.
- `e.target.value` from a `<select>` is typed `string`. Since you control the options, `e.target.value as CategoryFilter` is a reasonable, documented cast. (A stricter alternative is a type guard that checks against your options list.)
- "Clear filters" calls `setSearch('')` and `setCategory('all')`. Both updates are batched into one re-render.
</details>
