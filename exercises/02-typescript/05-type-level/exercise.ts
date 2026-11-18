/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 02-05 · type-level
 * Lesson:  02.6 Type operators & utility types
 * Run:     npm run watch 02-05
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pure type-level programming: no runtime code at all. Rebuild some of
 * TypeScript's utility types yourself, then a few new ones. You may NOT use the
 * built-in utility you're re-implementing (e.g. no `Partial` inside MyPartial),
 * but you MAY use others (e.g. `Exclude` inside MyOmit).
 *
 * The only test runs the compiler over types.check.ts, so open it side by side
 * with this file. Hover over types in VS Code to see what they evaluate to.
 *
 *  1. MyPartial<T>      every property optional              (mapped type with ?)
 *  2. MyReadonly<T>     every property readonly
 *  3. MyPick<T, K>      only the keys K
 *  4. MyOmit<T, K>      every key except K
 *  5. ValueOf<T>        union of all property value types    { a: 1; b: 'x' } → 1 | 'x'
 *  6. ElementOf<T>      the element type of an array type, `never` for non-arrays
 *                       (conditional type with `infer`)
 *  7. Nullable<T>       T | null
 *  8. Handlers<E>       for a union of event names E, an object with one
 *                       `on<EventName>` key per event (capitalised), each a
 *                       function () => void.
 *                       Handlers<'click' | 'hover'> = { onClick: () => void; onHover: () => void }
 *                       (mapped type + template literal type + Capitalize + `as` key remapping)
 *  9. DeepReadonly<T>   readonly all the way down, through nested objects AND arrays
 */

export type MyPartial<T> = unknown;

export type MyReadonly<T> = unknown;

export type MyPick<T, K extends keyof T> = unknown;

export type MyOmit<T, K extends keyof T> = unknown;

export type ValueOf<T> = unknown;

export type ElementOf<T> = unknown;

export type Nullable<T> = unknown;

export type Handlers<E extends string> = unknown;

export type DeepReadonly<T> = unknown;
