# Module 20 · Deployment & DevOps

**Time:** ~12 hours · **Prerequisites:** Modules 15–19 (especially 19.4, config)

## Why this module matters
A project that only runs on your laptop can't be played by anyone, and can't be shown to an employer. Getting software into production, keeping it healthy and knowing when it isn't is a large part of a developer's real job. Teams expect even juniors to understand CI, read deploy logs and help investigate an incident. In this module you'll learn the concepts and the concrete steps. Milestone C12 is where you put Hearthwild live, so you can send its URL to anyone.

## Learning objectives
By the end of this module you can:
- explain how production differs from development, and work through a production-readiness checklist
- choose hosting and a deployment layout that works with cookie-based auth
- deploy a monorepo's web app, API and database, with health checks and migrations
- write a GitHub Actions workflow that lints, type-checks, tests and builds every change
- add structured logging, error tracking and uptime monitoring, and write a blameless postmortem

## Lessons
| # | Lesson | Time |
|---|---|---|
| 20.1 | [What "production" means](01-what-production-means.md) | 2h |
| 20.2 | [Choosing hosting & domains](02-choosing-hosting.md) | 2h |
| 20.3 | [Deploying the frontend, API & database](03-deploying-frontend-api-and-database.md) | 3h |
| 20.4 | [CI with GitHub Actions](04-ci-with-github-actions.md) | 2.5h |
| 20.5 | [Observability](05-observability.md) | 2.5h |

## Exercises
There are no graded exercises in this module. The practice is real: you'll set up CI in milestone C01 and deploy in C12. The extra practice below lets you rehearse on something small first.

## Checkpoint quiz
1. You roll back a release whose migration added a column. Is the column removed? What does that imply for writing migrations?
2. Why can't the game's frontend be on `*.vercel.app` and its API on `*.onrender.com`?
3. What's the trade-off between Layout A (one service) and Layout B (static frontend + API subdomain)?
4. Why does `index.html` get `Cache-Control: no-cache` while `/assets/*` is cached for a year?
5. What does the `/{*splat}` route do in 20.3, and why does it skip `/api/` paths?
6. What should your health endpoint check?
7. Name the steps in a sensible CI job, in order.
8. What does a request id let you do?
9. A player reports that sync broke yesterday afternoon. Which three tools from this module help you find out why?

<details><summary>Answers</summary>

1. No. Rollbacks only change the code. Migrations must be backwards-compatible (expand, then contract), so the previous release still works with the new schema.
2. Both are on the Public Suffix List, so they're different sites. The API's session cookie would be a third-party cookie, blocked by default in Safari and Firefox (17.4).
3. A: the simplest (no CORS, no domain needed), but a sleeping free-tier service delays the first page load. B: the game loads instantly from a CDN and syncs once the API wakes, but it needs a domain and CORS.
4. Asset filenames contain a content hash, so a changed file gets a new name. `index.html` always has the same name and must be re-checked to pick up new asset names.
5. It's the SPA fallback: it serves `index.html` for client-side routes, so reloading `/skills/fishing` works. API paths must still return JSON 404s, not HTML.
6. That essential dependencies work: at least a trivial database query.
7. Check out, set up Node (with a cache), `npm ci`, lint, type-check, test, build. Then end-to-end tests as a separate job that needs the first.
8. Find every log line (and the error report) belonging to one request.
9. Logs (search by user and time, then follow the request id), error tracking (any new errors since a release), and the uptime monitor's history (was the API down?).
</details>

## Extra practice
1. **Deploy a toy.** Deploy your 15-02 Express app (with an in-memory repo) to a PaaS using Layout A. Add a `/api/health` route and configure it as the health check.
2. **CI for this course repo.** Fork this repository and add a workflow that runs `npm ci` and `npm run verify:solutions` on every push. Make a change that breaks a solution and watch it fail.
3. **Log it.** Add pino-http to your 17-03 app with request ids and `redact` for cookies. Make requests, and confirm no cookie or password appears anywhere in the output.
4. **Practise a postmortem.** Deliberately break your toy deployment (a wrong `DATABASE_URL`, say), fix it, and write a five-minute blameless postmortem.

**Next:** [Module 21 · PWA, Performance & Accessibility →](../21-pwa-performance-a11y/README.md)
