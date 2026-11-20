// Reference solution for 17-03. Read it only AFTER your own version passes.
import { randomBytes } from 'node:crypto';
import cookieParser from 'cookie-parser';
import express, { Router, type Express, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  errorHandler,
  getCurrentUser,
  HttpError,
  notFound,
  setCurrentUser,
  UsernameTakenError,
  type AuthUser,
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

// ─── Task 1: cookies ──────────────────────────────────────────────────────────
const cookieOptions = (secure: boolean) => ({ httpOnly: true, secure, sameSite: 'lax' as const, path: '/' });

export function setSessionCookie(res: Response, token: string, secure: boolean): void {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(secure), maxAge: SESSION_MAX_AGE_MS });
}

export function clearSessionCookie(res: Response, secure: boolean): void {
  // Same name, path and flags as when it was set, or the browser treats it as a different cookie.
  res.clearCookie(SESSION_COOKIE, cookieOptions(secure));
}

// ─── validation ───────────────────────────────────────────────────────────────
const Credentials = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, 'Username must be 3–20 letters, digits or underscores'),
  password: z.string().min(8).max(128),
});

const NoteBody = z.object({ text: z.string().min(1).max(500) });

const publicUser = (user: AuthUser): AuthUser => ({ id: user.id, username: user.username });

function readToken(req: Request): string | undefined {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

// ─── the app ──────────────────────────────────────────────────────────────────
export function createApp(deps: AppDeps): Express {
  const { users, sessions, passwords, notes, cookieSecure } = deps;

  // Made once, lazily: verifying against it costs the same as verifying a real user.
  let dummyHash: Promise<string> | undefined;
  const getDummyHash = () => (dummyHash ??= passwords.hash(randomBytes(16).toString('hex')));

  // Task 2: identify the user if there is one. Never rejects.
  async function loadSession(req: Request, res: Response, next: NextFunction) {
    const token = readToken(req);
    if (token) {
      const session = await sessions.validate(token);
      const user = session ? await users.findById(session.userId) : undefined;
      if (user) setCurrentUser(res, publicUser(user));
      else clearSessionCookie(res, cookieSecure);
    }
    next();
  }

  // Task 3: guard for routes that need a user.
  function requireAuth(_req: Request, res: Response, next: NextFunction) {
    if (!getCurrentUser(res)) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Log in to continue' } });
      return;
    }
    next();
  }

  /** For handlers behind requireAuth. Throwing here would mean a wiring bug. */
  function currentUser(res: Response): AuthUser {
    const user = getCurrentUser(res);
    if (!user) throw new Error('currentUser() used on a route without requireAuth');
    return user;
  }

  async function startSession(res: Response, userId: number) {
    setSessionCookie(res, await sessions.create(userId), cookieSecure);
  }

  // Task 4: routes
  const auth = Router();

  auth.post('/register', async (req, res) => {
    const { username, password } = Credentials.parse(req.body);
    const passwordHash = await passwords.hash(password);
    let user;
    try {
      user = await users.create({ username, passwordHash });
    } catch (err) {
      if (err instanceof UsernameTakenError) throw new HttpError(409, 'USERNAME_TAKEN', 'That username is taken');
      throw err;
    }
    await startSession(res, user.id);
    res.status(201).json({ user: publicUser(user) });
  });

  auth.post('/login', async (req, res) => {
    const { username, password } = Credentials.parse(req.body);
    const user = await users.findByUsername(username);
    const ok = await passwords.verify(password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    await startSession(res, user.id); // always a fresh session: prevents session fixation
    res.json({ user: publicUser(user) });
  });

  auth.get('/me', requireAuth, (_req, res) => {
    res.json({ user: currentUser(res) });
  });

  auth.post('/logout', async (req, res) => {
    const token = readToken(req);
    if (token) await sessions.invalidate(token);
    clearSessionCookie(res, cookieSecure);
    res.status(204).end();
  });

  auth.post('/logout-all', requireAuth, async (_req, res) => {
    await sessions.invalidateAllForUser(currentUser(res).id);
    clearSessionCookie(res, cookieSecure);
    res.status(204).end();
  });

  const notesRouter = Router();
  notesRouter.use(requireAuth);

  notesRouter.get('/', async (_req, res) => {
    const items = await notes.listForUser(currentUser(res).id);
    res.json({ items: items.map(({ id, text }) => ({ id, text })) });
  });

  notesRouter.post('/', async (req, res) => {
    const { text } = NoteBody.parse(req.body);
    const note = await notes.create(currentUser(res).id, text);
    res.status(201).json({ id: note.id, text: note.text });
  });

  notesRouter.delete('/:id', async (req, res) => {
    const note = await notes.get(Number(req.params.id));
    // 404 for "missing" AND "not yours", so nobody can probe which ids exist.
    if (!note || note.userId !== currentUser(res).id) throw new HttpError(404, 'NOT_FOUND', 'Note not found');
    await notes.delete(note.id);
    res.status(204).end();
  });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(loadSession);
  app.use('/api/auth', auth);
  app.use('/api/notes', notesRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
