# 19.4 · Config & secrets

> ⏱ 1.5 hours · Module 19 · Architecture & Monorepos

## What you'll learn
- Why configuration lives in environment variables
- `.env` files for development, and why they never go in Git
- Validating config at startup and failing fast
- Passing a typed `Config` object instead of reading `process.env` everywhere
- What frontend "environment variables" really are
- Handling secrets: storage, rotation and leaks

---

## Config is not code

The same build of your API runs on your laptop, in CI and in production. What differs between them is **config**: the database URL, the port, whether cookies are `Secure`, which origins CORS allows. The "twelve-factor app" rule is to keep config **out of the code**, in **environment variables**, so one build can run anywhere and secrets never end up in the repository.

```bash
DATABASE_URL=postgres://… PORT=3000 node dist/index.js
```

Hosting platforms (Module 20) have a settings page for these, and they inject them when your app starts.

## `.env` files for development

Typing a dozen variables before every `npm run dev` gets old, so in development they live in a file:

```bash
# apps/api/.env  (NEVER committed)
DATABASE_URL=postgres://hearthwild:devpassword@localhost:5432/hearthwild
PORT=3000
COOKIE_SECURE=false
CORS_ORIGINS=
```

Node loads it natively (no `dotenv` package needed):

```json
{ "scripts": { "dev": "tsx watch --env-file=.env src/index.ts" } }
```

`--env-file` works with plain `node` too. The rules:

- **`.env` is in `.gitignore`**, always, before you create the file.
- **Commit `.env.example`** with every variable and safe placeholder values. It documents what the app needs, and a new developer copies it to `.env`.
- Production **never reads a `.env` file**. Its values come from the host's settings.

### If a secret is committed
Removing the file in a new commit isn't enough: it's still in the Git history, and bots scan public GitHub for credentials within minutes. **Rotate the secret** first (change the database password, revoke the key), then clean up. GitHub's secret scanning and push protection catch many of these before they happen, so leave them on.

## Validate at startup

`process.env.PORT` is `string | undefined`. Values can be missing, misspelled or malformed, and you want to find out when the server **starts**, with a clear message, not three hours later when the first player tries to log in.

```ts
// apps/api/src/config.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgres:// URL'),
  // …
});

export type Config = { env: 'development' | 'test' | 'production'; port: number; databaseUrl: string /* … */ };

export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    // Report EVERY problem at once, so fixing config isn't one restart per mistake.
    throw new Error('Invalid configuration:\n' + z.prettifyError(result.error));
  }
  const e = result.data;
  return { env: e.NODE_ENV, port: e.PORT, databaseUrl: e.DATABASE_URL };
}
```

```ts
// apps/api/src/index.ts (the composition root)
const config = loadConfig(process.env);   // crash here, loudly, if config is wrong
const app = createApp({ config, /* repos built from config.databaseUrl … */ });
```

Things worth knowing:

- **Empty is not set.** `PORT=` in a `.env` file gives the empty string, and `z.coerce.number()` turns `''` into `0`. Treat empty strings as missing before validating.
- **Booleans are strings.** `COOKIE_SECURE=false` is the string `'false'`, which is *truthy*. Parse `'true'`/`'false'` explicitly. Never `Boolean(value)`.
- **Production rules.** Some values are only wrong in production: `COOKIE_SECURE=false` is fine locally and a security bug live. Check those explicitly.
- **Take `env` as a parameter.** `loadConfig(process.env)` in the app, `loadConfig({ … })` in tests. No need to mutate the real `process.env` in tests.

Exercise 19-01 builds exactly this, for Hearthwild's real settings.

### One typed object, passed down
After startup, nothing else reads `process.env`. Routes and services receive the parts of `Config` they need (15.6). Then:

- every setting the app uses is listed in one file;
- typos are compile errors (`config.cookieSecure`, not `process.env.COOKIE_SECUER`);
- tests pass any config they like.

### Logging config safely
Logging the config at startup ("listening on 3000, database db.example.com, CORS: https://hearthwild.com") saves debugging time, but `DATABASE_URL` contains a password. Log a **redacted** copy: `postgres://hearthwild:***@db.example.com:5432/hearthwild`.

## Frontend "env vars"

Vite exposes variables prefixed with `VITE_` to the browser code:

```ts
const apiBase = import.meta.env.VITE_API_BASE_URL;
```

Understand what this is: Vite **pastes the value into the JavaScript bundle at build time**. It isn't read at runtime, and anyone can see it by opening DevTools. So:

- **Never put a secret in a `VITE_` variable.** Not an API key, not a database URL, nothing.
- Changing it requires a **rebuild**, not a restart.
- With the single-origin layout (17.4, 20.2), the frontend often needs no config at all: it calls `/api`.

Type them in `src/vite-env.d.ts` so typos are caught:

```ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}
```

## Secrets in production

- Store them in the host's **secret/environment settings**, which are encrypted and access-controlled. Never in the repo, a wiki page or a chat message.
- **Least privilege**: the app's database user can't create databases or other users (16.5).
- **Separate secrets per environment.** The development database password should be useless in production.
- **Rotate** them when someone with access leaves, and immediately after any leak.
- Larger organisations use a dedicated secrets manager (AWS Secrets Manager, Doppler, Vault, 1Password). The idea is the same: one source of truth, audited access.

## Check your understanding

1. Why does config live in environment variables rather than in code?
2. What's committed: `.env`, `.env.example`, both or neither?
3. You committed a database password and pushed. What do you do first?
4. Why validate config at startup, and why report every problem at once?
5. `COOKIE_SECURE=false`. What does `Boolean(process.env.COOKIE_SECURE)` return?
6. Can a `VITE_` variable hold a secret? Why or why not?

<details><summary>Answers</summary>

1. So one build runs in every environment, and secrets stay out of the repository.
2. Only `.env.example` (placeholders, documenting the variables). `.env` holds real values and is ignored.
3. Rotate it: change the password so the leaked one stops working. Then clean up the repo. The history and any clones still contain it.
4. To fail immediately, with a clear message, instead of failing later in confusing ways. Reporting everything means one fix-and-restart, not one per mistake.
5. `true`. Any non-empty string is truthy. Parse `'true'`/`'false'` explicitly.
6. No. Its value is pasted into the public JavaScript bundle at build time, where anyone can read it.
</details>

## Further reading
- The Twelve-Factor App, "III. Config" (12factor.net/config)
- Node.js docs: `--env-file`
- Vite docs: "Env Variables and Modes"
- GitHub docs: "About secret scanning" and "push protection"

---
[← Structuring a real app](03-structuring-a-real-app.md) · [Module overview](README.md) · [Module 20 · Deployment & DevOps →](../20-deployment/README.md)
