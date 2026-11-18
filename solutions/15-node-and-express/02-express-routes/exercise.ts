// Reference solution for 15-02. Read it only AFTER your own version passes.
import express, { Router, type Express, type Response } from 'express';

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

const toJson = (p: Player) => ({ id: p.id, name: p.name, createdAt: p.createdAt.toISOString() });

function sendError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

/** Returns a trimmed valid name, or null. (Module 15-03 replaces this with Zod.) */
function parseName(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('name' in body) || typeof body.name !== 'string') return null;
  const name = body.name.trim();
  return name.length >= 3 && name.length <= 20 ? name : null;
}

function parseId(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

function playersRouter({ players, now }: AppDeps) {
  const router = Router();

  router.get('/', async (req, res) => {
    const sort = req.query.sort === 'name' ? 'name' : 'createdAt';
    const parsedLimit = Number(req.query.limit);
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
    const all = await players.list();
    const sorted = all.toSorted((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : a.createdAt.getTime() - b.createdAt.getTime(),
    );
    res.json({ items: sorted.slice(0, limit).map(toJson), total: all.length });
  });

  router.get('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const player = id === null ? undefined : await players.get(id);
    if (!player) return sendError(res, 404, 'NOT_FOUND', 'Player not found');
    res.json(toJson(player));
  });

  router.post('/', async (req, res) => {
    const name = parseName(req.body);
    if (name === null) return sendError(res, 400, 'VALIDATION_ERROR', 'name must be 3–20 characters');
    if (await players.findByName(name)) return sendError(res, 409, 'NAME_TAKEN', 'That name is taken');
    const player = await players.create(name, now());
    res.status(201).location(`/api/players/${player.id}`).json(toJson(player));
  });

  router.patch('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const existing = id === null ? undefined : await players.get(id);
    if (!existing || id === null) return sendError(res, 404, 'NOT_FOUND', 'Player not found');
    const name = parseName(req.body);
    if (name === null) return sendError(res, 400, 'VALIDATION_ERROR', 'name must be 3–20 characters');
    const clash = await players.findByName(name);
    if (clash && clash.id !== id) return sendError(res, 409, 'NAME_TAKEN', 'That name is taken');
    const updated = await players.rename(id, name);
    res.json(toJson(updated ?? existing));
  });

  router.delete('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null || !(await players.delete(id))) return sendError(res, 404, 'NOT_FOUND', 'Player not found');
    res.status(204).end();
  });

  return router;
}

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/players', playersRouter(deps));
  app.use((_req, res) => sendError(res, 404, 'NOT_FOUND', 'Route not found'));
  return app;
}
