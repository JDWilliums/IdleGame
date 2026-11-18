// Reference solution for 02-01. Read it only AFTER your own version passes.

export type ItemCategory = 'log' | 'fish' | 'ore' | 'bar';

export type ItemDefinition = {
  name: string;
  category: ItemCategory;
  sellPrice: number;
  description?: string;
};

export const ITEMS = {
  oak_log: { name: 'Oak Log', category: 'log', sellPrice: 5 },
  willow_log: { name: 'Willow Log', category: 'log', sellPrice: 12 },
  trout: { name: 'Trout', category: 'fish', sellPrice: 20 },
  copper_ore: { name: 'Copper Ore', category: 'ore', sellPrice: 8 },
  bronze_bar: {
    name: 'Bronze Bar',
    category: 'bar',
    sellPrice: 30,
    description: 'Smelted from copper. Used in smithing.',
  },
} as const satisfies Record<string, ItemDefinition>;

export type ItemId = keyof typeof ITEMS;

export function getItem(id: ItemId): ItemDefinition {
  return ITEMS[id]; // no `undefined`: the key is guaranteed to exist
}

export function sellValue(id: ItemId, quantity: number): number {
  return getItem(id).sellPrice * quantity;
}

export type Inventory = Partial<Record<ItemId, number>>;

export function inventoryValue(inventory: Inventory): number {
  // Object.entries() types keys as `string` (an object may have extra keys at
  // runtime, thanks to structural typing). Looping over the KNOWN ids instead
  // keeps everything typed without a cast.
  const ids = Object.keys(ITEMS) as ItemId[]; // a safe cast: these are exactly ITEMS' keys
  return ids.reduce((total, id) => total + sellValue(id, inventory[id] ?? 0), 0);
}

export function itemsInCategory(category: ItemCategory): ItemId[] {
  return (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].category === category);
}
