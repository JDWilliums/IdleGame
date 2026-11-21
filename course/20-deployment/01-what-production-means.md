# 20.1 · What "production" means

> ⏱ 2 hours · Module 20 · Deployment & DevOps

## What you'll learn
- How production differs from your laptop
- Environments: local, preview, production
- Builds, releases and rollbacks
- Small, frequent deploys, and feature flags
- A production-readiness checklist for Hearthwild

---

## Your laptop vs production

| | Development | Production |
|---|---|---|
| Users | you | real people, on devices and networks you've never seen |
| Data | throwaway; reset it whenever you like | **theirs**: hours of play you must never lose |
| Code | Vite dev server, `tsx watch`, source maps, hot reload | a minified, optimised build |
| Errors | a red overlay in your browser | invisible, unless you've set up logging and error tracking (20.5) |
| Network | `localhost`, instant | HTTPS, proxies, latency, flaky mobile connections |
| Config | `.env` | the host's environment settings (19.4) |
| When it breaks | you notice immediately | players notice first, unless you've set up monitoring |

"It works on my machine" is where production work **starts**. Everything in this module is about closing that gap.

## Environments

- **Local**: your machine, with `.env`, a Docker or PGlite database, and seed data.
- **Preview** (or staging): a deployed copy made from a branch or pull request, with its own database. Many hosts can create one per pull request automatically. It's where you click through a change in a real browser, on a real phone, before it reaches players.
- **Production**: the real one.

Each environment has **its own database and its own secrets** (19.4). Never point a preview at the production database.

## Builds, releases, rollbacks

- A **build** turns source into something runnable: `vite build` for the web app (static files in `dist/`), and a bundle or `tsx` entry point for the API.
- A **release** is a build plus an environment's config, running.
- A **rollback** means switching back to the previous release. Every host keeps old releases, so a rollback is usually one click. Know where that button is **before** you need it.

Rollbacks and the database: rolling back the **code** doesn't roll back a **migration**. That's why migrations should be backwards-compatible (expand, then contract, 16.5). The previous code version must still work with the new schema.

## Ship small, ship often

Teams that deploy several times a day have *fewer* incidents than teams that deploy monthly. A small change is easy to review, easy to test, and obvious to roll back if it breaks. A month of changes deployed at once is none of those.

- **Trunk-based development**: short-lived branches, merged to `main` within a day or two. `main` is always deployable.
- **CI on every pull request** (20.4), so `main` stays green.
- **Deploy from `main`**, automatically or at the press of a button.
- **Feature flags** for work that isn't ready: the code is deployed but switched off (`if (flags.combat) …`), so unfinished features don't need long-lived branches. A flag can be as simple as a config value. Remove it once the feature is fully launched.

## Production-readiness checklist

Before inviting players to Hearthwild, every item here should be ticked. You'll come back to this list in milestone C12.

**Security**
- [ ] HTTPS everywhere, with HSTS (17.6). Hosts provide certificates automatically.
- [ ] Cookies `HttpOnly`, `Secure`, `SameSite=Lax` (17.4), checked by `loadConfig` (19-01).
- [ ] `helmet()` security headers and a CSP (17.6).
- [ ] Rate limits on login, registration and save uploads (17-04).
- [ ] Secrets only in the host's settings; `.env` never committed (19.4).
- [ ] `npm audit` reviewed; Dependabot on (20.4).

**Data**
- [ ] Migrations run automatically on deploy (20.3).
- [ ] Automated database backups are on, **and you've tried restoring one**.
- [ ] Save history kept for recovery (18.1).

**Reliability**
- [ ] Config validated at startup (19-01).
- [ ] A `/health` endpoint that checks the database (20.3).
- [ ] Graceful shutdown on `SIGTERM` (15.6).
- [ ] `trust proxy` set correctly, so `req.ip` and rate limits work (17.6).

**Visibility** (20.5)
- [ ] Structured request logs, with no passwords, tokens or cookies in them.
- [ ] Error tracking on the server and in the browser.
- [ ] An uptime monitor that alerts you.

**Player experience**
- [ ] The game works offline, and the sync status is visible (18.5).
- [ ] Tested on a real phone, not just DevTools device mode (21.2).
- [ ] Lighthouse: good performance and accessibility scores (21.3, 21.4).
- [ ] A privacy notice saying what you store (a username, a password hash, game saves) and how to delete an account.

## Check your understanding

1. Give three ways production differs from development.
2. Why does each environment need its own database?
3. You roll back a deploy that included a migration. Is the migration undone?
4. Why are small, frequent deploys safer than big, rare ones?
5. What is a feature flag for?

<details><summary>Answers</summary>

1. Any three of: real users and real data you can't lose; an optimised build without dev tooling; invisible errors unless you monitor; real network conditions and HTTPS; config from the host rather than `.env`.
2. So testing a preview can never damage or leak production data, and each environment's data and schema can change independently.
3. No. Code rollbacks don't touch the database, so migrations must be backwards-compatible with the previous code.
4. Each change is easier to review and test, and when something breaks, it's obvious what caused it and quick to roll back.
5. Deploying code that isn't ready while keeping it switched off, so work can merge to `main` without long-lived branches, and features can be turned on (or off) without a deploy.
</details>

## Further reading
- "Accelerate" by Forsgren, Humble and Kim (the research behind "deploy small and often")
- trunkbaseddevelopment.com

---
[← Module overview](README.md) · [Next: Choosing hosting & domains →](02-choosing-hosting.md)
