# Part 6 · Capstone: build Hearthwild

**Time:** ~130 hours · **Prerequisites:** Parts 0–5 (you can start C01–C04 after Module 14, see the table below)

This is where everything comes together. You'll build **Hearthwild**, a mobile-first idle RPG with cloud saves that follow the player between devices, from an empty folder to a live URL you can put on your CV.

There's **no starter code and there are no tests to pass**. Instead you get what you'd get at work:

- a **[game design document](GAME-DESIGN.md)**: what to build, with the starting content and numbers;
- an **[architecture guide](ARCHITECTURE.md)**: how the pieces fit, and why;
- **twelve milestones**, each a set of **user stories with acceptance criteria**, like tickets in a sprint.

You decide the details, write the tests and make the trade-offs. That's the point: this is the step from "I can do exercises" to "I can build software".

---

## Ground rules

1. **Your own repository.** Milestone C01 has you create a new repository, `hearthwild` (or whatever you call your game), separate from this course. It's your portfolio piece, so make it public once you're happy with it.
2. **Copy `CLAUDE.md` into it.** It's the tutor-mode file from this repo. It tells AI assistants to teach you instead of writing your code. You chose to learn by doing everything yourself, and the capstone is where that choice pays off most.
3. **Work like you would at a job.** Turn each user story into a GitHub issue, do it on a branch, open a pull request, let CI run, review your own diff (22.2), then merge. Your Git history becomes evidence of how you work.
4. **Definition of done** (applies to every milestone):
   - [ ] every acceptance criterion is met;
   - [ ] the logic has tests, and CI is green;
   - [ ] it works on a phone-sized screen **and** on desktop;
   - [ ] it's usable with a keyboard (21.4);
   - [ ] no `any`, no ignored type errors, no lint warnings;
   - [ ] the README is updated (how to run it, what's new);
   - [ ] it's merged to `main` (and, from C12, deployed).
5. **Tick it off.** When a milestone is done, tick its line in this course's [`PROGRESS.md`](../PROGRESS.md) and write a line in [`JOURNAL.md`](../JOURNAL.md): what was hard, what you'd do differently.

## The milestones

| # | Milestone | Main lessons | ~Hours | You can start after |
|---|---|---|---|---|
| C01 | [Repo, monorepo & CI](milestones/C01-project-setup.md) | 05, 19.1, 19.3, 20.4 | 8 | Module 14 (+ skim 19.1, 20.4) |
| C02 | [Game data & engine core](milestones/C02-engine-core.md) | 13.1–13.7 | 14 | Module 14 |
| C03 | [App shell & navigation](milestones/C03-app-shell.md) | 06–11, 14.1–14.2 | 8 | Module 14 |
| C04 | [Skills UI & live progress](milestones/C04-skills-ui.md) | 14.2–14.3, 21.4 | 10 | Module 14 |
| C05 | [Bank & items](milestones/C05-bank-and-items.md) | 08, 09, 13.9 | 10 | Module 14 |
| C06 | [Processing skills](milestones/C06-processing-skills.md) | 13.2, 13.5 | 10 | Module 14 |
| C07 | [Local saves, offline progress & migrations](milestones/C07-local-saves-and-offline.md) | 13.8, 13.10, 14.4, 18.2 | 12 | Module 14 |
| C08 | [API, database & accounts](milestones/C08-api-db-and-accounts.md) | 15, 16, 17, 19.4 | 14 | Module 17 |
| C09 | [Cloud saves & cross-device sync](milestones/C09-cloud-sync.md) | 18 | 14 | Module 18 |
| C10 | [Shop, equipment & economy](milestones/C10-shop-and-equipment.md) | 13.2, 13.9, 08 | 10 | C06 |
| C11 | [Combat](milestones/C11-combat.md) | 13.5, 13.7, 13.8 | 12 | C10 |
| C12 | [PWA, polish & launch](milestones/C12-launch.md) | 20, 21 | 8 | Modules 20–21 |

**Two ways to schedule it:**

- **In order, after Part 5.** The simplest, and everything you need has been taught.
- **Overlapping** (recommended if you're job-hunting): start C01–C07 straight after Module 14, while you study Modules 15–18 in parallel. The frontend-only game you'll have by C07 is already a good portfolio piece. Then add the backend (C08–C09) as you finish Part 4. C10 and C11 can come before or after C08–C09.

## Scope: protect the finish line

A finished, polished small game beats an ambitious half-built one, every time, for players and for employers. Each milestone has **stretch goals**: they're optional. Do them only once the main criteria are done, or come back to them after launch.

If you fall behind, cut scope, not quality: fewer actions per skill, combat with two monsters instead of ten. Never cut tests, accessibility or the save system.

## When you're stuck

1. Re-read the lessons listed in the milestone. The answer is usually there.
2. Follow the protocol in [`STUCK.md`](../STUCK.md): shrink the problem, reproduce it, read the error.
3. Ask an AI assistant **in tutor mode** (that's what `CLAUDE.md` is for) for a hint, a concept explanation or a review of code you've written. Not for the code itself.
4. Ask a community (listed in `STUCK.md`). Show what you tried.
5. Write it in your journal, even if you solved it. That's interview material ("tell me about a hard bug").

## Showing it off

By the end you'll have a live game, a public repo with a clean history, CI, tests, ADRs and a README with screenshots. Module 22.4 shows you how to turn it into a portfolio case study, and 22.5 how to talk about it in interviews.

Let's build it. → **[C01 · Repo, monorepo & CI](milestones/C01-project-setup.md)**
