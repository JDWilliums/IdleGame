# Module 10 · Routing, Forms & Server Data

**Time:** ~12 hours · **Prerequisites:** Modules 06–09, lessons 03.4 (fetch) and 02.7 (Zod)

## Why this module matters
Real apps have multiple screens with real URLs, forms that validate properly and handle server errors, and data that comes from an API. In your game that means routes for skills, bank, shop and settings, sign-up and login forms, and a leaderboard. These are the bread-and-butter tasks of a React job, and a lot of interview take-home tests are exactly "build a small app with routing, a form and data fetching".

## Learning objectives
By the end of this module you can:
- build a multi-screen SPA with React Router: nested layouts, params, search params, 404s and lazy routes
- build accessible forms with validation, server errors and pending states, using controlled inputs or React 19 form actions
- fetch data correctly by hand (loading, error and race conditions with `AbortController`), and explain why that's hard
- use TanStack Query for server state: queries, caching, mutations and invalidation

## Lessons
| # | Lesson | Time |
|---|---|---|
| 10.1 | [Client-side routing](01-client-side-routing.md) | 2.5h |
| 10.2 | [Forms](02-forms.md) | 3h |
| 10.3 | [Fetching data the hard way](03-fetching-data-the-hard-way.md) | 2h |
| 10.4 | [TanStack Query](04-tanstack-query.md) | 2.5h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `10-01` | [signup-form](../../exercises/10-routing-forms-data/01-signup-form/exercise.tsx) | 10.2 |
| `10-02` | [use-fetch](../../exercises/10-routing-forms-data/02-use-fetch/exercise.ts) | 10.3 |

For routing and TanStack Query, the practice is in your `vite-sandbox` (each lesson has a "Do it" list). You'll use both in the capstone.

Hints: [`exercises/10-routing-forms-data/HINTS.md`](../../exercises/10-routing-forms-data/HINTS.md)

## Checkpoint quiz
1. Why use `<Link>` instead of `<a href>` for in-app navigation?
2. What's a layout route, and what does `<Outlet />` do?
3. When should UI state (a filter, a selected tab) live in the URL instead of `useState`?
4. How do you connect an error message to its input for screen readers?
5. What's a race condition in data fetching, and how do you prevent it?
6. What's the difference between "server state" and "client state"?
7. In TanStack Query, what does `staleTime` control? And `invalidateQueries`?
8. Why must a static host be configured to serve `index.html` for unknown paths?

<details><summary>Answers</summary>

1. `<Link>` updates the URL and renders the new route **without a full page reload**, so state is kept, nothing is re-downloaded, and it's fast. A plain `<a>` reloads the whole app.
2. A route that renders shared UI (header, nav) around its child routes. `<Outlet />` marks where the matched child route renders.
3. When it should survive a reload, be shareable or bookmarkable, or work with the back button (filters, search queries, tabs, pagination).
4. Give the message an `id` and set `aria-describedby="that-id"` on the input, plus `aria-invalid="true"` while it's invalid.
5. A slow, older request finishing after a newer one and overwriting fresh data with stale data. Abort the old request (`AbortController`), or ignore its result (an `ignore` flag in the effect cleanup).
6. Server state lives on the server and is fetched (it can go stale, is shared with other users, and needs caching and refetching). Client state is owned by the UI (an open menu, form inputs, the game simulation running locally).
7. `staleTime` is how long fetched data is considered fresh, during which there are no automatic refetches. `invalidateQueries` marks matching queries as stale and refetches the active ones, typically after a mutation.
8. In an SPA, `/bank` is a client-side route with no file on the server. A refresh or a direct link would 404 unless the server falls back to `index.html`, which then lets the router render the route.
</details>

## Extra practice
1. **Settings form with `useActionState`**: rebuild 10-01 using a React 19 form action instead of controlled inputs.
2. **React Hook Form + Zod**: build the same sign-up form with `react-hook-form` and `@hookform/resolvers/zod`. Compare the code size and re-render counts.
3. **Pokédex**: build a small app with a list page, a detail page (`/pokemon/:name`), search params for filtering, and TanStack Query over the free PokéAPI. It's a classic take-home-test shape.

**Next:** [Module 11 · Styling React Apps →](../11-styling/README.md)
