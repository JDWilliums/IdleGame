/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 15-03 · validation-middleware
 * Lesson:  15.5 Validation & error handling
 * Run:     npm run watch 15-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · validate({ body?, query?, params? }) → Express middleware
 *   Validate each provided part of the request with its Zod schema
 *   (safeParse). Collect issues from ALL parts (don't stop at the first).
 *   - Any issues → 400 {
 *       error: { code: 'VALIDATION_ERROR', message: 'Invalid request',
 *                details: [{ path: 'body.name', message: '…' }, …] }
 *     }   where path = location + the issue path, joined with '.'
 *         (e.g. 'query.limit', 'params.id', 'body.skills.fishing.xp')
 *   - No issues → store the PARSED values, then call next():
 *       body   → replace req.body
 *       query  → res.locals.query    (req.query is read-only in Express 5!)
 *       params → res.locals.params
 *
 * TASK 2 · the provided demo routes in createDemoApp() use your middleware.
 *   Read them to see how it's used. They're what the tests call.
 */
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

export type Schemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

export function validate(schemas: Schemas) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next(); // TODO
  };
}

// ─── provided: a small app that uses your middleware ─────────────────────────
export const CreateSaveBody = z.object({
  playerName: z.string().trim().min(3).max(20),
  gold: z.number().int().nonnegative(),
  skills: z.record(z.string(), z.object({ xp: z.number().int().nonnegative() })).default({}),
});

export const LeaderboardQuery = z.object({
  skill: z.enum(['woodcutting', 'fishing', 'mining']),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const PlayerParams = z.object({ id: z.coerce.number().int().positive() });

export function createDemoApp(): Express {
  const app = express();
  app.use(express.json());

  app.post('/api/saves', validate({ body: CreateSaveBody }), (req, res) => {
    res.status(201).json({ received: req.body });
  });

  app.get('/api/leaderboard', validate({ query: LeaderboardQuery }), (_req, res) => {
    res.json({ query: res.locals.query });
  });

  app.put(
    '/api/players/:id/save',
    validate({ params: PlayerParams, body: CreateSaveBody }),
    (req, res) => {
      res.json({ params: res.locals.params, body: req.body });
    },
  );

  return app;
}
