# 20.2 · Choosing hosting & domains

> ⏱ 2 hours · Module 20 · Deployment & DevOps

## What you'll learn
- The kinds of hosting: static, application and managed databases
- Two deployment layouts that work with cookies, and their trade-offs
- How to compare hosts without being caught out by free-tier limits
- Domains and DNS: registrars, records and HTTPS

---

## Three things to host

1. **The web app**: after `vite build`, it's just static files (`index.html`, hashed JS and CSS, images).
2. **The API**: a long-running Node process.
3. **The database**: Postgres.

| Kind | Hosts static files? | Runs Node? | Examples |
|---|---|---|---|
| **Static hosting / CDN** | ✅ fast, global, usually free for hobby use | ❌ (or only short-lived functions) | Cloudflare Pages, Netlify, Vercel, GitHub Pages |
| **Application hosting** (PaaS) | ✅ if your app serves them | ✅ | Render, Railway, Fly.io, Heroku, DigitalOcean App Platform |
| **Managed Postgres** | — | — | Neon, Supabase, and most PaaS hosts' own Postgres |
| **A virtual server** (VPS) | ✅ | ✅ | Hetzner, DigitalOcean, Linode; you manage everything yourself |

A PaaS takes your repository, runs your build and start commands, gives you HTTPS, logs, environment settings and rollbacks, and restarts the app if it crashes. That's exactly the level of control a junior needs, and what many companies use. A VPS teaches you more about Linux, but you also become responsible for patching, firewalls and backups. That's a good later project, not a launch plan.

> Serverless functions (AWS Lambda, Vercel Functions, Cloudflare Workers) are another option for APIs. They suit request/response APIs well, but they need serverless-friendly database drivers and change some of the patterns in this course, such as in-memory rate limiting. Stick with a long-running Node server for Hearthwild.

## Two layouts that work

Lesson 17.4 explained why the frontend and API must be on the **same site** for the session cookie to be first-party. Two layouts achieve that.

### Layout A: one service, one origin (the simplest)
Express serves the built web app **and** the API:

```
https://hearthwild.onrender.com/            → index.html, JS, CSS (from apps/web/dist)
https://hearthwild.onrender.com/api/…       → Express routes
```

- ✅ One thing to deploy. No CORS, cookies just work, and it needs no custom domain.
- ✅ Matches the Vite dev proxy setup (17.4), so dev and production behave the same.
- ❌ If the host puts the service to sleep when idle (common on free tiers), the **first page load** waits for it to wake up, often 30 seconds or more.

### Layout B: static frontend + API on your own domain

```
https://hearthwild.com          → static host (CDN)
https://api.hearthwild.com      → the API service
```

- ✅ The game loads instantly from a CDN, even if the API is asleep. Hearthwild is local-first (18.2), so players can start playing at once while sync catches up.
- ✅ Same site (`hearthwild.com`), so cookies are first-party.
- ❌ It needs a domain, and CORS with credentials configured exactly (17.6).
- ❌ Two deployments to keep in step.

**Recommendation:** start with **Layout A**. It gets you to "live" fastest, with the fewest things that can go wrong. Move to Layout B when you buy a domain and care about first-load speed. Your code supports both if the API base URL comes from config and CORS origins come from `CORS_ORIGINS` (19-01).

## Comparing hosts

Pricing pages change often, so check the current details yourself. Ask these questions of any host:

- **Does the free tier sleep?** How long does it take to wake up?
- **Free database limits.** Storage size, and whether **free databases expire or get deleted** after a period. Some do, which is fine for a demo and a disaster for real players' saves.
- **Backups.** Are they automatic? How far back? Have you tried restoring one?
- **Region.** Put the API and database in the same region, because every query crosses that gap. Choose one near most of your players.
- **Deploys.** Does it deploy from GitHub automatically? Can it wait for CI to pass first? Does it have preview environments?
- **Costs once you grow.** What does the smallest *paid* plan cost, if your game takes off or you want it always awake?

A typical hobby setup costs nothing to start, and roughly the price of a couple of coffees a month for an always-on service, a database with backups and a domain. Worth it for a portfolio project people will actually visit.

## Domains and DNS

A domain costs around £8–£15 a year from a **registrar** (Cloudflare Registrar, Porkbun, Namecheap and others). Avoid registrars that charge for basic privacy (WHOIS redaction) or hike renewal prices.

**DNS** maps names to servers. The records you'll set up:

| Record | Points | Example |
|---|---|---|
| `A` / `AAAA` | a name at an IPv4 / IPv6 address | `hearthwild.com → 203.0.113.10` |
| `CNAME` | a name at another name | `api.hearthwild.com → hearthwild-api.onrender.com` |
| `TXT` | arbitrary text, often for proving you own the domain | `_verify.hearthwild.com → "abc123"` |

Your host's "custom domain" page tells you exactly which records to add. DNS changes can take minutes to hours to spread.

**HTTPS** certificates are free and automatic: hosts get them from Let's Encrypt once your DNS points at them. There's no reason for any site to be served over plain HTTP.

## Check your understanding

1. What are the three things Hearthwild needs to host?
2. Why does Layout A need no CORS configuration?
3. What's Layout B's main advantage, and why does it fit Hearthwild in particular?
4. Name three things to check about a host's free tier before trusting it with players' saves.
5. Which DNS record would point `api.hearthwild.com` at your host's provided hostname?

<details><summary>Answers</summary>

1. The static web app, the Node API and the Postgres database.
2. The frontend and API share one origin, so every request is same-origin.
3. The frontend loads instantly from a CDN even when the API is asleep. Hearthwild is local-first, so players can play at once while the API wakes up.
4. Any three of: whether it sleeps (and how long it takes to wake); database size limits; whether free databases expire; whether backups exist and can be restored; the region; costs after the free tier.
5. A `CNAME`.
</details>

## Further reading
- MDN: "What is a domain name?" and "What is DNS?"
- Let's Encrypt: "How It Works"
- Your chosen host's docs on custom domains and environment variables

---
[← What "production" means](01-what-production-means.md) · [Module overview](README.md) · [Next: Deploying the frontend, API & database →](03-deploying-frontend-api-and-database.md)
