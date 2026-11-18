/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 08-04 · zustand-shop
 * Lesson:  08.5 External stores & Zustand
 * Run:     npm run watch 08-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Now use the real thing. Build the shop with Zustand's vanilla `createStore`
 * (a factory, so every test gets a fresh store) and the `useStore` hook.
 *   import { createStore } from 'zustand/vanilla';
 *   import { useStore } from 'zustand';
 *
 * TASK 1 · createShopStore(initialGold = 100): StoreApi<ShopState>
 *   State:   gold: number, owned: ItemId[] (in purchase order)
 *   Actions:
 *     addGold(amount)  add gold (amount must be > 0, otherwise ignore it)
 *     buy(itemId)      if affordable and not owned: pay PRICES[itemId], add
 *                      it to owned, and return true. Otherwise change nothing
 *                      and return false.
 *     sell(itemId)     if owned: remove it and refund Math.floor(price / 2)
 *     reset()          back to initialGold and nothing owned
 *
 * TASK 2 · selectors (plain functions, usable with useStore or getState)
 *   selectCanAfford(itemId)  → a SELECTOR: (state) => boolean
 *                              (affordable AND not already owned)
 *   selectOwnedCount         → (state) => number
 *
 * TASK 3 · components that take the store as a prop
 *   GoldBadge({ store })            <output aria-label="Gold">{gold}</output>
 *   BuyButton({ store, itemId })    <button>Buy {itemId}</button>, disabled when it can't be bought
 *   OwnedCount({ store })           <p>Owned: {n}</p>. Must NOT re-render when only gold changes.
 *
 * Each component must use a selector that picks only what it needs.
 */
import type { StoreApi } from 'zustand/vanilla';

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
  throw new Error('Not implemented yet');
}

export function selectCanAfford(itemId: ItemId): (state: ShopState) => boolean {
  throw new Error('Not implemented yet');
}

export function selectOwnedCount(state: ShopState): number {
  throw new Error('Not implemented yet');
}

type StoreProp = { store: StoreApi<ShopState> };

export function GoldBadge({ store }: StoreProp) {
  return null; // TODO
}

export function BuyButton({ store, itemId }: StoreProp & { itemId: ItemId }) {
  return null; // TODO
}

export function OwnedCount({ store }: StoreProp) {
  return null; // TODO
}
