// Reference solution for 17-01. Read it only AFTER your own version passes.
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

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

// promisify can't pick scrypt's overload that takes options, so describe it ourselves.
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

type Parsed = { N: number; r: number; p: number; salt: Buffer; key: Buffer };

const POSITIVE_INT = /^[1-9]\d*$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

function parse(stored: string): Parsed | undefined {
  const parts = stored.split('$');
  if (parts.length !== 6) return undefined;
  const [algorithm, N, r, p, salt, key] = parts as [string, string, string, string, string, string];
  if (algorithm !== 'scrypt') return undefined;
  if (![N, r, p].every((n) => POSITIVE_INT.test(n))) return undefined;
  if (!BASE64URL.test(salt) || !BASE64URL.test(key)) return undefined;
  return {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    salt: Buffer.from(salt, 'base64url'),
    key: Buffer.from(key, 'base64url'),
  };
}

function derive(password: string, salt: Buffer, keyLength: number, N: number, r: number, p: number) {
  // scrypt needs ~128·N·r bytes; Node's default limit is 32 MiB, too small for N = 2^17.
  return scryptAsync(password.normalize('NFKC'), salt, keyLength, { N, r, p, maxmem: 256 * N * r });
}

export function createPasswordHasher(options: HasherOptions = {}): PasswordHasher {
  const { N = 2 ** 17, r = 8, p = 1, keyLength = 32, saltLength = 16 } = options;

  return {
    async hash(password) {
      const salt = randomBytes(saltLength);
      const key = await derive(password, salt, keyLength, N, r, p);
      return ['scrypt', N, r, p, salt.toString('base64url'), key.toString('base64url')].join('$');
    },

    async verify(password, stored) {
      const parsed = parse(stored);
      if (!parsed) return false;
      try {
        const attempt = await derive(password, parsed.salt, parsed.key.length, parsed.N, parsed.r, parsed.p);
        return attempt.length === parsed.key.length && timingSafeEqual(attempt, parsed.key);
      } catch {
        return false; // e.g. N not a power of two: treat a corrupt row like a wrong password
      }
    },

    needsRehash(stored) {
      const parsed = parse(stored);
      if (!parsed) return true;
      return parsed.N !== N || parsed.r !== r || parsed.p !== p || parsed.key.length !== keyLength;
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
  const normalised = password.normalize('NFKC');
  const length = [...normalised].length; // code points, so an emoji counts as one character
  const lower = normalised.toLowerCase();

  if (length < 8) return { ok: false, reason: 'too_short' };
  if (length > 128) return { ok: false, reason: 'too_long' };
  if (COMMON_PASSWORDS.has(lower)) return { ok: false, reason: 'common' };
  if (lower.includes(context.username.toLowerCase())) return { ok: false, reason: 'contains_username' };
  return { ok: true };
}
