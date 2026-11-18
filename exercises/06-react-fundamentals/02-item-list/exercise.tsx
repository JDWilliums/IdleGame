/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 06-02 · item-list
 * Lesson:  06.4 Lists, keys & conditional rendering
 * Run:     npm run watch 06-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · ItemList({ items, emptyMessage = 'Nothing here yet', hideEmpty = false })
 *   - Sort the items by name (A→Z). The `items` prop is frozen, so don't
 *     mutate it.
 *   - If hideEmpty is true, leave out items whose quantity is 0.
 *   - If no items are left to show: render <p>{emptyMessage}</p> and no list.
 *   - Otherwise: <ul aria-label="Items"> with one <li> per item:
 *       quantity > 0 → "{name} ×{quantity}"
 *       quantity = 0 → "{name} (out of stock)"
 *   - Every <li> needs a correct key. The test fails if React logs a key
 *     warning.
 *
 * TASK 2 · BankSummary({ items })
 *   Render a single <p> containing:
 *     no items      → "Empty bank"
 *     otherwise     → "{stacks} stack(s) · {total} item(s)"
 *       e.g. "1 stack · 1 item", "3 stacks · 45 items"
 *   (stacks = number of entries, total = sum of quantities)
 *   Watch out for the `0 &&` trap: an empty bank must not render a stray "0".
 */

export type Item = {
  id: string;
  name: string;
  quantity: number;
};

export type ItemListProps = {
  items: readonly Item[];
  emptyMessage?: string;
  hideEmpty?: boolean;
};

export function ItemList(props: ItemListProps) {
  return null; // TODO
}

export function BankSummary({ items }: { items: readonly Item[] }) {
  return null; // TODO
}
