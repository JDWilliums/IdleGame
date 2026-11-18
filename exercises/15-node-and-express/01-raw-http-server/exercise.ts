/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 15-01 · raw-http-server
 * Lesson:  15.2 HTTP from scratch
 * Run:     npm run watch 15-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a tiny JSON API with node:http only (no Express). createItemsServer()
 * returns an http.Server (don't call listen; the tests use supertest). Each
 * server has its OWN in-memory list of items, and ids start at 1.
 *
 * Every response is JSON with Content-Type "application/json; charset=utf-8".
 *
 *   GET  /health        → 200 { status: 'ok' }
 *   GET  /api/items     → 200 [ …items ]       (?minQty=5 filters to qty ≥ 5)
 *   POST /api/items     body { name: non-empty string, qty: positive integer }
 *                       → 201, the created item { id, name, qty }, plus a
 *                         Location header: /api/items/{id}
 *                       invalid JSON          → 400 { error: 'Invalid JSON' }
 *                       invalid fields        → 400 { error: 'Invalid item' }
 *                       body over 10,000 bytes → 413 { error: 'Payload too large' }
 *   GET  /api/items/:id → 200 the item, or 404 { error: 'Not found' }
 *   Other methods on /api/items → 405 { error: 'Method not allowed' } with
 *                         header Allow: GET, POST
 *   Anything else       → 404 { error: 'Not found' }
 *   If a handler throws unexpectedly → 500 { error: 'Internal server error' }
 *   (and the server keeps running)
 */
import { createServer, type Server } from 'node:http';

export type Item = { id: number; name: string; qty: number };

export function createItemsServer(): Server {
  return createServer((_req, res) => {
    res.statusCode = 501;
    res.end('TODO');
  });
}
