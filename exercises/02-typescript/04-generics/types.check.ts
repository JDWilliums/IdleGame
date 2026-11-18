// Type tests for 02-04. Every line here must compile.
//   Expect<Equal<A, B>>          fails unless A and B are exactly the same type.
//   A "ts-expect-error" comment  means the NEXT line MUST be a type error.
import type { Equal, Expect } from '../../_support/type-assertions';
import { createRegistry, err, first, groupBy, last, mapResult, ok, pluck, type Result } from './exercise';

type Item = { id: string; category: 'log' | 'fish'; value: number };
declare const items: Item[];
declare const frozen: readonly string[];

// Task 1
const f = first([1, 2, 3]);
type _t1a = Expect<Equal<typeof f, number | undefined>>;
const l = last(frozen);
type _t1b = Expect<Equal<typeof l, string | undefined>>;

// Task 2
const groups = groupBy(items, (item) => item.category);
type _t2 = Expect<Equal<typeof groups, Partial<Record<'log' | 'fish', Item[]>>>>;

// Task 3
const values = pluck(items, 'value');
type _t3a = Expect<Equal<typeof values, number[]>>;
const categories = pluck(items, 'category');
type _t3b = Expect<Equal<typeof categories, ('log' | 'fish')[]>>;
// @ts-expect-error: 'weight' is not a key of Item
pluck(items, 'weight');

// Task 4
type _t4a = Expect<Equal<Result<number>, { ok: true; value: number } | { ok: false; error: string }>>;
type _t4b = Expect<Equal<Result<number, Error>, { ok: true; value: number } | { ok: false; error: Error }>>;
const good = ok(5);
type _t4c = Expect<Equal<typeof good, Result<number, never>>>;
const bad = err('nope');
type _t4d = Expect<Equal<typeof bad, Result<never, string>>>;
declare const parsed: Result<number>;
const mapped = mapResult(parsed, (n) => n.toFixed(2));
type _t4e = Expect<Equal<typeof mapped, Result<string, string>>>;

// Task 5
const registry = createRegistry<{ id: string; hp: number }>();
registry.register({ id: 'goblin', hp: 10 });
const goblin = registry.get('goblin');
type _t5a = Expect<Equal<typeof goblin, { id: string; hp: number } | undefined>>;
const all = registry.all();
type _t5b = Expect<Equal<typeof all, { id: string; hp: number }[]>>;
// @ts-expect-error: hp is required
registry.register({ id: 'orc' });
// @ts-expect-error: T must have an `id: string`
createRegistry<{ name: string }>();
