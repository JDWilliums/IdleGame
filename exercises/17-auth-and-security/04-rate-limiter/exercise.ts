/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 17-04 · rate-limiter
 * Lesson:  17.6 Web security essentials ("Rate limiting")
 * Run:     npm run watch 17-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · createRateLimiter({ windowMs, max, now }) → RateLimiter
 *   A FIXED-WINDOW limiter, tracked separately for each key:
 *   - A key's first hit starts its window, which lasts windowMs.
 *   - Up to `max` hits in a window are allowed. Later hits in the same window
 *     are blocked. Blocked hits don't extend or restart the window.
 *   - Once the window has ended (now >= start + windowMs), the next hit starts
 *     a fresh window.
 *
 *   hit(key) → { allowed, remaining, retryAfterMs }
 *     remaining:    allowed hits left in this window after this one (never below 0)
 *     retryAfterMs: 0 when allowed; otherwise the ms until the window ends
 *   reset(key)  → forget the key (e.g. after a successful login)
 *   prune()     → delete every key whose window has ended (call it on a timer)
 *   size()      → how many keys are stored (so tests can check memory doesn't grow forever)
 *
 * TASK 2 · rateLimit(limiter, keyOf) → Express middleware
 *   keyOf(req) returns the key, or undefined to skip limiting this request.
 *   Allowed → next(). Blocked → 429
 *     { error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' } }
 *   with a Retry-After header: whole seconds, rounded UP.
 *
 * The provided createDemoApp() uses both on a login route. Read it.
 */
import express, { type Express, type NextFunction, type Request, type Response } from 'express';

export type HitResult = { allowed: boolean; remaining: number; retryAfterMs: number };

export type RateLimiter = {
  hit(key: string): HitResult;
  reset(key: string): void;
  prune(): void;
  size(): number;
};

export type RateLimiterOptions = { windowMs: number; max: number; now: () => number };

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  return {
    hit(key) {
      throw new Error('Not implemented yet');
    },
    reset(key) {
      throw new Error('Not implemented yet');
    },
    prune() {
      throw new Error('Not implemented yet');
    },
    size() {
      throw new Error('Not implemented yet');
    },
  };
}

export function rateLimit(limiter: RateLimiter, keyOf: (req: Request) => string | undefined) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next(); // TODO (Task 2)
  };
}

// ─── provided: a login route protected by your limiter ────────────────────────
export function createDemoApp(deps: {
  limiter: RateLimiter;
  checkPassword: (username: string, password: string) => boolean;
}): Express {
  const app = express();
  app.use(express.json());

  // Key by IP AND username: one attacker can't lock everyone out, and spreading
  // guesses at one account across many IPs still hits that account's limit (in
  // production you'd add a second, per-username-only limiter for that).
  const loginKey = (req: Request) => {
    const username: unknown = req.body?.username;
    return typeof username === 'string' ? `login:${req.ip}:${username.toLowerCase()}` : undefined;
  };

  app.post('/api/auth/login', rateLimit(deps.limiter, loginKey), (req, res) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!deps.checkPassword(username, password)) {
      res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } });
      return;
    }
    const key = loginKey(req);
    if (key) deps.limiter.reset(key); // a successful login clears the failures
    res.json({ ok: true });
  });

  return app;
}
