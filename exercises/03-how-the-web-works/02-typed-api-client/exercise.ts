/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 03-02 · typed-api-client
 * Lesson:  03.4 fetch, JSON & CORS
 * Run:     npm run watch 03-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build the small API client your game's frontend will use. The tests pass in
 * a FAKE fetch function (`fetchFn`) so no real network is involved. Always use
 * `fetchFn`, never the global `fetch`.
 *
 * TASK 1 · HttpError and NetworkError
 *   HttpError:    name 'HttpError', message `HTTP ${status}`, readonly `status`
 *                 and `body` properties.
 *   NetworkError: name 'NetworkError', message 'Network request failed', and the
 *                 original error stored as `cause` (pass { cause } to super).
 *
 * TASK 2 · createApiClient({ baseUrl, fetchFn }) → { get, put, delete }
 *   URL = baseUrl + path (baseUrl never ends with '/', path always starts with '/').
 *   Every request:
 *     - sends cookies cross-origin:           credentials: 'include'
 *     - asks for JSON:                        header Accept: application/json
 *   get(path, schema)        → GET
 *   put(path, body, schema)  → PUT with a JSON body and Content-Type: application/json
 *   delete(path)             → DELETE; resolves with undefined
 *
 *   Responses:
 *     - fetchFn REJECTS (offline, DNS, CORS…) → throw a NetworkError with that cause
 *     - !response.ok → throw HttpError(status, body), where body is the parsed JSON
 *       if the Content-Type includes 'application/json', otherwise the text
 *     - ok → parse the JSON and validate it with `schema` (schema.parse). Let a
 *       validation failure throw.
 *     - (delete only) ok → don't read or validate a body; just resolve undefined
 */
import type { z } from 'zod';

export class HttpError extends Error {
  // TODO (Task 1)
}

export class NetworkError extends Error {
  // TODO (Task 1)
}

export type ApiClient = {
  get<T>(path: string, schema: z.ZodType<T>): Promise<T>;
  put<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T>;
  delete(path: string): Promise<void>;
};

export type ApiClientOptions = {
  baseUrl: string;
  fetchFn?: typeof fetch;
};

export function createApiClient({ baseUrl, fetchFn = fetch }: ApiClientOptions): ApiClient {
  throw new Error('Not implemented yet');
}
