import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { typeErrors } from '../../_support/typecheck';
import { createRegistry, err, first, groupBy, last, mapResult, ok, pluck } from './exercise';

describe('types (checked by the TypeScript compiler)', () => {
  it('types.check.ts compiles with no errors', () => {
    expect(typeErrors(path.join(import.meta.dirname, 'types.check.ts'))).toEqual([]);
  });
});

const items = [
  { id: 'oak', category: 'log', value: 5 },
  { id: 'trout', category: 'fish', value: 20 },
  { id: 'ash', category: 'log', value: 7 },
] as const;

describe('first / last', () => {
  it('returns the ends of an array', () => {
    expect(first([1, 2, 3])).toBe(1);
    expect(last([1, 2, 3])).toBe(3);
  });
  it('returns undefined for empty arrays', () => {
    expect(first([])).toBeUndefined();
    expect(last([])).toBeUndefined();
  });
});

describe('groupBy', () => {
  it('groups by the computed key, preserving order', () => {
    expect(groupBy(items, (i) => i.category)).toEqual({
      log: [items[0], items[2]],
      fish: [items[1]],
    });
  });
  it('works with number keys', () => {
    expect(groupBy([1, 2, 3, 4], (n) => n % 2)).toEqual({ 1: [1, 3], 0: [2, 4] });
  });
  it('returns {} for no items', () => {
    expect(groupBy([], (x: string) => x)).toEqual({});
  });
});

describe('pluck', () => {
  it('extracts one property from each item', () => {
    expect(pluck(items, 'id')).toEqual(['oak', 'trout', 'ash']);
    expect(pluck(items, 'value')).toEqual([5, 20, 7]);
  });
});

describe('Result helpers', () => {
  it('creates ok and err results', () => {
    expect(ok(5)).toEqual({ ok: true, value: 5 });
    expect(err('bad')).toEqual({ ok: false, error: 'bad' });
  });
  it('maps ok values and passes errors through untouched', () => {
    expect(mapResult(ok(2), (n: number) => n * 10)).toEqual({ ok: true, value: 20 });
    const failure = err('bad');
    let called = false;
    expect(
      mapResult(failure, () => {
        called = true;
        return 1;
      }),
    ).toEqual({ ok: false, error: 'bad' });
    expect(called).toBe(false);
  });
});

describe('createRegistry', () => {
  it('registers and retrieves items', () => {
    const reg = createRegistry<{ id: string; hp: number }>();
    reg.register({ id: 'goblin', hp: 10 });
    reg.register({ id: 'orc', hp: 30 });
    expect(reg.get('orc')).toEqual({ id: 'orc', hp: 30 });
    expect(reg.get('dragon')).toBeUndefined();
    expect(reg.all().map((m) => m.id)).toEqual(['goblin', 'orc']);
  });
  it('throws on duplicate ids', () => {
    const reg = createRegistry<{ id: string }>();
    reg.register({ id: 'a' });
    expect(() => reg.register({ id: 'a' })).toThrow();
  });
  it('keeps registries independent', () => {
    const a = createRegistry<{ id: string }>();
    const b = createRegistry<{ id: string }>();
    a.register({ id: 'x' });
    expect(b.all()).toEqual([]);
  });
});
