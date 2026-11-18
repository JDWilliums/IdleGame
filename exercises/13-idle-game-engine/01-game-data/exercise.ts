/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 13-01 · game-data
 * Lesson:  13.2 Data-driven design
 * Run:     npm run watch 13-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Define your game's actions as typed data, derive types from it, and write a
 * content validator that catches mistakes before players see them.
 * types.check.ts grades the types.
 *
 * TASK 1 · ActionDefinition
 *   An object type with:
 *     skill: SkillId,  name: string,  level: number,  durationMs: number,  xp: number,
 *     inputs?: readonly ItemStack[]   (optional)
 *     outputs: readonly ItemStack[]
 *   where ItemStack's `item` must be an ItemId (so typos in item ids are compile errors).
 *
 * TASK 2 · ACTIONS: make it keep its literal keys AND be checked against
 *   ActionDefinition (lesson 13.2 / 02.6).
 *
 * TASK 3 · ActionId: derive the union of action ids from ACTIONS.
 *
 * TASK 4 · getAction(id): the definition for an id.
 *
 * TASK 5 · actionsForSkill(skill): the ids of that skill's actions, sorted by
 *   level (lowest first), ties broken by name (A→Z).
 *
 * TASK 6 · unlockedActions(skill, level): like actionsForSkill, but only
 *   actions whose level requirement is ≤ level.
 *
 * TASK 7 · validateGameData(actions, items, skills): returns a list of problems
 *   (an empty list means valid). It takes LOOSELY typed data, so tests can pass
 *   broken content. For each action, in key order, check in THIS order, using
 *   these exact messages:
 *     `${id}: unknown skill "${skill}"`
 *     `${id}: level must be between 1 and 99`          (integers 1..99)
 *     `${id}: durationMs must be positive`
 *     `${id}: must have at least one output`
 *     for every input then every output stack:
 *       `${id}: unknown item "${item}"`
 *       `${id}: quantities must be positive whole numbers`   (report this one at most once per action)
 *   Then, for each skill in key order with no actions at all:
 *     `${skillId}: has no actions`
 */

export const SKILLS = {
  woodcutting: { name: 'Woodcutting', icon: '🪓' },
  mining: { name: 'Mining', icon: '⛏️' },
  smithing: { name: 'Smithing', icon: '🔨' },
} as const satisfies Record<string, { name: string; icon: string }>;

export const ITEMS = {
  oak_log: { name: 'Oak Log', sellPrice: 1 },
  willow_log: { name: 'Willow Log', sellPrice: 4 },
  copper_ore: { name: 'Copper Ore', sellPrice: 2 },
  tin_ore: { name: 'Tin Ore', sellPrice: 2 },
  bronze_bar: { name: 'Bronze Bar', sellPrice: 9 },
} as const satisfies Record<string, { name: string; sellPrice: number }>;

export type SkillId = keyof typeof SKILLS;
export type ItemId = keyof typeof ITEMS;

export type ItemStack = { item: string; qty: number }; // TODO (Task 1): `item` should be an ItemId

export type ActionDefinition = unknown; // TODO (Task 1)

export const ACTIONS = {
  chop_oak: { skill: 'woodcutting', name: 'Oak Tree', level: 1, durationMs: 3000, xp: 10, outputs: [{ item: 'oak_log', qty: 1 }] },
  chop_willow: { skill: 'woodcutting', name: 'Willow Tree', level: 10, durationMs: 4000, xp: 22, outputs: [{ item: 'willow_log', qty: 1 }] },
  mine_tin: { skill: 'mining', name: 'Tin Rock', level: 1, durationMs: 3000, xp: 7, outputs: [{ item: 'tin_ore', qty: 1 }] },
  mine_copper: { skill: 'mining', name: 'Copper Rock', level: 1, durationMs: 3000, xp: 7, outputs: [{ item: 'copper_ore', qty: 1 }] },
  smelt_bronze: {
    skill: 'smithing',
    name: 'Bronze Bar',
    level: 1,
    durationMs: 2500,
    xp: 8,
    inputs: [
      { item: 'copper_ore', qty: 1 },
      { item: 'tin_ore', qty: 1 },
    ],
    outputs: [{ item: 'bronze_bar', qty: 1 }],
  },
}; // TODO (Task 2)

export type ActionId = string; // TODO (Task 3)

export function getAction(id: ActionId): ActionDefinition {
  throw new Error('Not implemented yet');
}

export function actionsForSkill(skill: SkillId): ActionId[] {
  throw new Error('Not implemented yet');
}

export function unlockedActions(skill: SkillId, level: number): ActionId[] {
  throw new Error('Not implemented yet');
}

// Loosely typed on purpose, so the validator can be tested with broken data.
export type RawStack = { item: string; qty: number };
export type RawAction = {
  skill: string;
  name: string;
  level: number;
  durationMs: number;
  xp: number;
  inputs?: readonly RawStack[];
  outputs: readonly RawStack[];
};

export function validateGameData(
  actions: Record<string, RawAction>,
  items: Record<string, unknown>,
  skills: Record<string, unknown>,
): string[] {
  throw new Error('Not implemented yet');
}
