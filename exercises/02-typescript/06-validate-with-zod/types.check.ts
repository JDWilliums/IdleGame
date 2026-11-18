// Type tests for 02-06. Every line here must compile.
//   Expect<Equal<A, B>>          fails unless A and B are exactly the same type.
//   A "ts-expect-error" comment  means the NEXT line MUST be a type error.
import type { Equal, Expect } from '../../_support/type-assertions';
import { assertIsString, isRecord, type SaveFile } from './exercise';

// The inferred SaveFile type has exactly these fields:
type _t1 = Expect<Equal<keyof SaveFile, 'version' | 'playerName' | 'gold' | 'skills' | 'bank' | 'lastSavedAt'>>;
type _t2 = Expect<Equal<SaveFile['version'], 1>>;
type _t3 = Expect<Equal<SaveFile['playerName'], string>>;
type _t4 = Expect<Equal<SaveFile['skills'], Record<string, { xp: number }>>>;
// After parsing, bank is always present (the default fills it in):
type _t5 = Expect<Equal<SaveFile['bank'], Record<string, number>>>;

type _t6 = Expect<Equal<typeof isRecord, (value: unknown) => value is Record<string, unknown>>>;
type _t7 = Expect<Equal<typeof assertIsString, (value: unknown, name: string) => asserts value is string>>;

export function narrowsAfterAssert(value: unknown): string {
  assertIsString(value, 'value');
  return value.toUpperCase(); // only compiles if `value` is narrowed to string
}
