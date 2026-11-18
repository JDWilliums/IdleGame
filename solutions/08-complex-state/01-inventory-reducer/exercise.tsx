// Reference solution for 08-01. Read it only AFTER your own version passes.
import { useReducer } from 'react';

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

const LOG_LIMIT = 5;

function assertNever(value: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(value)}`);
}

function withLog(log: string[], entry: string): string[] {
  return [entry, ...log].slice(0, LOG_LIMIT);
}

/** Remove `quantity` of an item, or return null if there aren't enough. */
function removeItems(items: Record<string, number>, itemId: string, quantity: number) {
  const have = items[itemId] ?? 0;
  if (have < quantity) return null;
  if (have === quantity) {
    const { [itemId]: _gone, ...rest } = items;
    return rest;
  }
  return { ...items, [itemId]: have - quantity };
}

export function bankReducer(state: BankState, action: BankAction): BankState {
  switch (action.type) {
    case 'deposited': {
      const { itemId, quantity } = action;
      return {
        ...state,
        items: { ...state.items, [itemId]: (state.items[itemId] ?? 0) + quantity },
        log: withLog(state.log, `Deposited ${quantity} × ${itemId}`),
      };
    }
    case 'withdrawn': {
      const items = removeItems(state.items, action.itemId, action.quantity);
      if (items === null) return state;
      return { ...state, items, log: withLog(state.log, `Withdrew ${action.quantity} × ${action.itemId}`) };
    }
    case 'sold': {
      const items = removeItems(state.items, action.itemId, action.quantity);
      if (items === null) return state;
      const total = action.quantity * action.price;
      return {
        items,
        gold: state.gold + total,
        log: withLog(state.log, `Sold ${action.quantity} × ${action.itemId} for ${total} gold`),
      };
    }
    case 'soldAll': {
      let total = 0;
      const kept: Record<string, number> = {};
      for (const [itemId, quantity] of Object.entries(state.items)) {
        const price = action.prices[itemId];
        if (price === undefined) kept[itemId] = quantity;
        else total += price * quantity;
      }
      if (Object.keys(kept).length === Object.keys(state.items).length) return state; // nothing sold
      return { items: kept, gold: state.gold + total, log: withLog(state.log, `Sold everything for ${total} gold`) };
    }
    case 'logCleared':
      return state.log.length === 0 ? state : { ...state, log: [] };
    default:
      return assertNever(action);
  }
}

export type BankPanelProps = {
  initial?: BankState;
  prices: Record<string, number>;
};

export function BankPanel({ initial = initialBankState, prices }: BankPanelProps) {
  const [state, dispatch] = useReducer(bankReducer, initial);
  const stacks = Object.entries(state.items).toSorted(([a], [b]) => a.localeCompare(b));

  return (
    <section>
      <output aria-label="Gold">{state.gold}</output>
      <ul aria-label="Bank">
        {stacks.map(([itemId, quantity]) => {
          const price = prices[itemId];
          return (
            <li key={itemId}>
              {itemId} ×{quantity}
              <button
                type="button"
                aria-label={`Sell 1 ${itemId}`}
                disabled={price === undefined}
                onClick={() => price !== undefined && dispatch({ type: 'sold', itemId, quantity: 1, price })}
              >
                Sell 1
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => dispatch({ type: 'soldAll', prices })}>
        Sell all
      </button>
      <button type="button" onClick={() => dispatch({ type: 'logCleared' })}>
        Clear log
      </button>
      <ol aria-label="Log">
        {state.log.map((entry, i) => (
          // Log entries can repeat, so combine position and text. The log is
          // append-only from the top, which makes this acceptable here.
          <li key={`${i}-${entry}`}>{entry}</li>
        ))}
      </ol>
    </section>
  );
}
