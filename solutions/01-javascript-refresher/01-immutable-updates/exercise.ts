// Reference solution for 01-01. Read it only AFTER your own version passes.

export type Inventory = Record<string, number>;

export type Skill = {
  xp: number;
  level: number;
};

export type GameState = {
  gold: number;
  inventory: Inventory;
  skills: Record<string, Skill>;
};

export function addItem(inventory: Inventory, itemId: string, quantity: number): Inventory {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new RangeError(`Quantity must be a positive integer, got ${quantity}`);
  }
  // `?? 0` handles a missing key. Computed key syntax [itemId] sets that property.
  return { ...inventory, [itemId]: (inventory[itemId] ?? 0) + quantity };
}

export function removeItem(inventory: Inventory, itemId: string, quantity: number): Inventory {
  const have = inventory[itemId] ?? 0;
  if (have < quantity) {
    throw new Error(`Cannot remove ${quantity} ${itemId}: only have ${have}`);
  }
  const remaining = have - quantity;
  if (remaining === 0) {
    // Rest destructuring builds a copy WITHOUT the key. Nothing is mutated.
    const { [itemId]: _removed, ...rest } = inventory;
    return rest;
  }
  return { ...inventory, [itemId]: remaining };
}

export function addSkillXp(state: GameState, skillId: string, amount: number): GameState {
  const current = state.skills[skillId];
  const updated: Skill = current ? { ...current, xp: current.xp + amount } : { xp: amount, level: 1 };
  // Copy each level on the path to the change; everything else is shared.
  return {
    ...state,
    skills: { ...state.skills, [skillId]: updated },
  };
}

export function spendGold(state: GameState, amount: number): GameState {
  if (amount === 0) return state; // no change → same reference → no wasted re-render
  if (amount > state.gold) {
    throw new Error(`Cannot spend ${amount} gold: only have ${state.gold}`);
  }
  return { ...state, gold: state.gold - amount };
}

export function sortedInventory(inventory: Inventory): Array<[string, number]> {
  // Object.entries already returns a fresh array, so .sort() here wouldn't mutate
  // the inventory, but toSorted makes the intent obvious.
  return Object.entries(inventory).toSorted(
    ([idA, qtyA], [idB, qtyB]) => qtyB - qtyA || idA.localeCompare(idB),
  );
}
