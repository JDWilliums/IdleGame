# 22.2 · Pull requests & code review

> ⏱ 2 hours · Module 22 · Career Ready

## What you'll learn
- What makes a pull request easy to review
- Reviewing your own diff before anyone else does
- Responding to review comments well
- Giving reviews that are kind, specific and useful
- Contributing to open source

---

## A pull request is a message to a busy person

Your reviewer has their own work. The easier your PR is to understand, the faster and better the review. The PR description is where you make it easy.

```markdown
## What
Show each item's total value in the bank, and a bank total.

## Why
Players asked what their bank is "worth" before selling (issue #42).

## How
- `bankValue` selector in the engine (pure, tested)
- `ItemRow` shows qty × price, formatted with `formatNumber`
- Bank header shows the total, with a full-value aria-label

## How to test
1. Start an oak-tree action for ~30 s
2. Open /bank: the Oak Log row shows "12 · 12 gold"; the header shows "Bank value: 12 gold"

## Screenshots
| Before | After |
|---|---|
| … | … |

## Notes
The total doesn't include equipped tools; that felt right but happy to change.
```

- **Small.** Under about 400 changed lines, ideally much less. Big changes can almost always be split: a refactor first, then the feature; the backend, then the frontend.
- **One thing.** "Fix bug and also rename everything" is two PRs.
- **The title says what it does**: "Show item values in the bank", not "updates" or "fix".
- **Screenshots for any UI change**, and a GIF for interactions.
- Point out the parts you're unsure about. It focuses the review where it helps.

## Review yourself first

Before asking anyone, open the **Files changed** tab and read your diff as if a stranger wrote it:

- [ ] No leftover `console.log`, commented-out code or `TODO`s you meant to fix.
- [ ] Names that would make sense to someone who hasn't seen the ticket.
- [ ] Tests for the new behaviour, including an unhappy path.
- [ ] No unrelated changes (formatting a whole file, an accidental lockfile change).
- [ ] CI is green.
- [ ] You've tried it in the browser, at phone width.

You'll catch something almost every time. That's the point.

## Receiving review

- **A comment on your code is not a comment on you.** Reviews exist because everyone's code improves with a second pair of eyes, including your reviewer's.
- **Reply to every comment**: "Done", "Good catch, fixed in a1b2c3", or a reasoned disagreement. Don't silently ignore things.
- **Disagree with reasons, and be willing to be wrong**: "I went with X because Y. Does that change your view, or should I switch?" If it goes back and forth more than twice, talk instead of typing.
- **Ask when you don't understand a comment.** "Could you say more about why?" is a great way to learn.
- Push fixes as new commits during review (easier to re-review). The team's convention decides whether to squash when merging.

## Giving review

As a junior, you'll review too, and you'll be good at it sooner than you think. You can spot unclear names, missing tests and confusing logic, and asking "why does this do X?" is a valuable review even when the answer is "good reason".

**Look for** (most important first):
1. **Correctness**: does it do what the ticket says? What about empty lists, errors, slow networks, a double-click?
2. **Security and data**: input validation, authorisation checks, secrets, anything that could lose data.
3. **Tests**: do they test behaviour, and would they fail if the code were wrong?
4. **Design and readability**: can you follow it? Does it fit the codebase's patterns?
5. **Style nits** last. Linters and formatters should be catching most of these.

**How to say it:**

- **Ask, don't command**: "What happens if `items` is empty here?" teaches more than "Handle empty."
- **Be specific**: point at the line, and suggest an alternative when you have one.
- **Label how much it matters.** Many teams use prefixes such as *Conventional Comments*: `nit:` (trivial, optional), `suggestion:`, `question:`, `issue:` (must fix), `praise:`.
- **Say what's good.** "praise: this reducer is really clear" costs nothing and teaches the author what to keep doing.
- **Approve with small comments** when they're truly optional. Don't block a PR over a `nit:`.

You'll notice this is how the tutor in this course reviewed your code: strengths first, questions rather than rewrites, and the reasons behind each point. Do the same for others.

## Open source

Contributing to open source is excellent practice and looks good on a CV, because it shows you can work in someone else's codebase and process.

1. Pick a project **you actually use** (a library from this course, a tool, a docs site).
2. Read its `CONTRIBUTING.md`, and look for `good first issue` or `help wanted` labels.
3. **Comment on the issue before starting** ("I'd like to work on this. My plan is…"), so effort isn't wasted.
4. Keep the first PR small: a docs fix, a test, a clear bug.
5. Follow their conventions exactly, and be patient. Maintainers are often volunteers.

Documentation fixes are real contributions. Many maintainers value them more than code.

## Practice
- Go back through your capstone's merged PRs. Rewrite the description of the worst one using the template above.
- Review a friend's or study partner's PR using the labels above. Ask them which comments were most useful.

## Check your understanding

1. What sections make a good PR description?
2. Why keep PRs small, and how do you split a big one?
3. Name four things to check when reviewing your own diff.
4. A reviewer's comment seems wrong to you. What do you do?
5. In what order of importance should you review someone else's code?
6. What do `nit:` and `issue:` prefixes tell the author?

<details><summary>Answers</summary>

1. What, why, how (the approach), how to test, screenshots for UI, and notes on open questions.
2. Small PRs get faster, better reviews and are safer to merge and roll back. Split a refactor from a feature, backend from frontend, or one step of a feature from the next.
3. Any four of: no leftover logs or commented-out code; clear names; tests including an unhappy path; no unrelated changes; green CI; tried in the browser at phone width.
4. Reply with your reasoning and ask whether it changes their view, staying open to being wrong. If it goes back and forth, talk it through.
5. Correctness, then security and data, then tests, then design and readability, then style nits.
6. `nit:` is a trivial, optional suggestion. `issue:` is something that should be fixed before merging.
</details>

## Further reading
- Google's "Engineering Practices" guide: "The Code Reviewer's Guide" and "The CL author's guide" (google.github.io/eng-practices)
- conventionalcomments.org
- GitHub's "First Contributions" repository, for a guided first open-source PR

---
[← Working in a real codebase](01-working-in-a-real-codebase.md) · [Module overview](README.md) · [Next: AI tools at work →](03-ai-tools-at-work.md)
