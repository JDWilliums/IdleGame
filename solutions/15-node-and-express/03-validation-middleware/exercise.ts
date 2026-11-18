// Reference solution for 15-03. Read it only AFTER your own version passes.
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

export type Schemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

type Detail = { path: string; message: string };

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const details: Detail[] = [];

    function check(location: 'body' | 'query' | 'params', schema: z.ZodType | undefined, value: unknown) {
      if (!schema) return { used: false as const };
      const result = schema.safeParse(value);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({ path: [location, ...issue.path.map(String)].join('.'), message: issue.message });
        }
        return { used: false as const };
      }
      return { used: true as const, data: result.data };
    }

    const body = check('body', schemas.body, req.body);
    const query = check('query', schemas.query, req.query);
    const params = check('params', schemas.params, req.params);

    if (details.length > 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details } });
      return;
    }

    if (body.used) req.body = body.data;
    if (query.used) res.locals.query = query.data; // req.query is a read-only getter in Express 5
    if (params.used) res.locals.params = params.data;
    next();
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
