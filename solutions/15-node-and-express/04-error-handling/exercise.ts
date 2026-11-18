// Reference solution for 15-04. Read it only AFTER your own version passes.
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

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

export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

export type ErrorHandlerOptions = {
  exposeStack: boolean;
  logger: { error: (...args: unknown[]) => void };
};

/** body-parser errors are plain Errors with a `type` string. */
function bodyParserType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string') return err.type;
  return undefined;
}

export function errorHandler(options: ErrorHandlerOptions) {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      const error: Record<string, unknown> = { code: err.code, message: err.message };
      if (err.details !== undefined) error.details = err.details;
      res.status(err.status).json({ error });
      return;
    }

    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: err.issues.map((issue) => ({ path: issue.path.map(String).join('.'), message: issue.message })),
        },
      });
      return;
    }

    const type = bodyParserType(err);
    if (type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
      return;
    }
    if (type === 'entity.too.large') {
      res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
      return;
    }

    // Unknown: a bug. Log everything, reveal nothing.
    options.logger.error(err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        ...(options.exposeStack && err instanceof Error ? { stack: err.stack } : {}),
      },
    });
  };
}

// ─── provided: a demo app that throws every kind of error ─────────────────────
export function createDemoApp(options: ErrorHandlerOptions): Express {
  const app = express();
  app.use(express.json({ limit: '1kb' }));

  app.get('/api/players/:id', async (req) => {
    throw new HttpError(404, 'PLAYER_NOT_FOUND', `Player ${req.params.id} not found`);
  });
  app.put('/api/save', async () => {
    throw new HttpError(409, 'SAVE_CONFLICT', 'Your save is out of date', { currentRevision: 7 });
  });
  app.post('/api/echo', (req, res) => {
    const body = z.object({ name: z.string(), stats: z.object({ hp: z.number() }) }).parse(req.body); // throws ZodError
    res.json(body);
  });
  app.get('/api/boom', async () => {
    throw new Error('database password is hunter2'); // an unexpected bug: must NOT leak
  });

  app.use(notFound);
  app.use(errorHandler(options));
  return app;
}
