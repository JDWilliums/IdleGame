/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 02-02 · narrowing
 * Lesson:  02.3 Unions & narrowing
 * Run:     npm run watch 02-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * No `as`, no `!`, no `any`. Narrow with typeof / in / instanceof / equality
 * and type predicates only.
 *
 * TASK 1 · isItemStack(value: unknown)
 *   A TYPE GUARD (return type `value is ItemStack`) that returns true only for
 *   objects with:  itemId: a non-empty string,  quantity: a positive integer.
 *   (types.check.ts verifies the signature.)
 *
 * TASK 2 · describeReward(reward)
 *   number        → "50 gold"
 *   string        → "1 × oak_log"          (a single item, by id)
 *   ItemStack     → "3 × trout"
 *   ItemStack[]   → each stack described, joined with ", "  e.g. "3 × trout, 1 × gem"
 *   [] / null / undefined → "nothing"
 *   (Use the multiplication sign × — copy it from here.)
 *
 * TASK 3 · parseQuantity(input: unknown): number | null
 *   - a number that is a non-negative integer → that number
 *   - a string of only digits (after trimming whitespace) → its numeric value
 *       "12" → 12, "  7 " → 7, "007" → 7
 *   - anything else → null       ("", "1.5", "-3", "1e3", "ten", NaN, {}, null…)
 *
 * TASK 4 · getErrorMessage(error: unknown): string
 *   - an Error instance           → its message
 *   - a string                    → the string itself
 *   - an object with a string `message` property → that message
 *   - anything else               → "Unknown error"
 */

export type ItemStack = { itemId: string; quantity: number };

export type Reward = number | string | ItemStack | ItemStack[] | null | undefined;

export function isItemStack(value: unknown): boolean {
  // TODO: change the return type to a type predicate, then implement
  throw new Error('Not implemented yet');
}

export function describeReward(reward: Reward): string {
  throw new Error('Not implemented yet');
}

export function parseQuantity(input: unknown): number | null {
  throw new Error('Not implemented yet');
}

export function getErrorMessage(error: unknown): string {
  throw new Error('Not implemented yet');
}
