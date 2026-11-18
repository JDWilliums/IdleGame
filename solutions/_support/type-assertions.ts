// Tiny helpers for writing type-level tests (used in *.check.ts files).
//
//   type _ = Expect<Equal<typeof x, number>>;   // compile error if not equal
//
// These are the same helpers used by the popular "type-challenges" repo.

export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type Expect<T extends true> = T;

export type IsAny<T> = 0 extends 1 & T ? true : false;
