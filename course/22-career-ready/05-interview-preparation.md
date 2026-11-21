# 22.5 · Interview preparation

> ⏱ 3 hours (plus practice) · Module 22 · Career Ready

## What you'll learn
- The stages of a typical junior developer interview process
- The fundamentals questions you should be able to answer, with the lessons that cover them
- Live coding: how to think out loud, and the tasks that come up most
- Talking about your project in depth
- Behavioural questions and the STAR method
- **A mock interview format** to practise with a friend or an AI tutor

---

## The process

Processes vary, but most junior roles combine several of these:

| Stage | What happens | How to prepare |
|---|---|---|
| **Recruiter screen** (20–30 min) | your background, why this role, salary expectations, logistics | a two-minute "about me"; know why you want *this* job |
| **Technical screen** (45–60 min) | fundamentals questions and/or a small coding task | this lesson's question bank; practise coding out loud |
| **Take-home** (a few hours) | build a small feature or app | treat it like a capstone milestone: tests, README, clean commits |
| **Live coding / pairing** (60–90 min) | build or fix something with an interviewer watching | the tasks below; think out loud |
| **Project deep dive** | walk through something you built | your case study (22.4), especially the hardest problem |
| **System design (lite)** | "how would you design…?" at a high level | the architecture of your own capstone is the perfect example |
| **Behavioural** | how you work, learn and handle problems | STAR stories (below) |

Ask the recruiter what the stages are and what each assesses. It's a normal question, and the answer tells you exactly what to prepare.

## Fundamentals: the question bank

You should be able to explain each of these clearly in a minute or two, with a small example. The lesson in brackets is where it's covered. Go back to it if you're unsure.

**JavaScript and TypeScript**
- What is a closure? Give a practical use. (01.2)
- Explain the event loop: the call stack, microtasks and macrotasks. What does this print? (01.4)
- `==` vs `===`; `null` vs `undefined`; `let`/`const`/`var`. (01.1)
- Promises vs `async`/`await`; `Promise.all` vs `Promise.allSettled`; handling errors. (01.4, 01.5)
- `type` vs `interface`; `unknown` vs `any`; what generics are for; narrowing; discriminated unions. (02.2–02.5)
- Why validate data at runtime when you have TypeScript? (02.7)

**React**
- What triggers a re-render? What does React do when state changes? (06.6)
- Why do lists need keys? What goes wrong with index keys? (06.4)
- What is an effect for? When should you *not* use one? (07.4, 07.5)
- Why can a timer callback see stale state, and how do you fix it? (07.6)
- `useState` vs `useReducer` vs context vs an external store: when would you use each? (08)
- How would you find and fix a slow component? (09.5, 14.3)
- How do you make a modal accessible? (09-03, 21.4)

**The web**
- What happens when you type a URL and press Enter? (03.1)
- HTTP methods, status codes, idempotency. (03.2)
- What is CORS, and what doesn't it protect against? (03.4, 17.6)
- Cookies vs `localStorage` for a session token. `HttpOnly`, `Secure`, `SameSite`. (17.3, 17.4)
- What are XSS and CSRF, and how do you prevent them? (17.6)
- Core Web Vitals; what is a service worker? (21.1, 21.3)

**Backend and data**
- Design a REST API for… (15.4)
- How should passwords be stored? Sessions vs JWTs? (17.2, 17.3)
- What's a SQL join? An index? A transaction? (16.3, 16.4)
- Two users update the same record at once. What can go wrong, and how do you prevent it? (16.4, 18.3)

**Testing**
- What do you unit test vs integration test vs end-to-end test? Why? (12.1)
- Why prefer `getByRole` over test ids? (12.3)

## Live coding

### How to do it
1. **Clarify** before coding: inputs, outputs, edge cases, what "done" looks like. "Should the search be case-insensitive?" is a good sign, not a weakness.
2. **Say your plan** in a sentence or two before typing.
3. **Start simple and working**, then improve. A working simple version beats an unfinished clever one.
4. **Think out loud.** Silence is the biggest mistake candidates make. The interviewer is assessing your thinking and can only help if they can hear it.
5. **Test as you go**: run it, try the edge cases, say what you're checking.
6. **When stuck**, say what you're considering: "I think the problem is the stale value in the interval. I'd reach for a ref." Interviewers often give hints, and taking them well is a skill.
7. **Finish with improvements**: "With more time I'd add tests for…, extract…, handle…"

### Tasks that come up a lot
- A **component** with state and events: an accordion, tabs, a star rating, a counter with limits, a form with validation.
- **Fetch and display** data with loading, error and empty states, possibly with search and pagination. (03-02, 10-02)
- A **debounced search** box (and why debouncing helps). Implement `debounce` or `throttle` from scratch.
- A **timer or stopwatch** in React, without stale closures. (07-05)
- **Data transformation**: grouping, sorting, counting with `reduce`, `Map` and `Set`. (01-03)
- **Fix a bug** in provided code, which is exactly what exercise 07-01 practised.
- A small **custom hook** (`useLocalStorage`, `useInterval`). (07.7, exercises 07-03 and 07-04)

Practise these with a timer, out loud, without autocomplete. Recording yourself is uncomfortable and very effective.

## Talking about your project

Interviewers love a real project, because it's where they see how you think. Prepare:

- **The two-minute tour**: what it is, the architecture in one breath, and one thing you're proud of.
- **The hardest problem** (from your case study): what went wrong, how you investigated, the options you considered, why you chose what you did, how you tested it. For Hearthwild, the sync conflict story is ideal.
- **Trade-offs**: "Why Zustand rather than context?", "Why sessions rather than JWTs?", "Why not run the game on the server?". Your ADRs are your revision notes.
- **What you'd change**: be honest. Self-awareness impresses far more than pretending it's perfect.

Expect follow-ups that go a level deeper than you planned ("what happens if the PUT succeeds but the response never arrives?"). The best answer combines what you know with honest reasoning about what you'd check.

## Behavioural questions: STAR

Answer with a story: **Situation** (brief context), **Task** (what you needed to do), **Action** (what *you* did, the biggest part), **Result** (what happened, and what you learned).

Prepare five or six stories that can cover most questions:

| Question | A story from this course could be… |
|---|---|
| A difficult bug you solved | a sync, timing or stale-closure bug from your capstone |
| Learning something new quickly | picking up SQL or auth from scratch for C08 |
| A mistake you made | something that broke, how you found it, what you changed (a postmortem, 20.5) |
| Handling feedback | a code review that changed your approach |
| A disagreement or a trade-off | a design choice where you weighed options (an ADR) |
| Working with others | uni group work, a part-time job, open-source contributions |

Keep each to about two minutes, focus on your own actions, and end with the result and the lesson.

## Questions to ask them

Always have a few. Good ones also help you decide whether you want the job:

- "What does a typical week look like for a junior on this team?"
- "How do code reviews work here? How long does a PR usually take to merge?"
- "What would success look like in my first three months?"
- "How does the team support learning: pairing, mentoring, time for courses?"
- "What's the biggest technical challenge the team is facing?"

## The mock interview format

Practise with a friend, a mentor or an AI assistant. The format works for all three. Run a full one at least three times before real interviews, and once a week while you're applying.

**45–60 minutes:**

| Part | Time | Content |
|---|---|---|
| 1. Intro | 3 min | "Tell me about yourself." The candidate gives their two-minute pitch |
| 2. Fundamentals | 12 min | 5 questions from the bank above, getting harder, with a follow-up on each answer |
| 3. Live coding | 20 min | one task from the list above. The interviewer gives a short spec, answers clarifying questions, and only hints when the candidate is stuck for a couple of minutes |
| 4. Project deep dive | 10 min | "Walk me through your capstone." Then two or three "why…?" and "what if…?" follow-ups |
| 5. Behavioural | 5 min | one or two questions, answered with STAR |
| 6. Candidate's questions | 2 min | the candidate asks the interviewer something |
| 7. Feedback | 5–10 min | scored against the rubric below, with one strength and one thing to work on for each row |

**Rubric** (1 = not yet, 2 = getting there, 3 = solid junior, 4 = strong):

| Area | What a "3" looks like |
|---|---|
| Communication | thinks out loud, clarifies requirements, explains clearly without rambling |
| Problem solving | breaks the problem down, starts simple, handles edge cases, uses hints well |
| Code quality | readable names, sensible structure, types used properly |
| Fundamentals | accurate explanations of JS/TS, React and web concepts, with examples |
| Testing mindset | checks the work, names edge cases, knows what tests they'd write |
| Project knowledge | explains architecture and trade-offs, honest about weaknesses |

### Using an AI assistant as the interviewer
Paste this into a chat with an AI assistant (it fits the tutor rules in [`CLAUDE.md`](../../CLAUDE.md)):

```
Run a mock technical interview for a junior React/TypeScript developer role, using the format
and rubric from lesson 22.5 of my course (intro, 5 fundamentals questions with follow-ups,
a 20-minute live-coding task, a project deep dive on my idle game Hearthwild, a behavioural
question, then scored feedback against the rubric).

Rules: act as the interviewer. Ask one question at a time and wait for my answer. During the
coding task, don't write the solution for me; only give a hint if I ask or I'm clearly stuck,
and keep hints small. Be realistic, not overly kind. At the end, score each rubric area 1–4
with one strength and one specific thing to improve, and suggest which course lessons to revisit.
```

Do the coding part in your own editor and paste your code in when you're done, or share your screen with a human interviewer.

## Check your understanding

1. What should you ask a recruiter at the start of the process?
2. List the steps of a good live-coding approach.
3. What's the biggest mistake candidates make in live coding?
4. What does STAR stand for, and which part should be longest?
5. Which story from your capstone would you use for "tell me about a hard bug"? Outline it in STAR form.

<details><summary>Answers</summary>

1. What the interview stages are and what each one assesses.
2. Clarify the requirements, state a plan, build a simple working version, think out loud throughout, test as you go, talk through it when stuck, and finish with improvements you'd make.
3. Silence. The interviewer can't assess, or help with, thinking they can't hear.
4. Situation, Task, Action, Result. The Action (what you did) should be the longest.
5. Your own answer, e.g. a sync bug: the Situation (two devices overwrote each other in testing), the Task (find out why and prevent it), the Action (reproduced it with two browser contexts, found the revision check was in JavaScript, not the SQL `WHERE`, moved it into one atomic statement, added a Playwright test), and the Result (no lost updates, plus a lesson about check-then-act races).
</details>

## Further reading
- "Cracking the Coding Interview" for the algorithm-heavy interviews some companies still run (and 22.6 for when to study them)
- Frontend-focused interview practice sites (several offer free React and JavaScript exercises)
- Your university careers service: mock interviews with real feedback

---
[← Portfolio, CV & GitHub](04-portfolio-cv-and-github.md) · [Module overview](README.md) · [Next: What to learn next →](06-what-to-learn-next.md)
