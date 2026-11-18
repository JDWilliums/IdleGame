# 04.1 · Semantic HTML & accessibility

> ⏱ 2 hours · Module 04 · HTML & CSS, Mobile-First

## What you'll learn
- The skeleton of a modern HTML document, including the viewport meta tag
- Semantic elements and landmarks, and why they matter
- Headings, lists, buttons vs links
- Accessible forms and images
- The basics of ARIA, and why "no ARIA is better than bad ARIA"

---

## The document skeleton

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>Hearthwild — Idle RPG</title>
    <meta name="description" content="An idle RPG you can play anywhere." />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <!-- content -->
    <script type="module" src="main.js"></script>
  </body>
</html>
```

- `lang="en"` tells screen readers which pronunciation to use.
- **The viewport meta tag is essential for mobile.** Without it, phones pretend to be about 980px wide and shrink your page to fit, so everything is tiny. `width=device-width` says "lay out at the device's real width". `viewport-fit=cover` lets you use the full screen, including behind notches (lesson 04.5).

## Semantic elements

**Semantic** HTML means choosing elements for their *meaning*, not their looks. A `<div>` means nothing. A `<nav>` means "navigation".

```html
<body>
  <header>              <!-- site/app header: logo, account menu -->
    <h1>Hearthwild</h1>
  </header>
  <nav aria-label="Main">   <!-- main navigation -->
    <ul>
      <li><a href="/skills">Skills</a></li>
      <li><a href="/bank">Bank</a></li>
    </ul>
  </nav>
  <main>                <!-- the primary content; ONE per page -->
    <section aria-labelledby="skills-heading">
      <h2 id="skills-heading">Skills</h2>
      <article class="skill-card">…</article>   <!-- self-contained item -->
    </section>
  </main>
  <aside>…</aside>      <!-- tangential content: activity log, tips -->
  <footer>…</footer>
</body>
```

Why it matters:
- **Screen reader users** jump between *landmarks* (`header`, `nav`, `main`, `aside`, `footer`) and *headings*, the way sighted users scan a page.
- **Keyboard users** get correct focus behaviour for free with native controls.
- **SEO** and browser features (reader mode, translation) work better.
- **Your future colleagues** can read the structure.

## Headings

Use `<h1>`–`<h6>` for **structure**, not size: one `<h1>` per page, and don't skip levels (`h2` → `h4`). Style them however you like with CSS.

## Lists

If it's a list of things (nav links, skills, inventory items, log entries), use `<ul>`/`<ol>` with `<li>`. Screen readers announce "list, 8 items", which is helpful context.

## Buttons vs links: the most important rule

| Use | When | Keyboard |
|---|---|---|
| `<a href="/bank">` | it **navigates** somewhere (a URL changes) | Enter |
| `<button type="button">` | it **does** something here (sell, start, open, toggle) | Enter **and** Space |

```html
<!-- ❌ never: not focusable, not announced as a button, no keyboard support -->
<div class="btn" onclick="sell()">Sell</div>

<!-- ✅ -->
<button type="button" class="btn">Sell</button>
```

A `<button>` gives you focusability, keyboard activation, the correct role for screen readers and disabled support, all for free. Rebuilding that on a `<div>` takes dozens of lines and you'll still miss something.

> `type="button"` matters: inside a `<form>`, a button defaults to `type="submit"` and will submit the form.

## Forms

```html
<form action="/login" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" required />

  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required minlength="8" />

  <button type="submit">Log in</button>
</form>
```

- **Every input needs a label.** `<label for="id">` links it, and clicking the label focuses the input. Placeholder text is **not** a label: it disappears when you type and often has poor contrast.
- **The right `type`** gives mobile users the right keyboard: `email` shows `@`, `number`/`inputmode="numeric"` shows digits, and `search` shows a search key.
- **`autocomplete`** lets password managers work. `new-password` on sign-up, `current-password` on login.
- Built-in validation (`required`, `minlength`, `type="email"`) is a good baseline. You'll add proper validation in Module 10.

## Images

```html
<img src="oak-tree.webp" alt="An oak tree" width="64" height="64" />
<img src="divider.svg" alt="" />  <!-- decorative: empty alt so screen readers skip it -->
```

- `alt` describes the image's **purpose** in context. For an icon button, label the *button* instead:
  ```html
  <button type="button" aria-label="Close"><svg aria-hidden="true">…</svg></button>
  ```
- `width`/`height` attributes let the browser reserve space before the image loads, which prevents layout shift (lesson 21.3).

## Accessibility basics (a11y)

About 1 in 6 people have some form of disability. Accessibility is also a **legal requirement** for many companies (the EU Accessibility Act, the ADA in the US), so interviewers do ask about it. The core ideas:

1. **Perceivable**: text alternatives, sufficient colour contrast (4.5:1 for normal text), and don't convey information by colour alone ("red = low HP" also needs a number or icon).
2. **Operable**: everything works with a keyboard, focus is visible, and there are no keyboard traps.
3. **Understandable**: clear labels, predictable behaviour, helpful error messages.
4. **Robust**: valid, semantic HTML that assistive tech can interpret.

### Focus
Press `Tab` through any page you build. Can you reach every control? Can you *see* where focus is? Never do `outline: none` without providing a replacement:

```css
:focus-visible {            /* keyboard focus only, so mouse clicks don't show a ring */
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
```

### ARIA: use it sparingly
ARIA attributes (`role`, `aria-label`, `aria-expanded`, `aria-live`…) add accessibility information when HTML alone can't express it. The **first rule of ARIA**: if a native element does the job, use it instead. Bad ARIA is worse than none.

Useful ones you'll actually use:
- `aria-label`: a name for elements without visible text (icon buttons).
- `aria-labelledby`: point at visible text that names this element.
- `aria-expanded="true|false"`: on a button that toggles a menu or panel.
- `aria-current="page"`: on the nav link for the current page.
- `aria-live="polite"`: announce updates, e.g. "Level up! Woodcutting is now level 15".
- `aria-hidden="true"`: hide decorative things from screen readers.

```html
<div aria-live="polite" class="sr-only" id="announcer"></div>
<!-- set its textContent to "Woodcutting level 15!" when it happens -->
```

### Visually hidden but readable text
```css
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0;
}
```

### Progress bars
Your game is full of them. The native element is accessible out of the box:

```html
<label for="chop-progress">Chopping oak</label>
<progress id="chop-progress" max="100" value="40">40%</progress>
```

You can style `<progress>`, or build a custom bar with `role="progressbar"`, `aria-valuenow`, `aria-valuemin` and `aria-valuemax`.

## Check your understanding

1. What does the viewport meta tag do, and what happens without it?
2. A "Start fishing" control: `<a>` or `<button>`? A "View bank" control that changes the URL?
3. Why isn't `placeholder` a substitute for `<label>`?
4. What's the first rule of ARIA?
5. How would you make an icon-only "Settings" button accessible?

<details><summary>Answers</summary>

1. It tells mobile browsers to lay the page out at the device's actual width. Without it, they render at roughly 980px and zoom out, so text is tiny and media queries don't behave as expected.
2. "Start fishing" is an action, so a `<button>`. "View bank" navigates, so an `<a href>`.
3. It vanishes as soon as the user types, it's often low-contrast, and it isn't reliably announced as the field's name.
4. Don't use ARIA if a native HTML element or attribute can do the job.
5. `<button type="button" aria-label="Settings"><svg aria-hidden="true">…</svg></button>`
</details>

## Further reading
- MDN: [HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements)
- MDN: [Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- web.dev: [Learn Accessibility](https://web.dev/learn/accessibility) (a free course)
- The A11Y Project checklist: https://www.a11yproject.com/checklist/

---
[Module overview](README.md) · [Next: Box model, display & positioning →](02-box-model-display-and-positioning.md)
