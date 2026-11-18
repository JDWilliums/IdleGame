# 10.4 · TanStack Query

> ⏱ 2.5 hours · Module 10 · Routing, Forms & Server Data

## What you'll learn
- Server state vs client state
- `QueryClient`, `useQuery`, query keys and query functions
- Freshness: `staleTime`, `gcTime`, refetch triggers
- `useMutation`, invalidation and optimistic updates
- `queryOptions`, Suspense, devtools
- Where TanStack Query fits in your game, and where it doesn't

---

## Server state is different

| Client state | Server state |
|---|---|
| owned by the browser | owned by the **server**: you have a *copy* |
| always up to date | can be **stale** (others change it) |
| synchronous | asynchronous: loading, errors |
| e.g. an open menu, form input, theme | e.g. the leaderboard, a profile, a guild roster, a cloud save's metadata |

TanStack Query (formerly React Query) is a **cache for server state**. It handles everything from the end of 10.3: caching, deduplication, background refetching, retries, invalidation and more. It's one of the most widely used React libraries, and very common in job listings.

## Setup

```bash
npm install @tanstack/react-query
```

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000 },   // treat data as fresh for 30s (default is 0)
  },
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
```

## `useQuery`

```tsx
import { useQuery } from '@tanstack/react-query';

function Leaderboard({ skill }: { skill: SkillId }) {
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['leaderboard', skill],                 // cache key: unique per distinct data
    queryFn: ({ signal }) => api.get(`/leaderboard?skill=${skill}`, RowsSchema, { signal }),
  });

  if (isPending) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  return (
    <>
      {isFetching && <SmallSpinner label="Refreshing" />}
      <Table rows={data} />
    </>
  );
}
```

- **`queryKey`** identifies the data in the cache. Include **everything the query depends on** (like effect dependencies). `['leaderboard', 'fishing']` and `['leaderboard', 'mining']` are cached separately.
- **`queryFn`** fetches the data. It must **throw** on failure (your api client from 03-02 does), and it receives an `AbortSignal` so changing keys cancels outdated requests. **No race conditions.**
- **`isPending`**: there's no data yet (the first load). **`isFetching`**: a request is in flight (including background refreshes). Show a full spinner for the first, and a subtle indicator for the second.
- `data` is typed from your `queryFn`'s return type (here, validated by Zod).

### What you get for free
- **Caching**: switch Fishing → Mining → Fishing, and the fishing data appears **instantly** from the cache.
- **Deduplication**: ten components using the same key make **one** request.
- **Stale-while-revalidate**: cached data is shown immediately and refreshed in the background when stale.
- **Refetch on window focus and on reconnect**: great for mobile.
- **Retries**: failed queries retry 3 times with exponential backoff by default.
- **Garbage collection**: unused cache entries are removed after `gcTime` (5 minutes by default).

## Freshness

- **`staleTime`**: how long data counts as **fresh**. While it's fresh, mounting a component or refocusing the window doesn't refetch. The default `0` means "always stale", so it refetches eagerly. For a leaderboard, 30–60 s is sensible. For data that never changes (game item definitions from the server), use `Infinity`.
- **`gcTime`**: how long **unused** data stays in the cache.

## `queryOptions`: reusable, typed query definitions

```ts
import { queryOptions } from '@tanstack/react-query';

export const leaderboardQuery = (skill: SkillId) =>
  queryOptions({
    queryKey: ['leaderboard', skill] as const,
    queryFn: ({ signal }) => api.get(`/leaderboard?skill=${skill}`, RowsSchema, { signal }),
    staleTime: 60_000,
  });

useQuery(leaderboardQuery(skill));
queryClient.prefetchQuery(leaderboardQuery('mining'));   // e.g. on hover/touchstart of the tab
```

Defining queries in one place keeps keys consistent, and inconsistent keys are the most common TanStack Query bug.

## Mutations

Changing server data goes through `useMutation`:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function RenameForm() {
  const queryClient = useQueryClient();
  const rename = useMutation({
    mutationFn: (displayName: string) => api.put('/me', { displayName }, ProfileSchema),
    onSuccess: (profile) => {
      queryClient.setQueryData(['me'], profile);                    // update the cache directly…
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] }); // …and mark related data stale
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); rename.mutate(newName); }}>
      …
      <button disabled={rename.isPending}>{rename.isPending ? 'Saving…' : 'Save'}</button>
      {rename.isError && <p role="alert">{rename.error.message}</p>}
    </form>
  );
}
```

`invalidateQueries({ queryKey: ['leaderboard'] })` matches by **prefix**, so every skill's leaderboard is marked stale, and the active ones refetch.

### Optimistic updates
Update the UI *before* the server confirms, and roll back on error. It makes apps feel instant:

```ts
useMutation({
  mutationFn: toggleFavourite,
  onMutate: async (itemId) => {
    await queryClient.cancelQueries({ queryKey: ['favourites'] });
    const previous = queryClient.getQueryData<string[]>(['favourites']);
    queryClient.setQueryData<string[]>(['favourites'], (old = []) => [...old, itemId]);
    return { previous };                                       // context for rollback
  },
  onError: (_err, _itemId, context) => queryClient.setQueryData(['favourites'], context?.previous),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['favourites'] }),
});
```

## Suspense mode

```tsx
const { data } = useSuspenseQuery(leaderboardQuery(skill));   // data is never undefined
```

Wrap it in `<Suspense fallback={…}>` and an error boundary (09.4). The component only ever deals with the success case.

## Devtools

```bash
npm install -D @tanstack/react-query-devtools
```

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
<ReactQueryDevtools />   // a floating panel: every query, its key, status, data and freshness
```

## In your game: what goes where?

| State | Tool |
|---|---|
| leaderboard, other players' profiles, your account info | **TanStack Query** |
| login/logout, sign-up | **TanStack Query mutations** (17.8) |
| the running game simulation (skills, bank, the active action) | **Zustand game store** (Module 14). It's *client* state that happens to be backed up to the server |
| saving and syncing the game | a **custom sync engine** (Module 18). It needs revision checks, conflict handling and offline queues that go beyond a simple mutation |
| UI state: menus, modals, filters | `useState`, or the URL |

Don't put the game state into TanStack Query. It's not server state: the *local simulation* is the source of truth while you're playing, and the server holds the backup.

## Do it (in `vite-sandbox`)
- [ ] Add a QueryClient and fetch from a free public API (e.g. `https://pokeapi.co/api/v2/pokemon?limit=20`) with `useQuery`, validating with Zod.
- [ ] Add a detail route that uses a second query keyed by name. Navigate back and forth and watch the cache work in the devtools.
- [ ] Set the network to "Slow 4G" in DevTools and compare `isPending` vs `isFetching`.
- [ ] Prefetch a detail query on `onPointerEnter`/`onTouchStart` of a list link.

## Check your understanding

1. Why include `skill` in the query key?
2. What's the difference between `isPending` and `isFetching`?
3. A query has `staleTime: 60_000`. The user switches tabs and comes back after 10 s. Does it refetch?
4. After a successful rename mutation, how do you make the leaderboard refresh?
5. Why shouldn't the running game state live in TanStack Query?

<details><summary>Answers</summary>

1. The key identifies the cached data. Different skills are different data, and changing the key triggers a fetch for (and caches) the new skill. Missing dependencies in keys cause stale or wrong data.
2. `isPending` means there's no cached data yet (the first load). `isFetching` means any request is in flight, including background refreshes while cached data is being shown.
3. No. The data is still fresh (10 s < 60 s), so refetch-on-focus is skipped.
4. `queryClient.invalidateQueries({ queryKey: ['leaderboard'] })` in `onSuccess`, which marks all leaderboard queries stale and refetches the active ones.
5. It's client state. The local simulation is authoritative while playing and changes many times a second. TanStack Query is designed for caching data whose source of truth is the server.
</details>

## Further reading
- TanStack Query docs: https://tanstack.com/query/latest ("Overview", "Quick Start", "Important Defaults", "Query Keys", "Mutations", "Optimistic Updates")
- TkDodo's blog (a TanStack Query maintainer): *"Practical React Query"*. It's the best series on using it well.

---
[← Fetching data the hard way](03-fetching-data-the-hard-way.md) · [Module overview](README.md) · [Next module: Styling React Apps →](../11-styling/README.md)
