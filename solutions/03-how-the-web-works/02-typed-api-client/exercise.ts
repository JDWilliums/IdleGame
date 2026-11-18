// Reference solution for 03-02. Read it only AFTER your own version passes.
import type { z } from 'zod';

export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Network request failed', { cause });
    this.name = 'NetworkError';
  }
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

async function readBody(response: Response): Promise<unknown> {
  const isJson = response.headers.get('Content-Type')?.includes('application/json');
  return isJson ? response.json() : response.text();
}

export function createApiClient({ baseUrl, fetchFn = fetch }: ApiClientOptions): ApiClient {
  // One private function does the shared work; the public methods are thin wrappers.
  async function send(path: string, init: RequestInit = {}): Promise<Response> {
    let response: Response;
    try {
      response = await fetchFn(baseUrl + path, {
        ...init,
        credentials: 'include',
        headers: { Accept: 'application/json', ...init.headers },
      });
    } catch (error) {
      throw new NetworkError(error);
    }
    if (!response.ok) {
      throw new HttpError(response.status, await readBody(response));
    }
    return response;
  }

  return {
    async get(path, schema) {
      const response = await send(path);
      return schema.parse(await response.json());
    },
    async put(path, body, schema) {
      const response = await send(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return schema.parse(await response.json());
    },
    async delete(path) {
      await send(path, { method: 'DELETE' });
    },
  };
}
