# 22.4 · Portfolio, CV & GitHub

> ⏱ 3 hours · Module 22 · Career Ready

## What you'll learn
- What hiring teams actually look for in a junior React/TypeScript developer
- Turning Hearthwild into a portfolio case study
- A README and GitHub profile that make a good first impression
- Writing a CV that gets past the first ten seconds
- Running a job search: where to look, how many to apply for, and handling rejection

---

> Read this lesson when you **start** the capstone, not when you finish (00.1). Applications take time to turn into interviews, so start early.

## What hiring teams look for

For a junior role, nobody expects deep experience. They're looking for evidence that you can:

1. **Build real things** with the stack they use (React, TypeScript, an API).
2. **Learn** and work through problems on your own.
3. **Write code others can work with**: readable, tested, consistent.
4. **Communicate**: explain what you built, what was hard and why you made your choices.
5. **Care about the user**: accessibility, mobile, performance, details.

Your capstone shows all five, *if you present it well*. Most junior portfolios are tutorial clones (a weather app, a to-do list). A deployed, tested, accessible idle game with offline play and cross-device sync stands out, as long as a busy reviewer can see that in two minutes.

## The portfolio

Quality beats quantity. You need:

- **One flagship project**: Hearthwild, with a live link, the code and a case study.
- **One or two smaller projects** that show range: P2 (Pocket Forge), or a small tool you built for yourself.
- A simple **personal site** (optional, but nice): a short "about", your projects and links. It can be a single page you built, accessible and fast, which is itself a demonstration.

### The case study
A case study is a short write-up (a page in your README, a `CASE_STUDY.md` or your site) telling the story behind the code. Reviewers read it to judge your thinking.

```markdown
# Hearthwild: a mobile-first idle RPG with cross-device cloud saves

**Live:** hearthwild.example · **Code:** github.com/you/hearthwild · **Stack:** React 19, TypeScript, Zustand,
Express 5, PostgreSQL (Drizzle), Vitest, Playwright · **Time:** ~130 hours

## The problem
Idle games are played in short sessions on whichever device is nearby. I wanted progress
to carry on offline and follow the player between phone and laptop, without ever losing it.

## Architecture
[diagram] A pure TypeScript engine (no React, no timers) runs in the browser; React renders it through
selectors; an Express API stores saves with revision numbers in Postgres.

## The hardest problem: two devices, one save
[The lost-update story, optimistic concurrency, the four sync situations, the conflict dialog,
and why I didn't merge saves automatically.] [GIF of two devices]

## Other decisions
- Fixed-timestep loop with O(1) batched ticks, so 12 hours offline computes instantly
- Sessions in HttpOnly cookies, not JWTs (and why)
- Plausibility checks keep the leaderboard honest without a server-side simulation

## Quality (use your real numbers)
- 300+ tests: engine (95% coverage), API (supertest + PGlite), components, Playwright
  (including a two-device sync test); CI on every PR
- Lighthouse 95+ on mobile; WCAG 2.2 AA, tested with VoiceOver and a keyboard

## What I'd do next
[Two or three honest improvements.]
```

The "hardest problem" section is the most important. It's what you'll talk about in interviews (22.5).

### The README
The project's front page. At the top: what it is (one sentence), a **live link**, a **GIF**, then the stack, features, how to run it, how to test it, the architecture and a link to the ADRs. Someone should know what the project is and see it working without scrolling.

### GitHub
- **Pin** your best repositories, with descriptions and topics.
- A short **profile README**: who you are, what you're looking for, what you're learning.
- Clean commit history in your main projects (meaningful messages, PRs with descriptions). Reviewers do look.
- Don't worry about the contribution graph. Nobody serious judges you on green squares.

## The CV

Reviewers often spend under a minute on a first pass, so make the important things easy to find.

- **One page** (two at most), in a simple layout: a single column, standard fonts, no tables or graphics. Many companies use applicant-tracking systems that parse your CV as text.
- **Order**: name and links (email, GitHub, portfolio, LinkedIn); a two-line summary; **projects** (for career starters, these come before work history); skills; education; work experience (any job counts: it shows reliability, teamwork and communication).
- **No photo, date of birth or marital status** (standard in the UK and many other countries).
- **Tailor it**: reorder skills and project bullets to match each job's description. Use their words where they're true for you.

### Writing bullets
A useful formula: **what you built + how (the technology) + the result or why it matters.**

```
✗ Made an idle game with React.

✓ Built Hearthwild, a mobile-first idle RPG (React 19, TypeScript, Zustand) with offline
  progress and cross-device cloud saves; deployed with CI and 300+ automated tests.
✓ Designed optimistic-concurrency sync (PostgreSQL revisions, Express 5 API) so progress
  from two devices is never silently overwritten; covered by a two-device Playwright test.
✓ Achieved Lighthouse 95+ on mobile and WCAG 2.2 AA (keyboard and screen-reader tested).
```

Numbers help, but only true ones. Everything on your CV is fair game for an interview question, so only include what you can talk about in depth.

### Skills section
Group them, and be honest: "**Languages**: TypeScript, JavaScript, SQL, HTML, CSS · **Frontend**: React, Vite, Tailwind, TanStack Query, Zustand · **Backend**: Node.js, Express, PostgreSQL, Drizzle · **Testing**: Vitest, Testing Library, Playwright · **Tools**: Git, GitHub Actions, Docker (basic)". No skill ratings out of five or progress bars.

### Cover letters
Short, three paragraphs: why this company (be specific: their product, their tech blog, their mission), what you'd bring (one or two relevant highlights with links), and a polite close. Some applications don't need one. Never send a generic one.

## The job search

### Where to look
- **Company career pages**, for companies whose products you like. Often the best route, and less crowded.
- **LinkedIn Jobs** and **Indeed**.
- Startup-focused boards (such as Welcome to the Jungle and Wellfound) and the monthly "Who is hiring?" thread on Hacker News.
- **Graduate schemes**. Many larger UK employers run them, and graduate job sites (Bright Network, Gradcracker, Prospects, TARGETjobs) list them, often with deadlines in the autumn.
- **Local tech meetups** (Meetup.com, community Slack and Discord groups). Many jobs are filled through people who've met you.

Job boards change, so look for what's active in your area.

### Volume and tracking
The junior market is competitive. Expect to apply to **many** jobs: dozens, sometimes more. That's normal and not a judgement of you. Track applications in a spreadsheet: company, role, date, link, status, contact, next step. Follow up politely after a week or two.

### Referrals and networking
A referral from someone inside a company is one of the most effective ways to get an interview. You build that network by being around: going to meetups, contributing to open source, writing about what you learn, and staying in touch with your university's alumni. Ask people about their work, not for a job, and the rest often follows.

### Rejection
You'll be rejected far more often than not, frequently with no feedback, sometimes after interviews that felt great. Everyone is, including people who are now senior engineers. Keep applying, keep building, and ask for feedback when you can. Each interview makes the next one easier.

## Practice
- Write your Hearthwild case study (even before the game is finished: it'll change).
- Write your CV using the formula above, then ask two people to give it a ten-second look and tell you what they remember.
- Make a list of 20 companies you'd like to work for, and find out who among your contacts, or their contacts, works at or near them.

## Check your understanding

1. What five things are hiring teams looking for in a junior?
2. Which section of the case study matters most, and why?
3. Why use a simple, single-column CV layout?
4. Rewrite "Worked on the backend" as a strong bullet for your capstone.
5. Why track your applications?

<details><summary>Answers</summary>

1. Building real things with their stack, learning independently, writing maintainable code, communicating, and caring about users.
2. The hardest problem. It shows how you think, and it's what interviewers will ask about.
3. Applicant-tracking systems parse CVs as text, and humans skim. Fancy layouts break both.
4. For example: "Built an Express 5 + PostgreSQL API with session auth (scrypt, HttpOnly cookies), rate limiting and optimistic-concurrency cloud saves; tested with supertest and PGlite."
5. To follow up at the right time, prepare for each company's next step, spot patterns (which applications get responses), and keep going methodically.
</details>

## Further reading
- "The Tech Resume Inside Out" by Gergely Orosz
- Your university's careers service: CV reviews and mock interviews are usually free for graduates

---
[← AI tools at work](03-ai-tools-at-work.md) · [Module overview](README.md) · [Next: Interview preparation →](05-interview-preparation.md)
