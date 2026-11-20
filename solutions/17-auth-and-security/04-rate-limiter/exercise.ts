// Reference solution for 17-04. Read it only AFTER your own version passes.
import express, { type Express, type NextFunction, type Request, type Response } from 'express';

export type HitResult = { allowed: boolean; remaining: number; retryAfterMs: number };

export type RateLimiter = {
  hit(key: string): HitResult;
  reset(key: string): void;
  prune(): void;
  size(): number;
};

export type RateLimiterOptions = { windowMs: number; max: number; now: () => number };

type Window = { start: number; count: number };

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, max, now } = options;
  const windows = new Map<string, Window>();
  const hasEnded = (w: Window, time: number) => time >= w.start + windowMs;

  return {
    hit(key) {
      const time = now();
      let window = windows.get(key);
      if (!window || hasEnded(window, time)) {
        window = { start: time, count: 0 };
        windows.set(key, window);
      }

      if (window.count >= max) {
        return { allowed: false, remaining: 0, retryAfterMs: window.start + windowMs - time };
      }
      window.count += 1;
      return { allowed: true, remaining: max - window.count, retryAfterMs: 0 };
    },

    reset(key) {
      windows.delete(key);
    },

    prune() {
      const time = now();
      for (const [key, window] of windows) {
        if (hasEnded(window, time)) windows.delete(key); // deleting while iterating a Map is safe
      }
    },

    size() {
      return windows.size;
    },
  };
}

export function rateLimit(limiter: RateLimiter, keyOf: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyOf(req);
    if (key === undefined) return next();

    const result = limiter.hit(key);
    if (result.allowed) return next();

    res.set('Retry-After', String(Math.max(1, Math.ceil(result.retryAfterMs / 1000))));
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' } });
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
