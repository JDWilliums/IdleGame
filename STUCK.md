# I'm stuck. Now what?

Getting stuck isn't a sign you're bad at this. It's the job. Professional developers spend a large part of every day stuck, and what makes someone senior is mostly having a reliable process for getting unstuck. This page is that process. Use it every time and it'll become a habit.

---

## The protocol

### Step 1 · Read the error. Actually read it. (2 minutes)
Most beginners glance at an error and start changing code at random. Don't. Read the whole message slowly.

- **Which line?** Stack traces list the most recent call first. Find the first line that points at *your* file.
- **What kind of error?** `TypeError: Cannot read properties of undefined (reading 'name')` means *something* is `undefined` and you tried to read `.name` from it. So: what's undefined, and why?
- **For a failing test:** the test name tells you the behaviour that's missing, and `Expected: X / Received: Y` tells you exactly what's wrong. Open the test file and read the test. Tests are documentation.

### Step 2 · State the problem in one sentence (1 minute)
Write it down, in your journal or a comment:
> "I expected `levelFromXp(83)` to return 2 but it returns 1."

If you can't write the sentence, you don't understand the problem yet. Go back to Step 1.

### Step 3 · Check your assumptions (5–10 minutes)
The bug is almost always in something you're *sure* is fine.

- Add `console.log` before the broken line. **Predict** the output before you run it. If your prediction is wrong, you've found where your mental model breaks.
- Better still, use the debugger (lesson 05.5): put a `debugger;` statement on the line, run, and look at every variable.
- Check types: hover over variables in VS Code. Is that `string | undefined` really a string?
- Check data shape: `console.log(JSON.stringify(thing, null, 2))`.

### Step 4 · Shrink the problem (5–10 minutes)
Make a tiny copy of the problem in a scratch file, with as few lines as possible that still show the bug. Half the time you'll spot the issue while doing this. The other half, you've got the perfect thing to ask about.

### Step 5 · Rubber duck it (2 minutes)
Explain the code, line by line, out loud, to a rubber duck, a pet or an empty chair. Saying it out loud forces your brain to process each step instead of skimming. It works far more often than you'd expect.

### Step 6 · Re-read the lesson and the docs (10 minutes)
Each lesson links the official docs. The answer is usually there. Search the docs, not just Google:
- React → https://react.dev
- JavaScript, CSS, HTML, web APIs → https://developer.mozilla.org
- TypeScript → https://www.typescriptlang.org/docs/

### Step 7 · Use the hints (as long as you need)
Every exercise has a section in `exercises/<module>/HINTS.md` with three levels:
1. **Nudge**: which concept to think about
2. **Direction**: the approach in plain English
3. **Walkthrough**: step by step, with no final code

Open one level at a time. Give each level a real attempt before you open the next.

### Step 8 · Take a break (seriously)
If you've been stuck for 45+ minutes, walk away for 15. Your brain keeps working on the problem in the background. You'll be surprised how often the answer arrives in the shower.

### Step 9 · Ask for help
You've earned it now, and you've got a good question ready from Steps 2 and 4.

**Option A: the AI tutor.** If you use an AI coding tool inside this repo, [`CLAUDE.md`](CLAUDE.md) already tells it to act as a tutor. In any other AI chat, paste this first:

```text
You are my programming tutor. I'm learning React/TypeScript and I want to write
all the code myself. Rules: never write the solution or fix my code for me.
Instead: ask me questions, point me to the concept I'm missing, explain with a
DIFFERENT small example, and give hints one level at a time (nudge → direction →
analogy). If I share working code, review it like a senior engineer but don't
rewrite it. If I ask for the answer, remind me of these rules.
```

Then use this question template (it works for humans too):

```text
**What I'm trying to do:** (one sentence)
**What I expected:** ...
**What actually happens:** (exact error message / output)
**What I've tried:** (bullet list — this matters!)
**Minimal code:** (the smallest snippet that shows the problem)
```

**Option B: humans.** Good communities for beginners:
- **Reactiflux Discord**: the largest React community, with dedicated help channels.
- **The Boot.dev Discord**: you're already a member.
- **r/reactjs** (beginner threads) and **r/learnjavascript**.
- **Stack Overflow**: search first. Post only with a minimal reproduction.

### Step 10 · Last resort: the reference solution
`solutions/` has a reference for every exercise. If you've honestly worked through Steps 1–9, it's fine to read it. Then:
1. Close it.
2. **Wait an hour**, then solve the exercise again from a blank file without looking.
3. Write in your journal what you were missing. That gap is exactly what you needed to learn.

---

## When a whole module feels too hard

That's normal, especially in Modules 02, 07, 13 and 17. Try these, in order:

1. **Check the prerequisite map** in [`SYLLABUS.md`](SYLLABUS.md). Difficulty usually comes from a gap in an earlier topic, not from the current one.
2. **Re-do the previous module's exercises from scratch.** If they're easy now, the foundation is solid. If not, you've found the gap.
3. **Do the module's "Extra practice"** problems for more reps at an easier level.
4. **Teach it.** Write a short explanation of the concept in your journal as if for a friend. Wherever you can't explain it, you don't understand it yet.
5. **Ask the AI tutor to quiz you** on the module and generate easier practice problems.
6. **Move on and come back.** For a single lesson (not a whole module), it's fine to continue and revisit in a week. Things often click later.

## When motivation dips

- **The dip is real.** Every learner hits a point (often Module 07 or 17) where it feels endless. It passes.
- **Shrink the goal.** "Do one exercise" beats "finish the module".
- **Look back.** Run `npm run progress`. Re-read your first journal entries. You've come a long way.
- **Play.** When you start the capstone, put the game on your phone. Playing something you built yourself is very motivating.
