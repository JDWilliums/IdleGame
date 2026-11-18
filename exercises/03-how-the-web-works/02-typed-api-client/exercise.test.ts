import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createApiClient, HttpError, NetworkError } from './exercise';

const SaveSchema = z.object({ revision: z.number(), gold: z.number() });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function setup(respond: () => Response | Promise<Response>) {
  const fetchFn = vi.fn<typeof fetch>(async () => respond());
  const api = createApiClient({ baseUrl: 'https://api.example.com', fetchFn });
  const lastCall = () => {
    const call = fetchFn.mock.calls.at(-1);
    if (!call) throw new Error('fetchFn was never called');
    const [url, init = {}] = call;
    return { url: String(url), init, headers: new Headers(init.headers) };
  };
  return { api, fetchFn, lastCall };
}

describe('error classes', () => {
  it('HttpError carries status and body', () => {
    const err = new HttpError(409, { reason: 'conflict' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('HttpError');
    expect(err.message).toBe('HTTP 409');
    expect(err.status).toBe(409);
    expect(err.body).toEqual({ reason: 'conflict' });
  });

  it('NetworkError keeps the original cause', () => {
    const cause = new TypeError('Failed to fetch');
    const err = new NetworkError(cause);
    expect(err.name).toBe('NetworkError');
    expect(err.message).toBe('Network request failed');
    expect(err.cause).toBe(cause);
  });
});

describe('get', () => {
  it('requests baseUrl + path with credentials and an Accept header', async () => {
    const { api, lastCall } = setup(() => jsonResponse({ revision: 1, gold: 5 }));
    await api.get('/save', SaveSchema);
    const { url, init, headers } = lastCall();
    expect(url).toBe('https://api.example.com/save');
    expect(init.method ?? 'GET').toBe('GET');
    expect(init.credentials).toBe('include');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('returns validated, typed data', async () => {
    const { api } = setup(() => jsonResponse({ revision: 3, gold: 120 }));
    await expect(api.get('/save', SaveSchema)).resolves.toEqual({ revision: 3, gold: 120 });
  });

  it('throws when the data does not match the schema', async () => {
    const { api } = setup(() => jsonResponse({ revision: 'three' }));
    await expect(api.get('/save', SaveSchema)).rejects.toBeInstanceOf(z.ZodError);
  });

  it('throws HttpError with the parsed JSON body for non-2xx responses', async () => {
    const { api } = setup(() => jsonResponse({ error: 'Not logged in' }, 401));
    const error = await api.get('/save', SaveSchema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(401);
    expect((error as HttpError).body).toEqual({ error: 'Not logged in' });
  });

  it('uses the text body when the error response is not JSON', async () => {
    const { api } = setup(() => new Response('Bad Gateway', { status: 502 }));
    const error = await api.get('/save', SaveSchema).catch((e: unknown) => e);
    expect((error as HttpError).status).toBe(502);
    expect((error as HttpError).body).toBe('Bad Gateway');
  });

  it('wraps network failures in NetworkError', async () => {
    const cause = new TypeError('Failed to fetch');
    const { api } = setup(() => Promise.reject(cause));
    const error = await api.get('/save', SaveSchema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NetworkError);
    expect((error as NetworkError).cause).toBe(cause);
  });
});

describe('put', () => {
  it('sends a JSON body with the right method and headers', async () => {
    const { api, lastCall } = setup(() => jsonResponse({ revision: 2, gold: 50 }));
    const result = await api.put('/save', { gold: 50 }, SaveSchema);
    const { url, init, headers } = lastCall();
    expect(url).toBe('https://api.example.com/save');
    expect(init.method).toBe('PUT');
    expect(init.credentials).toBe('include');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Accept')).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual({ gold: 50 });
    expect(result).toEqual({ revision: 2, gold: 50 });
  });

  it('throws HttpError on conflict', async () => {
    const { api } = setup(() => jsonResponse({ serverRevision: 7 }, 409));
    const error = await api.put('/save', {}, SaveSchema).catch((e: unknown) => e);
    expect((error as HttpError).status).toBe(409);
    expect((error as HttpError).body).toEqual({ serverRevision: 7 });
  });
});

describe('delete', () => {
  it('sends DELETE and resolves undefined on 204', async () => {
    const { api, lastCall } = setup(() => new Response(null, { status: 204 }));
    await expect(api.delete('/save')).resolves.toBeUndefined();
    expect(lastCall().init.method).toBe('DELETE');
    expect(lastCall().init.credentials).toBe('include');
  });

  it('throws HttpError when deletion fails', async () => {
    const { api } = setup(() => jsonResponse({ error: 'Forbidden' }, 403));
    await expect(api.delete('/save')).rejects.toBeInstanceOf(HttpError);
  });
});
