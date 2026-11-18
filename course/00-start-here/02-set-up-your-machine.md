# 00.2 · Set up your machine

> ⏱ 90 min · Module 00 · Start Here

You'll set up the same tools a professional React developer uses. Take your time. A well set-up machine saves you hours of frustration later.

**Checklist for this lesson:**
- [ ] Node.js (LTS) installed through a version manager
- [ ] git installed and configured
- [ ] GitHub account with SSH access
- [ ] VS Code with the recommended extensions
- [ ] This repo cloned, `npm install` done
- [ ] Exercise `00-01` passing and committed

---

## 1. A terminal you're comfortable with

You'll live in the terminal. Use:
- **macOS:** the built-in Terminal, or iTerm2. The default shell is `zsh`.
- **Windows:** **Windows Terminal** with PowerShell, or **WSL2** (Ubuntu inside Windows). WSL2 behaves the same as the Mac/Linux instructions everywhere in this course and is common at companies that use Macs. Native Windows also works. If you're unsure, start native and switch to WSL2 if you hit weird path or permissions issues.
- **Linux:** whatever came with your distro.

The minimum you need today: `cd folder` (change directory), `ls` (`dir` in PowerShell) to list files, `pwd` to show where you are, and the up arrow to repeat a command. Lesson 05.1 goes much deeper.

## 2. Node.js, via a version manager

Node.js runs JavaScript outside the browser. It powers every tool in this course (the test runner, Vite, the backend).

**Don't install Node from the website installer.** Use a **version manager**, because different projects need different Node versions, and at work you'll switch between them constantly. We'll use **fnm** (Fast Node Manager), which works on every OS:

```bash
# macOS (with Homebrew)
brew install fnm

# Windows (PowerShell)
winget install Schniz.fnm

# Linux / WSL
curl -fsSL https://fnm.vercel.app/install | bash
```

Then follow the "shell setup" step from fnm's README (it adds one line to your shell profile, so that fnm switches versions automatically when you `cd` into a project). Restart your terminal, then:

```bash
fnm install --lts      # install the current Long-Term Support version
fnm default lts-latest
node --version         # should print v24 or newer
npm --version
```

> 🧠 **Why LTS?** Node releases a new major version regularly. Even-numbered versions become **Long-Term Support** and get security fixes for about three years. Companies run LTS in production.
>
> This repo has a `.nvmrc` file containing the version number. With fnm's `--use-on-cd` setup, entering the folder switches to that version automatically.

## 3. git

git tracks every change to your code. It's non-negotiable at any job.

- **macOS:** `xcode-select --install` (or `brew install git`)
- **Windows:** https://git-scm.com/download/win (accept the defaults, and choose VS Code as the default editor when asked)
- **Linux:** `sudo apt install git` (or your distro's equivalent)

Configure it once:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"     # same email as your GitHub account
git config --global init.defaultBranch main
git config --global core.editor "code --wait"         # use VS Code for commit messages
git config --global pull.rebase false                 # explained in 05.1
```

## 4. GitHub + SSH

Your GitHub profile becomes part of your CV, so use a professional username.

To push code without typing a password every time, set up an **SSH key**: a pair of files, one private (stays on your machine, never share it) and one public (you give it to GitHub).

```bash
ssh-keygen -t ed25519 -C "you@example.com"   # press Enter to accept the defaults; set a passphrase
cat ~/.ssh/id_ed25519.pub                     # print the PUBLIC key (Windows: type $env:USERPROFILE\.ssh\id_ed25519.pub)
```

Copy that output → GitHub → *Settings → SSH and GPG keys → New SSH key* → paste. Then test it:

```bash
ssh -T git@github.com
# "Hi <username>! You've successfully authenticated..."
```

> Prefer a guided setup? Install the GitHub CLI (`gh`) and run `gh auth login`. It sets everything up for you. Both approaches are fine.

## 5. VS Code

Install from https://code.visualstudio.com. Then:

1. Open the repo folder (*File → Open Folder*).
2. VS Code will offer to install the **recommended extensions** (listed in `.vscode/extensions.json`). Accept. They are:
   - **ESLint**: shows code-quality problems inline (lesson 05.4)
   - **Prettier**: formats your code on save
   - **Vitest**: run and debug tests from the sidebar
   - **Error Lens**: shows errors on the line where they happen. Very helpful while learning.
   - **Tailwind CSS IntelliSense**: autocomplete for Module 11
3. Install the `code` command so you can open folders from the terminal: *Command Palette (`Ctrl/Cmd+Shift+P`) → "Shell Command: Install 'code' command in PATH"* (on Windows it's set up automatically).

Shortcuts to learn **today**:

| Action | Windows/Linux | macOS |
|---|---|---|
| Command palette | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| Go to file | `Ctrl+P` | `Cmd+P` |
| Toggle terminal | ``Ctrl+` `` | ``Ctrl+` `` |
| Go to definition | `F12` | `F12` |
| Rename symbol everywhere | `F2` | `F2` |
| Markdown preview | `Ctrl+Shift+V` | `Cmd+Shift+V` |

## 6. A browser for development

Use **Chrome** or **Firefox** for development. Both have excellent DevTools (lesson 05.5). Later you'll add the **React Developer Tools** extension.

## 7. Get the course running

```bash
cd ~/code                                   # or wherever you keep projects
git clone git@github.com:<your-username>/IdleGame.git
cd IdleGame
npm install                                 # downloads the tools into node_modules/
npm run check list                          # shows every exercise
npm run check 00-01                         # runs the first one — it will FAIL, that's expected
```

## 8. Your first exercise: `00-01`

Open `exercises/00-start-here/01-hello-course/exercise.ts`. Read the instructions at the top, then open `exercise.test.ts` next to it and read the tests.

Start watch mode:

```bash
npm run watch 00-01
```

Arrange VS Code so you can see the editor and the terminal at the same time. Edit, save, and watch the tests go green. When they all pass, press `q` to quit watch mode, then:

```bash
npm run progress
git add -A
git commit -m "Complete exercise 00-01"
git push
```

Open your repo on GitHub and look at `PROGRESS.md`. Your first tick is there. 🎉

## 9. Your playground

Create a folder for trying out lesson examples:

```bash
mkdir playground
```

Run any TypeScript file in it directly with Node (Node 24 understands TypeScript syntax natively):

```bash
node playground/closures.ts
```

> If you see an error about an unsupported TS feature (like `enum`), use `npx tsx playground/closures.ts` instead. `tsx` handles all TS syntax.

`playground/` is in `.gitignore` except for its README, so experiment freely.

## Troubleshooting

| Problem | Fix |
|---|---|
| `node: command not found` after installing fnm | You skipped fnm's shell setup step, or didn't restart the terminal. |
| `npm install` fails with `EACCES` | You installed Node with `sudo`/system installer. Uninstall it and use fnm. |
| Tests don't re-run on save | Make sure you used `npm run watch`, not `npm run check`. |
| `Permission denied (publickey)` on push | Your SSH key isn't added to GitHub, or you cloned with HTTPS. Run `git remote -v` to check. |
| Windows: weird `^M` characters or every line shows as changed | Line-ending issue. Run `git config --global core.autocrlf false`. The repo's `.editorconfig` keeps files as LF. |

## Check your understanding

1. Why use a version manager instead of installing Node directly?
2. Which SSH key file do you give to GitHub, and which do you never share?
3. What does `npm install` actually do?

<details><summary>Answers</summary>

1. Different projects need different Node versions. A version manager lets you switch per project (automatically, via `.nvmrc`) and avoids permission problems.
2. You give GitHub the **public** key (`id_ed25519.pub`). The **private** key (`id_ed25519`) never leaves your machine.
3. It reads `package.json` (and the exact versions in `package-lock.json`), downloads those packages into `node_modules/`, and makes their command-line tools available to `npm run` scripts. Lesson 05.2 covers this in depth.
</details>

---
[← How this course works](01-how-this-course-works.md) · [Module overview](README.md) · [Next: Learning like a professional →](03-learning-like-a-professional.md)
