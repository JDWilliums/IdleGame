# 05.5 · Debugging & DevTools

> ⏱ 2 hours · Module 05 · Tools of the Trade

## What you'll learn
- A repeatable, scientific debugging process
- Reading stack traces and using source maps
- Browser DevTools panel by panel: Elements, Console, Sources, Network, Application, Performance, Lighthouse
- Debugging Node code and tests in VS Code
- A preview of React DevTools

---

## Debugging is a process, not a talent

Good debuggers aren't magic. They follow a method:

1. **Reproduce it.** Find the exact steps that trigger the bug, every time. If you can't reproduce it, you can't confirm you've fixed it.
2. **Describe it precisely.** "Expected X, got Y, when doing Z." (See [`STUCK.md`](../../STUCK.md).)
3. **Form a hypothesis.** "I think the XP isn't saved because the save runs before the state updates."
4. **Test the hypothesis** with the cheapest experiment you can: a breakpoint, a log, or a smaller input. **Predict the result first.**
5. **Narrow down.** Binary search: is the data right at the start of the function? At the end? Half-way? Each check halves the search space.
6. **Fix the cause, not the symptom.** `if (xp === undefined) xp = 0` hides the bug, so find out *why* it's undefined.
7. **Explain it and protect it.** Write a test that would have caught it. Add it to your journal's bug story bank.

`git bisect` automates step 5 across history: it binary-searches commits to find the one that introduced a bug. It's worth knowing.

## Reading a stack trace

```
TypeError: Cannot read properties of undefined (reading 'xp')
    at levelFromXp (xp.ts:14:22)
    at SkillCard (SkillCard.tsx:9:17)
    at renderWithHooks (react-dom.development.js:15486:18)
    …
```

- **Top line:** *what* happened. Something was `undefined`, and the code tried to read `.xp` from it.
- **Frames, most recent first.** Find the first frame in **your** code (`xp.ts:14`), skipping library frames.
- **Then read the second frame** (`SkillCard.tsx:9`): what did it pass in? The bug is often one level up from where it crashed.

### Source maps
In the browser, your code has been transformed (TS → JS, bundled, minified). **Source maps** map it back to your original files and lines. Vite generates them in development, and the DevTools Sources panel shows your actual `.tsx` files. In production builds, you can upload source maps to an error tracker (lesson 20.5) without publishing them.

## Browser DevTools tour

Open DevTools with `F12` or `Ctrl/Cmd+Shift+I`. Practise each panel on your `vite-sandbox` app or any site.

### Elements
- Inspect any element (`Ctrl/Cmd+Shift+C`, then click it).
- **Styles pane**: every rule applied to the element, crossed out if overridden. **Edit values live**, toggle declarations with checkboxes, and add new rules. This is where you'll debug CSS.
- **Computed pane**: the final value of each property, and *which rule won*. There's also a box model diagram showing margin, border and padding.
- **Layout pane**: overlays for flex and grid. Turn on the grid overlay to see tracks and gaps.
- Force element states (`:hover`, `:focus-visible`) with the `:hov` button.

### Console
```js
console.log('xp', xp);                     // label your logs!
console.log({ xp, level, skillId });       // object shorthand prints names and values
console.table(inventoryArray);             // arrays of objects as a table
console.warn('…'); console.error('…');     // different levels, filterable
console.count('render');                   // counts how often a line runs. Great for re-renders
console.time('offline'); /*…*/ console.timeEnd('offline');   // quick timing
$0                                         // the element currently selected in Elements
copy(someObject)                           // copy as JSON to the clipboard
```

> ⚠️ `console.log(obj)` shows a **live reference**: if you expand it later, you see the *current* values, not the values at log time. Use `console.log(structuredClone(obj))` or `JSON.stringify(obj)` to capture a snapshot. This trips people up when debugging mutation bugs.

### Sources: breakpoints
**A breakpoint pauses your code on a line so you can inspect everything.** It's far more powerful than `console.log`:

- Click a line number to set a breakpoint, or write `debugger;` in your code.
- When paused, you get:
  - **Scope**: every local and closure variable, with its *current* value.
  - **Call stack**: how you got here. Click a frame to see its variables.
  - **Watch**: expressions re-evaluated at each step.
- Step controls: **Resume** (`F8`), **Step over** (`F10`, run this line), **Step into** (`F11`, go inside the function call), **Step out** (`Shift+F11`).
- **Conditional breakpoints** (right-click a line number): pause only when `skillId === 'fishing'`. This is essential in a game loop that runs 10 times a second.
- **Logpoints**: log a message *without* editing code.
- *Pause on caught/uncaught exceptions*: stops at the throw site.

### Network
- Every request: status, size, timing, initiator.
- Click a request to see its **Headers** (request and response, including cookies and CORS headers), **Payload** (what you sent), **Response** and **Timing**.
- **Throttling** ("Slow 4G", "Offline"): test your loading states and offline handling. Your cloud sync **must** survive this.
- **Preserve log**: keeps requests across page reloads and redirects.
- **Disable cache**, while DevTools is open.
- Right-click → **Copy as cURL** to replay a request in the terminal.

### Application
- **Local Storage / Session Storage / IndexedDB**: see your saves, edit them, delete them. Very useful for testing save migrations ("what happens with this old save?").
- **Cookies**: names, values, flags (`HttpOnly`, `Secure`, `SameSite`) and expiry. You'll debug auth here in Module 17.
- **Storage → Clear site data**: start fresh.
- **Service workers** and **Manifest**: for the PWA in Module 21.

### Performance
Record a few seconds of interaction to see what the main thread was doing:
- **Long tasks** (> 50 ms) are highlighted in red. These cause jank.
- A flame chart of function calls, time spent in scripting vs rendering vs painting, and frame rate.
- You'll use this in Module 14 to check your game stays smooth with ten updates a second.

### Lighthouse
Automated audits for performance, accessibility, best practices and SEO. Run it in an **incognito window** so extensions don't skew the results.

### Device mode and rendering
- Device toolbar (`Ctrl/Cmd+Shift+M`): phone sizes, touch emulation, throttled CPU.
- *More tools → Rendering*: emulate `prefers-color-scheme`, `prefers-reduced-motion`, and **paint flashing** (see what repaints).

## Debugging Node and tests in VS Code

- **JavaScript Debug Terminal**: Command Palette → "Debug: JavaScript Debug Terminal". Any `node` or `npm` command you run in it stops at your breakpoints.
- **Vitest extension**: in the Testing sidebar, click the debug icon next to a test. It runs the test with your breakpoints active. This is the best way to work out why an exercise test fails.

Try it now: put a breakpoint inside your solution to exercise `01-03`, then debug its test from the Testing sidebar.

## React DevTools (preview)

Install the **React Developer Tools** browser extension. It adds two panels:
- **Components**: the component tree, with each component's **props, state and hooks**, editable live.
- **Profiler**: records renders, shows which components re-rendered and **why**. You'll use it heavily in lessons 09.5 and 14.3.

Enable *"Highlight updates when components render"* in its settings to see re-renders flash on screen. In an idle game this is very revealing.

## Do it
- [ ] In `vite-sandbox`, set a breakpoint in the counter's click handler. Click, inspect the scope, and step through.
- [ ] Add a conditional breakpoint that only pauses when the count is 5.
- [ ] Throttle the network to "Offline" and reload. What do you see?
- [ ] Put something in `localStorage` from the console, find it in the Application panel, edit it, and delete it.
- [ ] Record a Performance profile while clicking the button quickly. Find your click handler in the flame chart.
- [ ] Debug an exercise test in VS Code using the Vitest extension.
- [ ] Install React DevTools and inspect the counter's state.

## Check your understanding

1. In a stack trace, which frame should you usually look at first?
2. Why can `console.log(state)` show values that were never there at the time of logging?
3. How would you pause the game loop only when the fishing skill ticks?
4. Where in DevTools would you check whether your session cookie has the `HttpOnly` flag?

<details><summary>Answers</summary>

1. The first (topmost) frame in *your own* code, then the one below it to see what was passed in.
2. The console logs a live reference. Expanding it later shows the object's *current* state, which might have been mutated since.
3. A conditional breakpoint in the tick function with a condition like `skillId === 'fishing'`.
4. Application → Cookies (or the Network tab → request → Cookies).
</details>

## Further reading
- Chrome DevTools docs: https://developer.chrome.com/docs/devtools
- Firefox DevTools User Docs: https://firefox-source-docs.mozilla.org/devtools-user/
- VS Code: [Debugging](https://code.visualstudio.com/docs/editor/debugging)

**🎉 That's Part 1 done.** Do the review below before starting React.

> **Part 1 review.** Before Module 06, re-do exercises `01-01`, `01-02` and `02-03` from scratch in a scratch folder, without looking at your old solutions. If any feel shaky, revisit those lessons. React builds directly on references, closures and discriminated unions.

---
[← Linting, formatting & type-checking](04-linting-formatting-and-typechecking.md) · [Module overview](README.md) · [Next module: React Fundamentals →](../06-react-fundamentals/README.md)
