/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 15-02 · express-routes
 * Lessons: 15.3 Express fundamentals · 15.4 Designing REST APIs · 15.6 structure
 * Run:     npm run watch 15-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a REST API for players with Express 5 and dependency injection:
 *   createApp({ players, now }) → an Express app
 * where `players` is a PlayerRepo (an in-memory one is provided) and `now`
 * returns the current Date (tests control it).
 *
 * Use a Router mounted at /api/players. Responses are JSON. Errors use the
 * shape { error: { code, message } }.
 *
 *   GET    /api/players            → 200 { items: Player[], total }
 *                                    ?sort=name|createdAt (default createdAt, oldest first)
 *                                    ?limit=N (default 20, max 100; invalid → default)
 *   GET    /api/players/:id        → 200 Player | 404 { error: { code: 'NOT_FOUND', message: 'Player not found' } }
 *   POST   /api/players            body { name }  (string, 3–20 chars after trimming)
 *                                  → 201 Player + Location: /api/players/{id}
 *                                  → 400 { error: { code: 'VALIDATION_ERROR', message: 'name must be 3–20 characters' } }
 *                                  → 409 { error: { code: 'NAME_TAKEN', message: 'That name is taken' } }
 *                                    (names are unique, case-insensitively)
 *   PATCH  /api/players/:id        body { name } → 200 updated Player (same validation and uniqueness rules;
 *                                    renaming to your own current name is fine) | 404
 *   DELETE /api/players/:id        → 204 (no body) | 404
 *   Anything else                  → 404 { error: { code: 'NOT_FOUND', message: 'Route not found' } }
 *
 * Players are serialised as { id, name, createdAt } with createdAt as an ISO string.
 * Repository methods are ASYNC, so use async handlers (Express 5 forwards their errors).
 */
import type { Express } from 'express';

// ─── provided: the repository interface and an in-memory implementation ──────
export type Player = { id: number; name: string; createdAt: Date };

export type PlayerRepo = {
  list(): Promise<Player[]>;
  get(id: number): Promise<Player | undefined>;
  findByName(name: string): Promise<Player | undefined>; // case-insensitive
  create(name: string, createdAt: Date): Promise<Player>;
  rename(id: number, name: string): Promise<Player | undefined>;
  delete(id: number): Promise<boolean>;
};

export function createInMemoryPlayerRepo(): PlayerRepo {
  const players = new Map<number, Player>();
  let nextId = 1;
  return {
    list: async () => [...players.values()],
    get: async (id) => players.get(id),
    findByName: async (name) => [...players.values()].find((p) => p.name.toLowerCase() === name.toLowerCase()),
    create: async (name, createdAt) => {
      const player = { id: nextId++, name, createdAt };
      players.set(player.id, player);
      return player;
    },
    rename: async (id, name) => {
      const player = players.get(id);
      if (!player) return undefined;
      const updated = { ...player, name };
      players.set(id, updated);
      return updated;
    },
    delete: async (id) => players.delete(id),
  };
}
// ─────────────────────────────────────────────────────────────────────────────

export type AppDeps = {
  players: PlayerRepo;
  now: () => Date;
};

export function createApp(deps: AppDeps): Express {
  throw new Error('Not implemented yet');
}
