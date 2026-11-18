// Reference solution for 10-02. Read it only AFTER your own version passes.
import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export type UseFetchResult<T> = AsyncState<T> & { refetch: () => void };

export function useFetch<T>(
  url: string | null,
  schema: z.ZodType<T>,
  fetchFn: typeof fetch = fetch,
): UseFetchResult<T> {
  const [state, setState] = useState<AsyncState<T>>(url === null ? { status: 'idle' } : { status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (url === null) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    let ignore = false; // belt and braces: even if fetchFn ignores the signal
    setState({ status: 'loading' });

    async function load(target: string) {
      let response: Response;
      try {
        response = await fetchFn(target, { signal: controller.signal });
      } catch (error) {
        if (ignore || (error instanceof DOMException && error.name === 'AbortError')) return;
        setState({ status: 'error', error: 'Network error' });
        return;
      }
      if (ignore) return;
      if (!response.ok) {
        setState({ status: 'error', error: `HTTP ${response.status}` });
        return;
      }
      try {
        const data = schema.parse(await response.json());
        if (!ignore) setState({ status: 'success', data });
      } catch {
        if (!ignore) setState({ status: 'error', error: 'Invalid response' });
      }
    }

    void load(url);

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [url, reloadKey, schema, fetchFn]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...state, refetch };
}
