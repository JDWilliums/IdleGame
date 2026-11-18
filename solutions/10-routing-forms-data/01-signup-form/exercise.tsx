// Reference solution for 10-01. Read it only AFTER your own version passes.
import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';

export const SignupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Use only letters, numbers and underscores'),
    email: z.email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must include a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SubmitResult = void | {
  fieldErrors?: Partial<Record<keyof SignupValues, string>>;
  formError?: string;
};

export type SignupFormProps = {
  onSubmit: (values: SignupValues) => Promise<SubmitResult>;
};

type FieldName = keyof SignupValues;
type Errors = Partial<Record<FieldName, string>>;

const FIELDS: { name: FieldName; label: string; type: string; autoComplete: string }[] = [
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
];

function toFieldErrors(error: z.ZodError): Errors {
  const errors: Errors = {};
  for (const issue of error.issues) {
    const name = issue.path[0];
    if (typeof name === 'string' && name in EMPTY) errors[name as FieldName] ??= issue.message;
  }
  return errors;
}

const EMPTY: SignupValues = { username: '', email: '', password: '', confirmPassword: '' };

export function SignupForm({ onSubmit }: SignupFormProps) {
  const [values, setValues] = useState<SignupValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const inputRefs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});

  function handleChange(name: FieldName, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const { [name]: _cleared, ...rest } = e;
      return rest;
    });
  }

  function showErrors(next: Errors) {
    setErrors(next);
    const first = FIELDS.find((f) => next[f.name]);
    if (first) inputRefs.current[first.name]?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting') return;

    const parsed = SignupSchema.safeParse(values);
    if (!parsed.success) {
      showErrors(toFieldErrors(parsed.error));
      return;
    }

    setStatus('submitting');
    setFormError(null);
    try {
      const result = await onSubmit(parsed.data);
      setStatus('idle');
      if (result?.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        showErrors(result.fieldErrors);
      } else if (result?.formError) {
        setFormError(result.formError);
      } else {
        setWelcomeName(parsed.data.username);
      }
    } catch {
      setStatus('idle');
      setFormError('Something went wrong. Please try again.');
    }
  }

  if (welcomeName !== null) {
    return <p role="status">Welcome, {welcomeName}!</p>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {FIELDS.map(({ name, label, type, autoComplete }) => {
        const error = errors[name];
        const errorId = `${name}-error`;
        return (
          <div key={name}>
            <label htmlFor={name}>{label}</label>
            <input
              ref={(node) => {
                inputRefs.current[name] = node;
              }}
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              value={values[name]}
              onChange={(e) => handleChange(name, e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
            {error && <p id={errorId}>{error}</p>}
          </div>
        );
      })}
      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
