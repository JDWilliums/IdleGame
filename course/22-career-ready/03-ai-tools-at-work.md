# 22.3 · AI tools at work

> ⏱ 2 hours · Module 22 · Career Ready

## What you'll learn
- How development teams use AI tools today
- Company policies you need to know about
- Using AI to go faster without losing understanding or quality
- Reviewing AI-written code
- AI in interviews
- How to keep growing when a tool can write the code

---

## Why this course kept AI out of your code

You chose to write every line of this course yourself, with AI only as a tutor. That was the right choice for learning: the struggle is where understanding forms. You now know *why* a closure captures a stale value, *why* a cookie isn't being sent and *why* two devices can overwrite each other's saves. That knowledge is exactly what makes AI tools useful instead of dangerous, because you can tell when they're wrong.

At work, AI tools are now part of the job almost everywhere. This lesson is about using them professionally.

## How teams use AI

| Use | Example |
|---|---|
| **Inline completion** | finishing the line or function you're typing |
| **Chat about code** | "what does this regex do?", "why might this test be flaky?" |
| **Agents** | given a task, they read the codebase, edit several files, run the tests and propose a change |
| **Code review assistants** | comments on pull requests: possible bugs, missing tests |
| **Explaining unfamiliar code** | "walk me through how auth works in this repo" (22.1) |
| **Tests and boilerplate** | test cases for a pure function, a migration, a typed API client from a schema |
| **Investigation** | summarising a long log, suggesting causes for an error |

How much is used varies a lot between companies. Some encourage agents for most work, and others restrict AI to approved tools for specific tasks.

## Policies come first

Before using any AI tool on company code, find out the rules:

- **Which tools are approved?** Company code pasted into an unapproved tool may leave the company. That can be a serious breach of contract or law.
- **What data may be shared?** Usually never customer data, credentials or secrets.
- **Licensing**: some companies have rules about generated code and open-source licences.
- **Disclosure**: some teams want PRs to say when an AI tool did significant work.

If there's no policy, ask your manager. "Is it OK to use X on this codebase?" is a question that shows good judgement.

## Using AI well

You're responsible for every line you commit, whoever or whatever typed it. Professionals who get the most out of AI work like this:

1. **Know what you want first.** Have a design in mind, even a rough one. "Add a selector for bank value, pure, in the engine package, tested like the others" gets far better results than "make the bank show value".
2. **Give it context**: the relevant files, the conventions, the constraints ("no new dependencies", "must work offline").
3. **Ask for small steps**, and review each one, rather than one giant change.
4. **Verify**: run it, run the tests, read the diff. Ask it to write tests, then check that the tests would actually fail if the code were wrong.
5. **Understand before you commit.** If you couldn't explain the change in code review, you're not ready to commit it.

### What AI gets wrong
- **Invented APIs**: functions or options that don't exist, or existed in an older version (`unescape` for UTF-8, Express 4's `*` route syntax, Zod 3's API in a Zod 4 project).
- **Outdated patterns**: a tool trained on older code suggests older practices, like JWTs in `localStorage` or class components.
- **Plausible but subtle bugs**: off-by-one errors in batching, a missing `await`, a race condition, an authorisation check on the wrong id.
- **Security issues**: string-built SQL, disabled certificate checks, secrets in client code.
- **Over-engineering**: an abstraction for something used once.

Review AI-written code **harder** than you'd review a colleague's. A colleague knows the system, and the tool might not.

## AI in interviews

- Some interviews allow AI tools, and some forbid them. **Ask if it isn't stated**, and follow the rule exactly. Using AI where it's forbidden is treated as cheating.
- Where it's allowed, interviewers are usually assessing **how** you use it: whether you give it good context, catch its mistakes and can explain the result.
- Take-home tasks: unless told otherwise, assume you'll be asked to explain every line in a follow-up interview.
- You'll still be asked fundamentals with no tools at all (22.5). This course prepared you for that.

## Keeping your edge

When a tool can produce working code quickly, the valuable skills are the ones it can't replace:

- **Judgement**: knowing which approach fits, what can go wrong and what to test.
- **Understanding systems**: how the parts interact, where the data lives, what happens under load or offline.
- **Debugging**: finding why something is wrong, which often means knowing what the tool doesn't.
- **Communication**: turning vague requirements into clear tickets, explaining trade-offs, reviewing well.

Keep learning the way you did in this course. When you meet something new, take time to understand it. Use AI to *explain* it, then build a small thing yourself before letting a tool do it for you.

## Practice
Now that your capstone is finished, try this once, on a branch:

1. Pick a small new feature from your `IDEAS.md`.
2. Write the user story and acceptance criteria yourself.
3. Ask an AI agent to implement it, with good context (pass it your architecture guide and conventions).
4. Review its diff exactly as you would a colleague's PR (22.2): correctness, security, tests, design. Run everything.
5. Write a short note: what it did well, what it got wrong, how long the review took, and whether you'd merge it.

It's eye-opening, and a good interview anecdote.

## Check your understanding

1. What should you find out before using an AI tool on a company codebase?
2. Name three kinds of mistakes AI tools commonly make.
3. Why review AI-written code harder than a colleague's?
4. An interview doesn't mention AI tools. What do you do?
5. Which skills become *more* valuable as AI writes more code?

<details><summary>Answers</summary>

1. Which tools are approved, what data may be shared, any rules about licences and generated code, and whether the team expects disclosure.
2. Any three of: invented or outdated APIs; outdated patterns; subtle bugs (off-by-one, missing `await`, races, wrong ownership checks); security issues; over-engineering.
3. It can produce confident, plausible code without knowing your system, your constraints or the current versions of your libraries. You're responsible for what you commit.
4. Ask whether AI tools are allowed, and follow the answer exactly.
5. Judgement, understanding systems, debugging, and communication (requirements, trade-offs, reviews).
</details>

## Further reading
- Your future employer's engineering handbook: many publish their AI usage guidelines
- The documentation of whichever AI tools your team adopts: learn their context and review features properly

---
[← Pull requests & code review](02-pull-requests-and-code-review.md) · [Module overview](README.md) · [Next: Portfolio, CV & GitHub →](04-portfolio-cv-and-github.md)
