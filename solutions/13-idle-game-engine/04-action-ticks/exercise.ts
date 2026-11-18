// Reference solution for 13-04. Read it only AFTER your own version passes.

// ─── provided: game data and the XP curve (you built it in 13-02) ────────────
export type SkillId = 'woodcutting' | 'smithing' | 'fishing';
export type ItemId = 'oak_log' | 'willow_log' | 'copper_ore' | 'tin_ore' | 'iron_ore' | 'bronze_bar' | 'iron_bar' | 'raw_shrimp';
export type ItemStack = { item: ItemId; qty: number };
export type ActionDefinition = {
  skill: SkillId;
  level: number;
  durationMs: number;
  xp: number;
  inputs?: readonly ItemStack[];
  outputs: readonly ItemStack[];
};

export const ACTIONS = {
  chop_oak: { skill: 'woodcutting', level: 1, durationMs: 3000, xp: 10, outputs: [{ item: 'oak_log', qty: 1 }] },
  chop_willow: { skill: 'woodcutting', level: 10, durationMs: 4000, xp: 25, outputs: [{ item: 'willow_log', qty: 1 }] },
  fish_shrimp: { skill: 'fishing', level: 1, durationMs: 1000, xp: 5, outputs: [{ item: 'raw_shrimp', qty: 2 }] },
  smelt_bronze: {
    skill: 'smithing',
    level: 1,
    durationMs: 2000,
    xp: 15,
    inputs: [
      { item: 'copper_ore', qty: 1 },
      { item: 'tin_ore', qty: 1 },
    ],
    outputs: [{ item: 'bronze_bar', qty: 1 }],
  },
  smelt_iron: { skill: 'smithing', level: 15, durationMs: 3000, xp: 30, inputs: [{ item: 'iron_ore', qty: 2 }], outputs: [{ item: 'iron_bar', qty: 1 }] },
} as const satisfies Record<string, ActionDefinition>;
export type ActionId = keyof typeof ACTIONS;

const XP_TABLE: number[] = (() => {
  const table = [0, 0];
  let points = 0;
  for (let level = 1; level < 99; level++) {
    points += Math.floor(level + 300 * 2 ** (level / 7));
    table.push(Math.floor(points / 4));
  }
  return table;
})();
export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < 99 && (XP_TABLE[level + 1] ?? Infinity) <= xp) level++;
  return level;
}

export type GameState = {
  skills: Record<SkillId, { xp: number }>;
  bank: Partial<Record<ItemId, number>>;
  activeAction: { id: ActionId; progressMs: number } | null;
  stats: { actionsCompleted: number; itemsGained: number };
};

export type GameEvent =
  | { type: 'actionCompleted'; actionId: ActionId; count: number }
  | { type: 'itemsUsed'; itemId: ItemId; qty: number }
  | { type: 'itemsGained'; itemId: ItemId; qty: number }
  | { type: 'xpGained'; skill: SkillId; xp: number }
  | { type: 'levelUp'; skill: SkillId; level: number }
  | { type: 'actionStopped'; actionId: ActionId; reason: 'outOfInputs' };

export type TickResult = { state: GameState; events: GameEvent[] };
// ─────────────────────────────────────────────────────────────────────────────

export function startAction(state: GameState, actionId: ActionId): GameState {
  const action: ActionDefinition = ACTIONS[actionId];
  if (levelFromXp(state.skills[action.skill].xp) < action.level) return state;
  if (state.activeAction?.id === actionId) return state;
  return { ...state, activeAction: { id: actionId, progressMs: 0 } };
}

export function stopAction(state: GameState): GameState {
  return state.activeAction === null ? state : { ...state, activeAction: null };
}

type Bank = GameState['bank'];

function affordableRepetitions(bank: Bank, inputs: readonly ItemStack[] | undefined): number {
  if (!inputs || inputs.length === 0) return Infinity;
  return Math.min(...inputs.map((input) => Math.floor((bank[input.item] ?? 0) / input.qty)));
}

function applyStacks(bank: Bank, stacks: readonly ItemStack[], times: number, sign: 1 | -1): Bank {
  const next = { ...bank };
  for (const { item, qty } of stacks) {
    const amount = (next[item] ?? 0) + sign * qty * times;
    if (amount === 0) delete next[item]; // safe: `next` is our own fresh copy
    else next[item] = amount;
  }
  return next;
}

export function tick(state: GameState, dtMs: number): TickResult {
  const active = state.activeAction;
  if (active === null || dtMs <= 0) return { state, events: [] };

  const action: ActionDefinition = ACTIONS[active.id];
  const progress = active.progressMs + dtMs;
  const possible = Math.floor(progress / action.durationMs);

  if (possible === 0) {
    return { state: { ...state, activeAction: { ...active, progressMs: progress } }, events: [] };
  }

  const completions = Math.min(possible, affordableRepetitions(state.bank, action.inputs));
  const ranOut = completions < possible;
  const events: GameEvent[] = [];
  let next: GameState = state;

  if (completions > 0) {
    const inputs = action.inputs ?? [];
    let bank = applyStacks(state.bank, inputs, completions, -1);
    bank = applyStacks(bank, action.outputs, completions, 1);

    const oldXp = state.skills[action.skill].xp;
    const xpGained = action.xp * completions;
    const newXp = oldXp + xpGained;
    const itemsGained = action.outputs.reduce((sum, o) => sum + o.qty, 0) * completions;

    next = {
      ...state,
      bank,
      skills: { ...state.skills, [action.skill]: { ...state.skills[action.skill], xp: newXp } },
      stats: {
        actionsCompleted: state.stats.actionsCompleted + completions,
        itemsGained: state.stats.itemsGained + itemsGained,
      },
    };

    events.push({ type: 'actionCompleted', actionId: active.id, count: completions });
    for (const { item, qty } of inputs) events.push({ type: 'itemsUsed', itemId: item, qty: qty * completions });
    for (const { item, qty } of action.outputs) events.push({ type: 'itemsGained', itemId: item, qty: qty * completions });
    events.push({ type: 'xpGained', skill: action.skill, xp: xpGained });
    const before = levelFromXp(oldXp);
    const after = levelFromXp(newXp);
    if (after > before) events.push({ type: 'levelUp', skill: action.skill, level: after });
  }

  if (ranOut) {
    next = { ...next, activeAction: null };
    events.push({ type: 'actionStopped', actionId: active.id, reason: 'outOfInputs' });
  } else {
    next = { ...next, activeAction: { id: active.id, progressMs: progress - possible * action.durationMs } };
  }

  return { state: next, events };
}
