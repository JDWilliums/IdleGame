# 12.5 · End-to-end tests with Playwright

> ⏱ 2 hours · Module 12 · Testing

## What you'll learn
- What E2E tests are for, and how few you need
- Setting up Playwright with a Vite app
- Locators, auto-waiting and web-first assertions
- Mobile emulation
- Fast-forwarding time with `page.clock` (perfect for idle games)
- Testing cross-device sync with two browser contexts
- Traces, flakiness and CI

---

## Why E2E

Unit and integration tests run in jsdom, a *simulation* of a browser. E2E tests drive a **real browser** (Chromium, Firefox, WebKit) against your **real running app**, so they catch things the others can't: routing and refresh behaviour, real CSS (is the button covered by the tab bar?), service workers, cookies, and the frontend and backend working together.

The trade-off is that they're slower (seconds each) and more fragile. Keep them to the **critical user journeys**, maybe 5–15 tests for your whole game.

## Setup

```bash
npm init playwright@latest
# choose TypeScript, an e2e/ folder, and install browsers
```

```ts
// playwright.config.ts (the important parts)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',               // record a trace when a retried test fails
  },
  webServer: {
    command: 'npm run dev',                 // Playwright starts your app for you
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 15'] } },   // mobile-first, so test mobile first!
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

## A first test

```ts
// e2e/skills.spec.ts
import { expect, test } from '@playwright/test';

test('a player can start chopping and earn a log', async ({ page }) => {
  await page.goto('/skills');
  await page.getByRole('button', { name: 'Train Woodcutting' }).click();
  await page.getByRole('button', { name: 'Chop Oak Tree' }).click();

  await expect(page.getByRole('status', { name: 'Current action' })).toHaveText(/Chopping Oak Tree/);
  await expect(page.getByText('+1 Oak Log')).toBeVisible({ timeout: 5000 });
});
```

It looks almost exactly like Testing Library, on purpose: `getByRole`, `getByLabel` and `getByText` are Playwright's recommended locators too.

### Auto-waiting and web-first assertions
- Actions (`click`, `fill`) **wait automatically** for the element to be visible, stable and enabled.
- `await expect(locator).toHaveText(...)` **retries** until it passes or times out.
- So you **never** need `sleep()`/`waitForTimeout()`, which is the classic cause of slow, flaky E2E tests.

```ts
await expect(page.getByRole('button', { name: 'Buy' })).toBeDisabled();
await expect(page).toHaveURL(/\/bank/);
await expect(page.getByRole('listitem')).toHaveCount(4);
```

## Fast-forwarding time: `page.clock`

Idle games are all about time passing. You can't wait 8 real hours in a test, but Playwright can **control the browser's clock** (`Date`, timers, `performance.now`):

```ts
test('shows offline progress after 8 hours away', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-06-01T09:00:00') });
  await page.goto('/skills');
  await page.getByRole('button', { name: 'Chop Oak Tree' }).click();

  await page.clock.fastForward('08:00:00');      // jump 8 hours forward
  await page.reload();                            // simulate coming back

  await expect(page.getByRole('dialog', { name: 'While you were away' })).toContainText(/Oak Log/);
});
```

This works because your engine measures time with timestamps (01.4, 13.4). A game that counted ticks would fail this test, which is exactly why the test is worth having.

## Two devices, one account

Each Playwright **browser context** is like a separate browser profile: separate cookies, storage and tabs. Two contexts simulate a player's phone and laptop:

```ts
test('progress syncs between devices', async ({ browser }) => {
  const phone = await browser.newContext({ ...devices['iPhone 15'] });
  const laptop = await browser.newContext();
  const p1 = await phone.newPage();
  const p2 = await laptop.newPage();

  await logIn(p1, testUser);
  await p1.getByRole('button', { name: 'Chop Oak Tree' }).click();
  await expect(p1.getByText(/Oak Log ×[1-9]/)).toBeVisible();
  await p1.getByRole('button', { name: 'Save now' }).click();

  await logIn(p2, testUser);
  await p2.goto('/bank');
  await expect(p2.getByText(/Oak Log ×[1-9]/)).toBeVisible();
});
```

That's the headline feature of your capstone, tested automatically. You'll write this test in milestone C09.

## Test data and isolation

- Each test should create its own data (a fresh user with a random email) or reset the database in a setup step. **Never depend on another test having run.**
- Log in via the API (`request.post('/api/login')`) in a setup step and reuse the stored auth state (Playwright's `storageState`), rather than clicking through the login UI in every test.

## When things fail

- `npx playwright test --ui`: watch tests step by step, with time-travel.
- `npx playwright show-trace trace.zip`: the **trace viewer** shows every action, DOM snapshot, network request and console log. It's the best debugging tool for E2E.
- `npx playwright codegen localhost:5173`: record interactions to generate test code (handy for finding locators).

### Flakiness checklist
- Using `waitForTimeout`? Replace it with a web-first assertion.
- Tests sharing data? Isolate them.
- Animations? Use `reducedMotion: 'reduce'` in `use`, or assert on the final state.
- Real time-dependent logic? Use `page.clock`.

## In CI

Run E2E in GitHub Actions on every PR (lesson 20.4), with `npx playwright install --with-deps` and `npx playwright test`, and upload the HTML report and traces as artifacts when something fails.

## Do it (in `vite-sandbox`)
- [ ] `npm init playwright@latest`, and configure `webServer` and `mobile` + `desktop` projects.
- [ ] Write a test that navigates between two routes using the tab bar on mobile.
- [ ] Put your 07-05 `ActionTimer` on a page and use `page.clock` to fast-forward through a cycle.
- [ ] Break the test on purpose and explore the trace viewer.

## Check your understanding

1. Why keep the number of E2E tests small?
2. Why should you never use `page.waitForTimeout(2000)`?
3. How do you test an 8-hour absence in a few seconds?
4. How do you simulate two devices for one player?

<details><summary>Answers</summary>

1. They're slow and more fragile, and they're expensive to maintain. Unit and integration tests cover most logic more cheaply, so E2E covers the critical journeys only.
2. It's slow (it always waits the full time) and still flaky (sometimes 2 s isn't enough). Web-first assertions wait exactly as long as needed.
3. Install Playwright's fake clock (`page.clock.install`) and `fastForward` the browser's time, then reload or continue.
4. Two separate browser contexts (each with its own cookies and storage), logged in as the same user.
</details>

## Further reading
- Playwright docs: https://playwright.dev ("Writing tests", "Locators", "Assertions", "Clock", "Trace viewer", "Authentication")

**🎉 That's Part 2 done.** Now build project P2.

---
[← Mocking the network & testing hooks](04-mocking-the-network.md) · [Module overview](README.md) · [Project P2 · Pocket Forge →](../projects/P2-pocket-forge.md)
