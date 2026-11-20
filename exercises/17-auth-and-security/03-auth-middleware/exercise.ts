/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 17-03 · auth-middleware
 * Lesson:  17.5 Implementing session auth (with 17.4 for cookies)
 * Run:     npm run watch 17-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build the account API: register, login, me, logout, logout-all, plus a
 * private notes API that shows authorisation. Dependencies come from
 * ./provided.ts; read it first. Errors use the provided HttpError and
 * errorHandler (a thrown ZodError becomes a 400 VALIDATION_ERROR for you).
 *
 * TASK 1 · setSessionCookie(res, token, secure) / clearSessionCookie(res, secure)
 *   Cookie name SESSION_COOKIE. Attributes: HttpOnly, SameSite=Lax, Path=/,
 *   Max-Age 30 days (SESSION_MAX_AGE_MS), and Secure only when `secure` is true.
 *   Clearing must use the same attributes (minus the max age).
 *
 * TASK 2 · loadSession middleware (for every request)
 *   If the request has a session cookie: validate it with deps.sessions and load
 *   the user with deps.users.findById. Valid → setCurrentUser(res, { id, username }).
 *   Invalid or expired → clear the cookie. NEVER rejects the request.
 *
 * TASK 3 · requireAuth middleware
 *   No current user → 401 { error: { code: 'UNAUTHENTICATED', message: 'Log in to continue' } }
 *
 * TASK 4 · routes (all JSON; responses never include passwordHash)
 *   POST /api/auth/register   { username, password }
 *       username: trimmed, 3–20 of [a-z A-Z 0-9 _]; password: 8–128 characters
 *       → 400 VALIDATION_ERROR | 409 USERNAME_TAKEN
 *       → 201 { user: { id, username } }, and the new user is logged in (cookie set)
 *   POST /api/auth/login      { username, password }
 *       → 200 { user } with a NEW session cookie
 *       → 401 { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } }
 *         for an unknown user AND for a wrong password. For an unknown user, still
 *         call passwords.verify (against a dummy hash made once with passwords.hash).
 *       → 400 VALIDATION_ERROR for a malformed body
 *   GET  /api/auth/me         → 200 { user } | 401
 *   POST /api/auth/logout     → 204: invalidate the session (if any) and clear the cookie.
 *                                Works when logged out too.
 *   POST /api/auth/logout-all → requires auth; invalidates ALL the user's sessions,
 *                                clears the cookie, 204
 *   GET    /api/notes         → requires auth; 200 { items: [{ id, text }] }, own notes only
 *   POST   /api/notes { text } (1–500 characters) → 201 { id, text }
 *   DELETE /api/notes/:id     → 204 if it's yours; 404 NOT_FOUND if it doesn't exist
 *                                OR belongs to someone else (don't reveal which)
 */
import cookieParser from 'cookie-parser';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import {
  errorHandler,
  notFound,
  type NoteRepo,
  type PasswordHasher,
  type SessionService,
  type UserRepo,
} from './provided';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type AppDeps = {
  users: UserRepo;
  sessions: SessionService;
  passwords: PasswordHasher;
  notes: NoteRepo;
  cookieSecure: boolean;
};

export function setSessionCookie(res: Response, token: string, secure: boolean): void {
  // TODO (Task 1)
}

export function clearSessionCookie(res: Response, secure: boolean): void {
  // TODO (Task 1)
}

export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // TODO (Tasks 2–4): loadSession, requireAuth, the auth routes and the notes routes

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
