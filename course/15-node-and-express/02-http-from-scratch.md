# 15.2 · HTTP from scratch

> ⏱ 2 hours · Module 15 · Node.js & Express

## What you'll learn
- Building a server with `node:http` and no framework
- Routing by method and path
- Reading a JSON request body from a stream
- Writing status codes, headers and bodies
- What frameworks like Express add, and why they exist

---

You learned HTTP's shape in 03.2. Now you're on the other side of it. Building a tiny server by hand shows you exactly what Express does for you, and you'll understand Express's design much better for it.

## The smallest server

```ts
import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from the forge!');
});

server.listen(3000, () => console.log('Listening on http://localhost:3000'));
```

`createServer` takes **one function** that runs for **every request**:
- `req` (an `IncomingMessage`) has the method, URL, headers, and the body as a *readable stream*.
- `res` (a `ServerResponse`) is where you set the status and headers and write the body, then call `end()`.

Try it: `curl -i http://localhost:3000`.

## Routing by hand

```ts
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);   // parse path + query (03-01!)

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }
  if (url.pathname === '/api/items') {
    if (req.method === 'GET') return sendJson(res, 200, items);
    if (req.method === 'POST') return createItem(req, res);
    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  sendJson(res, 404, { error: 'Not found' });
});

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}
```

Note the **405 Method Not Allowed** with an `Allow` header when the path exists but the method doesn't. It's a small detail, and the kind that shows HTTP knowledge in code review.

## Reading a JSON body

The body arrives as a **stream** of chunks (a big upload doesn't arrive all at once). Collect them, then parse:

```ts
async function readJson(req: IncomingMessage, limitBytes = 100_000): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {            // request streams are async iterable
    size += chunk.length;
    if (size > limitBytes) throw new PayloadTooLargeError();
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(text);                    // throws SyntaxError on invalid JSON → respond 400
}
```

Things to handle:
- **Invalid JSON** → `400 Bad Request` (never let it crash the server).
- **Too large** → `413 Content Too Large`. Without a limit, anyone can send a 2 GB body and exhaust your memory.
- **Wrong `Content-Type`** → `415 Unsupported Media Type` (being strict is better).
- The parsed value is `unknown`: **validate it** (02.7, 15.5).

```ts
async function createItem(req: IncomingMessage, res: ServerResponse) {
  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' });
  }
  if (!isNewItem(body)) return sendJson(res, 400, { error: 'name (string) and qty (positive integer) are required' });
  const item = { id: nextId++, ...body };
  items.push(item);
  sendJson(res, 201, item);                   // 201 Created
}
```

## Errors must not crash the server

An exception thrown inside a request handler that nobody catches, especially in async code, can crash the whole process and take every user down with it. Wrap your handler:

```ts
const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error' });
  });
});
```

## Testing a raw server

supertest works with any Node `http.Server`, with no port needed:

```ts
import request from 'supertest';
const res = await request(createAppServer()).post('/api/items').send({ name: 'Oak Log', qty: 3 });
expect(res.status).toBe(201);
```

## What frameworks add

Look at everything you wrote by hand:
- parsing the URL and **matching routes**, including params like `/api/items/:id`
- **reading and parsing bodies** with size limits
- **sending JSON** with the right headers
- **error handling** that doesn't crash
- sharing logic between routes (auth checks, logging) → **middleware**

Express (next lesson) provides exactly these, in a design you'll now recognise: a chain of `(req, res, next)` functions over the same `req`/`res` objects you just used. Express's `req` *is* Node's `IncomingMessage` with extras.

## Check your understanding

1. Why is a request body read as a stream?
2. What status code do you send for a known path with an unsupported method, and which header goes with it?
3. Why must you limit the body size?
4. What happens if an async handler throws and nothing catches it?

<details><summary>Answers</summary>

1. Bodies can be large and arrive over the network in pieces. Streaming lets you process or limit them chunk by chunk without waiting for (or buffering) everything.
2. `405 Method Not Allowed`, with an `Allow` header listing the supported methods.
3. Otherwise a client can send a huge body and exhaust the server's memory, which is a trivial denial-of-service.
4. An unhandled rejection. Depending on the Node settings it logs an error or crashes the process, and the client never gets a response. Always catch, and respond with a 500.
</details>

## Further reading
- Node docs: [HTTP](https://nodejs.org/api/http.html) and the guide [Anatomy of an HTTP Transaction](https://nodejs.org/en/learn/modules/anatomy-of-an-http-transaction)

**Practice:** exercise `15-01` raw-http-server → `npm run watch 15-01`

---
[← Node: the runtime](01-node-the-runtime.md) · [Module overview](README.md) · [Next: Express fundamentals →](03-express-fundamentals.md)
