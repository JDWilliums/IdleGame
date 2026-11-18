# 10.3 · Fetching data the hard way

> ⏱ 2 hours · Module 10 · Routing, Forms & Server Data

## What you'll learn
- Fetching in an effect, done properly: loading, error and success as a discriminated union
- Race conditions, and two ways to prevent them (`ignore` flags and `AbortController`)
- Refetching
- Everything that's *still* missing (caching, deduplication, staleness, retries), and why libraries exist

---

You'll write a `useFetch` hook in exercise 10-02. Doing it properly by hand shows you **why** data-fetching libraries exist, and makes you much better at using them.

## Version 1: the naive fetch

```tsx
function Leaderboard({ skill }: { skill: SkillId }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    fetch(`/api/leaderboard?skill=${skill}`)
      .then((r) => r.json())
      .then(setRows);
  }, [skill]);

  return <Table rows={rows} />;
}
```

Problems:
1. No loading state, so the user sees an empty table and doesn't know why.
2. No error handling, so a 500 or a network error leaves the table silently empty, or crashes on `.json()`.
3. No validation: the response is `any` (02.7).
4. **A race condition** (below).

## Version 2: an explicit state machine

Model the states with a discriminated union (02.4):

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };
```

```tsx
const [state, setState] = useState<AsyncState<Row[]>>({ status: 'loading' });

useEffect(() => {
  setState({ status: 'loading' });
  fetch(`/api/leaderboard?skill=${skill}`)
    .then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return RowsSchema.parse(await r.json());
    })
    .then((data) => setState({ status: 'success', data }))
    .catch((e: unknown) => setState({ status: 'error', error: e instanceof Error ? e.message : 'Failed' }));
}, [skill]);

switch (state.status) {
  case 'idle':
  case 'loading': return <Spinner />;
  case 'error':   return <ErrorMessage message={state.error} />;
  case 'success': return <Table rows={state.data} />;
}
```

> Setting state in an effect *is* appropriate here: you're synchronising with an external system (the network), unlike the derived-state effects from 07.5.

## The race condition

The player taps **Fishing**, then quickly taps **Mining**:

```
t=0ms    request A: skill=fishing  ──────────────────────────► response A at 900ms
t=200ms  request B: skill=mining   ─────► response B at 400ms
t=400ms  setState(B)  → shows mining ✅
t=900ms  setState(A)  → shows FISHING while the tab says Mining ❌
```

Responses don't arrive in the order you sent the requests. Whichever finishes last wins, so the screen can show stale data for the wrong selection. This bug is very common in real apps.

### Fix A: ignore stale results
```tsx
useEffect(() => {
  let ignore = false;
  fetchRows(skill).then((data) => {
    if (!ignore) setState({ status: 'success', data });
  });
  return () => {
    ignore = true;          // this effect is outdated: skill changed, or we unmounted
  };
}, [skill]);
```

Each effect run has its **own** `ignore` variable (a closure from 01.2!). When `skill` changes, React runs the cleanup for the old effect, which marks its result as unwanted.

### Fix B: cancel the request with `AbortController`
```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then(/* … */)
    .catch((e) => {
      if (e instanceof DOMException && e.name === 'AbortError') return;   // expected: ignore it
      setState({ status: 'error', error: String(e) });
    });
  return () => controller.abort();     // cancel the in-flight request
}, [url]);
```

Aborting also **saves bandwidth and battery**, because the browser actually stops downloading. It's the better fix, and you'll combine both in the exercise for full safety. (A response that has already arrived can't be "un-arrived", but the abort makes `fetch` reject.)

## Refetching

To retry after an error, or refresh on demand, add a counter that's part of the effect's dependencies:

```tsx
const [reloadKey, setReloadKey] = useState(0);
useEffect(() => { /* fetch */ }, [url, reloadKey]);
const refetch = () => setReloadKey((k) => k + 1);
```

## What's still missing

Even with all of that, a hand-written hook doesn't give you:

| Problem | Example in the game |
|---|---|
| **Caching** | Switching tabs Bank → Leaderboard → Bank refetches every time and shows a spinner again |
| **Deduplication** | The header and the profile page both call `useFetch('/api/me')`, which makes two identical requests |
| **Stale-while-revalidate** | Showing cached data instantly while silently refreshing it |
| **Refetch on focus / reconnect** | When the player returns to the tab or the phone reconnects, the data should refresh |
| **Retries with backoff** | A flaky mobile connection should retry automatically (your `retry` from 01-04) |
| **Mutations + invalidation** | After saving, the profile should refetch automatically |
| **Pagination / infinite scroll**, **prefetching**, **SSR** | |

Building all of that correctly is a library-sized job, and that's exactly what **TanStack Query** is. **In real apps, use a data-fetching library rather than hand-rolled effects.** The React docs themselves say this. Next lesson.

## Check your understanding

1. Describe the race condition in your own words, with a concrete example.
2. Why does each effect run get its own `ignore` variable?
3. Why must you treat `AbortError` differently from other errors?
4. Name three things a hand-written `useFetch` doesn't handle.

<details><summary>Answers</summary>

1. Two requests are in flight because the input changed quickly. The older one responds last and overwrites the newer result, so the UI shows data that doesn't match the current selection.
2. `let ignore = false` is declared inside the effect function, and each run of the effect is a new function call with its own scope. The cleanup closes over that specific run's variable.
3. Aborting is something *you* did on purpose (the input changed, or the component unmounted), so it isn't a failure to show the user. Treating it as an error would flash an error message or set state after unmount.
4. Any three of: caching, deduplication, stale-while-revalidate, refetching on focus or reconnect, automatic retries, mutation invalidation, pagination, prefetching.
</details>

## Further reading
- react.dev: [Fetching data with Effects](https://react.dev/learn/synchronizing-with-effects#fetching-data) and "What are good alternatives to data fetching in Effects?"
- MDN: [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)

**Practice:** exercise `10-02` use-fetch → `npm run watch 10-02`

---
[← Forms](02-forms.md) · [Module overview](README.md) · [Next: TanStack Query →](04-tanstack-query.md)
