# 12.3 · Testing React components

> ⏱ 2.5 hours · Module 12 · Testing

## What you'll learn
- Testing Library's philosophy
- `render`, `screen`, and the query priority list
- `getBy` vs `queryBy` vs `findBy`
- Simulating users with `user-event`
- `jest-dom` matchers
- Async UI, `within`, and custom render functions with providers
- Debugging failing tests

---

## The guiding principle

> *"The more your tests resemble the way your software is used, the more confidence they can give you."* (Testing Library)

Users don't know about props, state or class names. They see text, labels and buttons, and they click and type. Testing Library gives you tools that work **only** at that level, which nudges you towards behaviour tests (12.1).

## The basics

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { SkillCard } from './SkillCard';

it('calls onSelect when Train is clicked', async () => {
  const onSelect = vi.fn();
  render(<SkillCard name="Fishing" level={5} isActive={false} onSelect={onSelect} />);

  await userEvent.click(screen.getByRole('button', { name: 'Train' }));

  expect(onSelect).toHaveBeenCalledTimes(1);
});
```

- `render` mounts the component into a jsdom `document.body`.
- `screen` queries the whole document.
- This repo's `vitest.setup.ts` loads the `jest-dom` matchers and cleans up after each test.

## Query priority

Use the first one that works:

1. **`getByRole(role, { name })`**: buttons, links, headings, textboxes, checkboxes, dialogs, lists… This is how assistive tech sees the page, so if you can't find it by role, a screen reader user might not find it either.
2. **`getByLabelText('Email')`**: form fields.
3. **`getByPlaceholderText`**: only if there's no label (and there should be one).
4. **`getByText('Out of stock')`**: non-interactive text.
5. **`getByDisplayValue`**: the current value of a filled-in field.
6. **`getByAltText`, `getByTitle`**
7. **`getByTestId('modal-backdrop')`**: a last resort, for things with no accessible role or text.

Common roles: `button`, `link`, `heading` (with `{ level: 2 }`), `textbox`, `searchbox`, `spinbutton` (number input), `checkbox`, `radio`, `combobox` (select), `option`, `listbox`, `list`, `listitem`, `dialog`, `alert`, `status`, `progressbar`, `tab`, `tabpanel`, `region` (a labelled section), `article`, `navigation`, `main`, `img`.

The `name` option matches the **accessible name** (button text, `aria-label`, label text, or `aria-labelledby`) as a string (exact) or a regex: `{ name: /buy/i }`.

## `getBy`, `queryBy`, `findBy`

| Variant | Not found | Found many | Async | Use for |
|---|---|---|---|---|
| `getBy…` | **throws** | throws | no | asserting something **is** there |
| `queryBy…` | returns `null` | throws | no | asserting something is **not** there |
| `findBy…` | rejects (after ~1s) | rejects | **yes** | waiting for something to **appear** |
| `getAllBy…` / `queryAllBy…` / `findAllBy…` | | returns an array | | lists |

```tsx
expect(screen.getByRole('heading', { name: 'Bank' })).toBeInTheDocument();
expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
expect(await screen.findByRole('status')).toHaveTextContent('Welcome, ava!');
```

## `user-event`: interacting like a user

```ts
await userEvent.click(button);
await userEvent.type(input, 'ava_99');            // types character by character, firing all key events
await userEvent.clear(input);
await userEvent.selectOptions(select, 'fish');
await userEvent.keyboard('{ArrowDown}{Enter}');
await userEvent.tab();                             // move focus, as with the Tab key
await userEvent.hover(element);
```

Prefer `userEvent` over `fireEvent`. `fireEvent.click` dispatches one event, while `userEvent.click` simulates the whole sequence (pointer down, focus, pointer up, click) the way a browser does, and it respects `disabled`. Use `fireEvent` when you need one specific low-level event, or with fake timers (where `userEvent` needs extra setup: `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`).

## `jest-dom` matchers

```ts
expect(el).toBeInTheDocument();
expect(el).toBeVisible();
expect(button).toBeDisabled();       // / toBeEnabled()
expect(el).toHaveTextContent('Level 12');
expect(input).toHaveValue('ava');    // numbers for number inputs: toHaveValue(5)
expect(el).toHaveAttribute('aria-selected', 'true');
expect(input).toHaveAccessibleDescription('Enter a valid email address');
expect(input).toHaveFocus();
expect(checkbox).toBeChecked();
expect(el).toHaveClass('active');    // ⚠️ usually an implementation detail
```

## Scoping with `within`

```tsx
const shop = screen.getByRole('list', { name: 'Shop' });
await userEvent.click(within(shop).getByRole('button', { name: 'Buy Bronze Axe' }));
```

## Async UI

When the UI updates after a promise resolves:

```tsx
await userEvent.click(screen.getByRole('button', { name: 'Load save' }));
expect(await screen.findByText('Welcome back, Ava')).toBeInTheDocument();

// or wait for any assertion to become true
await waitFor(() => expect(onSaved).toHaveBeenCalled());
```

> ⚠️ The classic flaky-test bug: using `getBy` for something that appears *asynchronously*. It sometimes passes (fast machine) and sometimes fails (CI). Use `findBy`.

## Providers: a custom render

Components that need a router, a query client or a store need those providers in tests too. Wrap them once in a helper:

```tsx
// test/render.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });  // no retries in tests!
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: [route] });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
```

Create **fresh** clients and stores per test, so no state leaks between tests.

## What not to do

```tsx
// ❌ reaching into implementation
container.querySelector('.skill-card__button')!.click();
expect(wrapper.find(SkillCard).prop('level')).toBe(5);

// ❌ testing that React works
expect(useStateSpy).toHaveBeenCalled();

// ❌ one giant test checking everything (when it fails, what broke?)

// ❌ waitFor with side effects inside it
await waitFor(() => { userEvent.click(button); expect(...) });   // the click can run many times!
```

## Debugging failing tests

- When a query fails, Testing Library **prints the DOM**. Read it: is the element there under a different name or role?
- `screen.debug()` prints the current DOM, and `screen.debug(element)` just one element.
- `screen.logTestingPlaygroundURL()` gives a link to an interactive tool that suggests the best query.
- `logRoles(container)` lists every role and accessible name on the page.
- Put a breakpoint in the test or the component, and debug it from the Vitest VS Code extension (05.5).

## Check your understanding

1. Why prefer `getByRole('button', { name: 'Buy' })` to `getByTestId('buy-button')`?
2. Which query do you use to assert that "Out of stock" is *not* shown?
3. A test sometimes fails in CI with "Unable to find role status". What's the likely bug?
4. Why create a new `QueryClient` per test, with `retry: false`?

<details><summary>Answers</summary>

1. It matches how users and assistive tech find the button, so it also verifies accessibility, and it survives refactors that don't change behaviour. Test ids are invisible to users and say nothing about accessibility.
2. `expect(screen.queryByText('Out of stock')).not.toBeInTheDocument()`.
3. The status element appears asynchronously, but the test uses `getByRole` instead of `await findByRole`.
4. A fresh client means no cached data leaks between tests. `retry: false` makes error-state tests fail fast instead of retrying three times with backoff.
</details>

## Further reading
- Testing Library: [Guiding principles](https://testing-library.com/docs/guiding-principles), [Which query should I use?](https://testing-library.com/docs/queries/about#priority), [user-event](https://testing-library.com/docs/user-event/intro)
- Kent C. Dodds: *"Common mistakes with React Testing Library"*. Read it before the exercise.

**Practice:** exercise `12-02` write-component-tests → `npm run watch 12-02`

---
[← Vitest fundamentals](02-vitest-fundamentals.md) · [Module overview](README.md) · [Next: Mocking the network & testing hooks →](04-mocking-the-network.md)
