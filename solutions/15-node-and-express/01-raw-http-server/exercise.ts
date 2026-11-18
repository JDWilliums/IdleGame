// Reference solution for 15-01. Read it only AFTER your own version passes.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

export type Item = { id: number; name: string; qty: number };

const MAX_BODY_BYTES = 10_000;

class PayloadTooLargeError extends Error {}

function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new PayloadTooLargeError();
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function isNewItem(value: unknown): value is { name: string; qty: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'name' in value &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    'qty' in value &&
    typeof value.qty === 'number' &&
    Number.isInteger(value.qty) &&
    value.qty > 0
  );
}

export function createItemsServer(): Server {
  const items: Item[] = []; // per server instance
  let nextId = 1;

  async function handle(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const { pathname } = url;

    if (pathname === '/health' && req.method === 'GET') {
      return sendJson(res, 200, { status: 'ok' });
    }

    if (pathname === '/api/items') {
      if (req.method === 'GET') {
        const minQty = Number(url.searchParams.get('minQty') ?? 0);
        return sendJson(res, 200, items.filter((item) => item.qty >= (Number.isFinite(minQty) ? minQty : 0)));
      }
      if (req.method === 'POST') {
        let text: string;
        try {
          text = await readBody(req);
        } catch (error) {
          if (error instanceof PayloadTooLargeError) return sendJson(res, 413, { error: 'Payload too large' });
          throw error;
        }
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          return sendJson(res, 400, { error: 'Invalid JSON' });
        }
        if (!isNewItem(body)) return sendJson(res, 400, { error: 'Invalid item' });
        const item: Item = { id: nextId++, name: body.name, qty: body.qty };
        items.push(item);
        return sendJson(res, 201, item, { Location: `/api/items/${item.id}` });
      }
      return sendJson(res, 405, { error: 'Method not allowed' }, { Allow: 'GET, POST' });
    }

    const match = /^\/api\/items\/(\d+)$/.exec(pathname);
    if (match && req.method === 'GET') {
      const item = items.find((i) => i.id === Number(match[1]));
      return item ? sendJson(res, 200, item) : sendJson(res, 404, { error: 'Not found' });
    }

    sendJson(res, 404, { error: 'Not found' });
  }

  return createServer((req, res) => {
    handle(req, res).catch((error: unknown) => {
      console.error(error);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error' });
      else res.end();
    });
  });
}
