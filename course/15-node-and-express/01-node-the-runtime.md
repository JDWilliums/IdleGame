# 15.1 · Node: the runtime

> ⏱ 1.5 hours · Module 15 · Node.js & Express

## What you'll learn
- What Node.js is: V8 + libuv + core modules
- The event loop on the server, and why blocking is so costly there
- Core APIs: `process`, environment variables, `fs/promises`, `path`, `crypto`
- Running TypeScript on Node
- Built-ins that replace old dependencies: `fetch`, the test runner, `--watch`, `--env-file`

---

## What Node is

**Node.js** runs JavaScript outside the browser. It's:
- **V8**: the same JavaScript engine as Chrome
- **libuv**: a C library that provides the event loop and does I/O (files, network, DNS) asynchronously, using the operating system and a small thread pool
- **core modules**: `node:fs`, `node:http`, `node:crypto`, `node:path` and so on

There's no DOM, no `window` and no `document`. Instead there's `process`, the file system and network sockets.

## The event loop, server edition

Lesson 01.4's event loop applies here too, and it matters even more:

```
request A arrives → handler starts DB query → awaits ──┐
request B arrives → handler starts DB query → awaits ──┤  Node is FREE while waiting.
request C arrives → …                                  │  libuv does the I/O.
DB answers A → callback queued → A's handler resumes ◄─┘
```

One thread serves thousands of concurrent requests **because it never waits**: every I/O operation is async. But if one request does **CPU-heavy synchronous work** (hashing a password with a sync API, a giant `JSON.parse`, a tight loop), *every* other request waits. In the browser a blocked thread freezes one user's tab. On the server it freezes **all** your users.

> 🧠 That's why lesson 17.2 uses the **async** `crypto.scrypt` for password hashing, which runs in libuv's thread pool, rather than `scryptSync`.

## `process`

```ts
process.env.PORT;              // environment variables: string | undefined (validate them! lesson 19.4)
process.argv;                  // command-line arguments
process.exit(1);               // exit with an error code (non-zero = failure)
process.cwd();                 // the current working directory
process.on('SIGTERM', shutdown);   // the host asks you to stop: close the server and DB pool gracefully
process.on('unhandledRejection', (err) => { log(err); process.exit(1); });
```

### Environment variables
Configuration (ports, database URLs, secrets) comes from the environment, not from code. Node can load a `.env` file natively:

```bash
node --env-file=.env src/server.ts
```

```bash
# .env (never commit it! lesson 05.1)
PORT=3000
DATABASE_URL=postgres://game:secret@localhost:5432/game
SESSION_SECRET=…
```

## Core modules

Always import them with the `node:` prefix, which makes it clear they're built in:

```ts
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';

const config = JSON.parse(await readFile(path.join(import.meta.dirname, 'config.json'), 'utf8'));
await mkdir('logs', { recursive: true });
const token = randomBytes(32).toString('base64url');            // a cryptographically secure random token
const digest = createHash('sha256').update(token).digest('hex');
```

- **`fs/promises`**: file I/O. Always use the async versions in servers (the `*Sync` variants block the event loop).
- **`path`**: join paths portably (`/` vs `\` on Windows). `import.meta.dirname` is the current file's folder in ESM.
- **`crypto`**: hashing, random bytes, key derivation (Module 17).
- **`http`**: the low-level HTTP server (next lesson).
- **Streams** (`node:stream`): process data piece by piece, for large files and uploads. Request and response bodies are streams.

## Running TypeScript

Options, from simplest:
1. **Node's built-in type stripping** (Node 22.18+ / 24): `node src/server.ts` just works for "erasable" TypeScript (no enums or parameter properties, the same rules as `erasableSyntaxOnly` in 05.3). It's great for dev, scripts and even production.
2. **`tsx`**: `npx tsx watch src/server.ts`. It handles all TS syntax, with fast restarts on change. Very common in dev.
3. **Compile with `tsc`** (or a bundler) to JavaScript in `dist/`, and run `node dist/server.js` in production.

Whichever runs your code, **type-check separately** with `tsc --noEmit` in CI (02.1). Running code doesn't type-check it.

Watch mode is built in too: `node --watch src/server.ts` restarts on file changes.

## Built-ins that replace dependencies

| Need | Built in since |
|---|---|
| HTTP requests | global `fetch` |
| `.env` loading | `--env-file` |
| restart on change | `--watch` |
| a test runner | `node:test` (this course uses Vitest for front and back, but it's good to know) |
| UUIDs | `crypto.randomUUID()` |
| deep copies | `structuredClone` |

## Check your understanding

1. Why can one Node process serve many concurrent requests?
2. Why is `readFileSync` acceptable in a build script but bad inside a request handler?
3. Where should a database password come from?
4. Does running `node src/server.ts` check your types?

<details><summary>Answers</summary>

1. I/O is non-blocking. While one request waits for the database or the network, the event loop handles others, and libuv completes the I/O in the background.
2. A build script handles one job at a time, so blocking is harmless. In a server, a synchronous read blocks the event loop and stalls every other user's request.
3. An environment variable (from `.env` locally, or the host's secret settings in production), never the source code or the repo.
4. No. Type stripping removes types without checking them. Run `tsc --noEmit` separately.
</details>

## Further reading
- Node docs: [Introduction to Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs), [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick), [Running TypeScript natively](https://nodejs.org/en/learn/typescript/run-natively)
- Node docs: [Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

---
[Module overview](README.md) · [Next: HTTP from scratch →](02-http-from-scratch.md)
