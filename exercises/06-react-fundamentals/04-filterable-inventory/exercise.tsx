/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 06-04 · filterable-inventory
 * Lessons: 06.5 Events & state · 06.6 How React renders · (and 06.4)
 * Run:     npm run watch 06-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build the bank screen's filter bar. Keep the MINIMUM state (search text,
 * category, sort) and DERIVE everything else during render. No useEffect.
 *
 * Inventory({ items }) renders:
 *   - <label>Search <input type="search" … /></label>
 *       case-insensitive match on the item name ("LOG" matches "Oak Log")
 *   - <label>Category <select>…</select></label>
 *       options (value → text): all → "All", wood → "Wood", fish → "Fish", ore → "Ore"
 *   - <label>Sort by <select>…</select></label>
 *       options: name → "Name" (A→Z, the default), quantity → "Quantity" (highest first)
 *   - <p>Showing {shown} of {total} items</p>
 *   - if anything matches: <ul aria-label="Inventory"> with <li>"{name} ×{quantity}"</li>
 *   - if nothing matches: <p>No items match your filters</p> and a
 *     <button type="button">Clear filters</button> that resets search AND
 *     category (but not the sort)
 *
 * The `items` prop is frozen, so don't mutate it.
 */

export type Category = 'wood' | 'fish' | 'ore';

export type InventoryItem = {
  id: string;
  name: string;
  category: Category;
  quantity: number;
};

export function Inventory({ items }: { items: readonly InventoryItem[] }) {
  return null; // TODO
}
