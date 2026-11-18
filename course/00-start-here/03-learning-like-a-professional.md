# 00.3 · Learning like a professional

> ⏱ 30 min · Module 00 · Start Here

You've already shown you can learn, since you finished a degree. Learning to program for a job is different from learning for exams, though. You're not memorising facts. You're building **skills** and **mental models**. Here's what the research and the experience of a lot of developers say actually works.

## 1. Type it, don't paste it

When a lesson shows code, type it into your playground. Your hands and eyes learn patterns your brain skims past when reading. Then **change something** and predict what happens. Break it on purpose. Typing an example, changing one thing and running it teaches you more than reading it five times.

## 2. Predict, then run

Before running any code, make a prediction: *"This will log 3."* Then run it.

- If you were **right**, your mental model is good.
- If you were **wrong**, that's the most valuable moment in learning. Your model is broken in a specific place, and now you know where. Dig in until you can explain why.

## 3. Active recall beats re-reading

Re-reading a lesson feels productive but barely helps memory. **Testing yourself** does. That's why every lesson has check questions: answer them *before* revealing the answer, out loud or in writing. A week later, try answering the module's checkpoint quiz again from memory.

## 4. Spaced repetition

You forget about half of what you learn within days unless you revisit it. Build in review:
- Start each session by skimming your **last journal entry**.
- At the start of each new Part, re-do two exercises from the previous Part from scratch (delete your solution, or do it in a scratch folder).
- Optional: put tricky facts into a flashcard app like Anki ("What does `SameSite=Lax` do?").

## 5. The 20-minute rule

When stuck: struggle **productively** for about 20 minutes, using [`STUCK.md`](../../STUCK.md). Struggling is where learning happens, but past a certain point you're just stewing. After 20 minutes, open the first hint. After another 20, the next one. Never spend three hours stuck on one problem.

## 6. Explain it (the Feynman technique)

After each lesson, write two or three sentences in [`JOURNAL.md`](../../JOURNAL.md) explaining the main idea **in your own words**, as if to a friend who doesn't code. Anywhere you hand-wave ("and then React... does its thing") is something you don't understand yet.

## 7. Read the docs

Junior developers who can read documentation are much more valuable than ones who can only follow tutorials. Each lesson links the official docs, so read them. The first few times it's slow and dense. It gets faster, and it compounds.

The three you'll use most:
- **react.dev**: the official React docs. Excellent, and especially good on effects.
- **MDN (developer.mozilla.org)**: the reference for HTML, CSS, JavaScript and every browser API.
- **typescriptlang.org/docs**: the TypeScript Handbook.

## 8. Using AI the right way

You've decided not to let AI build this for you. That's a good decision, and here's why it matters beyond willpower.

**Reading AI-written code that works gives you an illusion of competence.** You recognise it, so it feels like you know it. Then you face a blank file in an interview and nothing comes. The same thing happens when you copy from Stack Overflow, but AI makes it much easier.

The other side: **AI tools are used at almost every company now**, and you'll use them at work (lesson 22.3). The developers who get value from them are the ones with strong fundamentals, because they can tell when the AI is wrong. That's what you're building.

So in this course, AI is a **tutor**:

| ✅ Good uses | ❌ Avoid |
|---|---|
| "Explain closures with a different example" | "Write the `useInterval` hook" |
| "What does this error mean?" | "Fix my code" (and pasting the whole file) |
| "Quiz me on Module 07" | "Complete this exercise" |
| "Review my passing solution like a senior dev" | Accepting autocomplete suggestions for exercise code |
| "Give me three extra practice problems with tests" | |

**Turn off AI autocomplete** (like Copilot's inline suggestions) in this repo and in your capstone. It writes code before you've thought about it, which defeats the purpose.

The repo's [`CLAUDE.md`](../../CLAUDE.md) sets AI assistants to tutor mode automatically, and [`STUCK.md`](../../STUCK.md) has a prompt you can paste into any AI chat.

## 9. A sustainable routine

- **Same time, most days.** One focused hour daily beats one exhausted seven-hour day.
- **Pomodoro:** 25 minutes focused (phone in another room), 5 minutes off. After four rounds, take a longer break.
- **End each session mid-task**, with a note about what's next. It makes the next session much easier to start.
- **Commit at the end of every session**, even if it's just `PROGRESS.md` and `JOURNAL.md`. Your GitHub contribution graph becomes a visible record of your consistency.

## 10. Comparing yourself to others

You'll see people online who "learned React in a weekend". They learned to copy a tutorial in a weekend. You're learning to build, from first principles, something a company would pay you to build. That takes longer, and it's worth more.

## Check your understanding

1. Why is "predict, then run" more effective than just running code?
2. What should you do after 20 minutes of being stuck?
3. Name two good and two bad ways to use AI while doing this course.

<details><summary>Answers</summary>

1. A wrong prediction shows you exactly where your mental model is broken, and fixing that is where learning happens. Running without predicting skips that feedback.
2. Open the first hint level in `HINTS.md` and keep following [`STUCK.md`](../../STUCK.md), rather than continuing to stew.
3. Good: asking for concept explanations with different examples, or asking it to quiz you or review your *working* code. Bad: asking it to write or fix your exercise code, or accepting inline autocomplete for exercises.
</details>

---
[← Set up your machine](02-set-up-your-machine.md) · [Module overview](README.md) · [Next module: JavaScript You'll Use Every Day →](../01-javascript-refresher/README.md)
