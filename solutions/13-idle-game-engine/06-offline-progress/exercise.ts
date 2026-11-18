// Reference solution for 13-06. Read it only AFTER your own version passes.
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 13-06 · offline-progress
 * Lesson:  13.8 Offline progress
 * Run:     npm run watch 13-06
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The engine from 13-04 is PROVIDED at the bottom of this file, including a
 * `tick` that already handles any dt in constant time. Your job is the offline
 * layer on top: guards, the cap, the summary, and the clock bookkeeping.
 *
 * TASK 1 · calculateOfflineProgress(state, elapsedMs, capMs) → { state, summary }
 *   - appliedMs = elapsedMs clamped to 0..capMs (negative → 0)
 *   - advance the state by appliedMs IN ONE GO (don't loop over small ticks;
 *     a test runs a 30-day absence and must finish in milliseconds)
 *   - build the summary:
 *       elapsedMs       the original elapsedMs (or 0 if it was negative)
 *       appliedMs
 *       capped          true if elapsedMs > capMs
 *       actionId        the action that was active BEFORE (or null)
 *       completions     how many repetitions completed
 *       itemsGained     { itemId: qty } of everything gained
 *       itemsUsed       { itemId: qty } of everything consumed
 *       xpGained        total XP gained
 *       levelsGained    levels gained in that action's skill (0 if none)
 *       stoppedReason   'outOfInputs' if the action stopped, otherwise null
 *   - This function does NOT touch lastUpdatedAt.
 *
 * TASK 2 · catchUp(state, now, capMs) → { state, summary }
 *   - elapsed = now − state.lastUpdatedAt, then calculateOfflineProgress(…)
 *   - set lastUpdatedAt = max(state.lastUpdatedAt, now). If the clock went
 *     BACKWARDS, keep the later time, or a player could gain time by moving
 *     their clock back and forth.
 *   - This works with no active action too (only lastUpdatedAt changes).
 */

export type OfflineSummary = {
  elapsedMs: number;
  appliedMs: number;
  capped: boolean;
  actionId: ActionId | null;
  completions: number;
  itemsGained: Partial<Record<ItemId, number>>;
  itemsUsed: Partial<Record<ItemId, number>>;
  xpGained: number;
  levelsGained: number;
  stoppedReason: 'outOfInputs' | null;
};

export type OfflineResult = { state: GameState; summary: OfflineSummary };

export function calculateOfflineProgress(state: GameState, elapsedMs: number, capMs: number): OfflineResult {
  const elapsed = Math.max(0, elapsedMs);
  const appliedMs = Math.min(elapsed, capMs);
  const actionId = state.activeAction?.id ?? null;

  // Offline progress is ONE big tick: the engine already handles any dt in O(1).
  const { state: next, events } = tick(state, appliedMs);

  const summary: OfflineSummary = {
    elapsedMs: elapsed,
    appliedMs,
    capped: elapsed > capMs,
    actionId,
    completions: 0,
    itemsGained: {},
    itemsUsed: {},
    xpGained: 0,
    levelsGained: 0,
    stoppedReason: null,
  };

  for (const event of events) {
    switch (event.type) {
      case 'actionCompleted':
        summary.completions += event.count;
        break;
      case 'itemsGained':
        summary.itemsGained[event.itemId] = (summary.itemsGained[event.itemId] ?? 0) + event.qty;
        break;
      case 'itemsUsed':
        summary.itemsUsed[event.itemId] = (summary.itemsUsed[event.itemId] ?? 0) + event.qty;
        break;
      case 'xpGained':
        summary.xpGained += event.xp;
        break;
      case 'levelUp':
        break; // levelsGained is computed below from the XP before and after
      case 'actionStopped':
        summary.stoppedReason = event.reason;
        break;
    }
  }

  if (actionId !== null) {
    const skill = ACTIONS[actionId].skill;
    summary.levelsGained = levelFromXp(next.skills[skill].xp) - levelFromXp(state.skills[skill].xp);
  }

  return { state: next, summary };
}

export function catchUp(state: GameState, now: number, capMs: number): OfflineResult {
  const result = calculateOfflineProgress(state, now - state.lastUpdatedAt, capMs);
  // Never move the clock backwards: that would let players re-earn the same time.
  return { ...result, state: { ...result.state, lastUpdatedAt: Math.max(state.lastUpdatedAt, now) } };
}

// ─── provided: the engine from 13-04 (data, XP curve, and a batch tick) ───────
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
  /** wall-clock ms when the state was last advanced */
  lastUpdatedAt: number;
};

export type GameEvent =
  | { type: 'actionCompleted'; actionId: ActionId; count: number }
  | { type: 'itemsUsed'; itemId: ItemId; qty: number }
  | { type: 'itemsGained'; itemId: ItemId; qty: number }
  | { type: 'xpGained'; skill: SkillId; xp: number }
  | { type: 'levelUp'; skill: SkillId; level: number }
  | { type: 'actionStopped'; actionId: ActionId; reason: 'outOfInputs' };

export type TickResult = { state: GameState; events: GameEvent[] };

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
// ─────────────────────────────────────────────────────────────────────────────
