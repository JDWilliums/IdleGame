/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 14-01 · game-store
 * Lessons: 14.1 Architecture · 14.2 Building the game store
 * Run:     npm run watch 14-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Wrap the pure engine (./engine.ts, provided) in a Zustand VANILLA store, emit
 * engine events to listeners, and write efficient selectors and components.
 *   import { createStore, type StoreApi } from 'zustand/vanilla';
 *   import { useStore } from 'zustand';
 *
 * TASK 1 · createGameStore(initial, { now }) → StoreApi<GameStoreState>
 *   game            the GameState
 *   startAction(id) / stopAction() / sell(itemId, qty)   delegate to the engine
 *   advance(dtMs)   run tick(). If the engine returned a NEW state, store it
 *                   with lastUpdatedAt = now(). If it returned the SAME state,
 *                   don't call set() at all (subscribers must not be notified).
 *                   Then emit the events (only if there are any).
 *   catchUp(now)    run the engine's catchUp with OFFLINE_CAP_MS, store the
 *                   state, and return the summary
 *   subscribeEvents(listener) → unsubscribe. Listeners receive each non-empty
 *                   GameEvent[] from advance(). Events are NOT stored in state.
 *   In every action: if the engine returns the same object, don't set().
 *
 * TASK 2 · selectors (plain functions that return PRIMITIVES)
 *   selectGold(state)               → gold
 *   selectItemCount(itemId)(state)  → quantity in the bank (0 if none)
 *   selectLevel(skill)(state)       → levelFromXp(xp)
 *   selectProgressFraction(state)   → 0..1 through the active action (0 if idle)
 *
 * TASK 3 · useGameEvents(store, handler): subscribe to events on mount and
 *   unsubscribe on unmount. ALWAYS call the LATEST handler, without
 *   resubscribing when it changes (07.6's latest-ref pattern).
 *
 * TASK 4 · components (each subscribes with ONE narrow selector)
 *   GoldDisplay({ store })               <output aria-label="Gold">{gold}</output>
 *   ItemCount({ store, itemId })         <output aria-label={`${itemId} count`}>{n}</output>
 *   SkillLevel({ store, skill })         <output aria-label={`${skill} level`}>{level}</output>
 *   A tick that only advances progress must NOT re-render any of them.
 */
import type { StoreApi } from 'zustand/vanilla';
import type { ActionId, GameEvent, GameState, ItemId, OfflineSummary, SkillId } from './engine';

export const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000;

export type GameStoreState = {
  game: GameState;
  startAction: (id: ActionId) => void;
  stopAction: () => void;
  sell: (itemId: ItemId, qty: number) => void;
  advance: (dtMs: number) => void;
  catchUp: (now: number) => OfflineSummary;
  subscribeEvents: (listener: (events: GameEvent[]) => void) => () => void;
};

export type GameStore = StoreApi<GameStoreState>;

export function createGameStore(initial: GameState, deps: { now: () => number }): GameStore {
  throw new Error('Not implemented yet');
}

export function selectGold(state: GameStoreState): number {
  throw new Error('Not implemented yet');
}

export function selectItemCount(itemId: ItemId): (state: GameStoreState) => number {
  throw new Error('Not implemented yet');
}

export function selectLevel(skill: SkillId): (state: GameStoreState) => number {
  throw new Error('Not implemented yet');
}

export function selectProgressFraction(state: GameStoreState): number {
  throw new Error('Not implemented yet');
}

export function useGameEvents(store: GameStore, handler: (events: GameEvent[]) => void): void {
  // TODO
}

export function GoldDisplay({ store }: { store: GameStore }) {
  return null; // TODO
}

export function ItemCount({ store, itemId }: { store: GameStore; itemId: ItemId }) {
  return null; // TODO
}

export function SkillLevel({ store, skill }: { store: GameStore; skill: SkillId }) {
  return null; // TODO
}
