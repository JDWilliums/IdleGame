import { scryptSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checkPasswordPolicy, createPasswordHasher } from './exercise';

// Small parameters keep the tests fast. One test below uses the real defaults.
const fast = createPasswordHasher({ N: 2 ** 10 });

const FORMAT = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/;

describe('hash', () => {
  it('produces the self-describing format', async () => {
    const stored = await fast.hash('correct horse battery staple');
    const match = FORMAT.exec(stored);
    expect(match, `"${stored}" doesn't match scrypt$N$r$p$salt$key`).not.toBeNull();
    const [, N, r, p, salt, key] = match ?? [];
    expect([N, r, p]).toEqual(['1024', '8', '1']);
    expect(Buffer.from(salt ?? '', 'base64url')).toHaveLength(16);
    expect(Buffer.from(key ?? '', 'base64url')).toHaveLength(32);
  });

  it('really uses scrypt with the stored salt and parameters', async () => {
    const stored = await fast.hash('hunter2hunter2');
    const [, N, r, p, salt, key] = FORMAT.exec(stored) ?? [];
    const expected = scryptSync('hunter2hunter2', Buffer.from(salt ?? '', 'base64url'), 32, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    });
    expect(key).toBe(expected.toString('base64url'));
  });

  it('salts: the same password hashes differently every time', async () => {
    const [a, b] = await Promise.all([fast.hash('same password'), fast.hash('same password')]);
    expect(a).not.toBe(b);
  });

  it('respects keyLength and saltLength options', async () => {
    const custom = createPasswordHasher({ N: 2 ** 10, keyLength: 64, saltLength: 32 });
    const [, , , , salt, key] = FORMAT.exec(await custom.hash('long enough')) ?? [];
    expect(Buffer.from(salt ?? '', 'base64url')).toHaveLength(32);
    expect(Buffer.from(key ?? '', 'base64url')).toHaveLength(64);
  });

  it('works with the real default parameters (N = 2^17), which need a raised maxmem', async () => {
    const real = createPasswordHasher();
    const stored = await real.hash('correct horse battery staple');
    expect(stored.startsWith('scrypt$131072$8$1$')).toBe(true);
    expect(await real.verify('correct horse battery staple', stored)).toBe(true);
  });
});

describe('verify', () => {
  it('accepts the right password and rejects wrong ones', async () => {
    const stored = await fast.hash('correct horse battery staple');
    expect(await fast.verify('correct horse battery staple', stored)).toBe(true);
    expect(await fast.verify('correct horse battery stapl', stored)).toBe(false);
    expect(await fast.verify('Correct horse battery staple', stored)).toBe(false);
    expect(await fast.verify('', stored)).toBe(false);
  });

  it('normalises Unicode, so é typed two different ways matches', async () => {
    const composed = 'café-au-lait'; // é as one code point
    const decomposed = 'café-au-lait'; // e + combining accent
    expect(composed).not.toBe(decomposed);
    const stored = await fast.hash(composed);
    expect(await fast.verify(decomposed, stored)).toBe(true);
  });

  it("uses the stored hash's own parameters, not the hasher's", async () => {
    const oldHasher = createPasswordHasher({ N: 2 ** 10, keyLength: 16 });
    const newHasher = createPasswordHasher({ N: 2 ** 11 });
    const stored = await oldHasher.hash('an old password');
    expect(await newHasher.verify('an old password', stored)).toBe(true);
    expect(await newHasher.verify('a wrong password', stored)).toBe(false);
  });

  it('returns false (never throws) for malformed stored values', async () => {
    const stored = await fast.hash('whatever123');
    const parts = stored.split('$');
    const malformed = [
      '',
      'not a hash',
      'bcrypt$10$8$1$abc$def',
      parts.slice(0, 5).join('$'), // missing the key
      [...parts, 'extra'].join('$'),
      ['scrypt', 'abc', ...parts.slice(2)].join('$'), // N isn't a number
      ['scrypt', '1000', ...parts.slice(2)].join('$'), // N isn't a power of two: scrypt itself throws
    ];
    for (const value of malformed) {
      await expect(fast.verify('whatever123', value), `verify(…, ${JSON.stringify(value)})`).resolves.toBe(false);
    }
  });
});

describe('needsRehash', () => {
  it('is false for hashes made with the current options', async () => {
    expect(fast.needsRehash(await fast.hash('fine password'))).toBe(false);
  });

  it('is true when any parameter differs, or the value is malformed', async () => {
    const stored = await fast.hash('fine password');
    expect(createPasswordHasher({ N: 2 ** 11 }).needsRehash(stored)).toBe(true);
    expect(createPasswordHasher({ N: 2 ** 10, r: 16 }).needsRehash(stored)).toBe(true);
    expect(createPasswordHasher({ N: 2 ** 10, keyLength: 64 }).needsRehash(stored)).toBe(true);
    expect(fast.needsRehash('garbage')).toBe(true);
  });
});

describe('checkPasswordPolicy', () => {
  const ctx = { username: 'Ava_Fisher' };

  it('accepts a decent passphrase', () => {
    expect(checkPasswordPolicy('correct horse battery staple', ctx)).toEqual({ ok: true });
    expect(checkPasswordPolicy('8charsOK', ctx)).toEqual({ ok: true });
  });

  it('enforces length limits, counting characters (code points)', () => {
    expect(checkPasswordPolicy('short', ctx)).toEqual({ ok: false, reason: 'too_short' });
    expect(checkPasswordPolicy('😀😀😀😀', ctx)).toEqual({ ok: false, reason: 'too_short' }); // 4 characters, 8 UTF-16 units
    expect(checkPasswordPolicy('x'.repeat(128), ctx)).toEqual({ ok: true });
    expect(checkPasswordPolicy('x'.repeat(129), ctx)).toEqual({ ok: false, reason: 'too_long' });
  });

  it('rejects common passwords, case-insensitively', () => {
    expect(checkPasswordPolicy('Password123', ctx)).toEqual({ ok: false, reason: 'common' });
    expect(checkPasswordPolicy('HEARTHWILD', ctx)).toEqual({ ok: false, reason: 'common' });
  });

  it('rejects passwords containing the username', () => {
    expect(checkPasswordPolicy('my-ava_fisher-pass', ctx)).toEqual({ ok: false, reason: 'contains_username' });
  });

  it('reports the first failure in order', () => {
    expect(checkPasswordPolicy('ava', { username: 'ava' })).toEqual({ ok: false, reason: 'too_short' });
    expect(checkPasswordPolicy('password', { username: 'password' })).toEqual({ ok: false, reason: 'common' });
  });
});
