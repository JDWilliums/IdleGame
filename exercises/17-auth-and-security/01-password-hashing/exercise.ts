/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 17-01 · password-hashing
 * Lesson:  17.2 Storing passwords
 * Run:     npm run watch 17-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · createPasswordHasher(options?) → { hash, verify, needsRehash }
 *   Options (all optional): N (default 2 ** 17), r (8), p (1), keyLength (32), saltLength (16).
 *
 *   hash(password) → Promise<string>
 *     - Normalise the password with NFKC first.
 *     - Random salt of saltLength bytes from crypto.randomBytes.
 *     - Derive keyLength bytes with the ASYNC crypto.scrypt, passing N, r, p and a
 *       maxmem big enough for them (scrypt needs about 128 × N × r bytes).
 *     - Return the format:  scrypt$<N>$<r>$<p>$<salt base64url>$<key base64url>
 *
 *   verify(password, stored) → Promise<boolean>
 *     - Parse `stored` and re-derive with ITS salt, N, r, p and key length
 *       (not this hasher's options: old hashes must keep working).
 *     - Compare with crypto.timingSafeEqual.
 *     - A malformed `stored` string returns false. Never throw.
 *
 *   needsRehash(stored) → boolean
 *     - true if `stored` is malformed, or was made with an N, r, p or key length
 *       different from this hasher's options.
 *
 * TASK 2 · checkPasswordPolicy(password, { username }) → PolicyResult
 *   Check in this order and report the FIRST failure:
 *     'too_short'          fewer than 8 characters (count code points, after NFKC)
 *     'too_long'           more than 128 characters
 *     'common'             in COMMON_PASSWORDS (case-insensitive)
 *     'contains_username'  contains the username (case-insensitive)
 *   Otherwise { ok: true }.
 */

export type HasherOptions = {
  N?: number;
  r?: number;
  p?: number;
  keyLength?: number;
  saltLength?: number;
};

export type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(password: string, stored: string): Promise<boolean>;
  needsRehash(stored: string): boolean;
};

export function createPasswordHasher(options: HasherOptions = {}): PasswordHasher {
  return {
    async hash(password) {
      throw new Error('Not implemented yet');
    },
    async verify(password, stored) {
      throw new Error('Not implemented yet');
    },
    needsRehash(stored) {
      throw new Error('Not implemented yet');
    },
  };
}

// ─── Task 2 ───────────────────────────────────────────────────────────────────
/** A tiny sample. In production you'd check a breached-password list (17.2). */
export const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', 'qwertyuiop',
  'iloveyou', 'sunshine1', 'football', 'letmein123', 'trustno1', 'hearthwild',
]);

export type PolicyResult =
  | { ok: true }
  | { ok: false; reason: 'too_short' | 'too_long' | 'common' | 'contains_username' };

export function checkPasswordPolicy(password: string, context: { username: string }): PolicyResult {
  throw new Error('Not implemented yet');
}
