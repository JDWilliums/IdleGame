# C12 · PWA, polish & launch

> ⏱ ~8 hours (plus fixes) · Lessons: 20.1–20.5, 21.1–21.4, 22.4 · Before you start: finish Modules 20 and 21

## Why
A game nobody can play doesn't count. This milestone puts Hearthwild on the internet, installable on phones, fast, accessible and monitored, and packages it as the centrepiece of your portfolio.

## User stories

### US-1 · Live
*As anyone with the link, I want to play Hearthwild.*

**Acceptance criteria**
- [ ] Deployed using a layout from 20.2, with an ADR explaining the choice.
- [ ] Every item on the **production-readiness checklist in 20.1** is ticked, including restoring a database backup once to prove it works.
- [ ] Auto-deploy from `main` after CI passes. You know where the rollback button is.
- [ ] Production config validated by `loadConfig`. No secrets in the repo or the bundle.

### US-2 · Installable and offline
*As a phone player, I want Hearthwild on my home screen, working without signal.*

**Acceptance criteria**
- [ ] A manifest with name, icons (including maskable), theme colour and `display: standalone` (21.1).
- [ ] A service worker (vite-plugin-pwa) precaching the app shell, with **no** API caching, and an "Update available" prompt that saves locally before reloading.
- [ ] Installs on Android (Chrome) and iOS (Safari: Add to Home Screen). A one-time hint explains the iOS steps.
- [ ] In airplane mode, the installed app opens and plays. Sync resumes when the network returns.

### US-3 · Feels right on a phone
*As a phone player, I want it to feel like an app.*

**Acceptance criteria**
- [ ] Tested on at least one real Android phone and one real iPhone (21.2), with notes in the README.
- [ ] Safe areas, `dvh`, 44 px targets, no zoom on input focus, no accidental pull-to-refresh, no hover-only information.

### US-4 · Fast
*As a player on a mid-range phone, I want the game to load and respond quickly.*

**Acceptance criteria**
- [ ] Lighthouse (mobile) performance score ≥ 90 on the main screen, with results in the README.
- [ ] Field Web Vitals reported with `web-vitals` to the API, with LCP, INP and CLS within "good" at the 75th percentile across your test sessions.
- [ ] Initial JavaScript within the budget in ARCHITECTURE §8. Non-essential routes lazy-loaded.
- [ ] No long tasks during normal play (a Performance recording on a throttled CPU).

### US-5 · Accessible
*As a player using a keyboard or screen reader, I want to play the whole game.*

**Acceptance criteria**
- [ ] axe (Playwright) reports no violations on every main screen, in CI.
- [ ] A keyboard-only playthrough of the core loop (gather, process, sell, buy, fight, handle a conflict) with notes.
- [ ] A screen-reader playthrough (VoiceOver, NVDA or TalkBack) of the core loop, with notes and fixes.
- [ ] Announcement settings work (off / milestones only / more).

### US-6 · Observable
*As the developer, I want to know when something breaks before players tell me.*

**Acceptance criteria**
- [ ] Structured logs with request ids, and nothing sensitive in them (20.5).
- [ ] Error tracking in the browser and on the server, with source maps uploaded (not served), tagged with the release.
- [ ] An uptime monitor on `/api/health` that alerts you.

### US-7 · Ready to show
*As a hiring manager, I want to understand what you built in two minutes.*

**Acceptance criteria**
- [ ] The README: a live link, a GIF of play and the two-device sync clip (C09), features, stack, an architecture diagram, how to run it, test commands and a link to the ADRs.
- [ ] A privacy note in the game (what's stored, how to delete it).
- [ ] A `v1.0.0` tag and a GitHub release with a changelog.
- [ ] A case study written using the guide in 22.4.
- [ ] At least three people other than you have played it, and you've fixed what they found (as GitHub issues).

## Hints (directions, not code)
- Deploy **early** in this milestone, even before the polish, so production problems surface while you still have time.
- Lighthouse on your laptop lies (it's fast). Use the mobile preset with throttling, and trust the field data more.
- Ask testers to try installing it, playing offline and using two devices. Those are the things that break in ways you can't see at your desk.

## Lessons to revisit
20.1 (the checklist) · 20.3 · 20.5 · 21.1–21.4 · 22.4

## Stretch goals
- Opt-in push notifications ("Your bank is full") via the Push API (21.1).
- A custom domain (Layout B), with first load served from a CDN.
- Post-launch: pick one idea from your `IDEAS.md`, write the milestone for it yourself (user stories and acceptance criteria), and build it. That's exactly the job of a product engineer.

## You did it
Tick C12 in [`PROGRESS.md`](../../PROGRESS.md), write the final entry in your journal, and then go to **[Module 22 · Career Ready](../../course/22-career-ready/README.md)**. You now have something genuinely impressive to talk about.

---
[← C11](C11-combat.md) · [Capstone overview](../README.md)
