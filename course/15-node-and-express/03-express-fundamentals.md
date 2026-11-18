# 15.3 · Express fundamentals

> ⏱ 2.5 hours · Module 15 · Node.js & Express

## What you'll learn
- Apps, routes, params and query strings
- Responses: status, JSON, headers, `204 No Content`
- Middleware: the request pipeline, `next()`, and why order matters
- Routers for organising routes
- Async handlers in Express 5
- 404s and error handlers
- Typing Express with TypeScript

---

## Setup

```bash
npm install express
npm install -D @types/express
```

```ts
import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));   // parse JSON bodies (with a size limit!)

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });                // sets Content-Type and status 200
  });

  return app;
}

// server.ts
const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => console.log(`API on :${port}`));
```

Export a **function that creates the app** (`createApp`) separately from the code that **listens**. Tests import `createApp()` and use supertest, with no ports involved (15.7).

## Routes

```ts
app.get('/api/players', listPlayers);
app.post('/api/players', createPlayer);
app.get('/api/players/:id', getPlayer);        // :id is a route parameter
app.patch('/api/players/:id', updatePlayer);
app.delete('/api/players/:id', deletePlayer);
```

### Request data
```ts
app.get('/api/players/:id', (req, res) => {
  req.params.id;            // string: '42'   (always a string! convert and validate)
  req.query.sort;           // from ?sort=xp → string | string[] | … (also untrusted)
  req.headers.authorization;
  req.body;                 // the parsed JSON (needs express.json()): untrusted, so validate
});
```

> ⚠️ In Express 5, `req.query` is a **getter**, so you can't assign to it. Store validated query values elsewhere (`res.locals`, lesson 15.5).

### Responses
```ts
res.status(201).json(player);                         // created
res.status(204).end();                                // success, no body (DELETE)
res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Player not found' } });
res.set('Location', `/api/players/${player.id}`);     // headers
res.cookie('session', token, { httpOnly: true });     // cookies (Module 17)
```

Send exactly **one** response per request. Calling `res.json` twice throws "Cannot set headers after they are sent", which usually means a missing `return`.

## Middleware

A middleware is a function `(req, res, next)` that runs in the request pipeline. It can:
- read or modify `req`/`res`
- end the response (for example, reject with a 401)
- call `next()` to pass control to the next middleware or route

```ts
function requestTimer(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${(performance.now() - start).toFixed(1)}ms`);
  });
  next();                                   // ← forget this and the request hangs forever
}

app.use(requestTimer);                      // every request
app.use('/api', requireAuth);               // every request under /api
app.get('/api/me', requireAuth, getMe);     // just this route
```

### Order matters
Middleware and routes run **in the order they're registered**:

```ts
app.use(express.json());     // 1. parse bodies first…
app.use(requestTimer);       // 2. log
app.use('/api', apiRouter);  // 3. routes (they can now read req.body)
app.use(notFound);           // 4. nothing matched → 404
app.use(errorHandler);       // 5. LAST: errors from anything above
```

Register the JSON parser *after* your routes and `req.body` is `undefined`. Register the error handler first and it never catches anything.

### Passing data along
Middleware often computes something later handlers need (like the authenticated user). Put it on `res.locals`, which is a per-request object:

```ts
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in' } });
  res.locals.user = user;
  next();
}
```

## Routers

Group related routes into a mini-app:

```ts
// routes/players.ts
import { Router } from 'express';

export function playersRouter(deps: { players: PlayerRepo }) {
  const router = Router();
  router.get('/', async (_req, res) => res.json(await deps.players.list()));
  router.get('/:id', async (req, res) => { … });
  return router;
}

// app.ts
app.use('/api/players', playersRouter({ players }));
```

## Async handlers (Express 5)

Database calls are async. In **Express 5**, if an async handler throws or its promise rejects, Express catches it and forwards it to your error handler automatically:

```ts
router.get('/:id', async (req, res) => {
  const player = await deps.players.get(req.params.id);   // if this throws → error handler
  if (!player) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Player not found' } });
  res.json(player);
});
```

> In **Express 4** (lots of existing code!) async errors were *not* caught. People wrapped handlers in `asyncHandler(fn)` or `try/catch` + `next(err)`. If you see those wrappers at work, that's why.

## 404s and errors

```ts
// after all routes: nothing matched
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
});

// error handler: FOUR parameters (that's how Express recognises it)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
});
```

Calling `next(err)` (or throwing in an async handler) skips straight to the error handler. Lesson 15.5 builds a proper one.

## Typing

```ts
import type { NextFunction, Request, Response } from 'express';

// typed params / body / response body / query
app.get('/api/players/:id', (req: Request<{ id: string }>, res: Response<Player | ApiError>) => { … });
```

The generic types document intent, but **they don't validate anything**: `req.body` typed as `NewPlayer` is still whatever the client sent. Validation turns `unknown` into a real type (15.5).

## Check your understanding

1. Why export `createApp()` instead of calling `app.listen()` in the same file?
2. What happens if a middleware neither calls `next()` nor sends a response?
3. Where do you register the error handler, and how does Express know it's one?
4. You get "Cannot set headers after they are sent to the client". What's the likely bug?
5. Why can't you trust `req.params.id` to be a valid id?

<details><summary>Answers</summary>

1. Tests and other entry points can create the app without opening a port, and the same app can be listened on, tested with supertest, or wrapped differently in production.
2. The request hangs until the client times out.
3. After every route and middleware. Express identifies it by its four parameters `(err, req, res, next)`.
4. The handler sent a response twice, typically because of a missing `return` after an early `res.status(…).json(…)`, so execution continued to a second send.
5. It's raw text from the URL that any client can set to anything. Convert and validate it, and handle the not-found case.
</details>

## Further reading
- Express docs: [Routing](https://expressjs.com/en/guide/routing.html), [Writing middleware](https://expressjs.com/en/guide/writing-middleware.html), [Error handling](https://expressjs.com/en/guide/error-handling.html), [Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html)

---
[← HTTP from scratch](02-http-from-scratch.md) · [Module overview](README.md) · [Next: Designing REST APIs →](04-designing-rest-apis.md)
