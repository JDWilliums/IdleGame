# 21.4 · Accessibility in depth

> ⏱ 2.5 hours · Module 21 · PWA, Performance & Accessibility

## What you'll learn
- WCAG 2.2 and the POUR principles
- Keyboard access and focus management, including dialogs
- Accessible progress bars, numbers and status for a game
- Live regions: announcing level-ups without announcing every tick
- Colour, contrast and motion
- Testing with axe, keyboards and real screen readers

---

## Why it matters

About one in six people has a disability, and everyone is temporarily impaired sometimes: one hand holding a bus rail, sunlight on the screen, a broken mouse. An idle game is unusually well suited to accessibility. There are no reflexes or timing required, just reading, deciding and tapping. That makes it a game that blind players, players with motor impairments and players using switch devices can genuinely enjoy, **if** it's built properly.

There's a career angle too. Accessibility is a legal requirement for many products (the European Accessibility Act has applied to many digital products and services sold in the EU since June 2025, and similar laws exist elsewhere), and it's a common interview topic. You covered the foundations in 04.1 and 11.4. This lesson goes deeper, with the game in mind.

## WCAG and POUR

The **Web Content Accessibility Guidelines** (WCAG 2.2) are the standard. Most organisations target **level AA**. Its criteria group under four principles:

- **Perceivable**: information isn't only visual, or only colour, or only sound (text alternatives, contrast, captions).
- **Operable**: everything works by keyboard and other inputs, with enough time and no seizure triggers.
- **Understandable**: predictable behaviour, clear labels, helpful errors.
- **Robust**: real semantic HTML that assistive technology can interpret.

## Keyboard and focus

Every action in the game must work with **Tab**, **Shift+Tab**, **Enter**, **Space**, arrow keys and **Escape**.

- Use real `<button>`s and `<a>`s. They're focusable and keyboard-operable for free. A `<div onClick>` is neither.
- Keep the **focus outline** visible. If you restyle it, use `:focus-visible`, so it shows for keyboard users without appearing on mouse clicks.
- **Tab order follows the DOM order.** Don't fight it with positive `tabindex` values.
- Add a "Skip to main content" link as the first focusable element.

### Dialogs
The conflict dialog (18.3) and confirmations ("Sell 500 logs?") must:

1. move focus into the dialog when it opens,
2. keep focus inside while it's open,
3. close on Escape, and
4. return focus to the button that opened it when it closes.

The native `<dialog>` element does nearly all of this:

```tsx
function ConfirmDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();    // modal: focus moves in, the rest of the page is inert
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="confirm-title">
      {children}
    </dialog>
  );
}
```

`showModal()` traps focus, makes the background inert, handles Escape (firing `close`), and modern browsers restore focus to the previously focused element on close. It's far more reliable than a hand-made overlay `div`.

## Game UI semantics

### Progress bars
A skill's action progress should be readable without seeing it:

```tsx
<div
  role="progressbar"
  aria-label="Chopping oak logs"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(progress * 100)}
/>
```

Or use the native `<progress max={100} value={…}>`. For the XP bar, add a text value next to it ("1,154 / 1,358 XP"), which helps everyone.

With transient updates (14.3), the visual bar moves smoothly via CSS without React. Update `aria-valuenow` only occasionally (every 10%, say), not 60 times a second, or you'll drown screen readers in changes and waste CPU.

### Numbers
`1.2M` is compact visually, but screen readers may read "one point two em". Provide the full meaning:

```tsx
<span aria-label="1,234,567 gold">1.2M</span>
```

(`aria-label` works on elements with a role. For plain text, render the full value in a visually hidden span and hide the compact one with `aria-hidden="true"`.)

### Icons
Decorative icons get `aria-hidden="true"`. Icon-only buttons need an accessible name: `<button aria-label="Sell all oak logs">`.

## Live regions: announcing, sparingly

When something important happens without the player acting, such as a level-up, a full bank or a sync problem, screen reader users need to hear it. A **live region** is announced when its content changes:

```tsx
<div aria-live="polite" className="visually-hidden">{announcement}</div>
```

- `polite` waits until the screen reader is idle. Use `assertive` (or `role="alert"`) only for urgent things, like "Sync conflict: choose a save".
- The region must **already be in the page** before you change its text. A newly added element with `aria-live` often isn't announced.

**The idle-game trap**: the game produces events constantly ("+1 oak log", "+25 XP"). Announcing each one makes the game unusable with a screen reader. Announce only **milestones** (level-ups, inventory full, an action stopped because you ran out of materials), and **throttle** them, combining several into one message ("Fishing level 12. Cooking level 8."). Give players a setting to choose what's announced.

## Colour, contrast and motion

- **Contrast**: at least 4.5:1 for normal text and 3:1 for large text and UI components (WCAG AA). Check your palette in DevTools' colour picker, which shows the ratio, in **both** light and dark themes.
- **Not colour alone**: "red means you can't afford it" fails for colour-blind players. Add a label, an icon or text ("Need 40 more gold").
- **Motion**: honour `prefers-reduced-motion` (11.4). Turn off decorative animation, and keep progress bars changing in steps rather than sweeping smoothly.
- **Text size**: use `rem` units so the player's browser font-size setting works, and check the layout at 200% zoom.

## Testing

Automated tools find about a third of accessibility problems: the mechanical ones (missing labels, contrast, invalid ARIA). Use them, then test by hand.

### Automated
- **axe** in Playwright (12.5), so CI fails on regressions:
  ```ts
  import AxeBuilder from '@axe-core/playwright';

  test('skills page has no detectable a11y violations', async ({ page }) => {
    await page.goto('/skills');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
  });
  ```
- Lighthouse's accessibility audit, and the axe DevTools browser extension, while you develop.
- Testing Library queries (12.3): if you can find it with `getByRole('button', { name: 'Sell all' })`, it has the right role and name.

### Manual (do these before C12)
- **Keyboard only**: unplug the mouse and play for ten minutes. Can you do everything? Can you always see where focus is?
- **Screen reader**: VoiceOver on macOS and iOS (built in), NVDA on Windows (free), TalkBack on Android. Learn five commands and try the core loop: choose a skill, start an action, check the bank, handle a level-up.
- **Zoom**: 200% browser zoom, and a phone with large text settings.

## Check your understanding

1. What are the four POUR principles?
2. What four things must a modal dialog do, and what does `<dialog>` with `showModal()` give you?
3. How do you make an action's progress bar accessible, and why not update `aria-valuenow` every frame?
4. Why must a live region exist in the page before you change its text?
5. Why shouldn't the game announce every "+1 oak log"? What should it announce?
6. "Red means unaffordable." What's wrong with that, and how do you fix it?
7. What can automated testing catch, and what does it miss?

<details><summary>Answers</summary>

1. Perceivable, Operable, Understandable, Robust.
2. Move focus in, trap it inside, close on Escape, and return focus to the trigger on close. `showModal()` does the focus move, the trap (an inert background) and Escape, and browsers restore focus on close.
3. Use `role="progressbar"` with a label and value attributes (or `<progress>`), plus a visible text value. Updating every frame floods assistive technology with changes and wastes CPU, so update in steps.
4. Screen readers watch existing live regions for changes. A region added at the same moment as its content is often not announced.
5. It would make the game impossible to use with a screen reader. Announce milestones (level-ups, full inventory, stopped actions), throttled and combined, with a setting for what's announced.
6. It relies on colour alone, which colour-blind players can't distinguish. Add text, an icon or a label explaining the state.
7. Mechanical issues such as missing names, contrast and invalid ARIA (roughly a third of problems). It misses whether things make sense, whether the focus order is logical, whether announcements are useful, and whether the game is actually playable without sight or a mouse.
</details>

## Further reading
- W3C: "WCAG 2.2 at a glance" and the "How to Meet WCAG" quick reference
- MDN: `<dialog>`, ARIA live regions, `role="progressbar"`
- The A11Y Project checklist (a11yproject.com/checklist)
- "Game Accessibility Guidelines" (gameaccessibilityguidelines.com)

---
[← Web performance](03-web-performance.md) · [Module overview](README.md) · [Part 6 · The capstone →](../../capstone/README.md)
