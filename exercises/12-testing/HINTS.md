# Hints · Module 12

These exercises are graded by **mutation testing**. If the grader says a mutant "survived", ask yourself: *what behaviour could be wrong in a way none of my tests would notice?* The mutant names are a clue.

---

## 12-01 · write-unit-tests

<details><summary>Level 1 · Nudge</summary>

The six mutants break: a boundary, rounding, the "drop the zero part" rule, input validation, the days range, and the order of units. You need at least one test aimed at each.
</details>

<details><summary>Level 2 · Direction</summary>

- **Boundaries**: test *exactly* at 60 000 ms, and just below it (59 999 ms). Do the same at the hour and day boundaries.
- **Rounding**: pick a value with a big fractional part, like 1 500 ms or 59 600 ms.
- **Zero parts**: a value with exactly 0 seconds left over in the minutes range (120 000 ms).
- **Validation**: `expect(() => formatDuration(-1)).toThrow(RangeError)`, plus NaN.
- **Days**: anything ≥ 24 h, e.g. 25 h.
- **Order**: hours *and* minutes both non-zero, e.g. 1 h 1 m 1 s.
</details>

<details><summary>Level 3 · Walkthrough</summary>

A compact way to cover many cases is a table:
```
it.each([
  [0, '0s'], [1_500, '1s'], [59_999, '59s'], [60_000, '1m'],
  [125_000, '2m 5s'], [120_000, '2m'], [3_661_000, '1h 1m'], [10_800_000, '3h'],
  [86_400_000, '1d'], [90_000_000, '1d 1h'],
])('formatDuration(%i) → %s', (ms, expected) => expect(formatDuration(ms)).toBe(expected));
```
Each row counts as a separate test case for the "at least 8" check. Then add a separate `it` for the RangeError cases.
</details>

---

## 12-02 · write-component-tests

<details><summary>Level 1 · Nudge</summary>

Mutant names: `noDisable`, `stringQty`, `staleTotal`, `noClamp`, `outOfStockMissing`, `offByOneAfford`. Each one suggests a specific assertion.
</details>

<details><summary>Level 2 · Direction</summary>

- The quantity input has role `spinbutton` and the accessible name "Quantity".
- To change it: `await userEvent.clear(input); await userEvent.type(input, '3');`.
- `stringQty`: `toHaveBeenCalledWith(2)` already fails for `'2'`, because `toHaveBeenCalledWith` uses strict-ish equality.
- `staleTotal`: change the quantity and assert the new "Total: …g".
- `noClamp`: type a number bigger than the stock, then check the total (or tab away and check the input's value).
- `offByOneAfford`: gold *exactly equal* to the price.
- `outOfStockMissing`: render with `stock: 0`.
- `noDisable`: too little gold, so the button must be disabled.
</details>

<details><summary>Level 3 · Walkthrough</summary>

A setup helper keeps each test short:
```
function setup({ gold = 1000, item = axe } = {}) {
  const onBuy = vi.fn();
  render(<ShopItemCard item={item} gold={gold} onBuy={onBuy} />);
  return { onBuy, buy: () => screen.getByRole('button', { name: 'Buy' }), quantity: () => screen.getByRole('spinbutton', { name: 'Quantity' }) };
}
```
Remember the file needs the `// @vitest-environment jsdom` comment at the very top (it's already there).
</details>
