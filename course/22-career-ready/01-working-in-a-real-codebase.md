# 22.1 · Working in a real codebase

> ⏱ 2.5 hours · Module 22 · Career Ready

## What you'll learn
- What your first weeks in a job actually look like
- How to find your way around a large, unfamiliar codebase
- Asking good questions, and when to ask them
- From ticket to merged change: scoping, estimating, shipping small
- Working with code you didn't write (and don't like)
- Communicating: standups, updates and writing things down

---

## The first weeks

Nobody expects a junior to be productive on day one. A typical first month:

- **Week 1**: laptop setup, accounts, getting the app running locally (often the hardest task of the week), meeting the team, reading docs, and a "good first ticket" such as a copy change or a small bug.
- **Weeks 2–4**: small tickets in one area, pairing with a teammate, your first code reviews (in both directions), learning the deploy process.
- **Months 2–3**: owning small features end to end.

The best thing you can do early is **write things down**: setup steps that weren't documented, what each service does, who knows what. Then turn those notes into improvements to the onboarding docs. That's a valuable first contribution that nobody else is well placed to make.

## Reading a codebase you didn't write

You've practised this throughout the course: every exercise came with provided code to read. At work it's the same skill at scale.

1. **Run it first.** Click around the app with the code open beside you.
2. **Find the entry points**: `main.tsx`, the router, the server's `index.ts` and its route registration. Follow one user action end to end: a button, its handler, the API call, the route, the service, the query.
3. **Read the tests.** They're executable documentation of what code is *supposed* to do.
4. **Search, don't scroll.** Search the codebase for the text on a button, an error message or an API path, and it'll lead you to the code.
5. **Use Git as a history book.** `git log -p path/to/file` shows how a file evolved. `git blame` (or your editor's inline blame) shows the commit and pull request behind a line, and the PR description often says *why*.
6. **Draw it.** A quick sketch of the main modules and arrows beats holding it all in your head.

Don't try to understand everything. Understand the path your ticket touches, and a little around it.

## Asking good questions

Juniors either ask too soon (before trying anything) or far too late (after two days stuck in silence). A good rule: **struggle for 15–30 minutes, then ask.** Your time and the team's time both matter, and a two-minute answer that saves you a day is a good trade for everyone.

A good question includes:

```
I'm working on TICKET-123 (show the item value in the bank).
I'm trying to find where bank items get their prices.
I've looked at features/bank/ and the items data in packages/engine, and searched for "sellPrice".
I can see the price on the item, but the bank shows a different number. I think something applies a modifier?
Could you point me to where that happens?
```

That's context, the goal, what you tried, what you expected versus what you saw, and a specific ask. It's the same structure as `STUCK.md`, and it often answers itself while you write it.

Ask in public channels when you can, not in private messages. Others learn from the answer, and it shows you're engaged.

## From ticket to merged change

1. **Understand the ticket.** Who is it for? What does "done" look like? If the acceptance criteria are vague, ask before building. Your capstone milestones were practice for exactly this.
2. **Find the smallest change that delivers it.** Resist fixing everything nearby. Note other problems for separate tickets.
3. **Estimate honestly.** "I think about a day. I'll know more by lunchtime." Then actually say something at lunchtime. Estimates are wrong, and surprises are the only real problem.
4. **Work in small steps**: a branch, small commits, tests alongside the code.
5. **Open a pull request early** (as a draft) if you want feedback on the direction (22.2).
6. **After merging**, check it in the deployed environment. It's yours until it works for users.

## Code you didn't write (and don't like)

Every real codebase has old code, inconsistent patterns and the occasional horror. Some rules that help:

- **It made sense to someone, once.** Deadlines, missing knowledge or a different stage of the product explain most strange code. Assume good intent, and check `git blame` before judging.
- **Follow the existing patterns**, even ones you'd do differently. Consistency beats your preference. Propose changes to patterns separately, with reasons.
- **Leave it slightly better** (the boy scout rule): a clearer name, a missing test, a comment explaining a trap. But small, and in the area you're working in. Not a rewrite smuggled into a bug fix.
- **Before changing code without tests, add tests that pin its current behaviour** (characterisation tests). Then change it.

## Communicating

- **Standups**: what you did, what you're doing, what's blocking you. Keep it short. "Blocked" is a useful word. Use it.
- **Written updates**: on long tasks, post a short status where the team can see it ("The sync bug is reproducible; it's the revision check; fix in review tomorrow").
- **Say when you've made a mistake**, quickly. Everyone breaks things. Hiding it is what turns a small problem into a serious one.
- **Write it down**: decisions in ADRs (19.3), gotchas in the README, answers in the docs. Your future self and the next junior will thank you.

### About feeling lost
Almost every new developer feels like everyone else understands more than they do. It's normal, and it passes. Asking questions, writing things down and shipping small things is how it passes. And you'll find that the experienced people around you are also searching for things, also reading error messages carefully, and also saying "I don't know, let me look".

## Practice
Pick an open-source React app you use or like (an open-source note app, a dashboard or a design-system docs site). Clone it, get it running, and trace one feature from the button to wherever its data comes from. Write a one-page "how this feature works" note. That's exactly the task your first week will set you, and it makes a nice blog post too.

## Check your understanding

1. What's a valuable thing a new joiner can contribute in their first week?
2. List four techniques for finding your way around an unfamiliar codebase.
3. What makes a good question? How long should you struggle before asking?
4. You notice messy code next to your bug fix. What do you do?
5. Why is "saying when you've made a mistake, quickly" important?

<details><summary>Answers</summary>

1. Improving the onboarding and setup docs based on what they just went through.
2. Any four of: run the app and follow one user action end to end; read the tests; search for visible text, errors or paths; use `git log`/`git blame` and PR descriptions; sketch the architecture.
3. Context, the goal, what you tried, expected versus actual behaviour, and a specific ask. Try for 15–30 minutes first, then ask, in a public channel if possible.
4. Fix it only if it's small and directly helpful, or note it for a separate ticket. Don't turn the bug fix into a refactor, and add tests before changing untested code.
5. Problems are cheapest to fix early, and teams can only fix what they know about. Hidden mistakes grow.
</details>

## Further reading
- "The Missing README" by Chris Riccomini and Dmitriy Ryaboy: a whole book on your first years as a software engineer
- "How to ask good questions" (Julia Evans, jvns.ca)

---
[← Module overview](README.md) · [Next: Pull requests & code review →](02-pull-requests-and-code-review.md)
