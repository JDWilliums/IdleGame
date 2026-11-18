/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 01-03 · data-transforms
 * Lesson:  01.3 Array & object power tools
 * Run:     npm run watch 01-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Your game's bank screen needs data in several shapes. Write each transform
 * with array/object methods. None of them may mutate the input (the tests
 * freeze it).
 *
 * "Stack value" of an item = value × quantity.
 *
 * TASK 1 · totalValue(items)      → sum of every item's stack value
 * TASK 2 · inStock(items)         → only items with quantity > 0 (same order)
 * TASK 3 · toLookup(items)        → an object mapping id → item
 * TASK 4 · groupByCategory(items) → { wood: [...], fish: [...] }. Only
 *                                   categories that actually appear get a key.
 * TASK 5 · topByValue(items, n)   → the n items with the highest stack value,
 *                                   highest first; ties broken by name (A→Z).
 *                                   Items with 0 quantity are excluded.
 * TASK 6 · summarize(items)       → {
 *                                      totalQuantity: sum of all quantities,
 *                                      categories: distinct categories, sorted A→Z,
 *                                      mostValuable: NAME of the item with the
 *                                        highest stack value, or null if no item
 *                                        has a stack value above 0
 *                                    }
 */

export type Category = 'wood' | 'fish' | 'ore' | 'bar';

export type Item = {
  id: string;
  name: string;
  category: Category;
  value: number;
  quantity: number;
};

export type Summary = {
  totalQuantity: number;
  categories: Category[];
  mostValuable: string | null;
};

export function totalValue(items: readonly Item[]): number {
  throw new Error('Not implemented yet');
}

export function inStock(items: readonly Item[]): Item[] {
  throw new Error('Not implemented yet');
}

export function toLookup(items: readonly Item[]): Record<string, Item> {
  throw new Error('Not implemented yet');
}

export function groupByCategory(items: readonly Item[]): Partial<Record<Category, Item[]>> {
  throw new Error('Not implemented yet');
}

export function topByValue(items: readonly Item[], n: number): Item[] {
  throw new Error('Not implemented yet');
}

export function summarize(items: readonly Item[]): Summary {
  throw new Error('Not implemented yet');
}
