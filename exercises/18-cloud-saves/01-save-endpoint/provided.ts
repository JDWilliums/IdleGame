/**
 * Provided for exercise 18-01. Read it, but you don't need to change it.
 *
 * - SaveSchema: the v3 save format from 13-08 (in the capstone it lives in a
 *   shared package used by both client and server, 19.2).
 * - An in-memory SaveRepo with the same contract as your 16-04 repository.
 * - fakeAuth: a TEST stand-in for 17-03's loadSession. It trusts an
 *   `x-test-user: <id>` header so the tests can be any user they like.
 *   (Obviously never do this in production.)
 * - HttpError and an error handler in the 15-04 style.
 */
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

// ─── the save format ──────────────────────────────────────────────────────────
const xp = z.number().int().nonnegative();

export const SaveSchema = z.object({
  version: z.literal(3),
  gold: z.number().int().nonnegative(),
  skills: z.record(z.string(), z.object({ xp })),
  bank: z.record(z.string(), z.number().int().positive()),
  lastSavedAt: z.number(),
  createdAt: z.number(),
  settings: z.object({ sound: z.boolean(), notifications: z.boolean() }),
});
export type Save = z.infer<typeof SaveSchema>;

// ─── storage ──────────────────────────────────────────────────────────────────
export type SaveRecord = { userId: number; data: Save; revision: number; updatedAt: Date };
export type PutResult = { ok: true; record: SaveRecord } | { ok: false; current: SaveRecord | null };

export type SaveRepo = {
  get(userId: number): Promise<SaveRecord | null>;
  /** Optimistic write: baseRevision 0 creates; otherwise only writes if the stored revision matches. */
  put(userId: number, data: Save, baseRevision: number): Promise<PutResult>;
};

export function createInMemorySaveRepo(deps: { now: () => Date }): SaveRepo {
  const rows = new Map<number, SaveRecord>();
  const copy = (r: SaveRecord): SaveRecord => structuredClone(r);
  return {
    async get(userId) {
      const row = rows.get(userId);
      return row ? copy(row) : null;
    },
    async put(userId, data, baseRevision) {
      const current = rows.get(userId) ?? null;
      const currentRevision = current?.revision ?? 0;
      if (currentRevision !== baseRevision) return { ok: false, current: current ? copy(current) : null };
      const record: SaveRecord = { userId, data: structuredClone(data), revision: currentRevision + 1, updatedAt: deps.now() };
      rows.set(userId, record);
      return { ok: true, record: copy(record) };
    },
  };
}

// ─── auth (test stand-in) ─────────────────────────────────────────────────────
export type AuthUser = { id: number };

export function fakeAuth(req: Request, res: Response, next: NextFunction) {
  const id = Number(req.get('x-test-user'));
  if (Number.isInteger(id) && id > 0) res.locals.user = { id } satisfies AuthUser;
  next();
}

export function getCurrentUser(res: Response): AuthUser | undefined {
  return res.locals.user as AuthUser | undefined;
}

export function requireAuth(_req: Request, res: Response, next: NextFunction) {
  if (!getCurrentUser(res)) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Log in to continue' } });
    return;
  }
  next();
}

// ─── errors ───────────────────────────────────────────────────────────────────
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) },
    });
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
  const type = typeof err === 'object' && err !== null && 'type' in err ? err.type : undefined;
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
