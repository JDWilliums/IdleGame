# 17.2 · Storing passwords

> ⏱ 2.5 hours · Module 17 · Authentication & Security

## What you'll learn
- Why plain text, encryption and ordinary hashes are all wrong for passwords
- Salts, work factors and memory-hard functions
- Hashing passwords with Node's built-in `scrypt`
- A self-describing hash format that lets you raise the cost later
- Constant-time comparison
- A sensible password policy (it's not "one capital, one symbol")

---

## The goal

You need to check a password at login without being able to recover it, so that **when** (not if) your database leaks, attackers learn as little as possible.

### ❌ Plain text
Anyone who reads the table has every password. This still happens.

### ❌ Encryption
Encryption is reversible by design. The key has to live on the server to check logins, so whoever steals the database usually gets the key as well.

### ❌ A normal hash (SHA-256, MD5)
A hash is one-way: `sha256('hunter2')` can't be reversed. But two problems remain:

1. **Same password, same hash.** Everyone with `password123` has the same hash. Attackers use precomputed tables (**rainbow tables**) of the hashes of millions of common passwords and look them up.
2. **Fast.** SHA-256 is designed to be fast. A single modern GPU computes **billions** of them per second, so every 8-character lowercase password can be tried in minutes.

### ✅ A salted, slow, memory-hard password hash
- A **salt** is a random value, different for each user, mixed into the hash and stored next to it. Identical passwords then get different hashes, and precomputed tables are useless: the attacker has to start from scratch for each user.
- A **work factor** makes each guess deliberately expensive (tens to hundreds of milliseconds). That's unnoticeable at login and ruinous for someone making billions of guesses.
- **Memory-hard** functions also need lots of RAM per guess, which is what GPUs and custom chips are short of.

The functions built for this are **Argon2id** (the current first choice), **scrypt** and **bcrypt** (older but still acceptable, with a 72-byte password limit). We'll use **scrypt** because it's built into Node's `crypto` module, so there's nothing native to install, and it's on OWASP's recommended list.

> OWASP's Password Storage Cheat Sheet lists minimum settings for each. For scrypt that's N = 2¹⁷, r = 8, p = 1. Check the current cheat sheet when you build for real, because these numbers rise as hardware gets faster.

## scrypt in Node

```ts
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const N = 2 ** 17;  // CPU/memory cost: must be a power of two
const r = 8;        // block size
const p = 1;        // parallelism

const salt = randomBytes(16);
const key = await scryptAsync('correct horse battery staple', salt, 32, { N, r, p, maxmem: 256 * N * r });
```

- **Always use the async version.** `scryptSync` blocks the event loop for the whole computation (about 0.3 s here), so every other request waits (01.4).
- scrypt needs about `128 × N × r` bytes of memory: 128 MiB with these settings. Node refuses to use more than 32 MiB unless you raise `maxmem`, and fails with a "memory limit exceeded" error. `256 * N * r` gives some headroom.
- The `as (…) => Promise<Buffer>` cast is needed because `promisify` can't infer the right overload for `scrypt`'s optional options argument.
- `randomBytes` uses the operating system's cryptographically secure random generator. **Never use `Math.random()` for anything security-related**: its output is predictable.

## A self-describing format

You need the salt and the parameters to check a password later, and you'll want to raise the parameters in a year's time without breaking existing users. So store them **with** the hash, in one string:

```
scrypt$131072$8$1$q3W9mY0vXK1yxW2l9q3RBA$8cJ5u7…Qk
  │      │    │ │          │                │
  │      N    r p       salt (base64url)  derived key (base64url)
  algorithm
```

That's the same idea as the `$2b$12$…` strings bcrypt produces or the `$argon2id$v=19$m=…` strings from Argon2. One `text` column holds everything.

Later, when you raise `N`:
1. Old hashes still verify, because each one carries its own parameters.
2. When a user logs in successfully, you have their plain password for a moment. If their stored hash uses old parameters (`needsRehash`), hash it again with the new ones and update the row. Over time everyone is upgraded, without a password reset.

## Verifying, in constant time

To verify: parse the stored string, run scrypt on the attempted password with the **stored** salt and parameters, and compare the result with the stored key.

```ts
import { timingSafeEqual } from 'node:crypto';

const same = attempt.length === stored.length && timingSafeEqual(attempt, stored);
```

Why not `attempt.equals(stored)` or comparing strings with `===`? A normal comparison stops at the first different byte, so it takes slightly longer the more bytes match. With enough measurements, an attacker can use that tiny timing difference to recover a secret byte by byte. `timingSafeEqual` always takes the same time for buffers of the same length. (It throws if the lengths differ, hence the length check first.)

A password hash comparison is hard to exploit this way, because the attacker can't choose the hash bytes. But it costs nothing, and the habit matters for tokens, signatures and API keys, where it really does matter.

If the stored string is malformed (wrong number of parts, an unknown algorithm), `verify` should return `false`, not throw. A corrupted row shouldn't produce a 500 that looks different from a wrong password.

## Normalising Unicode

`é` can be one code point (U+00E9) or two (`e` + a combining accent U+0301). They look identical, but they're different bytes, so they hash differently. A user who registered on a Mac and logs in from a Windows phone could be locked out. NIST recommends normalising before hashing:

```ts
const normalised = password.normalize('NFKC');
```

Do it in **both** `hash` and `verify`.

## Password policy

The old rules (one capital, one digit, one symbol, change every 90 days) made passwords *weaker*: people wrote `Password1!` and incremented the number. NIST's current guidance (SP 800-63B) says:

- **Length matters most.** A minimum of 8 characters, and 15 when the password is the only factor. Allow long passphrases: at least 64 characters.
- **No composition rules** (no mandatory symbols or capitals).
- **No forced periodic changes**, only after a suspected compromise.
- **Block known-bad passwords**: common ones, ones from breaches, and ones containing the username or site name.
- Allow paste, so password managers work.

You should also set a **maximum** length (e.g. 128 or 256 characters). An attacker who sends a 10 MB "password" makes your server run scrypt over 10 MB.

> The Have I Been Pwned "Pwned Passwords" API lets you check a password against hundreds of millions of breached ones without sending the password: you send the first 5 characters of its SHA-1 hash and get back matching suffixes (k-anonymity). It's a common production addition.

## Login without leaking which accounts exist

```ts
const user = await users.findByUsername(username);
const ok = await passwords.verify(password, user?.passwordHash ?? DUMMY_HASH);
if (!user || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
```

- The **same message** for "no such user" and "wrong password".
- **Run the hash anyway** when the user doesn't exist (against a dummy hash made at startup). Otherwise "no such user" answers in 1 ms and "wrong password" in 300 ms, and the timing tells the attacker which usernames are real.

(Registration still reveals that a username is taken. That's unavoidable when usernames are public. With email logins, the fix is to always say "check your email".)

## Check your understanding

1. Why isn't SHA-256 good enough for passwords, even with a salt?
2. What does a salt defend against? Does it need to be secret?
3. What happens if you call `scryptSync` in a request handler?
4. Why store the parameters inside the hash string?
5. Why `timingSafeEqual`, and why check lengths first?
6. Why normalise passwords with NFKC?
7. A user doesn't exist. Why should login still spend time hashing?

<details><summary>Answers</summary>

1. It's fast. A GPU can try billions of guesses per second against each salted hash. Password hashes must be deliberately slow and memory-hungry.
2. Identical passwords producing identical hashes, and precomputed (rainbow) tables. It isn't secret: it's stored next to the hash. It only has to be unique and random.
3. The event loop blocks for the whole computation, so every other request to the server waits.
4. So old hashes keep verifying after you raise the cost, and so you can detect old hashes (`needsRehash`) and upgrade them when the user next logs in.
5. A normal comparison returns as soon as bytes differ, which leaks timing information. `timingSafeEqual` takes the same time regardless, but throws on different lengths.
6. The same visible characters can be encoded as different code points on different devices, which would produce different hashes and lock the user out.
7. Otherwise "no such user" responds much faster than "wrong password", and the timing reveals which usernames exist.
</details>

## Further reading
- OWASP "Password Storage Cheat Sheet"
- NIST SP 800-63B, section on memorised secrets (passwords)
- Node.js docs: `crypto.scrypt`, `crypto.timingSafeEqual`, `crypto.randomBytes`

---
[← Auth concepts & threat modelling](01-auth-concepts-and-threats.md) · [Module overview](README.md) · [Next: Sessions vs JWTs →](03-sessions-vs-jwts.md)
