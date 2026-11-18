// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SignupForm, SignupSchema, type SubmitResult } from './exercise';

const field = (label: string) => screen.getByLabelText(label);
const submit = () => userEvent.click(screen.getByRole('button', { name: /create account|creating account/i }));

async function fillValid(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    Username: '  ava_99 ',
    Email: 'ava@example.com',
    Password: 'hunter12',
    'Confirm password': 'hunter12',
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    await userEvent.clear(field(label));
    if (value) await userEvent.type(field(label), value);
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SignupSchema', () => {
  const valid = { username: 'ava_99', email: 'ava@example.com', password: 'hunter12', confirmPassword: 'hunter12' };
  const messages = (input: unknown) => {
    const r = SignupSchema.safeParse(input);
    return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  };

  it('accepts valid input and trims the username', () => {
    const r = SignupSchema.safeParse({ ...valid, username: '  ava_99  ' });
    expect(r.success && r.data.username).toBe('ava_99');
  });

  it('uses the exact error messages', () => {
    expect(messages({ ...valid, username: 'ab' })).toContain('username: Username must be at least 3 characters');
    expect(messages({ ...valid, username: 'a'.repeat(21) })).toContain('username: Username must be at most 20 characters');
    expect(messages({ ...valid, username: 'ava 99!' })).toContain('username: Use only letters, numbers and underscores');
    expect(messages({ ...valid, email: 'nope' })).toContain('email: Enter a valid email address');
    expect(messages({ ...valid, password: 'short1', confirmPassword: 'short1' })).toContain(
      'password: Password must be at least 8 characters',
    );
    expect(messages({ ...valid, password: 'longenough', confirmPassword: 'longenough' })).toContain(
      'password: Password must include a number',
    );
    expect(messages({ ...valid, confirmPassword: 'different1' })).toContain('confirmPassword: Passwords do not match');
  });
});

describe('SignupForm', () => {
  it('renders labelled fields with the right types and autocomplete', () => {
    render(<SignupForm onSubmit={vi.fn()} />);
    expect(field('Username')).toHaveAttribute('autocomplete', 'username');
    expect(field('Email')).toHaveAttribute('type', 'email');
    expect(field('Password')).toHaveAttribute('type', 'password');
    expect(field('Password')).toHaveAttribute('autocomplete', 'new-password');
    expect(field('Confirm password')).toHaveAttribute('name', 'confirmPassword');
  });

  it('shows accessible errors, focuses the first invalid field and does not submit', async () => {
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);
    await fillValid({ Email: 'not-an-email', Password: 'abc', 'Confirm password': 'xyz' });
    await submit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(field('Email')).toHaveFocus();
    expect(field('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(field('Email')).toHaveAccessibleDescription('Enter a valid email address');
    expect(field('Password')).toHaveAccessibleDescription('Password must be at least 8 characters');
    expect(field('Confirm password')).toHaveAccessibleDescription('Passwords do not match');
    expect(field('Username')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('clears a field’s error when it is edited', async () => {
    render(<SignupForm onSubmit={vi.fn()} />);
    await fillValid({ Email: 'nope' });
    await submit();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    await userEvent.type(field('Email'), '@example.com');
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
    expect(field('Email')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('submits parsed values, shows a pending state and ignores double submits', async () => {
    const pending = deferred<SubmitResult>();
    const onSubmit = vi.fn(() => pending.promise);
    render(<SignupForm onSubmit={onSubmit} />);
    await fillValid();
    await submit();

    const button = screen.getByRole('button', { name: 'Creating account…' });
    expect(button).toBeDisabled();
    await submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      username: 'ava_99',
      email: 'ava@example.com',
      password: 'hunter12',
      confirmPassword: 'hunter12',
    });

    pending.resolve(undefined);
    expect(await screen.findByRole('status')).toHaveTextContent('Welcome, ava_99!');
    expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument();
  });

  it('shows server field errors and keeps the values', async () => {
    const onSubmit = vi.fn(async () => ({ fieldErrors: { username: 'Username is taken' } }));
    render(<SignupForm onSubmit={onSubmit} />);
    await fillValid();
    await submit();
    expect(await screen.findByText('Username is taken')).toBeInTheDocument();
    expect(field('Username')).toHaveAccessibleDescription('Username is taken');
    expect(field('Email')).toHaveValue('ava@example.com');
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });

  it('shows a form-level error from the server', async () => {
    render(<SignupForm onSubmit={async () => ({ formError: 'Sign-ups are closed' })} />);
    await fillValid();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-ups are closed');
  });

  it('shows a generic error when onSubmit throws, and allows retrying', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    render(<SignupForm onSubmit={onSubmit} />);
    await fillValid();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
    await submit();
    expect(await screen.findByRole('status')).toHaveTextContent('Welcome, ava_99!');
  });
});
