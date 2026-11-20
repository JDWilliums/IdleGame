// Reference solution for 18-01. Read it only AFTER your own version passes.
import express, { Router, type Express, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  errorHandler,
  fakeAuth,
  getCurrentUser,
  HttpError,
  requireAuth,
  SaveSchema,
  type SaveRecord,
  type SaveRepo,
} from './provided';

const PutSaveBody = z.object({
  baseRevision: z.number().int().nonnegative(),
  data: SaveSchema,
});

const toJson = (record: SaveRecord) => ({
  data: record.data,
  revision: record.revision,
  updatedAt: record.updatedAt.toISOString(),
});

/** Saves must never come from a cache: a stale copy would be the base of the next write. */
function noStore(_req: Request, res: Response, next: NextFunction) {
  res.set('Cache-Control', 'no-store');
  next();
}

function userId(res: Response): number {
  const user = getCurrentUser(res);
  if (!user) throw new Error('route is missing requireAuth');
  return user.id;
}

export function createSaveApp(deps: { saves: SaveRepo }): Express {
  const { saves } = deps;
  const router = Router();
  // noStore first, so even 401s and 400s from these routes carry the header.
  router.use(noStore, requireAuth);

  router.get('/', async (_req, res) => {
    const record = await saves.get(userId(res));
    res.json({ save: record ? toJson(record) : null });
  });

  router.get('/meta', async (_req, res) => {
    const record = await saves.get(userId(res));
    res.json(record ? { revision: record.revision, updatedAt: record.updatedAt.toISOString() } : { revision: 0, updatedAt: null });
  });

  router.put('/', async (req, res) => {
    const { baseRevision, data } = PutSaveBody.parse(req.body);
    const result = await saves.put(userId(res), data, baseRevision);
    if (!result.ok) {
      throw new HttpError(409, 'SAVE_CONFLICT', 'Your save is out of date', {
        current: result.current ? toJson(result.current) : null,
      });
    }
    res.json({ revision: result.record.revision, updatedAt: result.record.updatedAt.toISOString() });
  });

  const app = express();
  app.use(express.json({ limit: '64kb' })); // the default (100kb) is bigger than we want
  app.use(fakeAuth);
  app.use('/api/save', router);
  app.use(errorHandler);
  return app;
}
