/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 08-01 · inventory-reducer
 * Lesson:  08.1 useReducer
 * Run:     npm run watch 08-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · bankReducer(state, action): a PURE reducer. Never mutate (inputs are
 * frozen). Use a switch with an exhaustive `default` (assertNever).
 *
 *   deposited   add quantity to items[itemId]
 *               log: "Deposited {q} × {itemId}"
 *   withdrawn   remove quantity (delete the key when it reaches 0)
 *               log: "Withdrew {q} × {itemId}"
 *               not enough items → return the SAME state
 *   sold        like withdrawn, and gold += quantity × price
 *               log: "Sold {q} × {itemId} for {total} gold"
 *               not enough items → return the SAME state
 *   soldAll     sell EVERY stack whose itemId has a price in `prices`;
 *               stacks without a price stay
 *               log: "Sold everything for {total} gold"
 *               nothing sellable → return the SAME state
 *   logCleared  log becomes []  (already empty → the SAME state)
 *
 *   The log is newest-first and keeps at most 5 entries.
 *
 * TASK 2 · BankPanel({ initial = initialBankState, prices })
 *   Use useReducer(bankReducer, initial). Render:
 *     <output aria-label="Gold">{gold}</output>
 *     <ul aria-label="Bank">: one <li> per stack, sorted by itemId, text "{itemId} ×{q}"
 *       plus <button aria-label="Sell 1 {itemId}">Sell 1</button>, disabled if
 *       that item has no price
 *     <button>Sell all</button>
 *     <button>Clear log</button>
 *     <ol aria-label="Log">: one <li> per log entry
 */

export type BankState = {
  items: Record<string, number>;
  gold: number;
  log: string[];
};

export type BankAction =
  | { type: 'deposited'; itemId: string; quantity: number }
  | { type: 'withdrawn'; itemId: string; quantity: number }
  | { type: 'sold'; itemId: string; quantity: number; price: number }
  | { type: 'soldAll'; prices: Record<string, number> }
  | { type: 'logCleared' };

export const initialBankState: BankState = { items: {}, gold: 0, log: [] };

export function bankReducer(state: BankState, action: BankAction): BankState {
  throw new Error('Not implemented yet');
}

export type BankPanelProps = {
  initial?: BankState;
  prices: Record<string, number>;
};

export function BankPanel(props: BankPanelProps) {
  return null; // TODO
}
