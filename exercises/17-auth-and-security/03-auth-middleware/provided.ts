/**
 * Provided for exercise 17-03. You don't need to change anything in this file,
 * but do read it: these are the dependencies your app receives.
 *
 * The session service and password hasher here are TEST DOUBLES: simple,
 * fast stand-ins with the same interface as the real ones you built in
 * 17-01 and 17-02. The real app passes those in instead (dependency injection, 15.6).
 */
import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

// ─── users ────────────────────────────────────────────────────────────────────
export type AuthUser = { id: number; username: string };
export type UserRecord = AuthUser & { passwordHash: string };

export class UsernameTakenError extends Error {
  constructor(username: string) {
    super(`Username "${username}" is taken`);
    this.name = 'UsernameTakenError';
  }
}

export type UserRepo = {
  /** Case-insensitive. */
  findByUsername(username: string): Promise<UserRecord | undefined>;
  findById(id: number): Promise<UserRecord | undefined>;
  /** Throws UsernameTakenError if the name exists (case-insensitively). */
  create(input: { username: string; passwordHash: string }): Promise<UserRecord>;
};

export function createInMemoryUserRepo(): UserRepo & { all(): UserRecord[] } {
  const rows: UserRecord[] = [];
  return {
    async findByUsername(username) {
      return rows.find((u) => u.username.toLowerCase() === username.toLowerCase());
    },
    async findById(id) {
      return rows.find((u) => u.id === id);
    },
    async create({ username, passwordHash }) {
      if (rows.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new UsernameTakenError(username);
      const user = { id: rows.length + 1, username, passwordHash };
      rows.push(user);
      return user;
    },
    all: () => rows.map((u) => ({ ...u })),
  };
}

// ─── sessions (a test double for 17-02's session manager) ─────────────────────
export type SessionService = {
  /** Creates a session and returns its token (the cookie value). */
  create(userId: number): Promise<string>;
  validate(token: string): Promise<{ userId: number } | null>;
  invalidate(token: string): Promise<void>;
  invalidateAllForUser(userId: number): Promise<number>;
};

export function createInMemorySessions(options: { now: () => Date; ttlMs: number }): SessionService {
  const sessions = new Map<string, { userId: number; expiresAt: number }>();
  return {
    async create(userId) {
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, { userId, expiresAt: options.now().getTime() + options.ttlMs });
      return token;
    },
    async validate(token) {
      const session = sessions.get(token);
      if (!session) return null;
      if (options.now().getTime() >= session.expiresAt) {
        sessions.delete(token);
        return null;
      }
      return { userId: session.userId };
    },
    async invalidate(token) {
      sessions.delete(token);
    },
    async invalidateAllForUser(userId) {
      let removed = 0;
      for (const [token, session] of sessions) {
        if (session.userId === userId) {
          sessions.delete(token);
          removed += 1;
        }
      }
      return removed;
    },
  };
}

// ─── passwords (a test double for 17-01's hasher) ─────────────────────────────
export type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(password: string, stored: string): Promise<boolean>;
};

/** NEVER use this outside tests: it just reverses the string. It's fast, which is the point here. */
export function createFakePasswordHasher(): PasswordHasher {
  const fake = (password: string) => `fake$${[...password].reverse().join('')}`;
  return {
    async hash(password) {
      return fake(password);
    },
    async verify(password, stored) {
      return fake(password) === stored;
    },
  };
}

// ─── notes: some private, per-user data ───────────────────────────────────────
export type Note = { id: number; userId: number; text: string };

export type NoteRepo = {
  listForUser(userId: number): Promise<Note[]>;
  create(userId: number, text: string): Promise<Note>;
  get(id: number): Promise<Note | undefined>;
  delete(id: number): Promise<void>;
};

export function createInMemoryNoteRepo(): NoteRepo & { all(): Note[] } {
  let rows: Note[] = [];
  let nextId = 1;
  return {
    async listForUser(userId) {
      return rows.filter((n) => n.userId === userId);
    },
    async create(userId, text) {
      const note = { id: nextId++, userId, text };
      rows.push(note);
      return note;
    },
    async get(id) {
      return rows.find((n) => n.id === id);
    },
    async delete(id) {
      rows = rows.filter((n) => n.id !== id);
    },
    all: () => rows.map((n) => ({ ...n })),
  };
}

// ─── typed access to res.locals.user (see 17.5, "Typing res.locals.user") ────
export function setCurrentUser(res: Response, user: AuthUser): void {
  res.locals.user = user;
}

export function getCurrentUser(res: Response): AuthUser | undefined {
  return res.locals.user as AuthUser | undefined;
}

// ─── errors (the 15-04 design) ────────────────────────────────────────────────
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: err.issues.map((i) => ({ path: i.path.map(String).join('.'), message: i.message })),
      },
    });
    return;
  }
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
