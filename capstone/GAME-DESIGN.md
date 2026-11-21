# Hearthwild · Game design document

> Version 1.0 · Owner: you · Status: ready for development
>
> This is the "what" of the game. [ARCHITECTURE.md](ARCHITECTURE.md) is the "how". Treat it like a design doc at work: build what it says, and when you disagree with something, change it **on purpose** and write down why (an ADR, 19.3). The numbers are a starting point. You'll balance them as you play.

---

## 1. The pitch

*You've settled at the edge of a wild valley with nothing but a small fire. Gather from the forest, river and hills, turn what you find into tools and food, keep the Hearth burning, and venture out to face what lives in the wilds. Your village grows whether you're watching or not, and it's waiting for you on whichever device you pick up next.*

**Genre:** idle RPG (13.1) · **Platforms:** mobile web first, desktop web, installable PWA · **Session length:** 1–5 minutes, many times a day

## 2. Design pillars

Every decision should support these. When two ideas compete, the one that fits the pillars wins.

1. **Respect the player's time.** Progress continues offline. There are no punishing timers, no daily-login guilt and no notifications the player didn't ask for.
2. **Always something to look forward to.** A new unlock, item or level is never far away.
3. **Readable at a glance.** On a phone, in two seconds, you can see what you're doing, how far along it is and what's next.
4. **Your progress is safe.** Saves are local-first, sync across devices, and are never silently overwritten (Module 18).
5. **Fair and accessible.** No pay-to-win, no dark patterns, fully playable with a keyboard or a screen reader.

## 3. Core loop

```
 choose a skill ─► start an action ─► time passes (even offline) ─► items + XP
       ▲                                                              │
       │                                                              ▼
  unlock better ◄── level up / buy tools / upgrade the Hearth ◄── sell, cook, smelt, fight
  actions
```

- Only **one action runs at a time** (one skill active). Choosing what to do is the main decision.
- Actions **repeat** automatically until the player stops them, the bank is full, or a processing action runs out of inputs.

## 4. Skills

Five skills at launch, in three groups:

| Group | Skills | How they work |
|---|---|---|
| **Gathering** | Woodcutting 🪓, Fishing 🎣, Mining ⛏️ | actions produce items from nothing |
| **Processing** | Smithing 🔨, Cooking 🍳 | actions consume items and produce better ones |
| **Combat** | Combat ⚔️ | fighting monsters gives XP and loot (C11) |

- **Levels 1–99**, with the XP curve from 13.6 (level 2 = 83 XP, level 99 = 13,034,431 XP).
- Each action has a **level requirement**. Reaching it unlocks the action, with a celebration and an announcement.
- **Total level** (the sum of all skill levels) is shown on the profile and the leaderboard (C09).

### 4.1 Woodcutting
| Action | Level | Time | XP | Output |
|---|---|---|---|---|
| Oak Tree | 1 | 3.0 s | 10 | 1 Oak Log |
| Willow Tree | 15 | 4.0 s | 25 | 1 Willow Log |
| Maple Tree | 30 | 5.0 s | 45 | 1 Maple Log |
| Yew Tree | 60 | 7.0 s | 110 | 1 Yew Log |

### 4.2 Fishing
| Action | Level | Time | XP | Output |
|---|---|---|---|---|
| Minnow Shallows | 1 | 3.0 s | 10 | 1 Raw Minnow |
| Trout Stream | 15 | 4.0 s | 25 | 1 Raw Trout |
| Salmon Run | 30 | 5.0 s | 45 | 1 Raw Salmon |
| Pike Pool | 50 | 6.0 s | 80 | 1 Raw Pike |

### 4.3 Mining
| Action | Level | Time | XP | Output |
|---|---|---|---|---|
| Copper Vein | 1 | 3.0 s | 10 | 1 Copper Ore |
| Tin Vein | 1 | 3.0 s | 10 | 1 Tin Ore |
| Iron Vein | 20 | 4.0 s | 30 | 1 Iron Ore |
| Coal Seam | 30 | 5.0 s | 40 | 1 Coal |
| Gold Vein | 45 | 6.0 s | 70 | 1 Gold Ore |

### 4.4 Smithing (processing)
| Action | Level | Time | XP | Inputs | Output |
|---|---|---|---|---|---|
| Bronze Bar | 1 | 2.5 s | 8 | 1 Copper Ore, 1 Tin Ore | 1 Bronze Bar |
| Iron Bar | 20 | 3.0 s | 20 | 1 Iron Ore | 1 Iron Bar |
| Steel Bar | 35 | 4.0 s | 35 | 1 Iron Ore, 2 Coal | 1 Steel Bar |
| Gold Bar | 45 | 4.0 s | 50 | 1 Gold Ore | 1 Gold Bar |
| Bronze Dagger | 5 | 3.0 s | 15 | 2 Bronze Bars | 1 Bronze Dagger (C11) |
| Iron Sword | 25 | 4.0 s | 40 | 3 Iron Bars | 1 Iron Sword (C11) |
| Steel Sword | 40 | 5.0 s | 80 | 3 Steel Bars | 1 Steel Sword (C11) |

### 4.5 Cooking (processing)
| Action | Level | Time | XP | Input | Output | Heals (C11) |
|---|---|---|---|---|---|---|
| Cook Minnow | 1 | 2.0 s | 8 | 1 Raw Minnow | 1 Cooked Minnow | 3 HP |
| Cook Trout | 15 | 3.0 s | 20 | 1 Raw Trout | 1 Cooked Trout | 7 HP |
| Cook Salmon | 30 | 3.0 s | 35 | 1 Raw Salmon | 1 Cooked Salmon | 12 HP |
| Cook Pike | 50 | 4.0 s | 60 | 1 Raw Pike | 1 Cooked Pike | 18 HP |

*Stretch (C06):* a **burn chance** that falls as Cooking level rises (e.g. 30% at the action's required level, down to 0% fifteen levels later). Burnt food is "Charcoal Scraps", worth 0 gold. This uses the seeded RNG from 13.7.

## 5. Items

Every item has an id (`snake_case`), a name, an icon, a category and a sell price.

| Category | Items (sell price in gold) |
|---|---|
| Logs | Oak Log 1 · Willow Log 4 · Maple Log 10 · Yew Log 30 |
| Raw fish | Raw Minnow 1 · Raw Trout 4 · Raw Salmon 9 · Raw Pike 20 |
| Food | Cooked Minnow 2 · Cooked Trout 7 · Cooked Salmon 14 · Cooked Pike 30 |
| Ores | Copper Ore 2 · Tin Ore 2 · Iron Ore 6 · Coal 8 · Gold Ore 20 |
| Bars | Bronze Bar 7 · Iron Bar 15 · Steel Bar 40 · Gold Bar 60 |
| Weapons | Bronze Dagger 20 · Iron Sword 60 · Steel Sword 180 |
| Loot (C11) | Wolf Pelt 15 · Bandit Coin Pouch 40 · Troll Tooth 120 · and so on, defined with each monster |

Icons can be emoji to start (🪵 🐟 🪨 🧱 🗡️) and SVGs later. Every icon needs a text name for accessibility (21.4).

## 6. The bank

- Each **distinct** item uses one **slot**, whatever its quantity. Quantities have no limit.
- Players start with **40 slots**. More are bought in the shop (C10).
- When the bank is full and an action produces a **new** item, the action **stops**, and the player sees and hears why ("Bank full: sell something or buy more space").
- The player can **sell** one, a chosen quantity, or all of an item. "Sell all" for anything worth over 1,000 gold asks for confirmation.
- Sorting: by category (the default), name, quantity or value. Filtering: by category, plus a text search.

## 7. Gold, the shop and the Hearth

### 7.1 Tools (C10)
One tool slot per gathering skill. A better tool makes that skill's actions faster.

| Tool tier | Cost | Requires | Effect |
|---|---|---|---|
| Bronze axe / pickaxe / rod | 50 g | level 1 | actions take 10% less time |
| Iron axe / pickaxe / rod | 600 g | level 20 | 20% less time |
| Steel axe / pickaxe / rod | 6,000 g | level 40 | 30% less time |

Tools are bought once and kept. Equipping one replaces the previous tier, so tools never take bank slots.

### 7.2 Bank space (C10)
+10 slots per purchase. The first costs 100 gold, and each one after costs 1.6× the last, rounded to the nearest 10 gold.

### 7.3 The Hearth (C10): Hearthwild's signature mechanic
The village fire grows as you feed it, and a warmer village works harder. Each Hearth level needs a donation of materials from the bank, and gives a **permanent +2% XP to all skills** (up to level 10 = +20%).

| Hearth level | Donation |
|---|---|
| 1 → 2 | 50 Oak Logs |
| 2 → 3 | 100 Oak Logs, 20 Bronze Bars |
| 3 → 4 | 150 Willow Logs, 40 Cooked Trout |
| 4 → 5 | 200 Willow Logs, 60 Iron Bars |
| 5 → 10 | defined by you: escalate gently, using later-tier materials |

It turns every skill's output into a long-term goal, and it gives the main screen a growing fire to look at. It's the visual heart of the game (the name says so).

## 8. Combat (C11)

Deliberately simple. It's an idle game, not an action game.

- The player picks an **area**, then a **monster**. Fighting is automatic and repeats like an action.
- **Player stats**: max HP = `10 + combat level`. Attack = weapon power (fists: 1). Hit chance and damage formulas are defined in [C11](milestones/C11-combat.md).
- **Food**: the player selects one food stack. When HP falls below 50%, the player eats one automatically (it takes no time).
- **Defeat**: at 0 HP the fight stops, HP refills, and nothing is lost. A gentle game.
- **Loot**: each monster has a **loot table** (13.7): always some gold, plus weighted item drops.

| Area | Monster | Level | HP | Max hit | Attack speed | XP | Loot highlights |
|---|---|---|---|---|---|---|---|
| Meadow | Field Rat | 1 | 5 | 1 | 2.4 s | 8 | 1–3 gold |
| Meadow | Wild Boar | 5 | 12 | 2 | 2.8 s | 18 | 2–6 gold, Raw Pike (rare) |
| Old Forest | Grey Wolf | 12 | 25 | 4 | 2.4 s | 40 | Wolf Pelt |
| Old Forest | Bandit | 20 | 40 | 6 | 3.0 s | 70 | Bandit Coin Pouch, Iron Ore |
| Deep Caves | Cave Troll | 35 | 90 | 12 | 3.6 s | 160 | Troll Tooth, Coal, Gold Ore |

**Offline combat** uses expected values (13.8) rather than simulating every hit, and it must respect food: if the food would run out, the fight stops at that point.

## 9. Offline progress

- On return, the current action (or fight) runs for the time away, **capped at 12 hours** (13.8).
- A **"While you were away…"** summary shows the time away, XP gained per skill, items gained and used, and any reason the action stopped (bank full, out of inputs, food ran out).
- Offline time is measured with **server time** when online (18.4).

## 10. Saves, accounts and devices

- New players play immediately as a **guest**, with a local save (18.2).
- An optional **account** (username + password) adds cloud saves and sync. The game suggests it once there's progress worth protecting.
- Saves sync automatically (18.5). Conflicts are resolved by the player with a clear choice, and the other save is kept as a backup (18.3).
- **Export / import** a save as text (13.10) is always available, even without an account.
- Settings (sound, notifications, announcements, reduced motion) are part of the save, so they sync too.

## 11. Leaderboard (C09)

- Top 100 per skill, and by total level.
- Only saves that pass the server's plausibility checks count (18.4).
- Players can opt out of appearing on it.

## 12. Pacing targets

Use these to sanity-check your numbers (build a spreadsheet, 13.1):

| Milestone | Roughly, with the numbers above |
|---|---|
| First level-up | under 1 minute |
| Level 10 in a gathering skill | 5–10 minutes |
| Level 15 (the second tier unlocks) | about 15 minutes |
| Hearth level 2 | in the first session |
| Level 30 | about an hour of active play |
| First iron tool | the first or second session |
| Level 50 in one skill | an afternoon of active play, or a few days of checking in |
| Level 99 in one skill | a few weeks of regular check-ins |

That's quick for an idle game, which is deliberate: it lets you (and people trying your portfolio) see every system in a reasonable time. If you want a longer game, lower the XP values. The XP curve (13.6) does the rest.

## 13. Look and feel

- Warm and calm: firelight oranges, forest greens, parchment backgrounds. Dark theme by default, with a light theme (11.3).
- Mobile: a bottom tab bar (Skills · Bank · Shop · Combat · More). Desktop: a sidebar (21.2).
- The current action's progress is always visible on every screen (a slim bar under the header).
- Satisfying, small feedback: "+1 Oak Log" floats up, a level-up glows. All of it respects reduced motion.
- Sound is optional, off by default.

## 14. Accessibility requirements

- WCAG 2.2 AA (21.4): contrast, keyboard access, visible focus, 44 px touch targets.
- Progress bars expose their values. Big numbers have full-value labels.
- Announcements only for milestones (level-ups, unlocks, bank full, an action stopped), throttled, with a setting.
- No information conveyed by colour alone.

## 15. Ethics

- No real-money purchases. No ads.
- No streaks, no "you'll lose this if you don't log in", no fake timers.
- Notifications are off by default and only offered after the player has a reason to want them.
- Collect the minimum data: a username, a password hash and the save. A clear privacy note, and the ability to **delete the account and all its data**.

## 16. Out of scope (for launch)

Trading and multiplayer, chat, guilds, prestige resets, more skills, mastery, pets, quests, achievements. Good ideas for after launch: write them down in a `IDEAS.md`, and don't build them yet.
