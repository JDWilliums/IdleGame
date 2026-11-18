// Reference solution for 08-04. Read it only AFTER your own version passes.
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';

export const PRICES = { bronze_axe: 50, iron_axe: 120, fishing_rod: 75 } as const;
export type ItemId = keyof typeof PRICES;

export type ShopState = {
  gold: number;
  owned: ItemId[];
  addGold: (amount: number) => void;
  buy: (itemId: ItemId) => boolean;
  sell: (itemId: ItemId) => void;
  reset: () => void;
};

export function createShopStore(initialGold = 100): StoreApi<ShopState> {
  return createStore<ShopState>()((set, get) => ({
    gold: initialGold,
    owned: [],

    addGold: (amount) => {
      if (amount <= 0) return;
      set((s) => ({ gold: s.gold + amount })); // set() shallow-merges
    },

    buy: (itemId) => {
      if (!selectCanAfford(itemId)(get())) return false; // reuse the selector as the rule
      set((s) => ({ gold: s.gold - PRICES[itemId], owned: [...s.owned, itemId] }));
      return true;
    },

    sell: (itemId) => {
      if (!get().owned.includes(itemId)) return;
      set((s) => ({
        gold: s.gold + Math.floor(PRICES[itemId] / 2),
        owned: s.owned.filter((id) => id !== itemId),
      }));
    },

    reset: () => set({ gold: initialGold, owned: [] }),
  }));
}

export function selectCanAfford(itemId: ItemId): (state: ShopState) => boolean {
  return (state) => state.gold >= PRICES[itemId] && !state.owned.includes(itemId);
}

export function selectOwnedCount(state: ShopState): number {
  return state.owned.length;
}

type StoreProp = { store: StoreApi<ShopState> };

export function GoldBadge({ store }: StoreProp) {
  const gold = useStore(store, (s) => s.gold);
  return <output aria-label="Gold">{gold}</output>;
}

export function BuyButton({ store, itemId }: StoreProp & { itemId: ItemId }) {
  const canBuy = useStore(store, selectCanAfford(itemId)); // re-renders only when the boolean flips
  const buy = useStore(store, (s) => s.buy); // actions are stable
  return (
    <button type="button" disabled={!canBuy} onClick={() => buy(itemId)}>
      Buy {itemId}
    </button>
  );
}

export function OwnedCount({ store }: StoreProp) {
  const count = useStore(store, selectOwnedCount); // a number: unaffected by gold changes
  return <p>Owned: {count}</p>;
}
