# 20.4 · CI with GitHub Actions

> ⏱ 2.5 hours · Module 20 · Deployment & DevOps

## What you'll learn
- What continuous integration is for
- Writing a GitHub Actions workflow: triggers, jobs, steps and caching
- Running lint, type checks, unit tests, a build, and Playwright end-to-end tests
- Protecting `main` so nothing merges without passing checks
- Automated dependency updates with Dependabot
- Deploying only after CI passes

---

## Why CI?

**Continuous integration** means every change is automatically checked on a clean machine before it's merged. It catches the "works on my machine" problems (a forgotten file, a dependency you installed globally, a test you didn't run), and it's the safety net that makes small, frequent deploys (20.1) possible.

On a team, CI is also a social contract: a pull request with a red ❌ doesn't get reviewed until it's green. You'll work this way from your first week in a job.

## A workflow

Workflows are YAML files in `.github/workflows/`. This one runs on every pull request and every push to `main`:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read            # least privilege: this workflow only needs to read the code

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true  # a new push to the same branch cancels the old run

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm        # caches npm's download cache, keyed on package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- **`on`**: when to run. **`jobs`**: groups of steps, each on a fresh virtual machine. **`steps`**: either `uses:` (a reusable action) or `run:` (a shell command).
- Each `run` step fails the job if its command exits with a non-zero code. That's why your scripts must exit non-zero on failure (they do: `tsc`, `vitest run` and `oxlint` all do).
- `node-version-file: .nvmrc` means CI uses the same Node version as you and production.
- `timeout-minutes` stops a hung test from burning hours.

### Pin what you use
`actions/checkout@v5` follows the `v5` tag. The tag can move, so a compromised action could run in your CI (17.6, supply chain). Pinning to a full commit SHA (`actions/checkout@<40-character SHA> # v5`) is stricter, and Dependabot can keep the pins updated. For official `actions/*` actions, tags are a common compromise. For third-party actions, prefer SHAs.

## End-to-end tests

Playwright tests (12.5) need browsers and a running app, so they get their own job:

```yaml
  e2e:
    needs: check              # only run once the fast checks pass
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
      - uses: actions/upload-artifact@v4
        if: failure()         # when it fails, keep the report so you can see what happened
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 7
```

Playwright's `webServer` option (12.5) starts the app for the tests. Point the API at an in-memory or PGlite database in CI, so the job needs no external services. If you do need a real Postgres, GitHub Actions can start one as a **service container** alongside the job.

Keep e2e tests few and focused on the critical journeys (load the game, start an action, register, sync), because they're slower and flakier than unit tests. The testing pyramid (12.1) still applies.

## Protecting `main`

In the repository settings, add a **branch ruleset** (or classic branch protection) for `main`:

- Require a pull request before merging (even for you: it's good practice and good for your portfolio).
- Require status checks to pass: `check` and `e2e`.
- Block force pushes.

Now `main` is always green, so it's always deployable.

## Dependabot

Dependencies need updates for bug fixes and security patches, but updating by hand is easy to forget. Dependabot opens pull requests for you, and CI tests each one:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    groups:
      minor-and-patch:
        update-types: [minor, patch]   # one PR for the small stuff instead of twenty
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
```

Review them like any other PR: read the changelog for major versions, check CI, merge. Don't let them pile up.

## Deploying after CI

Two common patterns:

1. **The host deploys from `main`**, and its settings say "wait for CI checks to pass". This is the simplest, and many PaaS hosts support it.
2. **A deploy job in the workflow** that runs after `check` and `e2e` on pushes to `main`, calling the host's deploy hook or CLI with a token stored in **repository secrets** (`${{ secrets.DEPLOY_HOOK_URL }}`).

Secrets in Actions are masked in logs and aren't given to workflows triggered by pull requests from forks. Still, never `echo` them.

## When CI fails

- Read the log from the **first** error, not the last. Later failures are often consequences.
- Reproduce locally with the same commands: `npm ci && npm run lint && npm run typecheck && npm test`.
- "Passes locally, fails in CI" is usually different Node versions, a file missing from Git (check `git status`), timezone or locale assumptions in tests, or test order dependence.
- A **flaky** test (sometimes passes, sometimes fails) is a bug. Fix it or quarantine it with a ticket. Don't just click "re-run" forever.

## Check your understanding

1. What problem does CI solve?
2. What's the difference between a job and a step?
3. Why `node-version-file: .nvmrc` instead of a hard-coded version?
4. Why does the `e2e` job have `needs: check`?
5. What does requiring status checks on `main` guarantee?
6. Where do you keep a deploy token, and how does the workflow use it?

<details><summary>Answers</summary>

1. It checks every change on a clean machine before merging, catching problems that only work on one developer's machine, and keeps `main` releasable.
2. A job runs on its own fresh machine and contains steps. Steps run in order within a job, each either an action or a shell command.
3. So CI uses exactly the version you develop with and production runs, from one file.
4. So the slow end-to-end tests only run once the fast checks pass. There's no point running them on code that doesn't type-check.
5. Nothing can be merged into `main` unless CI passed, so `main` is always green and deployable.
6. In the repository's Actions secrets, referenced as `${{ secrets.NAME }}`. It's masked in logs and not given to workflows from forks.
</details>

## Further reading
- GitHub docs: "Understanding GitHub Actions", "Building and testing Node.js", "Security hardening for GitHub Actions"
- GitHub docs: "About rulesets", "Dependabot version updates"
- Playwright docs: "Continuous Integration"

---
[← Deploying the frontend, API & database](03-deploying-frontend-api-and-database.md) · [Module overview](README.md) · [Next: Observability →](05-observability.md)
