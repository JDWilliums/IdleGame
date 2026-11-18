# 15.5 · Validation & error handling

> ⏱ 2.5 hours · Module 15 · Node.js & Express

## What you'll learn
- Validating body, params and query with a reusable Zod middleware
- An `HttpError` class for expected failures
- A central error handler that maps errors to consistent JSON
- Handling body parse errors and unknown errors safely
- Logging without leaking details

---

## Every input is hostile

From lesson 02.7: `req.body`, `req.params`, `req.query` and headers are **untrusted**. On the server this goes beyond "nice UX". Unvalidated input leads to crashes, corrupted data, cheating (`gold: 999999999`), and security holes.

**Validate at the edge, before any business logic runs**, and give handlers typed, trusted data.

## A validation middleware

```ts
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

type Schemas = { body?: z.ZodType; query?: z.ZodType; params?: z.ZodType };

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const details: { path: string; message: string }[] = [];

    const check = (location: 'body' | 'query' | 'params', schema: z.ZodType | undefined, value: unknown) => {
      if (!schema) return undefined;
      const result = schema.safeParse(value);
      if (result.success) return result.data;
      for (const issue of result.error.issues) {
        details.push({ path: [location, ...issue.path].join('.'), message: issue.message });
      }
      return undefined;
    };

    const body = check('body', schemas.body, req.body);
    const query = check('query', schemas.query, req.query);
    const params = check('params', schemas.params, req.params);

    if (details.length > 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details } });
    }
    if (schemas.body) req.body = body;                  // replace with PARSED data (trimmed, coerced, defaults)
    if (schemas.query) res.locals.query = query;        // req.query is read-only in Express 5
    if (schemas.params) res.locals.params = params;
    next();
  };
}
```

Using it:

```ts
const CreatePlayerBody = z.object({ name: z.string().trim().min(3).max(20) });
const PlayerParams = z.object({ id: z.coerce.number().int().positive() });   // "42" → 42
const ListQuery = z.object({
  sort: z.enum(['name', 'createdAt']).default('createdAt'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.post('/', validate({ body: CreatePlayerBody }), async (req, res) => {
  const { name } = req.body as z.infer<typeof CreatePlayerBody>;   // validated
  …
});

router.get('/', validate({ query: ListQuery }), async (_req, res) => {
  const { sort, limit } = res.locals.query as z.infer<typeof ListQuery>;
  …
});
```

> `z.coerce.number()` matters here: params and query strings are always **strings**, and coercion turns `"42"` into `42` before validating.

You'll build this middleware (with tests) in exercise 15-03. Libraries like `zod-express-middleware` exist, but writing it yourself takes 30 lines and teaches you exactly how middleware works.

## Expected failures: `HttpError`

Many errors are **expected**: not found, forbidden, conflict. Throw a typed error from anywhere, and let one central handler turn it into a response:

```ts
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

export const notFound = (what: string) => new HttpError(404, 'NOT_FOUND', `${what} not found`);

// in a service or handler
const player = await players.get(id);
if (!player) throw notFound('Player');
if (player.ownerId !== userId) throw new HttpError(403, 'FORBIDDEN', 'Not your player');
```

Handlers stay focused on the happy path, and Express 5 forwards the thrown error to the handler.

## The central error handler

```ts
export function errorHandler(options: { exposeStack: boolean; logger: Pick<Console, 'error'> }) {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: … } });
    }
    if (isBodyParseError(err)) {     // express.json() on malformed JSON: err.type === 'entity.parse.failed'
      return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } });
    }
    if (isTooLarge(err)) {           // err.type === 'entity.too.large'
      return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
    }
    // Anything else is a BUG: log it with full details, tell the client nothing specific
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
```

Principles:
- **Expected errors** (`HttpError`, validation) get specific, safe messages.
- **Unexpected errors** get a **generic** message for the client and **full details in your logs**. Leaking stack traces or SQL errors helps attackers and confuses users. `exposeStack` is for development only.
- **One place** decides the error format, so it's consistent everywhere.

You'll build this in exercise 15-04.

## Logging

`console.log` is fine to start with. Production APIs use **structured logging** (JSON lines with a level, timestamp, request id, user id and message) so logs can be searched. The common library is **pino**. Lesson 20.5 covers observability.

```ts
logger.error({ err, requestId, userId, route: req.path }, 'Unhandled error');
```

Never log passwords, session tokens or full save files.

## Check your understanding

1. Why does the validation middleware replace `req.body` with the parsed result?
2. Why does `z.coerce.number()` matter for route params?
3. When should a handler throw `HttpError` versus letting an error propagate?
4. Why does the 500 response hide the real error message?

<details><summary>Answers</summary>

1. The parsed data has transforms and defaults applied (trimmed strings, coerced numbers, default values) and is known to be valid, so handlers can use it directly.
2. Params and query values are always strings. Coercion converts `"42"` to `42` before checking `int().positive()`, so `"abc"` fails validation instead of reaching your code.
3. Throw `HttpError` for expected, client-caused outcomes with a known status (404, 403, 409). Let unexpected errors (bugs, a database that's down) propagate, so they're logged and become a generic 500.
4. Internal details (stack traces, SQL, file paths) can reveal how the system works to attackers and mean nothing to users. Log them server-side instead.
</details>

## Further reading
- Express docs: [Error handling](https://expressjs.com/en/guide/error-handling.html)
- OWASP: [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)

**Practice:** exercises `15-03` validation-middleware and `15-04` error-handling

---
[← Designing REST APIs](04-designing-rest-apis.md) · [Module overview](README.md) · [Next: Structuring a backend →](06-structuring-a-backend.md)
