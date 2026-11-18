# 10.2 · Forms

> ⏱ 3 hours · Module 10 · Routing, Forms & Server Data

## What you'll learn
- Controlled vs uncontrolled forms, and reading values with `FormData`
- Validation: when to validate, and how to show errors accessibly
- Pending states, double-submit prevention, and server errors
- Sharing a Zod schema between client and server
- React 19 form actions: `<form action>`, `useActionState`, `useFormStatus`
- React Hook Form: what it is and when to use it

---

## Two ways to hold form values

### Controlled: React state is the source of truth
```tsx
function LoginForm({ onLogin }: { onLogin: (v: LoginValues) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();                     // stop the browser's full-page POST
    await onLogin({ email, password });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Log in</button>
    </form>
  );
}
```

Use controlled inputs when the UI needs the value *while you type*: live validation, character counters, conditional fields, formatting as you type.

### Uncontrolled: the DOM holds the values, and you read them on submit
```tsx
function LoginForm({ onLogin }: Props) {
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);   // reads every named field
    await onLogin({
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
    });
  }
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" defaultValue="" />
      <input name="password" type="password" />
      <button type="submit">Log in</button>
    </form>
  );
}
```

It's less code with no re-render per keystroke. Fields need a `name`.

> Always submit with a `<form>` and `onSubmit`, not a button `onClick`. You get Enter-to-submit, password manager support and native validation for free.

## Validation

### When to validate
| Timing | Good for | Downside |
|---|---|---|
| **on submit** | simple forms; the least annoying option | errors appear late |
| **on blur** (leaving a field) | the common sweet spot | |
| **on change** | password strength, availability checks | yelling at people mid-typing ("Invalid email" after one letter) |

A widely used, user-friendly approach is to **validate on submit first, then re-validate a field as it changes once it has shown an error** (so the error disappears as soon as it's fixed).

### One schema for everything (Zod)
```ts
// shared with the server later (Module 19)
export const SignupSchema = z
  .object({
    username: z.string().trim().min(3, 'At least 3 characters').max(20).regex(/^\w+$/, 'Letters, numbers and _ only'),
    email: z.email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],              // attach the error to this field
  });

type SignupValues = z.infer<typeof SignupSchema>;

function fieldErrors(error: z.ZodError): Partial<Record<keyof SignupValues, string>> {
  const out: Partial<Record<keyof SignupValues, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof SignupValues;
    out[field] ??= issue.message;           // keep the first message per field
  }
  return out;
}
```

### Showing errors accessibly
```tsx
<label htmlFor="username">Username</label>
<input
  id="username"
  name="username"
  aria-invalid={errors.username ? true : undefined}
  aria-describedby={errors.username ? 'username-error' : undefined}
/>
{errors.username && (
  <p id="username-error" className="field-error">{errors.username}</p>
)}
```

- `aria-invalid` tells assistive tech the field is invalid.
- `aria-describedby` makes screen readers read the error when the field gets focus.
- Don't rely on red colour alone. Show text (and an icon if you like).
- On a failed submit, **move focus to the first invalid field**, or show an error summary with `role="alert"`.

> Client-side validation is for **user experience only**. Anyone can bypass it with `curl`. The server must validate everything again (lesson 15.5), which is easy if both use the same schema.

## Submitting: pending states and server errors

```tsx
const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
const [serverError, setServerError] = useState<string | null>(null);

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if (status === 'submitting') return;       // prevent a double submit
  const parsed = SignupSchema.safeParse(values);
  if (!parsed.success) { setErrors(fieldErrors(parsed.error)); return; }

  setStatus('submitting');
  setServerError(null);
  try {
    await api.signup(parsed.data);
    setStatus('success');
  } catch (err) {
    setStatus('idle');
    if (err instanceof HttpError && err.status === 409) {
      setErrors({ username: 'That username is taken' });   // map a server error onto a field
    } else {
      setServerError('Something went wrong. Please try again.');
    }
  }
}

<button type="submit" disabled={status === 'submitting'}>
  {status === 'submitting' ? 'Creating account…' : 'Create account'}
</button>
{serverError && <p role="alert">{serverError}</p>}
```

The checklist for every form:
- [ ] Labels on every field, and correct `type`/`autocomplete`/`inputMode`
- [ ] Validation with accessible error messages
- [ ] A pending state (disabled submit, plus a label or spinner)
- [ ] Double-submit prevention
- [ ] Server errors shown, and mapped to fields where possible
- [ ] Success feedback (and a redirect or reset)
- [ ] Values kept when something fails. Never wipe what the user typed!

You'll implement every item in exercise 10-01.

## React 19 form actions

React 19 adds first-class support for async form submission. Pass a **function** to `<form action>`:

```tsx
import { useActionState } from 'react';

type State = { error: string | null };

async function signupAction(prev: State, formData: FormData): Promise<State> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid' };
  try {
    await api.signup(parsed.data);
    return { error: null };
  } catch {
    return { error: 'Sign-up failed' };
  }
}

function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, { error: null });
  return (
    <form action={formAction}>
      <input name="username" />
      …
      <button disabled={isPending}>{isPending ? 'Creating…' : 'Create account'}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

- `useActionState` gives you the action's latest returned state and an `isPending` flag.
- `useFormStatus()` (from `react-dom`) lets a child, like a reusable `<SubmitButton>`, read whether its parent form is pending.
- **Note:** after a successful action, React **resets uncontrolled fields** automatically.

This pattern is especially useful with frameworks that run actions on the server (Next.js). In an SPA, both it and the `onSubmit` approach are perfectly good.

## React Hook Form

For larger forms, **React Hook Form** is the most popular library. It's uncontrolled under the hood, so typing doesn't re-render the whole form, and it integrates with Zod:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupValues>({
  resolver: zodResolver(SignupSchema),
  mode: 'onTouched',
});

<form onSubmit={handleSubmit(onValid)}>
  <input {...register('username')} aria-invalid={!!errors.username} />
  {errors.username && <p>{errors.username.message}</p>}
</form>
```

You'll see it in many codebases. Learn the manual way (this lesson and exercise 10-01) so you understand what it automates, then try it in the module's extra practice.

## Mobile form tips (lesson 04.5 revisited)
- `type="email"`, `inputMode="numeric"` and `enterKeyHint="go"` give the right mobile keyboard.
- `autoComplete` values (`username`, `email`, `new-password`, `one-time-code`) let browsers and password managers help.
- Font size of at least 16px avoids iOS zoom.
- Large touch targets, and labels **above** fields on narrow screens.

## Check your understanding

1. Why use `<form onSubmit>` instead of a button's `onClick`?
2. What do `aria-invalid` and `aria-describedby` do?
3. Your form is client-validated with Zod. Does the server still need to validate? Why?
4. How do you prevent double submission?
5. What does `useActionState` return?

<details><summary>Answers</summary>

1. It handles Enter-to-submit, works with password managers and native validation, and is semantically correct.
2. `aria-invalid` marks the field as invalid for assistive tech. `aria-describedby` links the field to the element containing its error message, so screen readers read it.
3. Yes. Client validation can be bypassed entirely (DevTools, `curl`, a modified client). The server is the security boundary.
4. Track a submitting state: ignore submits while it's true, and disable the button.
5. `[state, formAction, isPending]`: the action's latest returned state, a function to pass to `<form action>`, and whether it's running.
</details>

## Further reading
- react.dev: [`<form>`](https://react.dev/reference/react-dom/components/form), [`useActionState`](https://react.dev/reference/react/useActionState), [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)
- MDN: [Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)
- React Hook Form: https://react-hook-form.com
- Adam Silver, *Form Design Patterns* (book). Excellent on form UX.

**Practice:** exercise `10-01` signup-form → `npm run watch 10-01`

---
[← Client-side routing](01-client-side-routing.md) · [Module overview](README.md) · [Next: Fetching data the hard way →](03-fetching-data-the-hard-way.md)
