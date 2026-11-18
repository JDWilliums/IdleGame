# 03.3 · The browser: DOM, events & storage

> ⏱ 120 min · Module 03 · How the Web Works

## What you'll learn
- Querying and changing the DOM by hand, which is what React does for you
- `textContent` vs `innerHTML`, and why the difference is a security issue
- Events: listeners, bubbling, delegation, `preventDefault`, and cleaning up
- Page lifecycle events an idle game needs (`visibilitychange`, `pagehide`)
- Every browser storage option, its limits, and why the **cloud** is the only safe place for a save

---

## Why learn the DOM if React handles it?

React *is* a DOM manipulation library. Knowing what it does underneath helps you:
- understand what React's re-rendering saves you from
- use refs to touch the DOM directly when you need to (focus, measuring, canvas)
- debug in DevTools' Elements panel
- answer interview questions ("what's event delegation?")

## Querying

```js
const app = document.getElementById('app');              // by id, Element | null
const firstCard = document.querySelector('.skill-card');   // first CSS-selector match | null
const cards = document.querySelectorAll('.skill-card');    // static NodeList of all matches
const inside = app.querySelector('button[data-action="sell"]');  // search within an element

cards.forEach((card) => console.log(card.dataset.skillId));  // data-skill-id="fishing" → dataset.skillId
```

## Creating and changing elements

```js
const li = document.createElement('li');
li.className = 'item';                 // or li.classList.add('item')
li.dataset.id = 'oak_log';             // → data-id="oak_log"
li.textContent = 'Oak Log ×30';        // set TEXT safely
li.setAttribute('aria-label', 'Oak Log, 30 in bank');

const list = document.querySelector('ul');
list.append(li);                       // add as last child
li.remove();                           // remove from the DOM
list.replaceChildren();                // remove ALL children
list.replaceChildren(a, b, c);         // replace children with these
```

Each change can trigger style recalculation, layout and paint. Batching changes (building elements first, then inserting them once) is faster. React does this kind of batching for you.

## ⚠️ `textContent` vs `innerHTML`

```js
const name = '<img src=x onerror="stealCookies()">';

el.textContent = name;   // ✅ shows the literal text <img src=x …>
el.innerHTML = name;     // ❌ creates an <img>, the onerror fires, and the attacker's code runs
```

`innerHTML` **parses** the string as HTML. If any part of it came from a user (a player name, a chat message, a guild description), you've created a **Cross-Site Scripting (XSS)** hole that can steal sessions and saves. Lesson 17.6 goes deeper.

**Rule: use `textContent` for text.** React escapes all text you render, so `{playerName}` in JSX is safe. Its escape hatch is called `dangerouslySetInnerHTML`, and the name is a warning.

## Events

```js
function handleClick(event) {
  console.log(event.type, event.target);
}
button.addEventListener('click', handleClick);
button.removeEventListener('click', handleClick);   // must be the SAME function reference
```

Common events: `click`, `input` (every keystroke in a field), `change`, `submit`, `keydown`, `pointerdown`/`pointerup` (mouse, touch and pen in one API), `focus`/`blur`, `scroll`, `resize`.

### The event object
- `event.target`: the element the event **started on** (could be a child).
- `event.currentTarget`: the element whose listener is **running now**.
- `event.preventDefault()`: cancel the browser's default behaviour (a form submitting and reloading the page, a link navigating).
- `event.stopPropagation()`: stop the event bubbling further. Use it sparingly.

### Bubbling

When you click a `<button>` inside an `<li>` inside a `<ul>`, the event fires on the button, then **bubbles up** to the `li`, the `ul`, and so on to `document`:

```
click ↓ (capture phase)         ↑ (bubble phase, which is where your listeners normally run)
document → body → ul → li → button
```

### Event delegation

Instead of adding a listener to each of 500 inventory buttons, add **one** to their container and work out which button was clicked:

```js
list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="sell"]');
  if (!button || !list.contains(button)) return;       // clicked something else
  const itemId = button.closest('li').dataset.id;
  sell(itemId);
});
```

Benefits: one listener, and it works for items **added later** without re-binding. React uses delegation internally: it attaches listeners at the root of your app.

### Always clean up listeners

A listener keeps its callback (and everything that callback's closure references) alive. If you attach listeners repeatedly without removing them, you get **memory leaks and duplicate handlers**. A good pattern is for the setup function to **return its own cleanup**:

```js
function listenForShortcuts(target, onSave) {
  function onKeyDown(event) {
    if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSave();
    }
  }
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);   // cleanup
}

const stop = listenForShortcuts(window, saveGame);
// later…
stop();
```

Keep that shape in mind: **setup returns cleanup**. React's `useEffect` uses exactly this pattern (lesson 07.4).

An alternative is `AbortController`: `target.addEventListener('keydown', fn, { signal: controller.signal })`, and `controller.abort()` removes every listener registered with that signal.

## Page lifecycle events for an idle game

```js
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveGame();             // the user switched tabs/apps, so they may never come back
  } else {
    catchUpOfflineProgress();
  }
});

window.addEventListener('pagehide', () => saveGame());   // the page is being unloaded or cached
```

- `visibilitychange` → `hidden` is the **most reliable** "the user is leaving" signal, especially on mobile, where `beforeunload` and `unload` often **don't fire** at all.
- Avoid the `unload` event. It's unreliable and stops the page using the back/forward cache.

Lessons 14.4 and 18.2 build on these.

## Browser storage

Everything here is stored **per origin**: `https://game.example.com` can't read `https://other.com`'s data.

| | Capacity | API | Sent to server? | Good for |
|---|---|---|---|---|
| **Cookies** | ~4 KB each | `Set-Cookie` header (or `document.cookie`) | ✅ automatically, with every request | session ids |
| **localStorage** | ~5 MB | sync: `getItem`/`setItem` (strings only) | ❌ | small settings, a local save copy |
| **sessionStorage** | ~5 MB | same as localStorage | ❌ | per-tab, cleared when the tab closes |
| **IndexedDB** | large (a share of disk) | async, transactional, stores objects | ❌ | bigger saves, offline data |
| **Cache API** | large | async, request → response | ❌ | service worker offline files (21.1) |

```js
localStorage.setItem('settings', JSON.stringify({ volume: 0.8 }));
const raw = localStorage.getItem('settings');               // string | null
const settings = raw ? JSON.parse(raw) : defaultSettings;   // validate it! (02.7)
localStorage.removeItem('settings');
```

Things to know:
- `localStorage` is **synchronous**, so a big write blocks the main thread. Keep writes small and infrequent.
- `setItem` can **throw** (`QuotaExceededError`) when storage is full, or in some private-browsing modes. Wrap it in `try/catch`.
- The `storage` event fires in **other tabs** when one tab changes `localStorage`. You'll use this to detect the game being open twice (lesson 14.4).

### Why local storage isn't enough for your game

Local storage can disappear:
- **Safari (iOS and macOS) may delete script-writable storage**, including `localStorage` and IndexedDB, for sites the user hasn't interacted with in **7 days**. (Installed home-screen PWAs get better treatment.)
- Users clear site data, use private mode, or the browser evicts data when the disk is nearly full.
- It's tied to **one browser on one device**, so your phone and laptop can't see each other's saves.

`navigator.storage.persist()` asks the browser to protect your data, and some browsers grant it. Treat that as a bonus, not a guarantee. **The only durable, cross-device home for a save is your server**, which is why Modules 15–18 exist. The local copy is a cache that makes the game work offline and load instantly.

## Check your understanding

1. In a delegated click listener on a `<ul>`, why use `event.target.closest(...)` instead of just `event.target`?
2. Why won't `removeEventListener('click', () => doThing())` remove a listener added with `addEventListener('click', () => doThing())`?
3. Which event is the most reliable signal that a mobile user is leaving your game?
4. Give three reasons a player's `localStorage` save could vanish.

<details><summary>Answers</summary>

1. The click might land on a child of the button (an icon `<span>` inside it). `closest` walks up from the target to find the nearest matching ancestor, or the element itself.
2. Each arrow function is a **new function object**. Removal needs the *same reference* that was added.
3. `visibilitychange`, when `document.visibilityState` becomes `'hidden'`.
4. Any three of: Safari's 7-day eviction of script-writable storage, the user clearing site data, private browsing, storage pressure eviction, switching device or browser.
</details>

## Further reading
- MDN: [Introduction to the DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction)
- MDN: [Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)
- MDN: [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- MDN: [Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- WebKit blog: *"Full Third-Party Cookie Blocking and More"* (2020), the post that introduced the 7-day storage cap

**Practice:** exercise `03-03` vanilla-dom → `npm run watch 03-03`

---
[← HTTP in depth](02-http-in-depth.md) · [Module overview](README.md) · [Next: fetch, JSON & CORS →](04-fetch-json-and-cors.md)
