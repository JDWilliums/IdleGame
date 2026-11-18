/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 10-01 · signup-form
 * Lesson:  10.2 Forms (and 02.7 for Zod)
 * Run:     npm run watch 10-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build the game's sign-up form, covering every item on lesson 10.2's checklist.
 *
 * TASK 1 · SignupSchema (Zod). Messages must match EXACTLY:
 *   username        trimmed;  < 3 chars  → "Username must be at least 3 characters"
 *                              > 20 chars → "Username must be at most 20 characters"
 *                              not /^[a-zA-Z0-9_]+$/ → "Use only letters, numbers and underscores"
 *   email           not an email → "Enter a valid email address"
 *   password        < 8 chars → "Password must be at least 8 characters"
 *                    no digit → "Password must include a number"
 *   confirmPassword  ≠ password → "Passwords do not match"   (an error on confirmPassword)
 *
 * TASK 2 · SignupForm({ onSubmit })
 *   Fields, in this order, each with a <label> (exact text) and a matching `name`:
 *     "Username" (text, autoComplete="username")
 *     "Email" (email, autoComplete="email")
 *     "Password" (password, autoComplete="new-password")
 *     "Confirm password" (password, autoComplete="new-password")
 *   and a submit button "Create account".
 *   Put `noValidate` on the <form>, so the browser's built-in validation popups
 *   don't run before your own, more helpful messages.
 *
 *   On submit:
 *   - Validate with SignupSchema. For each invalid field, show its FIRST error in
 *     <p id="{name}-error">, and give the input aria-invalid="true" and
 *     aria-describedby="{name}-error". Focus the FIRST invalid field. Don't call onSubmit.
 *   - Editing a field clears THAT field's error.
 *   - If valid: call onSubmit(parsed values) (username trimmed). While it's
 *     pending, the button is disabled and reads "Creating account…". Ignore
 *     extra submits.
 *   - onSubmit resolves with { fieldErrors } → show them like validation errors
 *     (e.g. "Username is taken"). Keep everything the user typed.
 *   - onSubmit resolves with { formError } → show it in <p role="alert">.
 *   - onSubmit THROWS → <p role="alert">Something went wrong. Please try again.</p>
 *   - onSubmit resolves with nothing → replace the form with
 *     <p role="status">Welcome, {username}!</p>
 */
import { z } from 'zod';

export const SignupSchema = z.object({
  // TODO (Task 1)
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

export function SignupForm(props: SignupFormProps) {
  return null; // TODO (Task 2)
}
