// Reference solution for 17-02. Read it only AFTER your own version passes.
import { createHash, randomBytes } from 'node:crypto';

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

// ─── solution ─────────────────────────────────────────────────────────────────
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** A fast hash is fine: the token has 256 random bits, so there's nothing to brute-force. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
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

const DAY = 24 * 60 * 60 * 1000;

export function createSessionManager(options: SessionManagerOptions): SessionManager {
  const { store, now, ttlMs = 30 * DAY, renewWithinMs = 15 * DAY } = options;

  return {
    async create(userId) {
      const token = generateSessionToken();
      const createdAt = now();
      const session: Session = {
        idHash: hashSessionToken(token),
        userId,
        createdAt,
        expiresAt: new Date(createdAt.getTime() + ttlMs),
      };
      await store.insert(session);
      return { token, session }; // the token leaves here exactly once: into the cookie
    },

    async validate(token) {
      if (!token) return null;
      const session = await store.get(hashSessionToken(token));
      if (!session) return null;

      const current = now().getTime();
      const remaining = session.expiresAt.getTime() - current;
      if (remaining <= 0) {
        await store.delete(session.idHash);
        return null;
      }
      if (remaining < renewWithinMs) {
        const expiresAt = new Date(current + ttlMs);
        await store.setExpiry(session.idHash, expiresAt);
        return { session: { ...session, expiresAt }, renewed: true };
      }
      return { session, renewed: false };
    },

    async invalidate(token) {
      if (token) await store.delete(hashSessionToken(token));
    },

    async invalidateAllForUser(userId) {
      return store.deleteAllForUser(userId);
    },
  };
}
