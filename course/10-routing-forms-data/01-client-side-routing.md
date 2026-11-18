# 10.1 · Client-side routing

> ⏱ 2.5 hours · Module 10 · Routing, Forms & Server Data

## What you'll learn
- Why SPAs need routing, and how client-side routing works
- React Router: routes, nested layouts, `<Outlet>`, index routes
- Links, active links, and programmatic navigation
- URL params and search params
- 404s, route error boundaries and lazy routes
- The server configuration an SPA needs

---

## Why routes?

Your game has screens: Skills, Bank, Shop, Settings. You *could* switch between them with `useState('skills')`, but then:
- refreshing the page loses where you were
- the **back button** leaves the app instead of going to the previous screen
- you can't link or bookmark "my bank"
- mobile users expect native-feeling navigation, and the back gesture is a big part of that

Client-side routing keeps the **URL in sync with what's on screen**, without full page reloads:

1. You click a `<Link to="/bank">`.
2. The router calls `history.pushState`, so the URL changes **without a request to the server**.
3. The router matches the new URL against your route config and renders the matching components.
4. The back button triggers a `popstate` event, and the router renders the previous route.

## React Router

The most widely used router. Install it in your sandbox:

```bash
npm install react-router
```

> Older tutorials import from `react-router-dom`. Since v7, everything comes from `react-router`.

### Defining routes
```tsx
// src/router.tsx
import { createBrowserRouter } from 'react-router';
import { AppShell } from './AppShell';
import { SkillsPage } from './pages/SkillsPage';
import { SkillDetailPage } from './pages/SkillDetailPage';
import { BankPage } from './pages/BankPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,               // the layout: header + nav + <Outlet />
    errorElement: <RouteErrorPage />,    // a route-level error boundary
    children: [
      { index: true, element: <Navigate to="/skills" replace /> },   // "/" → redirect
      { path: 'skills', element: <SkillsPage /> },
      { path: 'skills/:skillId', element: <SkillDetailPage /> },      // a URL param
      { path: 'bank', element: <BankPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },                       // catch-all 404
    ],
  },
]);
```

```tsx
// src/main.tsx
import { RouterProvider } from 'react-router';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

### Layout routes and `<Outlet />`
The parent route renders the parts shared by all its children, and `<Outlet />` is where the matched child appears:

```tsx
import { NavLink, Outlet } from 'react-router';

export function AppShell() {
  return (
    <div className="app">
      <header className="app-header">Hearthwild</header>
      <main className="app-main">
        <Outlet />                       {/* SkillsPage, BankPage, … render here */}
      </main>
      <nav className="app-tabbar" aria-label="Main">
        <NavLink to="/skills">Skills</NavLink>
        <NavLink to="/bank">Bank</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </div>
  );
}
```

That's your P1 layout, now with working navigation. The shell stays mounted as you navigate, so its state (and the game loop!) isn't reset.

### Links
```tsx
<Link to="/bank">Bank</Link>                     // relative to the root
<Link to={`/skills/${skill.id}`}>Details</Link>
<Link to="..">Back</Link>                        // relative: up one level
```

`<NavLink>` knows whether it's active. It sets `aria-current="page"` automatically and can style itself:

```tsx
<NavLink to="/bank" className={({ isActive }) => (isActive ? 'tab tab--active' : 'tab')}>
  Bank
</NavLink>
```

```css
.app-tabbar a[aria-current='page'] { color: var(--color-accent); }   /* or style the attribute directly */
```

### Programmatic navigation
After an action (logging in, finishing a purchase), navigate in code:

```tsx
const navigate = useNavigate();

async function handleLogin(values: LoginValues) {
  await login(values);
  navigate('/skills', { replace: true });   // replace: the login page isn't in the back history
}
```

Use `<Link>` for things the user clicks to *go somewhere*, and `navigate()` for navigation that *results from an action*.

## URL params

```tsx
// route: { path: 'skills/:skillId', element: <SkillDetailPage /> }
import { useParams } from 'react-router';

function SkillDetailPage() {
  const { skillId } = useParams();            // string | undefined
  const skill = isSkillId(skillId) ? SKILLS[skillId] : undefined;   // validate! (02.7)
  if (!skill) return <NotFoundPage />;
  return <h1>{skill.name}</h1>;
}
```

> URL params are **user input**: anyone can type `/skills/banana`. Validate them like any other external data.

## Search params: state in the URL

Search params (`?sort=quantity&category=fish`) are perfect for UI state that should survive a refresh or be shareable: filters, sort order, the current tab, a search query, pagination.

```tsx
import { useSearchParams } from 'react-router';

function BankPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? 'all';
  const sort = searchParams.get('sort') === 'quantity' ? 'quantity' : 'name';

  function setCategory(next: string) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === 'all') params.delete('category');
      else params.set('category', next);
      return params;
    }, { replace: true });          // replace: don't add a history entry per filter click
  }
  …
}
```

This is just `URLSearchParams` from lesson 03.2, made reactive. Compare it with exercise 06-04, where the filters were in `useState`: now they survive a reload.

## Errors and 404s

- `path: '*'` catches unknown URLs, so render a friendly 404 page with a link home.
- `errorElement` is a **route-level error boundary**. If a route's component throws while rendering (or its loader fails), it renders instead:

```tsx
import { isRouteErrorResponse, useRouteError } from 'react-router';

function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : 'Something went wrong';
  return <p role="alert">{message}. <Link to="/">Go home</Link></p>;
}
```

## Lazy routes

Load a screen's code only when it's visited (09.4):

```tsx
{ path: 'combat', lazy: async () => ({ Component: (await import('./pages/CombatPage')).CombatPage }) }
```

## Loaders (briefly)

React Router can fetch data **before** rendering a route via `loader` functions and `useLoaderData()`, which avoids loading spinners inside components. This "data mode" is powerful, but this course uses **TanStack Query** for server data (10.4), which works with any router. If you join a team using loaders, the concepts from 10.3–10.4 transfer directly.

## Protecting routes

Some routes require login. A simple pattern (you'll build it in 17.8):

```tsx
function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}
```

Remember `isSafeRedirect` from exercise 03-01: validate `next` before navigating to it after login.

## Hosting an SPA

On the server there's only `index.html`. If a player refreshes on `/bank`, the server looks for a `/bank` file, finds nothing, and returns a 404, unless you configure a **fallback**: "for any path that isn't a real file, serve `index.html`". Then React Router takes over and renders the bank. Every static host supports this (lesson 20.3). Vite's dev server already does it for you.

## Do it (in `vite-sandbox`)
- [ ] Install `react-router` and create an `AppShell` with `<Outlet />` and a `NavLink` tab bar (reuse your P1 CSS!).
- [ ] Add `/skills`, `/skills/:skillId`, `/bank`, `/settings`, an index redirect and a 404.
- [ ] Validate `:skillId` against a list of known skills.
- [ ] Move 06-04's filters into search params. Check that a refresh keeps them, and that the back button behaves sensibly.
- [ ] Make `/settings` lazy, and find its chunk in the Network tab.
- [ ] Run `npm run build && npm run preview`, open `/bank` directly, and refresh. (Preview handles the fallback. Read lesson 20.3 to see why production needs config.)

## Check your understanding

1. What happens, step by step, when you click a `<Link to="/bank">`?
2. Why should the game loop live in (or above) the layout route rather than inside a page?
3. When should you pass `{ replace: true }` to `navigate` or `setSearchParams`?
4. `useParams()` returns `{ skillId: 'banana' }`. What should your component do?

<details><summary>Answers</summary>

1. The router prevents the default full-page navigation, calls `history.pushState('/bank')`, matches the new URL against the routes, and renders the matching component tree, keeping shared layouts mounted.
2. The layout stays mounted across navigation, but pages unmount when you leave them. A loop inside a page would stop (or restart) every time you change screens.
3. When the new entry shouldn't be "backable", like after login, after a redirect, or for frequent filter changes that would otherwise flood the history.
4. Treat it as invalid input: validate it against the known skill ids and render a 404 or redirect if it doesn't match.
</details>

## Further reading
- React Router docs: https://reactrouter.com (start with "Routing", "Navigating", "URL Values")
- MDN: [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)

---
[Module overview](README.md) · [Next: Forms →](02-forms.md)
