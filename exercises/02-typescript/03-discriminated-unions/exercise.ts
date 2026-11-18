/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 02-03 · discriminated-unions
 * Lesson:  02.4 Discriminated unions
 * Run:     npm run watch 02-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * You're writing a tiny version of the reducer at the heart of your game.
 *
 * TASK 1 · assertNever(value: never): never
 *   Throw an Error whose message includes JSON.stringify(value).
 *
 * TASK 2 · gameReducer(state, action) → new GameState (pure; never mutate)
 *   Use a `switch (action.type)` with `default: return assertNever(action)`.
 *     startAction → active = { skillId, actionId }
 *     stopAction  → active = null. If it's ALREADY null, return the same `state`.
 *     gainXp      → xp[skillId] += amount
 *     addItem     → bank[itemId] += quantity (create the key if missing)
 *     sellItem    → if the bank has fewer than `quantity`, return the SAME state
 *                   (unchanged). Otherwise remove the items (delete the key if
 *                   it reaches 0) and add quantity × pricePerItem gold.
 *
 * TASK 3 · describeAction(action) → string
 *     startAction → "Started woodcutting: oak_tree"
 *     stopAction  → "Stopped"
 *     gainXp      → "+25 fishing XP"
 *     addItem     → "+3 trout"
 *     sellItem    → "Sold 3 trout for 60 gold"
 *
 * TASK 4 · LoadState<T>
 *   Replace the placeholder with a discriminated union on `status`:
 *     'idle' | 'loading' (no other fields) | 'success' with `data: T`
 *     | 'error' with `error: string`
 *
 * TASK 5 · loadStateLabel(state: LoadState<string[]>) → string
 *     idle → "Not loaded", loading → "Loading…"   (that's the … character)
 *     success → "1 save found" / "3 saves found" (note singular/plural)
 *     error → "Error: <message>"
 */

export type SkillId = 'woodcutting' | 'fishing' | 'mining';

export type GameAction =
  | { type: 'startAction'; skillId: SkillId; actionId: string }
  | { type: 'stopAction' }
  | { type: 'gainXp'; skillId: SkillId; amount: number }
  | { type: 'addItem'; itemId: string; quantity: number }
  | { type: 'sellItem'; itemId: string; quantity: number; pricePerItem: number };

export type GameState = {
  active: { skillId: SkillId; actionId: string } | null;
  xp: Record<SkillId, number>;
  bank: Record<string, number>;
  gold: number;
};

export function assertNever(value: never): never {
  throw new Error('Not implemented yet');
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  throw new Error('Not implemented yet');
}

export function describeAction(action: GameAction): string {
  throw new Error('Not implemented yet');
}

export type LoadState<T> = { placeholder: T }; // TODO (Task 4)

export function loadStateLabel(state: LoadState<string[]>): string {
  throw new Error('Not implemented yet');
}
