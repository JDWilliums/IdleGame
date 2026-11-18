import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { typeErrors } from '../../_support/typecheck';
import { getItem, inventoryValue, itemsInCategory, sellValue } from './exercise';

describe('types (checked by the TypeScript compiler)', () => {
  it('types.check.ts compiles with no errors', () => {
    // If this fails, the list below shows the exact compiler errors.
    expect(typeErrors(path.join(import.meta.dirname, 'types.check.ts'))).toEqual([]);
  });
});

describe('getItem', () => {
  it('returns the definition for an id', () => {
    expect(getItem('trout')).toEqual({ name: 'Trout', category: 'fish', sellPrice: 20 });
    expect(getItem('bronze_bar').description).toMatch(/copper/i);
  });
});

describe('sellValue', () => {
  it('multiplies sell price by quantity', () => {
    expect(sellValue('oak_log', 10)).toBe(50);
    expect(sellValue('bronze_bar', 0)).toBe(0);
  });
});

describe('inventoryValue', () => {
  it('sums the sell value of every stack', () => {
    expect(inventoryValue({ oak_log: 10, trout: 2, bronze_bar: 1 })).toBe(50 + 40 + 30);
  });
  it('is 0 for an empty inventory', () => {
    expect(inventoryValue({})).toBe(0);
  });
});

describe('itemsInCategory', () => {
  it('lists ids in a category, in definition order', () => {
    expect(itemsInCategory('log')).toEqual(['oak_log', 'willow_log']);
    expect(itemsInCategory('bar')).toEqual(['bronze_bar']);
  });
});
