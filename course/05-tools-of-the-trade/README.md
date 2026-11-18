# Module 05 · Tools of the Trade

**Time:** ~10 hours · **Prerequisites:** Modules 00–04

## Why this module matters
On day one of a job, nobody will ask you to explain closures. They'll ask you to clone the repo, create a branch, run the app, fix a small bug, and open a pull request. Fluency with git, npm, the build tool, linters and the debugger is what lets you be productive in your first week. This module makes that workflow second nature.

## Learning objectives
By the end of this module you can:
- use the terminal comfortably and use git like a team member: branches, good commits, PRs, merging/rebasing, resolving conflicts, undoing mistakes
- explain `package.json`, semver, lockfiles and `npm audit`, and make sensible decisions about dependencies
- explain what a bundler does, scaffold a Vite + React + TS app, and use env vars, the dev server, builds and phone testing
- set up ESLint, Prettier and type-checking, and run them automatically
- debug methodically with breakpoints, the Network tab, the Application tab and the Performance panel

## Lessons
| # | Lesson | Time |
|---|---|---|
| 05.1 | [The terminal & git like a professional](01-terminal-and-git.md) | 3h |
| 05.2 | [npm, packages & semver](02-npm-packages-and-semver.md) | 1.5h |
| 05.3 | [Bundlers & Vite](03-bundlers-and-vite.md) | 2h |
| 05.4 | [Linting, formatting & type-checking](04-linting-formatting-and-typechecking.md) | 1.5h |
| 05.5 | [Debugging & DevTools](05-debugging-and-devtools.md) | 2h |

This module has no auto-graded exercises. Each lesson ends with a **"Do it"** checklist of practical tasks. Do them all, because they're the point of the module.

## Checkpoint quiz
1. What's the difference between `git merge` and `git rebase`? When should you never rebase?
2. You committed to `main` by accident and haven't pushed. How do you move that commit onto a new branch?
3. What does `^5.3.0` allow `npm install` to pick? And `~5.3.0`?
4. Why commit `package-lock.json`? When would you use `npm ci` instead of `npm install`?
5. Is a `VITE_API_KEY` environment variable secret? Why or why not?
6. What's the difference between a linter and a formatter?
7. Your code "doesn't work" and there's no error. Describe your debugging process.

<details><summary>Answers</summary>

1. Merge creates a merge commit joining two histories. Rebase replays your commits on top of another branch, which gives linear history but rewrites commit ids. Never rebase commits that others have already pulled, such as a shared branch.
2. `git branch my-feature` (creates a branch at the current commit), then `git reset --hard HEAD~1` on main (only if you have no uncommitted work you want to keep), then `git switch my-feature`.
3. `^5.3.0`: any 5.x.x ≥ 5.3.0 (no new major). `~5.3.0`: any 5.3.x ≥ 5.3.0 (patches only).
4. So that everyone (and CI) installs exactly the same dependency versions. `npm ci` is for CI and fresh installs: it installs exactly what the lockfile says, fails if `package.json` and the lockfile disagree, and deletes `node_modules` first.
5. **No.** Every `VITE_` variable is inlined into the JavaScript bundle that ships to every user's browser. Secrets belong on the server only.
6. A linter finds likely **bugs and bad patterns** (unused variables, missing hook dependencies). A formatter only changes **layout** (spaces, quotes, line breaks).
7. Reproduce it reliably → state expected vs actual → form a hypothesis → test it with a breakpoint or logs (predicting the result first) → narrow down where the actual behaviour diverges from the expected → fix → explain why it happened → add a test.
</details>

## Extra practice
- **Learn Git Branching** (learngitbranching.js.org): do the "Main" sequence. It visualises exactly what each command does.
- **Oh My Git!**: a free game for learning git.
- Read a large open-source project's `CONTRIBUTING.md` (React, Vite or Vitest) and note how they want PRs and commits written.

**Next:** [Module 06 · React Fundamentals →](../06-react-fundamentals/README.md)
