# Module 00 · Start Here

**Time:** ~3 hours · **Prerequisites:** none

## Why this module matters
A course this long only works if you have a reliable routine: an editor that helps you, a test runner you trust, and a method for learning that sticks. That setup is what this module gives you. Don't skip it, because every later module assumes it.

## Learning objectives
By the end of this module you can:
- explain how lessons, exercises, hints, projects and the capstone fit together
- set up Node.js, git, VS Code and GitHub the way professionals do
- run, watch and pass an exercise, then record your progress and commit it
- describe the study habits that will carry you through ~500 hours of learning

## Lessons
| # | Lesson | Time |
|---|---|---|
| 00.1 | [How this course works](01-how-this-course-works.md) | 20 min |
| 00.2 | [Set up your machine](02-set-up-your-machine.md) | 90 min |
| 00.3 | [Learning like a professional](03-learning-like-a-professional.md) | 30 min |

## Exercise
| Id | Exercise | Run |
|---|---|---|
| `00-01` | [hello-course](../../exercises/00-start-here/01-hello-course/exercise.ts) | `npm run watch 00-01` |

## Checkpoint quiz
1. Which command re-runs an exercise's tests every time you save?
2. Who ticks the exercise boxes in `PROGRESS.md`: you, or a script?
3. What are the three hint levels, and why open them one at a time?
4. When is it OK to read a file in `solutions/`?

<details><summary>Answers</summary>

1. `npm run watch <id>`, for example `npm run watch 00-01`.
2. The script, via `npm run progress`. It runs the tests and ticks exercises that pass. You tick lessons, projects and milestones yourself.
3. Nudge → direction → walkthrough. One at a time, because each level gives away more. Often a nudge is all you need, and solving it yourself is what makes it stick.
4. After you've passed, to compare approaches. Or as a last resort after working through [`STUCK.md`](../../STUCK.md), followed by re-solving it from scratch later.
</details>

## Extra practice
- Customise VS Code: pick a theme and font you like, and learn five keyboard shortcuts (go to file, go to symbol, multi-cursor, move line, toggle terminal). Write them in your journal.
- Read the source of [`scripts/check.mjs`](../../scripts/check.mjs). You won't understand all of it yet. Write down three things you *don't* understand, and come back to them after Module 15.

**Next:** [Module 01 · JavaScript You'll Use Every Day →](../01-javascript-refresher/README.md)
