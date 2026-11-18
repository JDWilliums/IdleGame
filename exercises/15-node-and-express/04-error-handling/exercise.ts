/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 15-04 · error-handling
 * Lesson:  15.5 Validation & error handling
 * Run:     npm run watch 15-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · HttpError(status, code, message, details?)
 *   An Error subclass with name 'HttpError' and readonly status/code/details.
 *
 * TASK 2 · notFound: middleware for unmatched routes →
 *   404 { error: { code: 'NOT_FOUND', message: `No route for ${METHOD} ${path}` } }
 *
 * TASK 3 · errorHandler({ exposeStack, logger }) → an Express error handler (4 params!)
 *   HttpError          → its status: { error: { code, message } }, plus `details` only if defined
 *   z.ZodError         → 400 { error: { code: 'VALIDATION_ERROR', message: 'Invalid request',
 *                               details: [{ path: 'a.b', message }] } }
 *   body parse failure → 400 { error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } }
 *                        (express.json() errors have type === 'entity.parse.failed')
 *   body too large     → 413 { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } }
 *                        (type === 'entity.too.large')
 *   anything else      → logger.error(err), then
 *                        500 { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }
 *                        and ALSO `stack` (the error's stack) in the error object ONLY when exposeStack is true.
 *                        Never send the real message of an unknown error.
 *   Expected errors (the first four) must NOT be logged as errors.
 *
 * The provided createDemoApp wires everything up for the tests.
 */
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';

export class HttpError extends Error {
  // TODO (Task 1)
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
  }
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(); // TODO (Task 2)
}

export type ErrorHandlerOptions = {
  exposeStack: boolean;
  logger: { error: (...args: unknown[]) => void };
};

export function errorHandler(options: ErrorHandlerOptions) {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ todo: true }); // TODO (Task 3)
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
