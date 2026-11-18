/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 13-04 · action-ticks
 * Lesson:  13.5 Actions & ticks (uses 13.6's XP curve, provided below)
 * Run:     npm run watch 13-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Write the heart of your engine: pure functions that advance the game.
 * Inputs are deep-frozen in the tests, so never mutate them.
 *
 * TASK 1 · startAction(state, actionId)
 *   - If the skill's level (levelFromXp of its XP) is below action.level → the SAME state.
 *   - If that action is already active → the SAME state (don't reset progress).
 *   - Otherwise → activeAction = { id, progressMs: 0 } (switching resets progress).
 *
 * TASK 2 · stopAction(state)
 *   activeAction = null (the SAME state if nothing was active).
 *
 * TASK 3 · tick(state, dtMs) → { state, events }   (lesson 13.5's algorithm)
 *   - No active action, or dtMs ≤ 0 → { state: the SAME state, events: [] }.
 *   - progress = progressMs + dtMs;  possible = floor(progress / durationMs)
 *   - possible = 0 → only progressMs changes; no events.
 *   - affordable = how many repetitions the bank's inputs allow (∞ if no inputs)
 *     completions = min(possible, affordable)
 *   - For `completions` repetitions, all at once (no per-completion loop!):
 *       remove inputs × completions from the bank (delete keys that reach 0),
 *       add outputs × completions, add xp × completions,
 *       stats.actionsCompleted += completions, stats.itemsGained += output quantity × completions
 *   - If completions < possible, the inputs ran out → activeAction = null.
 *     Otherwise progressMs = progress − possible × durationMs (carry the remainder over).
 *   - Untouched parts of the state keep their references (structural sharing).
 *   - Events, in this order (omit the ones that don't apply):
 *       { type: 'actionCompleted', actionId, count }                    (if completions > 0)
 *       { type: 'itemsUsed', itemId, qty }    one per input, in definition order
 *       { type: 'itemsGained', itemId, qty }  one per output, in definition order
 *       { type: 'xpGained', skill, xp }
 *       { type: 'levelUp', skill, level }     ONE event with the new level, if it went up
 *       { type: 'actionStopped', actionId, reason: 'outOfInputs' }      (if it ran out)
 */

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
  throw new Error('Not implemented yet');
}

export function stopAction(state: GameState): GameState {
  throw new Error('Not implemented yet');
}

export function tick(state: GameState, dtMs: number): TickResult {
  throw new Error('Not implemented yet');
}
