// Type tests for 02-02. Every line here must compile.
//   Expect<Equal<A, B>>          fails unless A and B are exactly the same type.
//   A "ts-expect-error" comment  means the NEXT line MUST be a type error.
import type { Equal, Expect } from '../../_support/type-assertions';
import { isItemStack, type ItemStack } from './exercise';

// isItemStack must be a type predicate
type _t1 = Expect<Equal<typeof isItemStack, (value: unknown) => value is ItemStack>>;

// …which means it narrows:
export function useGuard(data: unknown): number {
  if (isItemStack(data)) {
    return data.quantity; // only compiles if data is narrowed to ItemStack
  }
  return 0;
}
