// Reference solution for 14-01. Read it only AFTER your own version passes.
import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  ACTIONS,
  catchUp,
  levelFromXp,
  sellItems,
  startAction,
  stopAction,
  tick,
  type ActionId,
  type GameEvent,
  type GameState,
  type ItemId,
  type OfflineSummary,
  type SkillId,
} from './engine';

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
  const listeners = new Set<(events: GameEvent[]) => void>(); // events live OUTSIDE state

  return createStore<GameStoreState>()((set, get) => {
    // "No change, no set": the engine returns the same object when nothing happened.
    const update = (next: GameState) => {
      if (next !== get().game) set({ game: next });
    };

    return {
      game: initial,
      startAction: (id) => update(startAction(get().game, id)),
      stopAction: () => update(stopAction(get().game)),
      sell: (itemId, qty) => update(sellItems(get().game, itemId, qty)),
      advance: (dtMs) => {
        const current = get().game;
        const { state, events } = tick(current, dtMs);
        if (state !== current) set({ game: { ...state, lastUpdatedAt: deps.now() } });
        if (events.length > 0) listeners.forEach((listener) => listener(events));
      },
      catchUp: (now) => {
        const { state, summary } = catchUp(get().game, now, OFFLINE_CAP_MS);
        update(state);
        return summary;
      },
      subscribeEvents: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    };
  });
}

export function selectGold(state: GameStoreState): number {
  return state.game.gold;
}

export function selectItemCount(itemId: ItemId): (state: GameStoreState) => number {
  return (state) => state.game.bank[itemId] ?? 0;
}

export function selectLevel(skill: SkillId): (state: GameStoreState) => number {
  return (state) => levelFromXp(state.game.skills[skill].xp);
}

export function selectProgressFraction(state: GameStoreState): number {
  const active = state.game.activeAction;
  if (active === null) return 0;
  return active.progressMs / ACTIONS[active.id].durationMs;
}

export function useGameEvents(store: GameStore, handler: (events: GameEvent[]) => void): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => store.getState().subscribeEvents((events) => latest.current(events)), [store]);
}

export function GoldDisplay({ store }: { store: GameStore }) {
  const gold = useStore(store, selectGold);
  return <output aria-label="Gold">{gold}</output>;
}

export function ItemCount({ store, itemId }: { store: GameStore; itemId: ItemId }) {
  const count = useStore(store, selectItemCount(itemId));
  return <output aria-label={`${itemId} count`}>{count}</output>;
}

export function SkillLevel({ store, skill }: { store: GameStore; skill: SkillId }) {
  const level = useStore(store, selectLevel(skill));
  return <output aria-label={`${skill} level`}>{level}</output>;
}
