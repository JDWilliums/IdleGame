/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 18-01 · save-endpoint
 * Lesson:  18.1 Designing the save API
 * Run:     npm run watch 18-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build the cloud-save API. Dependencies and helpers are in ./provided.ts.
 * Every route requires a logged-in user (use the provided requireAuth) and
 * always works on THAT user's save: there is no user id in any URL or body.
 *
 * Every response from these three routes (success OR error) carries
 *   Cache-Control: no-store
 *
 * GET /api/save
 *   → 200 { save: null } when the user has no save yet
 *   → 200 { save: { data, revision, updatedAt } }   (updatedAt as an ISO string)
 *
 * GET /api/save/meta
 *   → 200 { revision, updatedAt }   or   { revision: 0, updatedAt: null }
 *
 * PUT /api/save   { baseRevision, data }
 *   baseRevision: an integer ≥ 0. data: must match the provided SaveSchema.
 *   Invalid → 400 VALIDATION_ERROR (throwing a ZodError is enough).
 *   → 200 { revision, updatedAt } when the write succeeded
 *   → 409 { error: { code: 'SAVE_CONFLICT', message: 'Your save is out of date',
 *                    details: { current: { data, revision, updatedAt } | null } } }
 *
 * Bodies over 64 KB → 413 PAYLOAD_TOO_LARGE (the provided errorHandler already maps
 * the right error; you need to configure the JSON parser). Saves under that size
 * must still be accepted.
 */
import express, { type Express } from 'express';
import { errorHandler, fakeAuth, type SaveRepo } from './provided';

export function createSaveApp(deps: { saves: SaveRepo }): Express {
  const app = express();
  app.use(express.json()); // TODO: is the default limit right?
  app.use(fakeAuth);

  // TODO: the three routes

  app.use(errorHandler);
  return app;
}
