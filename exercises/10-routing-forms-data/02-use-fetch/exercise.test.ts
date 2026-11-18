// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { useFetch } from './exercise';

const RowsSchema = z.array(z.object({ name: z.string(), level: z.number() }));
type Rows = z.infer<typeof RowsSchema>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A fetch whose responses we resolve by hand, per URL. Ignores abort signals unless told otherwise. */
function controllableFetch({ respectAbort = false } = {}) {
  const pending = new Map<string, { resolve: (r: Response) => void; signal: AbortSignal | undefined }>();
  const fetchFn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    return new Promise<Response>((resolve, reject) => {
      const signal = init?.signal ?? undefined;
      pending.set(url, { resolve, signal });
      if (respectAbort && signal) {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }
    });
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
  const respond = async (url: string, response: Response) => {
    await act(async () => {
      pending.get(url)?.resolve(response);
    });
  };
  const signalFor = (url: string) => pending.get(url)?.signal;
  return { fetchFn, respond, signalFor };
}

const fishing: Rows = [{ name: 'Ava', level: 50 }];
const mining: Rows = [{ name: 'Bo', level: 70 }];

describe('useFetch', () => {
  it('is idle without a url and makes no request', () => {
    const { fetchFn } = controllableFetch();
    const { result } = renderHook(() => useFetch(null, RowsSchema, fetchFn));
    expect(result.current.status).toBe('idle');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('loads, then succeeds with validated data', async () => {
    const { fetchFn, respond } = controllableFetch();
    const { result } = renderHook(() => useFetch('/lb?skill=fishing', RowsSchema, fetchFn));
    expect(result.current.status).toBe('loading');
    await respond('/lb?skill=fishing', json(fishing));
    expect(result.current).toMatchObject({ status: 'success', data: fishing });
  });

  it('passes an AbortSignal to fetch', () => {
    const { fetchFn, signalFor } = controllableFetch();
    renderHook(() => useFetch('/lb', RowsSchema, fetchFn));
    expect(signalFor('/lb')).toBeInstanceOf(AbortSignal);
  });

  it('reports HTTP errors', async () => {
    const { fetchFn, respond } = controllableFetch();
    const { result } = renderHook(() => useFetch('/lb', RowsSchema, fetchFn));
    await respond('/lb', json({ error: 'boom' }, 500));
    expect(result.current).toMatchObject({ status: 'error', error: 'HTTP 500' });
  });

  it('reports invalid responses', async () => {
    const { fetchFn, respond } = controllableFetch();
    const { result } = renderHook(() => useFetch('/lb', RowsSchema, fetchFn));
    await respond('/lb', json([{ name: 'Ava', level: 'high' }]));
    expect(result.current).toMatchObject({ status: 'error', error: 'Invalid response' });
  });

  it('reports network errors', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    const { result } = renderHook(() => useFetch('/lb', RowsSchema, fetchFn));
    await waitFor(() => expect(result.current).toMatchObject({ status: 'error', error: 'Network error' }));
  });

  it('aborts the previous request when the url changes, and on unmount', () => {
    const { fetchFn, signalFor } = controllableFetch();
    const { rerender, unmount } = renderHook(({ url }) => useFetch(url, RowsSchema, fetchFn), {
      initialProps: { url: '/lb?skill=fishing' },
    });
    rerender({ url: '/lb?skill=mining' });
    expect(signalFor('/lb?skill=fishing')?.aborted).toBe(true);
    expect(signalFor('/lb?skill=mining')?.aborted).toBe(false);
    unmount();
    expect(signalFor('/lb?skill=mining')?.aborted).toBe(true);
  });

  it('never lets a stale response overwrite newer data', async () => {
    const { fetchFn, respond } = controllableFetch(); // ignores abort, so the old response still arrives
    const { result, rerender } = renderHook(({ url }) => useFetch(url, RowsSchema, fetchFn), {
      initialProps: { url: '/lb?skill=fishing' },
    });
    rerender({ url: '/lb?skill=mining' });
    await respond('/lb?skill=mining', json(mining));
    await respond('/lb?skill=fishing', json(fishing)); // arrives LATE
    expect(result.current).toMatchObject({ status: 'success', data: mining });
  });

  it('does not report aborted requests as errors', async () => {
    const { fetchFn, respond } = controllableFetch({ respectAbort: true });
    const { result, rerender } = renderHook(({ url }) => useFetch(url, RowsSchema, fetchFn), {
      initialProps: { url: '/lb?skill=fishing' },
    });
    rerender({ url: '/lb?skill=mining' });
    await act(async () => {}); // let the abort rejection settle
    expect(result.current.status).toBe('loading');
    await respond('/lb?skill=mining', json(mining));
    expect(result.current).toMatchObject({ status: 'success', data: mining });
  });

  it('refetches on demand', async () => {
    const { fetchFn, respond } = controllableFetch();
    const { result } = renderHook(() => useFetch('/lb', RowsSchema, fetchFn));
    await respond('/lb', json(fishing));
    act(() => result.current.refetch());
    expect(result.current.status).toBe('loading');
    expect(fetchFn).toHaveBeenCalledTimes(2);
    await respond('/lb', json(mining));
    expect(result.current).toMatchObject({ status: 'success', data: mining });
  });
});
