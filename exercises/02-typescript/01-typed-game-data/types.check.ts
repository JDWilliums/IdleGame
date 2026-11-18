// Type tests for 02-01. Every line here must compile.
//   Expect<Equal<A, B>>          fails unless A and B are exactly the same type.
//   A "ts-expect-error" comment  means the NEXT line MUST be a type error.
import type { Equal, Expect } from '../../_support/type-assertions';
import {
  ITEMS,
  getItem,
  itemsInCategory,
  sellValue,
  type Inventory,
  type ItemCategory,
  type ItemDefinition,
  type ItemId,
} from './exercise';

// Task 1
type _t1 = Expect<Equal<ItemCategory, 'log' | 'fish' | 'ore' | 'bar'>>;

// Task 2
export const valid: ItemDefinition = { name: 'Ash Log', category: 'log', sellPrice: 7 };
export const withDescription: ItemDefinition = {
  name: 'Gem',
  category: 'ore',
  sellPrice: 100,
  description: 'Shiny',
};
// @ts-expect-error: 'gem' is not an ItemCategory
export const badCategory: ItemDefinition = { name: 'x', category: 'gem', sellPrice: 1 };
// @ts-expect-error: sellPrice is required
export const missingPrice: ItemDefinition = { name: 'x', category: 'log' };
// @ts-expect-error: sellPrice must be a number
export const stringPrice: ItemDefinition = { name: 'x', category: 'log', sellPrice: '5' };
type _t2 = Expect<Equal<ItemDefinition['description'], string | undefined>>;

// Task 3: literal types are preserved, and every entry is a valid ItemDefinition
type _t3a = Expect<Equal<(typeof ITEMS)['trout']['sellPrice'], 20>>;
type _t3b = Expect<Equal<(typeof ITEMS)['oak_log']['category'], 'log'>>;
type _t3c = Expect<(typeof ITEMS)[ItemId] extends ItemDefinition ? true : false>;

// Task 4
type _t4 = Expect<Equal<ItemId, 'oak_log' | 'willow_log' | 'trout' | 'copper_ore' | 'bronze_bar'>>;

// Tasks 5 & 6
type _t5 = Expect<Equal<ReturnType<typeof getItem>, ItemDefinition>>;
// @ts-expect-error: 'diamond' is not an ItemId
getItem('diamond');
// @ts-expect-error: typo
sellValue('oak_logg', 1);

// Task 7
export const inv: Inventory = { oak_log: 3, trout: 1 };
export const empty: Inventory = {};
// @ts-expect-error: unknown item id
export const badInv: Inventory = { diamond: 1 };
type _t7 = Expect<Equal<Inventory['trout'], number | undefined>>;

// Task 9
type _t9 = Expect<Equal<ReturnType<typeof itemsInCategory>, ItemId[]>>;
// @ts-expect-error: 'gem' is not a category
itemsInCategory('gem');
