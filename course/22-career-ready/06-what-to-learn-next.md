# 22.6 · What to learn next

> ⏱ 1.5 hours · Module 22 · Career Ready

## What you'll learn
- Where to go deeper in the stack you know
- Which neighbouring skills employers ask for most
- When (and how much) to study algorithms and data structures
- Specialisations to consider
- How to keep learning without falling into "tutorial hell"

---

## You've covered a lot

You started with some JavaScript and half a TypeScript course. You've now built and deployed a full-stack, offline-capable, accessible, tested application with authentication and real-time-ish sync, and you understand why every part of it works the way it does. That's a solid junior foundation, and more depth than many juniors have.

What comes next depends on the job you get and what you enjoy. Here's a map.

## Go deeper in what you know

- **TypeScript**: advanced types (conditional, mapped, template literal types), declaration files, and typing a library's public API. The *Type Challenges* repository is great practice.
- **React**: React Server Components and a full-stack React framework (**Next.js**, or **React Router's framework mode**). Many companies use one. You'll find the concepts (data loading, routing, caching) familiar, with the rendering moved to the server.
- **Testing**: test design, contract testing, visual regression testing, and testing accessibility more deeply.
- **Performance**: profiling real apps, rendering strategies (SSR, SSG, streaming) and their trade-offs.
- **Your capstone**: keep improving it. Add a feature, refactor a weak part, write an ADR about it. A living project shows growth.

## Broaden: neighbouring skills employers ask for

| Skill | Why | Where to start |
|---|---|---|
| **A full-stack React framework** (Next.js) | the most common React job requirement | the official tutorial; rebuild a small part of your game with it |
| **Cloud basics** (AWS, GCP or Azure) | most companies run there | one provider's free tier: deploy a container, use object storage and a managed database |
| **Docker** in more depth | local dev environments and deploys (20.3) | containerise your capstone's API and database for local development |
| **GraphQL** | used by some teams instead of REST | build a small schema and client |
| **A second language** (Python, Go, C# or Java) | backend roles, and it makes you a better engineer | rewrite your save API in it |
| **React Native / Expo** | mobile apps with the React you know | port your game's UI to a native app |

You don't need all of these. Look at job ads for roles you want and learn what keeps coming up.

## Algorithms and data structures

Some companies (particularly larger tech companies and graduate schemes) use algorithm-style interviews. Many product companies don't. Check each company's process (22.5).

If you need them:

- **Big O** for time and space, and recognising it in code (you used it for batching, 13.5).
- **Core structures**: arrays, hash maps, sets, stacks, queues, linked lists, trees, graphs, heaps.
- **Common patterns**: two pointers, sliding window, recursion and backtracking, BFS/DFS, sorting and binary search, simple dynamic programming.
- Practise steadily: a problem or two a day for a few weeks beats cramming. Explain your solution out loud, as in an interview.

Even if your interviews don't need them, a working knowledge makes you a better engineer.

## Specialisations

After a year or two you'll notice what you enjoy most. Some directions this course touched on:

- **Frontend platform**: build tools, performance, design systems, developer experience.
- **Accessibility**: a growing specialism with real demand and real impact (21.4).
- **Game development on the web**: Canvas, WebGL, libraries like PixiJS or Phaser, and game engines more broadly. Your engine work (Module 13) is a real start.
- **Backend and data**: APIs, databases, distributed systems. Module 18 was a taste.
- **DevOps / platform engineering**: CI/CD, infrastructure, observability (Module 20).
- **Product engineering**: working closely with design and users to decide what to build, not just how.

## Staying current without drowning

The JavaScript world moves fast, but the fundamentals you've learned change slowly.

- **One or two newsletters** (JavaScript Weekly, React Status, Frontend Focus or similar) are enough to know what's happening.
- **Read release notes** for the tools you use: React, TypeScript, Vite, Node. They're short and authoritative.
- **Follow a few practitioners** who explain things well, rather than everyone with an opinion.
- **Ignore most hype.** When something new appears, ask: what problem does it solve, and do I have that problem?

## Escaping tutorial hell

Tutorials feel productive, but you only really learn by building, getting stuck and getting unstuck, which is how this whole course worked. Keep that habit:

- **Build things you want to exist**, slightly beyond your current skills.
- **Read code**: libraries you use, open-source apps, your teammates' PRs.
- **Write about what you learn**: a short blog post or a README explaining something you figured out. Teaching is the fastest way to find gaps in your understanding, and it helps your job search too.
- **Teach someone**: pair with a friend who's a few steps behind you.
- **Keep a learning journal**, just as you did in [`JOURNAL.md`](../../JOURNAL.md).

## From junior to mid-level

You'll know you're growing when you can increasingly:

- take a vague request and turn it into a clear plan, and ask the right questions;
- deliver features end to end without step-by-step guidance;
- review others' code usefully;
- make trade-offs and explain them;
- notice problems before they become incidents.

Every skill on that list is one you started practising in this course. Keep going.

## One last thing

When you started, you asked for a course that would get you ready for a job in React and TypeScript web development, and decided to build your idle game entirely yourself. If you're reading this having done that, you've earned real confidence. You didn't just follow along; you built it.

Good luck with the job hunt. Go and show people what you made.

## Check your understanding

1. Name two ways to go deeper in React and TypeScript.
2. How should you decide which neighbouring skill to learn first?
3. When are algorithm and data-structure skills most important for interviews?
4. What's "tutorial hell", and what's the cure?
5. Name three signs you're moving from junior towards mid-level.

<details><summary>Answers</summary>

1. Any two of: advanced TypeScript types; Server Components and a full-stack framework (Next.js or React Router's framework mode); deeper testing; performance and rendering strategies; continuing to improve the capstone.
2. Look at job ads for roles you want, and learn what keeps appearing.
3. For companies that use algorithm-style interviews (often larger tech companies and graduate schemes). Check each company's process.
4. Watching tutorial after tutorial without building on your own. The cure is building real things, getting stuck and getting unstuck, reading code, and writing or teaching what you learn.
5. Any three of: turning vague requests into clear plans; delivering features end to end independently; useful code reviews; making and explaining trade-offs; spotting problems early.
</details>

---
[← Interview preparation](05-interview-preparation.md) · [Module overview](README.md) · [Back to the course overview](../../README.md)
