/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 02-04 · generics
 * Lesson:  02.5 Generics
 * Run:     npm run watch 02-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This time YOU write the signatures. The parameters below are deliberately
 * untyped. Add type parameters and annotations so that types.check.ts compiles
 * (the editor will show "implicitly has an 'any' type" until you do).
 * No `any` allowed.
 *
 * TASK 1 · first(arr) / last(arr)
 *   Return the first/last element, or undefined for an empty array.
 *   first([1, 2]) must be typed `number | undefined`. Accept readonly arrays.
 *
 * TASK 2 · groupBy(items, getKey)
 *   Group items by the key returned from getKey (a string/number/symbol key).
 *   The result type is Partial<Record<K, T[]>> where K is the key type.
 *   (Don't use Object.groupBy. Write it yourself with reduce or a loop.)
 *
 * TASK 3 · pluck(items, key)
 *   Return item[key] for every item. `key` must be a real key of the items,
 *   and the result type must be an array of that property's type.
 *
 * TASK 4 · Result<T, E = string>, ok(value), err(error), mapResult(result, fn)
 *   Result is { ok: true; value: T } | { ok: false; error: E }.
 *   ok(value)  returns Result<T, never>
 *   err(error) returns Result<never, E>
 *   mapResult(result, fn) returns a new Result with fn applied to the value if
 *   ok, or the same error if not: Result<U, E>.
 *
 * TASK 5 · createRegistry<T>()
 *   T must be constrained to objects with an `id: string`.
 *   Returns { register(item), get(id), all() }:
 *     register throws an Error if an item with that id already exists
 *     get returns the item or undefined
 *     all returns every item in registration order
 */

export function first(arr) {
  throw new Error('Not implemented yet');
}

export function last(arr) {
  throw new Error('Not implemented yet');
}

export function groupBy(items, getKey) {
  throw new Error('Not implemented yet');
}

export function pluck(items, key) {
  throw new Error('Not implemented yet');
}

export type Result = unknown; // TODO: Result<T, E = string>

export function ok(value) {
  throw new Error('Not implemented yet');
}

export function err(error) {
  throw new Error('Not implemented yet');
}

export function mapResult(result, fn) {
  throw new Error('Not implemented yet');
}

export function createRegistry() {
  throw new Error('Not implemented yet');
}
