# Module 15 · Node.js & Express

**Time:** ~18 hours · **Prerequisites:** Modules 01–03 (especially 03.2 HTTP), 02.7 (Zod), 12 (testing)

## Why this module matters
Your game needs a server: accounts, cloud saves and a leaderboard can't live only in the browser. Even if you end up on a frontend-only team, understanding the backend makes you a far better React developer. You'll know why an API returns what it does, debug CORS and cookie issues with confidence, and be able to take on full-stack tickets, which many junior roles at smaller companies expect. You'll write the server in **TypeScript with Express 5**, the most widely used Node framework.

## Learning objectives
By the end of this module you can:
- explain how Node runs JavaScript on the server, and use its core modules
- build an HTTP server from scratch, then with Express
- design a clean REST API with sensible URLs, methods, status codes and error formats
- validate every input with Zod and handle errors centrally
- structure a backend in layers with dependency injection, so it's testable
- test APIs end to end with supertest

## Lessons
| # | Lesson | Time |
|---|---|---|
| 15.1 | [Node: the runtime](01-node-the-runtime.md) | 1.5h |
| 15.2 | [HTTP from scratch](02-http-from-scratch.md) | 2h |
| 15.3 | [Express fundamentals](03-express-fundamentals.md) | 2.5h |
| 15.4 | [Designing REST APIs](04-designing-rest-apis.md) | 2h |
| 15.5 | [Validation & error handling](05-validation-and-error-handling.md) | 2.5h |
| 15.6 | [Structuring a backend](06-structuring-a-backend.md) | 2h |
| 15.7 | [Testing APIs](07-testing-apis.md) | 1.5h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `15-01` | [raw-http-server](../../exercises/15-node-and-express/01-raw-http-server/exercise.ts) | 15.2 |
| `15-02` | [express-routes](../../exercises/15-node-and-express/02-express-routes/exercise.ts) | 15.4 |
| `15-03` | [validation-middleware](../../exercises/15-node-and-express/03-validation-middleware/exercise.ts) | 15.5 |
| `15-04` | [error-handling](../../exercises/15-node-and-express/04-error-handling/exercise.ts) | 15.5 |

Hints: [`exercises/15-node-and-express/HINTS.md`](../../exercises/15-node-and-express/HINTS.md)

## Checkpoint quiz
1. Node is single-threaded. How does it handle thousands of simultaneous requests?
2. What does middleware do, and why does registration order matter?
3. What's the signature of an Express error handler, and where must it be registered?
4. What changed about async route handlers in Express 5?
5. Give the URL and method for: list a player's saves, create a save, replace a save, delete a save.
6. Why validate request bodies on the server if the frontend already validates?
7. Why should route handlers receive their dependencies (repositories, clocks) instead of importing them?
8. What does supertest let you do without starting a real server on a port?

<details><summary>Answers</summary>

1. Non-blocking I/O. While waiting on the network or disk, Node handles other requests, and libuv runs the I/O in the background and queues the callbacks (the event loop, 01.4). CPU-heavy work, though, *does* block everyone.
2. Middleware functions run in sequence for a request, and each can read or modify `req`/`res`, end the response, or call `next()`. They run in registration order, so body parsing must come before routes that read the body, and the error handler must come last.
3. `(err, req, res, next)`, with four parameters, registered after all routes.
4. Express 5 catches rejected promises from async handlers and forwards them to the error handler, so you no longer need `try/catch` + `next(err)` wrappers.
5. `GET /api/players/:id/saves`, `POST /api/players/:id/saves`, `PUT /api/saves/:saveId` (or `PUT /api/save` for "my" save), `DELETE /api/saves/:saveId`.
6. Anyone can call the API directly (curl, modified clients, scripts). Server validation is the actual security and integrity boundary.
7. So tests can pass fakes (an in-memory repo, a fixed clock). It's also clearer, and swapping implementations (Postgres vs memory) is easy.
8. Send real HTTP requests to your Express app in-process and assert on status, headers and body. It's fast and deterministic.
</details>

## Extra practice
1. **Leaderboard API.** Add `GET /api/leaderboard?skill=&page=&pageSize=` to your 15-02 app with `validate()` from 15-03 and pagination metadata (`{ items, page, pageSize, total }`).
2. **Request logging.** Write middleware that logs `METHOD URL STATUS DURATIONms` when each response finishes (`res.on('finish')`).
3. **OpenAPI.** Document your 15-02 API in an `openapi.yaml` and view it in Swagger Editor. Many teams generate typed clients from OpenAPI specs.

**Next:** [Module 16 · Databases & SQL →](../16-databases/README.md)
