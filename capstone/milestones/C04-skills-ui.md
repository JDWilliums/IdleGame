# C04 · Skills UI & live progress

> ⏱ ~10 hours · Lessons: 13.6, 13.9, 14.2–14.3, 09.5, 21.4 · Course exercises to reuse: 14-01, 14-02, 09-04, 13-07

## Why
This is the screen players stare at most. It needs to feel alive (smooth bars, satisfying feedback) while doing almost no work per frame, so it stays fast on a cheap phone and announces the right things to screen readers.

## User stories

### US-1 · The skills overview
*As a player, I want to see all my skills at a glance.*

**Acceptance criteria**
- [ ] A list or grid of the five skills: icon, name, level, an XP bar to the next level, and XP as text ("1,154 / 1,358 XP").
- [ ] The skill currently being trained is highlighted, with its action name.
- [ ] Total level is shown at the top.
- [ ] Tapping a skill opens its page (`/skills/:skillId`).

### US-2 · A skill's page
*As a player, I want to choose what to do within a skill, and see what I'll unlock next.*

**Acceptance criteria**
- [ ] Each action shows its name, time, XP and outputs. Locked actions show "Requires level 15", greyed **and** with text (not colour alone).
- [ ] A Start button for each available action, and a Stop button for the active one. Buttons have accessible names ("Start Oak Tree").
- [ ] The next unlock is shown ("Next: Willow Tree at level 15").

### US-3 · Smooth, cheap progress
*As a player, I want progress bars that move smoothly without draining my battery.*

**Acceptance criteria**
- [ ] The active action's bar moves smoothly using **transient updates** (a ref and a CSS custom property, 14-02). React doesn't re-render every frame.
- [ ] A slim global progress bar under the header shows the current action on **every** screen.
- [ ] The bars expose `role="progressbar"` with a label and a value that updates in steps (e.g. every 10%), not every frame (21.4).
- [ ] With `prefers-reduced-motion`, bars jump in steps instead of sweeping.

### US-4 · Feedback
*As a player, I want to feel my progress.*

**Acceptance criteria**
- [ ] Item gains show a brief "+1 Oak Log" indicator (combined if several arrive at once).
- [ ] Level-ups show a toast, and unlocks show "New: Willow Tree".
- [ ] **Announcements**: level-ups and unlocks go to a polite live region that's present from page load, **throttled** so several events within a second or two become one message (21.4). Item gains are not announced.

### US-5 · Performance
*As a player on an old phone, I want the game to stay responsive.*

**Acceptance criteria**
- [ ] Components select primitives (14.3). A test shows the skills list **does not** re-render on ticks that don't change a level (use a render counter, as in 09-04).
- [ ] A 20-second Performance recording on a 4× throttled CPU shows no long tasks while an action runs.

## Tests to write
- Selectors: level progress, total level, next unlock.
- Skill page: Start disabled for locked actions, with the requirement text; starting an action shows Stop.
- The announcer: several events within the throttle window produce one combined message (fake timers).
- Render-count test for the skills list.

## Hints (directions, not code)
- One subscription per progress bar (14-02), selecting just the active action's progress fraction.
- Big numbers go through your 13-07 formatter. Give them a full-value accessible label where they're abbreviated.
- The announcer is a tiny module outside React: it collects messages and flushes them to the live region at most every N ms. Unit-test it on its own.

## Lessons to revisit
09.5 (performance) · 13.9 (number formatting) · 14.3 (fast updates) · 21.4 (progress bars and live regions)

## Stretch goals
- XP per hour and "time to next level" on each action.
- A tiny particle effect on level-up (respecting reduced motion).

## Demo
A short screen recording (a GIF in the README) of an action running and a level-up.

---
[← C03](C03-app-shell.md) · [Capstone overview](../README.md) · [Next: C05 · Bank & items →](C05-bank-and-items.md)
