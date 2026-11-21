# 20.5 · Observability

> ⏱ 2.5 hours · Module 20 · Deployment & DevOps

## What you'll learn
- Logs, metrics and traces: what each tells you
- Structured logging with request ids, at the right levels, without leaking secrets
- Error tracking on the server and in the browser, with source maps
- Uptime monitoring and alerts that are worth waking up for
- Writing up incidents: the blameless postmortem

---

## Seeing inside production

In development you watch the terminal and the browser console. In production you can't see either, and the person who hit the bug won't send you a stack trace. They'll just stop playing. **Observability** means being able to answer "what is the system doing, and why?" from the outside.

| Signal | Answers | Example |
|---|---|---|
| **Logs** | what happened, in detail | `PUT /api/save 409 23ms user=42 requestId=…` |
| **Metrics** | how much, how fast, how often, over time | p95 latency of `PUT /api/save` = 180 ms; error rate 0.3% |
| **Traces** | where the time went within one request | 160 ms of a 180 ms request was one slow query |
| **Errors** | what broke, with a stack trace and context | `TypeError: Cannot read properties of undefined` at `bank.ts:42`, 31 users |

For a project like Hearthwild, **logs + error tracking + an uptime monitor** cover most of what you need. The host's dashboard usually gives you basic metrics (CPU, memory, request counts) for free.

## Structured logging

`console.log('saved for', userId)` produces text that's hard to search and filter. **Structured logs** are JSON, one object per line, which log tools can query (`status >= 500 AND path = "/api/save"`).

**pino** is the standard fast JSON logger for Node, and **pino-http** logs every request:

```ts
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';

export const logger = pino({
  level: config.logLevel,                           // from 19-01
  redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
});

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.headers['x-request-id']?.toString() ?? randomUUID();
      res.setHeader('X-Request-Id', id);            // the client can show or report it
      return id;
    },
    customProps: (_req, res) => ({ userId: res.locals.user?.id }),
  }),
);
```

```json
{"level":30,"time":1772366400000,"reqId":"5b1c…","req":{"method":"PUT","url":"/api/save"},"res":{"statusCode":409},"responseTime":23,"userId":42,"msg":"request completed"}
```

### Request ids
One id per request, included in every log line for that request (`req.log.info(…)` in pino-http does this) and returned in the `X-Request-Id` header. When a player reports "sync failed at 3pm", you can find every log line for that request. Include the id in your error responses' JSON as well, so support requests can quote it.

### Levels
- `error`: something failed that shouldn't have (the 500 path in 15-04's handler).
- `warn`: unexpected but handled (a plausibility check failed, 18.4; a retry).
- `info`: normal, notable events (startup with the redacted config, each request).
- `debug`: detail for development. Off in production unless you're investigating.

### Never log
Passwords, session tokens, cookies, `Authorization` headers, full save bodies, or anything else personal you don't need. Use `redact` for headers, and don't log request bodies on auth routes at all. Logs are copied to more places, kept longer and read by more people than your database.

## Error tracking

An error tracker (Sentry is the best known; others include Bugsnag, Rollbar and Honeybadger) collects exceptions from the server **and from players' browsers**, groups identical ones together, and shows you the stack trace, the browser and OS, what the user did beforehand (breadcrumbs), and how many players are affected.

- **Server**: initialise the SDK at startup, and report from your central error handler's 500 path (15-04), where unknown errors already end up.
- **Browser**: initialise in `main.tsx`, and report from your React error boundary (09.4) and the game loop's `try/catch` around ticks.
- **Source maps**: production JavaScript is minified, so a stack trace says `a.js:1:20387`. Upload your build's source maps to the tracker (the vendors provide Vite plugins), and it shows `BankPage.tsx:42`. Upload them to the tracker only. Don't serve them publicly.
- **Release tagging**: send the Git SHA as the release, so you can see "this error started with release 3f9a1c".
- **Privacy**: configure the SDK not to send personal data you don't need, and mention error tracking in your privacy notice.

## Uptime and alerts

An **uptime monitor** (UptimeRobot, Better Stack and many others have free plans) requests `/api/health` (20.3) every minute or so from outside, and alerts you by email or push notification when it fails. It's the cheapest, most valuable monitoring you can add: you hear about an outage before your players tell you.

Rules for alerts:

- **Alert on symptoms players feel**: the site is down, the error rate jumped, saves are failing. Not on causes like "CPU is at 70%".
- **Every alert must need a human to act.** Alerts that fire and get ignored train you to ignore all alerts.
- For a hobby project: uptime down, and a spike in new errors. That's enough.

### The RED method
For any API, three metrics tell you most of what you need: **R**ate (requests per second), **E**rrors (how many fail) and **D**uration (how long they take, as percentiles: p50, p95, p99). Averages hide the slow requests players actually notice, which is why you use percentiles.

## When things go wrong: postmortems

After an incident (the game was down, saves were lost, a bad deploy), write a short **blameless postmortem**:

```markdown
# 2026-05-14: Saves failing for 40 minutes

## Impact
~120 players saw "Couldn't reach the server". No data lost (saves were kept locally, 18.2).

## Timeline (UTC)
14:02 Deploy of 3f9a1c. 14:05 Uptime alert. 14:20 Found migration had not run. 14:41 Migration run, recovered.

## Root cause
The new code expected a column added by a migration; the pre-deploy migration step was misconfigured.

## What went well / what didn't
+ Local-first design meant no lost progress. − No alert on PUT /api/save error rate.

## Actions
- [ ] Run migrations at startup as a fallback (owner: me)
- [ ] Alert on 5xx rate > 5% for 5 minutes
```

"Blameless" means the question is *what about the system let this happen?*, never *who messed up?* People hide mistakes when they're blamed, and hidden mistakes repeat. A postmortem in your capstone repo is an unusual and impressive thing to show an interviewer.

## Check your understanding

1. What does each of logs, metrics, traces and error tracking tell you?
2. Why log JSON instead of text?
3. What is a request id for, and where should it appear?
4. Name four things that must never appear in logs.
5. Why do you need to upload source maps to an error tracker?
6. What makes a good alert?
7. What does "blameless" mean in a postmortem, and why does it matter?

<details><summary>Answers</summary>

1. Logs: the detail of what happened. Metrics: trends in rates, durations and counts. Traces: where the time went within one request. Error tracking: grouped exceptions with stack traces and how many users they affect.
2. Structured logs can be searched and filtered by field (status, path, user), which text can't do reliably.
3. To connect every log line (and the error response) for one request. It appears in each log line, in the `X-Request-Id` response header, and in error responses.
4. Any four of: passwords, session tokens, cookies, `Authorization` headers, full save bodies, unnecessary personal data.
5. Production code is minified. Source maps let the tracker map stack traces back to your original files and lines.
6. It reflects something users actually feel, and it needs a human to act. Otherwise it trains people to ignore alerts.
7. It focuses on how the system allowed the failure, not on who caused it, so people report problems honestly and the real causes get fixed.
</details>

## Further reading
- pino and pino-http READMEs
- Google SRE Book, chapter 6 ("Monitoring Distributed Systems") and chapter 15 ("Postmortem Culture"), free at sre.google
- Your error tracker's docs: "Source maps" and "Releases"

---
[← CI with GitHub Actions](04-ci-with-github-actions.md) · [Module overview](README.md) · [Module 21 · PWA, Performance & Accessibility →](../21-pwa-performance-a11y/README.md)
