/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 17-02 · session-tokens
 * Lesson:  17.3 Sessions vs JWTs
 * Run:     npm run watch 17-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The session layer behind the login cookie. Storage is behind the provided
 * SessionStore interface (an in-memory one is provided; in the capstone it's a
 * Postgres table). Time comes from the injected `now()`.
 *
 * TASK 1 · generateSessionToken() → string
 *   32 cryptographically random bytes, encoded as base64url (43 characters).
 *
 * TASK 2 · hashSessionToken(token) → string
 *   SHA-256 of the token, as lowercase hex (64 characters).
 *
 * TASK 3 · createSessionManager({ store, now, ttlMs?, renewWithinMs? }) → SessionManager
 *   Defaults: ttlMs = 30 days, renewWithinMs = 15 days.
 *
 *   create(userId) → { token, session }
 *     A new token; the store gets ONLY its hash (never the token itself).
 *     createdAt = now(), expiresAt = now() + ttlMs.
 *
 *   validate(token) → { session, renewed } | null
 *     - empty token, or no session with that hash → null
 *     - expired (now() >= expiresAt) → delete it from the store, return null
 *     - if FEWER than renewWithinMs remain → extend: expiresAt = now() + ttlMs
 *       (save it with store.setExpiry), renewed: true
 *     - otherwise renewed: false
 *     The returned session always shows the current expiresAt.
 *
 *   invalidate(token) → void          (logout; fine to call with an unknown token)
 *   invalidateAllForUser(userId) → number of sessions removed (log out everywhere)
 */

// ─── provided: storage ────────────────────────────────────────────────────────
export type Session = { idHash: string; userId: number; createdAt: Date; expiresAt: Date };

export type SessionStore = {
  insert(session: Session): Promise<void>;
  get(idHash: string): Promise<Session | undefined>;
  setExpiry(idHash: string, expiresAt: Date): Promise<void>;
  delete(idHash: string): Promise<void>;
  deleteAllForUser(userId: number): Promise<number>;
};

/** In-memory store. `all()` lets tests look inside. Stores copies, like a real database. */
export function createInMemorySessionStore(): SessionStore & { all(): Session[] } {
  const rows = new Map<string, Session>();
  const copy = (s: Session): Session => ({ ...s, createdAt: new Date(s.createdAt), expiresAt: new Date(s.expiresAt) });
  return {
    async insert(session) {
      if (rows.has(session.idHash)) throw new Error('duplicate session id');
      rows.set(session.idHash, copy(session));
    },
    async get(idHash) {
      const row = rows.get(idHash);
      return row ? copy(row) : undefined;
    },
    async setExpiry(idHash, expiresAt) {
      const row = rows.get(idHash);
      if (row) row.expiresAt = new Date(expiresAt);
    },
    async delete(idHash) {
      rows.delete(idHash);
    },
    async deleteAllForUser(userId) {
      let removed = 0;
      for (const [id, row] of rows) {
        if (row.userId === userId) {
          rows.delete(id);
          removed += 1;
        }
      }
      return removed;
    },
    all: () => [...rows.values()].map(copy),
  };
}

// ─── your code ────────────────────────────────────────────────────────────────
export function generateSessionToken(): string {
  throw new Error('Not implemented yet');
}

export function hashSessionToken(token: string): string {
  throw new Error('Not implemented yet');
}

export type SessionManager = {
  create(userId: number): Promise<{ token: string; session: Session }>;
  validate(token: string): Promise<{ session: Session; renewed: boolean } | null>;
  invalidate(token: string): Promise<void>;
  invalidateAllForUser(userId: number): Promise<number>;
};

export type SessionManagerOptions = {
  store: SessionStore;
  now: () => Date;
  ttlMs?: number;
  renewWithinMs?: number;
};

export function createSessionManager(options: SessionManagerOptions): SessionManager {
  return {
    async create(userId) {
      throw new Error('Not implemented yet');
    },
    async validate(token) {
      throw new Error('Not implemented yet');
    },
    async invalidate(token) {
      throw new Error('Not implemented yet');
    },
    async invalidateAllForUser(userId) {
      throw new Error('Not implemented yet');
    },
  };
}
