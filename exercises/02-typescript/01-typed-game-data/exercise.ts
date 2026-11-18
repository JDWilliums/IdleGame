/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 02-01 · typed-game-data
 * Lessons: 02.2 Object types & interfaces · 02.6 (for `satisfies`)
 * Run:     npm run watch 02-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This exercise grades your TYPES as well as your code. `types.check.ts` is
 * compiled by the real TypeScript compiler. Read it to see exactly what's
 * expected, and expect red squiggles there until you're done.
 *
 * TASK 1 · ItemCategory
 *   Replace `string` with a union of the literal types 'log', 'fish', 'ore', 'bar'.
 *
 * TASK 2 · ItemDefinition
 *   Replace the placeholder with an object type:
 *     name: string, category: ItemCategory, sellPrice: number,
 *     description: an OPTIONAL string
 *
 * TASK 3 · ITEMS
 *   Make the object below keep its literal keys and values (so that
 *   `typeof ITEMS.trout.sellPrice` is exactly 20) AND be checked against
 *   ItemDefinition. Two keywords after the closing brace do it (lesson 02.6).
 *
 * TASK 4 · ItemId
 *   DERIVE the union of item ids from ITEMS. Don't write the ids by hand, so
 *   that adding an item to ITEMS automatically updates the type.
 *
 * TASK 5 · getItem(id)          → the ItemDefinition for an id
 * TASK 6 · sellValue(id, qty)   → sellPrice × qty
 *
 * TASK 7 · Inventory
 *   An object whose keys are ItemIds (all optional) and whose values are numbers.
 *   One line using two utility types.
 *
 * TASK 8 · inventoryValue(inv)  → the total sell value of everything in the inventory
 * TASK 9 · itemsInCategory(cat) → the ids of items in that category, in ITEMS order
 */

export type ItemCategory = string; // TODO (Task 1)

export type ItemDefinition = { placeholder: never }; // TODO (Task 2)

export const ITEMS = {
  oak_log: { name: 'Oak Log', category: 'log', sellPrice: 5 },
  willow_log: { name: 'Willow Log', category: 'log', sellPrice: 12 },
  trout: { name: 'Trout', category: 'fish', sellPrice: 20 },
  copper_ore: { name: 'Copper Ore', category: 'ore', sellPrice: 8 },
  bronze_bar: {
    name: 'Bronze Bar',
    category: 'bar',
    sellPrice: 30,
    description: 'Smelted from copper. Used in smithing.',
  },
}; // TODO (Task 3)

export type ItemId = string; // TODO (Task 4)

export function getItem(id: ItemId): ItemDefinition {
  throw new Error('Not implemented yet');
}

export function sellValue(id: ItemId, quantity: number): number {
  throw new Error('Not implemented yet');
}

export type Inventory = unknown; // TODO (Task 7)

export function inventoryValue(inventory: Inventory): number {
  throw new Error('Not implemented yet');
}

export function itemsInCategory(category: ItemCategory): ItemId[] {
  throw new Error('Not implemented yet');
}
