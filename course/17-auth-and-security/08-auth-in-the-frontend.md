# 17.8 · Auth in the frontend

> ⏱ 2.5 hours · Module 17 · Authentication & Security

## What you'll learn
- How the frontend knows who's logged in when it can't see the token
- A `useMe` query, and login, register and logout mutations with TanStack Query
- Handling `401`s in one place
- Protecting routes with React Router
- Accessible login forms that work with password managers
- "Play first, sign up later": guest mode for an idle game

---

## The frontend never sees the token

With an `HttpOnly` cookie (17.4), JavaScript **can't** read the session token. That's the point. So the frontend learns its auth state the same way it learns anything else from the server: by asking.

```
app starts ──► GET /api/auth/me ──► 200 { user }  → logged in as user
                                └─► 401           → logged out (a normal answer, not an error)
```

The browser attaches the cookie automatically. With the one-origin layout or the Vite proxy (17.4), the default `credentials: 'same-origin'` is all you need.

## An API client that understands 401

Start from the typed client you built in 03-02 and 10.3, and make HTTP errors carry their status:

```ts
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (res.status === 204) return undefined as T;
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(res.status, error?.code ?? 'UNKNOWN', error?.message ?? res.statusText);
  }
  return body as T;   // validate with Zod where the shape matters (02.7)
}
```

## The current user as a query

The current user is server state, so it belongs in TanStack Query (10.4):

```ts
export type User = { id: number; username: string };

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<User | null> => {
      try {
        const { user } = await api<{ user: User }>('/api/auth/me');
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;   // logged out is data, not an error
        throw err;
      }
    },
    staleTime: Infinity,   // only changes when we log in or out, and we update it ourselves then
    retry: false,
  });
}
```

`data` is `undefined` while loading, `null` when logged out, and a `User` when logged in. Every component that needs the user calls `useMe()`, and TanStack Query makes only one request.

## Login, register and logout

```ts
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      api<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['me'], user);   // no need to refetch: the response says who we are
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.clear();                      // drop EVERY cached query: they belonged to that user
      queryClient.setQueryData(['me'], null);
    },
  });
}
```

`useRegister` looks like `useLogin`. On logout, clearing the whole cache matters: otherwise the next person to log in on a shared device could briefly see the previous user's data.

## One place for "your session ended"

Sessions expire, and other devices log out everywhere. When any request gets a `401`, the app should react the same way. Set it up once, on the `QueryClient`:

```ts
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) queryClient.setQueryData(['me'], null);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) queryClient.setQueryData(['me'], null);
    },
  }),
});
```

Every component using `useMe()` then re-renders as logged out, and route guards redirect if needed.

## Protecting routes

Frontend route guards are **UX, not security**. The server enforces access on every request (17.5). The guard just avoids showing a screen that can only fail.

```tsx
function RequireAccount({ children }: { children: React.ReactNode }) {
  const { data: user, isPending } = useMe();
  const location = useLocation();

  if (isPending) return <Spinner label="Checking your account…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

// routes
<Route path="/account" element={<RequireAccount><AccountPage /></RequireAccount>} />
```

After logging in, send the user back where they came from: `navigate(location.state?.from ?? '/', { replace: true })`. Only accept **paths** from that state, never full URLs. Redirecting to whatever URL an attacker put there is an **open redirect**, a favourite phishing tool.

## Forms that work with password managers

```tsx
<form onSubmit={handleSubmit} noValidate>
  <label htmlFor="username">Username</label>
  <input id="username" name="username" autoComplete="username" required />

  <label htmlFor="password">Password</label>
  <input id="password" name="password" type="password" autoComplete="current-password" required />
  {/* on the register form: autoComplete="new-password", so managers offer to generate one */}

  {login.error && (
    <p role="alert">{login.error instanceof ApiError ? login.error.message : 'Something went wrong. Try again.'}</p>
  )}
  <button type="submit" disabled={login.isPending}>{login.isPending ? 'Logging in…' : 'Log in'}</button>
</form>
```

- The right `autoComplete` values are what make password managers fill and save credentials properly. That makes users *more* secure, because they can use long random passwords.
- Never block pasting into password fields.
- Keep the username when a login fails. Clear only the password.
- `role="alert"` makes screen readers announce the error (11.4, 21.4).
- A "show password" toggle (switching `type` between `password` and `text`) helps on phones.

## Guest mode: play first, sign up later

An idle game should be **playable immediately**: nobody wants a sign-up form before they've chopped a single tree. Hearthwild's flow:

1. A new visitor plays as a **guest**. The save lives in `localStorage` (13.10, C07).
2. The UI offers "Create an account to sync between devices" (a banner, or the settings screen). That's a much easier sell once someone has progress to protect.
3. On registering, the local save is uploaded as the account's **first cloud save** (Module 18).
4. On a second device, logging in **pulls** the cloud save. If that device also has a local guest save, the conflict flow from Module 18 asks which to keep.

So `useMe()` returning `null` is a fully supported state across the whole app, not an error screen.

## Testing

Mock the auth endpoints with MSW (12.4):

```ts
export const loggedOut = http.get('/api/auth/me', () =>
  HttpResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Log in to continue' } }, { status: 401 }),
);
export const loggedInAs = (username: string) =>
  http.get('/api/auth/me', () => HttpResponse.json({ user: { id: 1, username } }));
```

Then test what users see: the guest banner when logged out, the username in the header after logging in, the error message on a wrong password, and the redirect from `/account` to `/login`.

## Check your understanding

1. How does the frontend know whether the user is logged in if it can't read the cookie?
2. Why does `useMe` turn a `401` into `null` instead of an error?
3. Why call `queryClient.clear()` on logout?
4. Are frontend route guards a security measure?
5. What's an open redirect, and how do you avoid one after login?
6. Which `autoComplete` values belong on a login form and a registration form?

<details><summary>Answers</summary>

1. It asks the server (`GET /api/auth/me`). The browser sends the cookie automatically, and the response says who the user is or returns `401`.
2. Being logged out is a normal, expected state (guest mode), not a failure. Treating it as data keeps error handling for real errors.
3. Cached queries contain the previous user's data. Clearing them stops the next user on the same device from seeing it.
4. No. They're UX. The server must enforce authentication and authorisation on every request.
5. Redirecting to a destination taken from user-controlled input, which attackers use to send people from your trusted domain to theirs. Only accept relative paths you expect (e.g. starting with a single `/`).
6. Login: `username` and `current-password`. Registration: `username` and `new-password`.
</details>

## Further reading
- TanStack Query docs: "Query Invalidation", "Updates from Mutation Responses", `QueryCache` callbacks
- web.dev: "Sign-in form best practices"
- React Router docs: `Navigate` and `useLocation`

---
[← OAuth & social login](07-oauth-and-social-login.md) · [Module overview](README.md) · [Module 18 · Cloud Saves & Sync →](../18-cloud-saves/README.md)
