/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 01-01 · immutable-updates
 * Lesson:  01.1 Values, references & immutability
 * Run:     npm run watch 01-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * You're writing the first pure "state update" functions of a game. Every
 * function takes data and returns NEW data. It must NEVER modify its inputs.
 * The tests freeze every input with Object.freeze, so a mutation throws a
 * TypeError and fails the test.
 *
 * The tests also check STRUCTURAL SHARING: parts of the state you didn't change
 * must be the *same reference* in the result (e.g. if you only change skills,
 * `result.inventory === state.inventory`). Don't deep-copy everything.
 *
 * TASK 1 · addItem(inventory, itemId, quantity)
 *   Return a new inventory with `quantity` more of `itemId` (add the key if it
 *   isn't there yet). If quantity is not a positive integer, throw a RangeError.
 *
 * TASK 2 · removeItem(inventory, itemId, quantity)
 *   Return a new inventory with `quantity` fewer of `itemId`.
 *   - If that leaves exactly 0, REMOVE the key entirely.
 *   - If there aren't enough (or none at all), throw an Error.
 *
 * TASK 3 · addSkillXp(state, skillId, amount)
 *   Return a new GameState where skills[skillId].xp has increased by `amount`.
 *   If the skill doesn't exist yet, create it as { xp: amount, level: 1 }.
 *   Everything you didn't change must keep its original reference.
 *
 * TASK 4 · spendGold(state, amount)
 *   Return a new state with `amount` less gold. Throw an Error if there isn't
 *   enough gold. Special case: if amount is 0, return the SAME state object
 *   (nothing changed, so there's no reason to create a new object; React would
 *   otherwise re-render for nothing).
 *
 * TASK 5 · sortedInventory(inventory)
 *   Return the inventory as an array of [itemId, quantity] pairs, sorted by
 *   quantity (highest first), ties broken by itemId alphabetically.
 */

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
  throw new Error('Not implemented yet');
}

export function removeItem(inventory: Inventory, itemId: string, quantity: number): Inventory {
  throw new Error('Not implemented yet');
}

export function addSkillXp(state: GameState, skillId: string, amount: number): GameState {
  throw new Error('Not implemented yet');
}

export function spendGold(state: GameState, amount: number): GameState {
  throw new Error('Not implemented yet');
}

export function sortedInventory(inventory: Inventory): Array<[string, number]> {
  throw new Error('Not implemented yet');
}
