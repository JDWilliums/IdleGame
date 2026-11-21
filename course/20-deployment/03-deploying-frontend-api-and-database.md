# 20.3 · Deploying the frontend, API & database

> ⏱ 3 hours · Module 20 · Deployment & DevOps

## What you'll learn
- Building the monorepo for production
- Serving the built web app from Express, with the right caching headers and an SPA fallback
- A health check that tells the host whether the app really works
- Running migrations as part of every deploy
- Optional: packaging the app as a Docker image
- A first-deploy checklist, step by step

---

## Build and start commands

Every PaaS asks two questions: **how do I build it**, and **how do I start it**? For Layout A (20.2), with the monorepo from 19.1:

```json
// root package.json
{
  "scripts": {
    "build": "npm run build -w apps/web && npm run build -w apps/api",
    "start": "npm run start -w apps/api"
  }
}
```

```json
// apps/api/package.json
{
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --format=esm --outfile=dist/index.js --sourcemap",
    "start": "node --enable-source-maps dist/index.js",
    "db:migrate": "node dist/migrate.js"
  }
}
```

In the host's settings:

- **Build command**: `npm ci && npm run build`
- **Start command**: `npm start`
- **Node version**: from `.nvmrc` or the `engines` field. Pin it, so production matches what CI tested.

`npm ci` installs exactly what's in the lockfile, and fails if `package.json` and the lockfile disagree. Use it everywhere except your own machine.

`--enable-source-maps` makes stack traces in production logs point at your TypeScript lines instead of the bundle's.

## Serving the web app from Express

```ts
import path from 'node:path';
import express from 'express';

const webDist = path.resolve(import.meta.dirname, '../../web/dist');   // adjust to your layout

// 1. The API first, so /api/* never falls through to index.html
app.use('/api', apiRouter);

// 2. Hashed assets: cache forever. A new build gives them new names.
app.use('/assets', express.static(path.join(webDist, 'assets'), { immutable: true, maxAge: '1y' }));

// 3. Other static files (favicon, manifest, icons)
app.use(express.static(webDist, { index: false }));

// 4. SPA fallback: any other GET gets index.html, so /skills/fishing works on reload
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();            // unknown API routes → JSON 404
  res.set('Cache-Control', 'no-cache');                       // always check for a new index.html
  res.sendFile(path.join(webDist, 'index.html'));
});
```

- **Why the fallback?** React Router handles `/skills/fishing` in the browser, but a reload asks the *server* for that path. Without the fallback, the server returns 404.
- **`/{*splat}`** is Express 5's syntax for "match everything, including `/`". Express 4's bare `*` no longer works.
- **Caching**: Vite names built files by content hash (`index-3f9a1c.js`), so they can be cached forever. `index.html` must **not** be cached for long, or players keep loading old asset names after you deploy. (The PWA service worker in 21.1 adds its own layer on top of this.)
- Hosts that offer a CDN in front of your service will respect these headers.

## Health checks

Hosts ping a health endpoint to decide whether a new release is ready for traffic, and whether to restart a stuck one. Make it check the things the app really needs:

```ts
app.get('/api/health', async (_req, res) => {
  try {
    await db.execute(sql`select 1`);                         // can we reach the database?
    res.json({ status: 'ok', version: config.version });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});
```

Configure the host to use `/api/health`. Including a `version` (the Git commit SHA, from an environment variable most hosts provide) means you can check what's actually deployed.

## Migrations on deploy

The schema must be migrated **before** new code that needs it starts serving requests. Options, from simplest:

1. **At startup.** Run `migrate()` (16.6) before `app.listen`. Fine for a single instance: if the migration fails, the new release fails its health check, and the old one keeps serving.
2. **A pre-deploy / release command.** Many hosts can run a command between build and start (`npm run db:migrate -w apps/api`). It's better when several instances start at once, because the migration then runs exactly once.

Either way:

- Migrations are **generated, reviewed and committed** (16.6), never run with `drizzle-kit push` against production.
- They're **backwards-compatible** with the previous release (expand/contract, 16.5), because the old version keeps running until the new one is healthy, and you may need to roll back.

## Environment settings

Set these in the host's dashboard, matching 19-01's `loadConfig`:

```
NODE_ENV=production
DATABASE_URL=<from your database provider, including ?sslmode=require>
COOKIE_SECURE=true
CORS_ORIGINS=                ← empty for Layout A; https://hearthwild.com for Layout B
LOG_LEVEL=info
```

Hosts usually set `PORT` themselves. Your config reads it, and `app.listen(config.port)` uses it. If config is wrong, `loadConfig` throws at startup with a clear list of problems, which you'll see in the deploy logs.

Also: **`app.set('trust proxy', 1)`**, because the host's proxy sits in front of your app (17.6).

## Docker (optional)

Some hosts build from a `Dockerfile` instead of build commands, and many companies ship everything as container images. A multi-stage build keeps the final image small:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/engine/package.json packages/engine/
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
USER node
CMD ["node", "--enable-source-maps", "apps/api/dist/index.js"]
```

Copying the `package.json` files before the rest of the source lets Docker cache the `npm ci` layer, so changing a component doesn't reinstall every dependency. Because esbuild bundled the API, the final image needs no `node_modules`. If you mark packages as external instead, copy production dependencies too. `USER node` means the app doesn't run as root.

## First deploy, step by step

1. Create the **database**. Copy its connection string. Turn on backups.
2. Create the **web service** from your GitHub repo. Set the build and start commands and the Node version.
3. Add the **environment variables**.
4. Set the **health check path** to `/api/health`.
5. Deploy. Read the **build log**, then the **runtime log**. `loadConfig` and migration errors appear here.
6. Open the site. Register, play for a minute, check the sync indicator, reload, and check that you're still logged in.
7. Log in on your **phone**. Is the save there?
8. Find the **rollback** button. Find the **database backup** page. (You'll be glad later.)
9. Turn on **auto-deploy** from `main`, ideally only after CI passes (20.4).

When something fails, it's almost always one of: a wrong environment variable, a missing build step for a workspace, the wrong path to `web/dist`, or a migration that didn't run. The logs will tell you which.

## Check your understanding

1. Why use `npm ci` instead of `npm install` in deploys?
2. Why do built assets get `immutable` caching but `index.html` gets `no-cache`?
3. What does the SPA fallback fix, and why must it skip `/api/` paths?
4. What should a health endpoint check?
5. Why must migrations be backwards-compatible with the previous release?
6. Your deploy log says "Invalid configuration: DATABASE_URL: must be a postgres:// URL". What happened, and where do you fix it?

<details><summary>Answers</summary>

1. It installs exactly what the lockfile says and fails if the lockfile and `package.json` disagree, so production gets what CI tested.
2. Asset names contain a content hash, so a changed file gets a new name and the old one can be cached forever. `index.html` keeps the same name and points at the current asset names, so browsers must always check for a new one.
3. A reload of a client-side route like `/skills/fishing` asks the server for that path. The fallback returns `index.html` so React Router can handle it. API paths must still get a JSON 404, not an HTML page.
4. That the app's essential dependencies work. At minimum, that the database answers a trivial query.
5. The old release keeps serving while the new one starts, and a rollback runs old code against the new schema.
6. Config validation at startup (19-01) rejected the environment variable. It's missing or wrong in the host's environment settings, so fix it there and redeploy.
</details>

## Further reading
- Express docs: "Serving static files" and the Express 5 migration guide (path syntax)
- Vite docs: "Deploying a Static Site"
- Your host's docs: build commands, health checks, pre-deploy commands

---
[← Choosing hosting & domains](02-choosing-hosting.md) · [Module overview](README.md) · [Next: CI with GitHub Actions →](04-ci-with-github-actions.md)
