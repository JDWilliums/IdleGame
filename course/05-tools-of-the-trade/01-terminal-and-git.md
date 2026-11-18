# 05.1 · The terminal & git like a professional

> ⏱ 3 hours · Module 05 · Tools of the Trade

## What you'll learn
- Terminal essentials: navigation, files, pipes, environment variables and `PATH`
- git's mental model: working tree, staging area, commits, branches and `HEAD`
- The team workflow: branch → commit → push → pull request → review → merge
- Writing good commit messages
- Merge vs rebase, and resolving conflicts calmly
- Undoing almost anything

---

## Part 1: Terminal essentials

```bash
pwd                      # where am I?
ls -la                   # list files, including hidden ones (.git, .env)
cd ~/code/IdleGame       # change directory (~ = home)
cd ..                    # up one level
cd -                     # back to the previous directory
mkdir -p a/b/c           # make nested directories
touch notes.md           # create an empty file
cp a.txt b.txt           # copy
mv old.txt new.txt       # move/rename
rm file.txt              # delete (no recycle bin!)
rm -r folder             # delete a folder recursively. Double-check before pressing Enter
cat file.txt             # print a file
less big.log             # page through a file (q to quit)
code .                   # open the current folder in VS Code
```

Power tools:

```bash
grep -rn "useEffect" src/            # search file contents recursively, with line numbers
find . -name "*.test.ts" -not -path "*/node_modules/*"
history | grep vitest                # find a command you ran earlier
Ctrl+R                               # interactive reverse search through history
```

### Pipes and redirection
```bash
npm test 2>&1 | tee test.log         # send output to the screen AND a file
ls | wc -l                           # count files
echo "PORT=3000" > .env              # write (overwrite) a file
echo "DEBUG=1" >> .env               # append to a file
```

### Environment variables and `PATH`
```bash
echo $HOME                           # read a variable
export NODE_ENV=production           # set for this shell session
PORT=4000 npm run dev                # set for ONE command only
echo $PATH                           # the folders searched for commands
which node                           # which `node` binary will run?
```

When the terminal says `command not found`, either the program isn't installed, or the folder containing it isn't on your `PATH`.

> **Windows PowerShell differences:** `$env:PORT = "4000"` instead of `export`, `dir` works like `ls`, and `Get-Content` like `cat`. WSL2 behaves exactly like Linux.

## Part 2: git's mental model

```
 working tree ──git add──► staging area (index) ──git commit──► repository (history)
 (your files)              (what goes in the next commit)       (snapshots)
```

- A **commit** is a snapshot of the whole project, plus a message, an author and a pointer to its parent commit(s). Its id is a hash like `a1b2c3d`.
- A **branch** is just a **movable pointer to a commit**. Creating a branch is instant and costs nothing.
- **`HEAD`** is a pointer to "where you are now", usually a branch.

```
        A ── B ── C          ← main
                   \
                    D ── E   ← feature/fishing   ← HEAD
```

When you commit on `feature/fishing`, that branch pointer moves forward to the new commit. `main` stays where it is.

### Everyday commands
```bash
git status                     # what's changed? Run this constantly
git diff                       # unstaged changes
git diff --staged              # what you're about to commit
git add src/skills.ts          # stage one file
git add -p                     # stage interactively, hunk by hunk (great for clean commits)
git commit -m "Add fishing skill data"
git log --oneline --graph --all  # visual history
git switch -c feature/fishing  # create and switch to a new branch
git switch main                # switch branches
git pull                       # fetch + merge the remote's changes into your branch
git push -u origin feature/fishing  # push and set the upstream (first time)
```

## Part 3: The team workflow (GitHub flow)

This is how almost every company works:

1. **Update main**: `git switch main && git pull`
2. **Branch**: `git switch -c feat/offline-progress` (one branch per ticket or feature)
3. **Commit** small, logical steps as you work.
4. **Push**: `git push -u origin feat/offline-progress`
5. **Open a pull request (PR)** on GitHub: describe what and why, and link the ticket.
6. **CI runs** your tests and lints automatically (lesson 20.4).
7. **Code review**: teammates comment and you push fixes to the same branch.
8. **Merge** (often "squash and merge"), then delete the branch.

**You'll use this workflow for the capstone**, even working alone: one branch and one PR per milestone. It's good practice, and it produces a portfolio that shows how you work.

## Part 4: Good commit messages

A commit message is a note to your future self and your teammates.

```
❌  fix
❌  stuff
❌  WIP
❌  changed files

✅  Fix offline progress ignoring the 12-hour cap
✅  Add fishing skill with three fishing spots
✅  Refactor tick loop to use a fixed timestep
```

Guidelines:
- **Imperative mood** ("Add", not "Added"), as if completing the sentence "This commit will…".
- A short summary line (≤ 72 characters). If needed, a blank line and then a body explaining **why**.
- One logical change per commit.

Many teams use **Conventional Commits**:

```
feat(skills): add fishing skill with three spots
fix(save): ignore offline time beyond the 12h cap
refactor(engine): extract tick logic into pure functions
test(xp): cover level boundaries
docs: explain save migrations in README
chore(deps): update vitest to 5.1
```

Tooling can generate changelogs from these. Use them for the capstone.

## Part 5: Merge vs rebase

Your branch has fallen behind `main`:

```
A ── B ── C ── F ── G        main
           \
            D ── E           feature
```

**Merge** (`git merge main` while on `feature`) creates a merge commit:
```
A ── B ── C ── F ── G
           \         \
            D ── E ── M      feature
```
History is preserved exactly. It's safe, but the history gets "bushy".

**Rebase** (`git rebase main` while on `feature`) replays your commits on top of main:
```
A ── B ── C ── F ── G ── D' ── E'    feature
```
The history is linear and clean, **but D' and E' are new commits with new ids.**

> ⚠️ **The golden rule of rebasing:** never rebase commits that other people have already pulled. Rewriting shared history causes chaos. Rebasing your own unpushed (or solo) feature branch is fine.

After rebasing a branch you'd already pushed, you need `git push --force-with-lease`. It's safer than `--force` because it refuses if someone else pushed in the meantime.

## Part 6: Merge conflicts

A conflict happens when two branches changed the same lines. git stops and marks the file:

```ts
<<<<<<< HEAD
const OFFLINE_CAP_HOURS = 12;
=======
const OFFLINE_CAP_HOURS = 24;
>>>>>>> feature/longer-offline
```

To resolve it:
1. **Don't panic.** Nothing is lost.
2. Open the file. VS Code shows buttons: *Accept Current / Incoming / Both*.
3. Decide what the code *should* be, which might be a combination of both. Delete the markers.
4. `git add <file>`, then `git commit` (for a merge) or `git rebase --continue` (for a rebase).
5. **Run the tests.** A merge can be textually clean and still logically broken.

To bail out: `git merge --abort` or `git rebase --abort`.

## Part 7: Undoing things

| Situation | Command |
|---|---|
| Discard unstaged changes to a file | `git restore file.ts` |
| Unstage a file (keep the changes) | `git restore --staged file.ts` |
| Fix the last commit's message or add a forgotten file (not pushed) | `git add forgotten.ts && git commit --amend` |
| Undo the last commit, keeping its changes staged | `git reset --soft HEAD~1` |
| Undo a commit that's **already pushed** (safely, by adding an inverse commit) | `git revert <commit>` |
| Temporarily shelve work in progress | `git stash` … `git stash pop` |
| "I destroyed everything" | `git reflog`, which lists every position HEAD has been at. Find the good one and `git reset --hard <id>` |

`git reflog` is your safety net: almost nothing committed is ever truly lost.

## Part 8: `.gitignore`

Never commit:
- `node_modules/` (huge, and reinstalled from the lockfile)
- build output: `dist/`, `coverage/`
- **secrets**: `.env` files with passwords and API keys. *If you ever commit a secret, treat it as leaked: rotate it immediately. Deleting it in a later commit doesn't remove it from history.*
- OS and editor clutter: `.DS_Store`, most of `.vscode/`

Look at this repo's [`.gitignore`](../../.gitignore).

## Do it

Practise in a throwaway repo (`mkdir ~/git-kata && cd ~/git-kata && git init`):

- [ ] Make three commits on `main` with good messages.
- [ ] Create `feature/a`, commit twice. Switch to `main`, commit once (change a *different* file). Merge `feature/a` into `main`. Look at `git log --oneline --graph`.
- [ ] Create `feature/b` and edit **the same line** of a file on both `feature/b` and `main`. Merge and **resolve the conflict**.
- [ ] Create `feature/c`, commit twice, and **rebase** it onto `main`. Compare the graph with the merge version.
- [ ] Commit something, then undo it with `reset --soft`. Commit again, then undo it with `revert`. Explain the difference in your journal.
- [ ] "Lose" a commit with `git reset --hard HEAD~2`, then recover it with `git reflog`.
- [ ] In *this* course repo: create a branch `study/module-05`, commit your journal entry, push it, and open a PR to `main` on GitHub. Read your own diff in the PR view, then merge it.

## Check your understanding

1. What is a branch, technically?
2. What does `git add -p` let you do, and why is it useful?
3. You pushed a commit with a bug to a shared branch. `reset` or `revert`? Why?
4. Why run the tests after resolving a merge conflict?

<details><summary>Answers</summary>

1. A lightweight, movable pointer to a commit.
2. Stage changes hunk by hunk, so one file's unrelated changes can go into separate, focused commits.
3. `revert`. It adds a new commit that undoes the bug without rewriting shared history. `reset` would rewrite history other people already have.
4. The merged result can be textually fine but logically wrong, e.g. both branches renamed the same function differently, or one branch used code the other removed.
</details>

## Further reading
- *Pro Git* (free book): https://git-scm.com/book. Chapters 2, 3 and 7.
- GitHub Docs: [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [Conventional Commits](https://www.conventionalcommits.org/)

---
[Module overview](README.md) · [Next: npm, packages & semver →](02-npm-packages-and-semver.md)
