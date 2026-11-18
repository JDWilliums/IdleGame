# 00.1 · How this course works

> ⏱ 20 min · Module 00 · Start Here

## The big idea

Most tutorials teach you to *build one thing* by copying along. You finish with an app that works, and no idea how you'd build the next one. This course goes the other way:

1. **Learn the fundamentals properly**, in order, each one building on the last (Parts 0–5).
2. **Then build a real product from a spec**, with no code given to you, the same way work arrives at a job (Part 6, the capstone).
3. **Then learn how to get hired** and present what you built (Part 7).

The capstone is an idle game because it touches almost everything a React developer meets at work: complex state, timers, performance, forms, APIs, auth, data sync, mobile layout and deployment. It's also fun to play on your phone, and that helps you stay motivated.

## The pieces

### Lessons (`course/`)
Each lesson is a Markdown file. Read them in VS Code (press `Ctrl/Cmd + Shift + V` for a rendered preview) or on GitHub. A lesson contains:

- **Explanations** with code examples. **Type the examples out** in your playground (lesson 00.3). Don't just read them.
- **⚠️ Common mistakes**: the bugs everyone writes. If you learn them now, you'll recognise them when they happen to you.
- **🧠 Why it matters**: how the concept shows up at work and in your game.
- **Check your understanding**: short questions with hidden answers. Answer *before* you peek.
- **Further reading**: official docs. Reading them is part of the course, not an optional extra.

### Exercises (`exercises/`)
Exercises are **starter code plus tests**. The tests describe the required behaviour, and you write code until they pass.

```
exercises/
  07-state-and-effects/        ← one folder per module
    HINTS.md                   ← hints for every exercise in the module
    03-use-interval/           ← one folder per exercise (id 07-03)
      exercise.ts              ← YOU EDIT THIS. Instructions are at the top.
      exercise.test.ts         ← the tests. Read them, don't edit them.
```

The loop:

```bash
npm run watch 07-03     # tests re-run every time you save
# ...edit exercise.ts until everything is green...
npm run progress        # ticks it off in PROGRESS.md
git add -A && git commit -m "Complete exercise 07-03"
```

> **Read the test file.** Tests are a precise, executable spec. Working out what a test expects is a skill you'll use every day at work.

### Projects (`course/projects/`)
Two mini-projects (P1 at the end of HTML/CSS, P2 at the end of React) give you practice building something **from a spec without tests**. You check your own work against an acceptance checklist.

### The capstone (`capstone/`)
Twelve milestones, each written like a real ticket, with user stories, acceptance criteria and technical notes. You build the game in **your own new repository** with your own architecture decisions. The milestones tell you *what* to build and point you at the lessons that teach *how*. They never give you the code.

### Progress tracking
- [`PROGRESS.md`](../../PROGRESS.md): tick lessons and projects yourself. `npm run progress` ticks exercises.
- [`JOURNAL.md`](../../JOURNAL.md): a short learning log after each session.

### Support
- [`STUCK.md`](../../STUCK.md): the protocol for getting unstuck.
- `HINTS.md`: three hint levels per exercise.
- [`CLAUDE.md`](../../CLAUDE.md): turns AI coding assistants into tutors that won't write your code.
- `solutions/`: reference answers. Read them after you pass, to compare approaches.

## How to approach a module

1. Read the module's `README.md`: objectives, lessons, exercises.
2. For each lesson: read it, type out the examples, answer the check questions, tick it in `PROGRESS.md`.
3. Do the exercises when the module README says to. Usually that's after the lessons they depend on.
4. Take the **checkpoint quiz** in the module README. If you miss more than one question, revisit those lessons.
5. Optionally, do some **extra practice**.
6. Write a journal entry and commit.

## A word on the order

The order matters. Module 07 (state and effects) will feel like a wall if you skipped Module 01's closures lesson. The game engine in Module 13 is much easier once you know reducers (Module 08). If you feel the urge to jump ahead to "the fun part", that's normal, but you'll save time by not doing it.

The exception is Module 22 (career). Read lessons 22.4 and 22.5 when you start the capstone, so you can apply for jobs while you finish it.

## Check your understanding

1. Where do the instructions for an exercise live?
2. What's the difference between a project and an exercise?
3. Where will you build the capstone game?

<details><summary>Answers</summary>

1. In a comment at the top of the exercise file (`exercise.ts` or `exercise.tsx`). The test file is the precise spec.
2. Exercises have automated tests that check your work. Projects have a spec and an acceptance checklist that *you* check against, which is closer to real work.
3. In a new repository you create yourself (milestone C01), so it's a clean portfolio piece.
</details>

---
[Module overview](README.md) · [Next: Set up your machine →](02-set-up-your-machine.md)
