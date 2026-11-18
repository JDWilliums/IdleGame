// Reference solution for 13-01. Read it only AFTER your own version passes.

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

export type ItemStack = { item: ItemId; qty: number };

export type ActionDefinition = {
  skill: SkillId;
  name: string;
  level: number;
  durationMs: number;
  xp: number;
  inputs?: readonly ItemStack[];
  outputs: readonly ItemStack[];
};

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
} as const satisfies Record<string, ActionDefinition>;

export type ActionId = keyof typeof ACTIONS;

// Computed once at module load: static data never changes.
const ACTION_IDS = Object.keys(ACTIONS) as ActionId[];

export function getAction(id: ActionId): ActionDefinition {
  return ACTIONS[id];
}

export function actionsForSkill(skill: SkillId): ActionId[] {
  return ACTION_IDS.filter((id) => ACTIONS[id].skill === skill).toSorted(
    (a, b) => ACTIONS[a].level - ACTIONS[b].level || ACTIONS[a].name.localeCompare(ACTIONS[b].name),
  );
}

export function unlockedActions(skill: SkillId, level: number): ActionId[] {
  return actionsForSkill(skill).filter((id) => ACTIONS[id].level <= level);
}

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

const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;

export function validateGameData(
  actions: Record<string, RawAction>,
  items: Record<string, unknown>,
  skills: Record<string, unknown>,
): string[] {
  const problems: string[] = [];

  for (const [id, action] of Object.entries(actions)) {
    if (!Object.hasOwn(skills, action.skill)) problems.push(`${id}: unknown skill "${action.skill}"`);
    if (!Number.isInteger(action.level) || action.level < 1 || action.level > 99) {
      problems.push(`${id}: level must be between 1 and 99`);
    }
    if (!(action.durationMs > 0)) problems.push(`${id}: durationMs must be positive`);
    if (action.outputs.length === 0) problems.push(`${id}: must have at least one output`);

    let badQuantity = false;
    for (const stack of [...(action.inputs ?? []), ...action.outputs]) {
      if (!Object.hasOwn(items, stack.item)) problems.push(`${id}: unknown item "${stack.item}"`);
      if (!isPositiveInt(stack.qty)) badQuantity = true;
    }
    if (badQuantity) problems.push(`${id}: quantities must be positive whole numbers`);
  }

  const usedSkills = new Set(Object.values(actions).map((a) => a.skill));
  for (const skillId of Object.keys(skills)) {
    if (!usedSkills.has(skillId)) problems.push(`${skillId}: has no actions`);
  }

  return problems;
}
