# Idle Game Academy

**A self-paced course that takes you from "I know some JavaScript" to shipping a full-stack, mobile-first idle game built with React and TypeScript, the stack used in most junior frontend job listings.**

You write every line of the game yourself. This repository teaches you how and checks your work as you go.

---

## Who this is for

You, if:

- you've finished a JavaScript course (like Boot.dev's) and part of a TypeScript one,
- you know little or no React,
- you want to be **job-ready as a React + TypeScript developer**, not just able to follow tutorials,
- you want to learn by understanding how things work, without AI writing your code.

## What you'll be able to do by the end

- Write strict, idiomatic **TypeScript** and explain how it works.
- Build **React** apps confidently: state, effects, context, reducers, custom hooks, performance, testing.
- Lay out **mobile-first** UIs with modern CSS and Tailwind that also work well on desktop.
- Design and build a **Node.js + Express REST API** backed by **PostgreSQL**.
- Implement **authentication** properly: password hashing, sessions, cookies, CSRF and CORS.
- Build **cloud saves** that sync between your phone and your laptop, with conflict handling and offline progress.
- **Deploy** it all with CI/CD, make it an installable **PWA**, and present it as a portfolio piece in interviews.

## What you'll build: the capstone

An original idle RPG in the spirit of games like Melvor Idle. You choose an action (chop trees, fish, mine ore, smelt, cook) and your character keeps doing it, earning XP and items, **even while the tab is closed**. Log in on your phone, pick up exactly where you left off on your laptop.

The full design is in [`capstone/GAME-DESIGN.md`](capstone/GAME-DESIGN.md). You'll build it **after** you've learned the fundamentals, across 12 milestones.

## The tech stack (and why)

| Layer | Choice | Why this one |
|---|---|---|
| Language | **TypeScript** (strict) | The industry default for serious frontend work |
| UI | **React 19** | Most in-demand frontend library by a wide margin |
| Build tool | **Vite** | Fast, simple, and the standard for new React apps |
| Styling | **CSS → Tailwind CSS** | Learn real CSS first, then the most common utility framework |
| State | **useState/useReducer → Zustand** | Built-in tools first, then a light store for a game that ticks many times per second |
| Testing | **Vitest, Testing Library, Playwright** | The modern standard testing stack |
| Backend | **Node.js + Express 5** | The most widely used Node framework, and the one you'll most likely meet at work |
| Database | **PostgreSQL + Drizzle ORM** | Real SQL, a TypeScript-first ORM, and JSONB for save files |
| Validation | **Zod** | One schema shared by the client and the server |
| Auth | **Session cookies you build yourself** | You'll understand auth instead of treating it as magic |
| Hosting | **Static host + Node host + managed Postgres** | A typical, cheap or free production setup |

---

## How the course works

```
Part 0  Orientation             ─┐
Part 1  Foundations               │  Learn: lessons + auto-graded exercises
Part 2  React                     │  + two mini-projects
Part 3  Game Programming          │
Part 4  Backend                   │
Part 5  Shipping to Production  ─┘
Part 6  Capstone: build your game   ← Apply: specs and acceptance criteria, no code given
Part 7  Career Ready                ← Get hired
```

Each **module** contains:

1. **Lessons** (`course/`): explanations, examples, common mistakes, and quick self-check questions.
2. **Exercises** (`exercises/`): starter code with failing tests. You make the tests pass. It works like Boot.dev, but in your own editor.
3. **Hints** (`exercises/<module>/HINTS.md`): three levels per exercise, so you can get unstuck without seeing the answer.
4. **Extra practice**: optional, open-ended challenges in each module README, for when you want more reps.
5. **Checkpoint quiz**: in each module README, to test yourself before you move on.

The full map is in **[SYLLABUS.md](SYLLABUS.md)**.

## Quick start

> Haven't set up Node, git or VS Code yet? Follow [lesson 00.2](course/00-start-here/02-set-up-your-machine.md) first.

```bash
git clone <this repo>
cd IdleGame
npm install
npm run check 00-01
```

Your first exercise *should* fail. Open `exercises/00-start-here/01-hello-course/exercise.ts` and follow the instructions at the top of the file.

## Commands you'll use every day

| Command | What it does |
|---|---|
| `npm run check 02-03` | Runs the tests for exercise 02-03 once |
| `npm run watch 02-03` | Re-runs them every time you save, which is the best way to work |
| `npm run check list` | Lists every exercise id |
| `npm run progress` | Runs all exercises, ticks the passing ones in `PROGRESS.md`, and shows your progress |
| `npm run typecheck` | Type-checks all exercises with `tsc` |

## Tracking your progress

- **[PROGRESS.md](PROGRESS.md)** is your tracker. You tick **lessons** and **projects** yourself. `npm run progress` ticks **exercises** automatically when their tests pass.
- **Commit `PROGRESS.md` regularly.** That gives you git practice and a history of your progress, and you can check it on GitHub from your phone.
- **[JOURNAL.md](JOURNAL.md)** is your learning log. Write two or three lines after each session. In interviews you'll be asked "tell me about a hard bug you fixed", and the journal is where those stories come from.

## When you get stuck

You will get stuck, and that's part of learning. Use these in order:

1. **[STUCK.md](STUCK.md)**: the step-by-step "I'm stuck" protocol, including how to debug.
2. **HINTS.md** for the exercise: three levels, from a nudge to a near-walkthrough.
3. **The AI tutor.** This repo includes a [`CLAUDE.md`](CLAUDE.md) that turns AI assistants into a *tutor*. They'll ask you questions, explain concepts and review your code, but they won't write your solutions. `STUCK.md` also has a prompt you can paste into any AI chat to get the same behaviour.
4. **`solutions/`**: reference solutions. Read them only *after* you've passed, to compare approaches, or as a last resort after following the stuck protocol.

## Time commitment

About **450–500 hours** in total. Some typical schedules:

| Pace | Hours/week | Duration |
|---|---|---|
| Full-time job hunt mode | 30–35 | ~4 months |
| Steady | 15–20 | ~7 months |
| Alongside a job | 8–10 | ~12 months |

Consistency matters more than intensity. An hour a day beats a seven-hour Sunday.

## Repository map

```
README.md        ← you are here
SYLLABUS.md      ← every module, lesson and exercise
PROGRESS.md      ← your tracker
STUCK.md         ← what to do when you're stuck
JOURNAL.md       ← your learning log
GLOSSARY.md      ← jargon decoder
CLAUDE.md        ← rules that make AI assistants act as tutors, not ghost-writers
course/          ← lessons, module by module
  projects/      ← mini-project specs (P1, P2)
exercises/       ← auto-graded exercises (you edit these)
solutions/       ← reference solutions (spoilers!)
capstone/        ← the game design, architecture guide and 12 milestone specs
scripts/         ← the check/progress tooling
```

## Ground rules

1. **Type the code yourself.** Don't copy and paste examples from lessons. Typing them out is how they stick.
2. **Make it work, then make it right.** Pass the tests first, then refactor and compare with the reference.
3. **Commit often**, with real commit messages. Your git history is part of your portfolio.
4. **Read the official docs** linked in each lesson. Reading documentation is a core job skill and you should practise it from day one.
5. **Don't skip the "boring" parts.** Most failed junior interviews trace back to CSS, HTTP or how `useEffect` works.

Good luck, and enjoy it.
