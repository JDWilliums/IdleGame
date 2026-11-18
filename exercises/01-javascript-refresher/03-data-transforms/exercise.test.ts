import { describe, expect, it } from 'vitest';
import {
  groupByCategory,
  inStock,
  summarize,
  toLookup,
  topByValue,
  totalValue,
  type Item,
} from './exercise';

function freezeAll(items: Item[]): readonly Item[] {
  items.forEach((i) => Object.freeze(i));
  return Object.freeze(items);
}

const makeItems = () =>
  freezeAll([
    { id: 'oak_log', name: 'Oak Log', category: 'wood', value: 5, quantity: 30 },
    { id: 'willow_log', name: 'Willow Log', category: 'wood', value: 12, quantity: 4 },
    { id: 'trout', name: 'Trout', category: 'fish', value: 20, quantity: 0 },
    { id: 'copper_ore', name: 'Copper Ore', category: 'ore', value: 8, quantity: 12 },
    { id: 'shrimp', name: 'Shrimp', category: 'fish', value: 2, quantity: 48 },
  ]);

describe('totalValue', () => {
  it('sums value × quantity', () => {
    // 150 + 48 + 0 + 96 + 96
    expect(totalValue(makeItems())).toBe(390);
  });
  it('is 0 for no items', () => {
    expect(totalValue([])).toBe(0);
  });
});

describe('inStock', () => {
  it('keeps only items with quantity above 0, in order', () => {
    expect(inStock(makeItems()).map((i) => i.id)).toEqual([
      'oak_log',
      'willow_log',
      'copper_ore',
      'shrimp',
    ]);
  });
});

describe('toLookup', () => {
  it('maps id → item', () => {
    const items = makeItems();
    const lookup = toLookup(items);
    expect(Object.keys(lookup)).toHaveLength(5);
    expect(lookup.trout).toBe(items[2]);
    expect(lookup.copper_ore?.name).toBe('Copper Ore');
  });
});

describe('groupByCategory', () => {
  it('groups items by category, preserving order', () => {
    const groups = groupByCategory(makeItems());
    expect(groups.wood?.map((i) => i.id)).toEqual(['oak_log', 'willow_log']);
    expect(groups.fish?.map((i) => i.id)).toEqual(['trout', 'shrimp']);
    expect(groups.ore?.map((i) => i.id)).toEqual(['copper_ore']);
  });

  it('only creates keys for categories that appear', () => {
    expect(Object.keys(groupByCategory(makeItems())).sort()).toEqual(['fish', 'ore', 'wood']);
  });
});

describe('topByValue', () => {
  it('returns the n most valuable stacks, highest first, ties by name', () => {
    // oak 150, copper 96, shrimp 96, willow 48, trout 0 (excluded)
    expect(topByValue(makeItems(), 3).map((i) => i.id)).toEqual([
      'oak_log',
      'copper_ore',
      'shrimp',
    ]);
  });

  it('excludes empty stacks and handles n larger than the list', () => {
    expect(topByValue(makeItems(), 10).map((i) => i.id)).toEqual([
      'oak_log',
      'copper_ore',
      'shrimp',
      'willow_log',
    ]);
  });
});

describe('summarize', () => {
  it('summarises the bank', () => {
    expect(summarize(makeItems())).toEqual({
      totalQuantity: 94,
      categories: ['fish', 'ore', 'wood'],
      mostValuable: 'Oak Log',
    });
  });

  it('handles an empty bank', () => {
    expect(summarize([])).toEqual({ totalQuantity: 0, categories: [], mostValuable: null });
  });

  it('returns null mostValuable when every stack is worth 0', () => {
    const items = freezeAll([
      { id: 'trout', name: 'Trout', category: 'fish', value: 20, quantity: 0 },
    ]);
    expect(summarize(items).mostValuable).toBeNull();
  });
});
