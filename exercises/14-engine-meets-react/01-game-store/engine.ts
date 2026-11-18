// PROVIDED: the pure engine from Module 13, extended with gold and selling.
// You don't need to modify this file. Exercise 14-01 builds the store around it.

export type SkillId = 'woodcutting' | 'fishing' | 'smithing';
export type ItemId = 'oak_log' | 'raw_shrimp' | 'copper_ore' | 'tin_ore' | 'bronze_bar';
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
  fish_shrimp: { skill: 'fishing', level: 1, durationMs: 1000, xp: 5, outputs: [{ item: 'raw_shrimp', qty: 1 }] },
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
} as const satisfies Record<string, ActionDefinition>;
export type ActionId = keyof typeof ACTIONS;

export const SELL_PRICES: Record<ItemId, number> = {
  oak_log: 1,
  raw_shrimp: 2,
  copper_ore: 2,
  tin_ore: 2,
  bronze_bar: 9,
};

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
  gold: number;
  activeAction: { id: ActionId; progressMs: number } | null;
  lastUpdatedAt: number;
};

export type GameEvent =
  | { type: 'actionCompleted'; actionId: ActionId; count: number }
  | { type: 'itemsGained'; itemId: ItemId; qty: number }
  | { type: 'itemsUsed'; itemId: ItemId; qty: number }
  | { type: 'xpGained'; skill: SkillId; xp: number }
  | { type: 'levelUp'; skill: SkillId; level: number }
  | { type: 'actionStopped'; actionId: ActionId; reason: 'outOfInputs' };

export function createInitialState(now: number): GameState {
  return {
    skills: { woodcutting: { xp: 0 }, fishing: { xp: 0 }, smithing: { xp: 0 } },
    bank: {},
    gold: 0,
    activeAction: null,
    lastUpdatedAt: now,
  };
}

export function startAction(state: GameState, id: ActionId): GameState {
  const action: ActionDefinition = ACTIONS[id];
  if (levelFromXp(state.skills[action.skill].xp) < action.level) return state;
  if (state.activeAction?.id === id) return state;
  return { ...state, activeAction: { id, progressMs: 0 } };
}

export function stopAction(state: GameState): GameState {
  return state.activeAction === null ? state : { ...state, activeAction: null };
}

/** Sell `qty` of an item for gold. Returns the SAME state if you don't have enough. */
export function sellItems(state: GameState, itemId: ItemId, qty: number): GameState {
  const have = state.bank[itemId] ?? 0;
  if (qty <= 0 || have < qty) return state;
  const bank = { ...state.bank };
  if (have === qty) delete bank[itemId];
  else bank[itemId] = have - qty;
  return { ...state, bank, gold: state.gold + qty * SELL_PRICES[itemId] };
}

/** Advance by dtMs in O(1). Returns the SAME state when nothing changes. */
export function tick(state: GameState, dtMs: number): { state: GameState; events: GameEvent[] } {
  const active = state.activeAction;
  if (active === null || dtMs <= 0) return { state, events: [] };
  const action: ActionDefinition = ACTIONS[active.id];
  const progress = active.progressMs + dtMs;
  const possible = Math.floor(progress / action.durationMs);
  if (possible === 0) return { state: { ...state, activeAction: { ...active, progressMs: progress } }, events: [] };

  const inputs = action.inputs ?? [];
  const affordable = inputs.length
    ? Math.min(...inputs.map((i) => Math.floor((state.bank[i.item] ?? 0) / i.qty)))
    : Infinity;
  const completions = Math.min(possible, affordable);
  const events: GameEvent[] = [];
  let next = state;

  if (completions > 0) {
    const bank = { ...state.bank };
    for (const { item, qty } of inputs) {
      const left = (bank[item] ?? 0) - qty * completions;
      if (left === 0) delete bank[item];
      else bank[item] = left;
    }
    for (const { item, qty } of action.outputs) bank[item] = (bank[item] ?? 0) + qty * completions;
    const oldXp = state.skills[action.skill].xp;
    const newXp = oldXp + action.xp * completions;
    next = { ...state, bank, skills: { ...state.skills, [action.skill]: { xp: newXp } } };
    events.push({ type: 'actionCompleted', actionId: active.id, count: completions });
    for (const { item, qty } of inputs) events.push({ type: 'itemsUsed', itemId: item, qty: qty * completions });
    for (const { item, qty } of action.outputs) events.push({ type: 'itemsGained', itemId: item, qty: qty * completions });
    events.push({ type: 'xpGained', skill: action.skill, xp: action.xp * completions });
    if (levelFromXp(newXp) > levelFromXp(oldXp)) events.push({ type: 'levelUp', skill: action.skill, level: levelFromXp(newXp) });
  }

  if (completions < possible) {
    next = { ...next, activeAction: null };
    events.push({ type: 'actionStopped', actionId: active.id, reason: 'outOfInputs' });
  } else {
    next = { ...next, activeAction: { id: active.id, progressMs: progress - possible * action.durationMs } };
  }
  return { state: next, events };
}

export type OfflineSummary = { elapsedMs: number; appliedMs: number; completions: number };

/** Offline catch-up (13-06), simplified: advance by the capped elapsed time, move lastUpdatedAt forward. */
export function catchUp(state: GameState, now: number, capMs: number): { state: GameState; summary: OfflineSummary } {
  const elapsedMs = Math.max(0, now - state.lastUpdatedAt);
  const appliedMs = Math.min(elapsedMs, capMs);
  const { state: next, events } = tick(state, appliedMs);
  const completions = events.reduce((n, e) => (e.type === 'actionCompleted' ? n + e.count : n), 0);
  const lastUpdatedAt = Math.max(state.lastUpdatedAt, now);
  return {
    state: next.lastUpdatedAt === lastUpdatedAt ? next : { ...next, lastUpdatedAt },
    summary: { elapsedMs, appliedMs, completions },
  };
}
