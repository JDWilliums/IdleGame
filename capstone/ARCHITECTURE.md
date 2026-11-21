# Hearthwild · Architecture guide

> The "how" to [GAME-DESIGN.md](GAME-DESIGN.md)'s "what". It describes the shape of the system and the reasons behind it, not the code. Every section points to the lessons where you learned the idea. Where this guide leaves a choice open, make it, and record it as an ADR (19.3).

---

## 1. The big picture

```
┌──────────────────────────── Browser (apps/web) ────────────────────────────┐
│                                                                            │
│   React UI (features/*)                                                    │
│     │ selectors (useStore)            ▲ events (level up, bank full…)      │
│     ▼                                 │                                    │
│   Game store (Zustand vanilla, 14.2) ─┴── Game runtime (created once, 14.1)│
│     │ actions: start/stop/sell/buy…       ├─ fixed-timestep loop (13.4)     │
│     ▼                                     ├─ page lifecycle + tab guard (14.4)
│   @hearthwild/engine (pure functions)     ├─ local persistence (18.2)       │
│     tick · startAction · sell · catchUp   └─ sync engine (18.5) ──────┐     │
│                                                                       │     │
└───────────────────────────────────────────────────────────────────────┼─────┘
                                       HTTPS, same site, session cookie │
┌──────────────────────────── Server (apps/api) ───────────────────────▼─────┐
│  Express: loadSession → routes (auth · save · leaderboard) → errorHandler  │
│  services: password hasher (17-01) · sessions (17-02) · plausibility (18-04)│
│  repositories (Drizzle, 16.6)                                              │
└──────────────────────────────────────────┬─────────────────────────────────┘
                                           ▼
                                       PostgreSQL
```

The most important idea: **the game runs entirely in the browser.** The server stores and syncs saves, authenticates players and keeps the leaderboard honest. It never runs the simulation (18.4 explains the trade-off).

## 2. Repository layout (19.1, 19.3)

```
hearthwild/
├── apps/
│   ├── web/                Vite + React + TypeScript + Tailwind; the game
│   └── api/                Express 5 + Drizzle + Zod
├── packages/
│   ├── engine/             pure game logic and content data; no React, no DOM, no timers
│   └── shared/             Zod schemas: save format, API requests/responses, error codes
├── docs/adr/               architecture decision records
├── .github/workflows/      CI (20.4)
├── CLAUDE.md               tutor mode (copied from the course)
└── package.json            workspaces + root scripts
```

Dependency direction: `apps/*` → `packages/*`, and `engine` → `shared`. Never the reverse (19.2).

## 3. The engine (`packages/engine`)

### 3.1 Content as data (13.2)
Skills, actions, items, monsters, tools and Hearth levels are **typed data** in `src/data/`, validated by tests (every action's items exist, every level requirement is between 1 and 99, and so on). Adding content means adding data, not code.

### 3.2 State (13.3)
One serialisable `GameState` object, the thing that gets saved:

```
GameState
├── version                       save format version (13.10)
├── skills: { [skillId]: { xp } }
├── bank: { items: { [itemId]: qty }, slots }
├── gold
├── activeAction: { actionId, progressMs } | null     (or a fight, C11)
├── equipment: { tools: { [skill]: toolId }, weapon, food }
├── hearth: { level }
├── combat: { hp } | …                                (C11)
├── rng: { seed/state }                               (13.7: deterministic loot)
├── settings: { sound, notifications, announcements, reducedMotion }
├── createdAt, lastSavedAt
```

Derived values (levels, total level, effective action time with tool and Hearth bonuses) are **computed by selectors**, never stored (13.3).

### 3.3 Pure operations (13.5, 13.8)
Every change is a pure function `(state, …args) → newState`, or `{ state, events }` when things happen that the UI should react to:

| Function | Purpose | Milestone |
|---|---|---|
| `tick(state, dtMs, data)` → `{ state, events }` | advance time; batch-completes many actions in O(1) (13.5) | C02 |
| `startAction` / `stopAction` | choose what to do (checks level and inputs) | C02, C06 |
| `sellItem`, `buyTool`, `buyBankSlots`, `donateToHearth` | economy | C05, C10 |
| `catchUp(state, elapsedMs, capMs)` → `{ state, summary }` | offline progress (13.8) | C07 |
| `fightTick` / combat helpers | combat (13.7 loot) | C11 |
| `loadSave(unknown)` | validate + migrate any known version (13.10) | C07 |

Events are plain objects: `{ type: 'levelUp', skill, level }`, `{ type: 'itemGained', itemId, qty }`, `{ type: 'actionStopped', reason: 'bankFull' | 'noInputs' | 'defeated' | 'outOfFood' }`.

**Rules:** no `Date.now()`, no `Math.random()` and no I/O inside the engine. Time and randomness come in as arguments or state. That's what makes it fully unit-testable and reproducible.

## 4. The client runtime (`apps/web/src/runtime`)

Created **once**, outside React, in `main.tsx` (14.1):

| Part | Responsibility | Lessons |
|---|---|---|
| **Store** | holds `GameState`; exposes commands that call engine functions; notifies subscribers | 14.2 |
| **Loop** | `requestAnimationFrame` + fixed-timestep accumulator calling `tick`; pauses when hidden | 13.4, 14.4 |
| **Events** | forwards engine events to listeners: toasts, sounds, live-region announcements (throttled, 21.4) | 14.2, 21.4 |
| **Persistence** | saves the local record (save + sync metadata) every ~5 s and on `visibilitychange` → hidden | 13.10, 18.2 |
| **Lifecycle** | single-tab guard; catch-up on return; flush on hide | 14.4 |
| **Sync engine** | the 18-03 reducer + effects; talks to the API | 18.5 |

### Startup sequence
```
1. read local record (guest or user key)  → loadSave() (validate + migrate)  → or a new game
2. if logged in: GET /api/save/meta (with a short timeout; offline is fine)
      remote newer & local clean → pull     both changed → conflict dialog (18.3)
3. catch up offline time (server-measured when available, 18.4) → show "While you were away"
4. start the loop, render <App/>
```

## 5. The UI (`apps/web/src`)

- **Feature folders**: `features/skills`, `bank`, `shop`, `combat`, `hearth`, `auth`, `sync`, `settings` (19.3).
- **State homes** (19.3): game → store; current user and leaderboard → TanStack Query; sync status → sync engine; selected tab and filters → URL; a menu being open → `useState`.
- **Fast updates** (14.3): components select **primitives**. Progress bars use **transient updates** (a ref + CSS custom property), not re-renders.
- **Routing**: `/skills/:skillId`, `/bank`, `/shop`, `/combat/:areaId?`, `/hearth`, `/settings`, `/account`, `/login`, `/register`.
- **Design system**: `components/ui` (Button, Card, Dialog based on `<dialog>`, ProgressBar, Tabs, Toast) with Tailwind tokens (11.2–11.3).

## 6. The server (`apps/api`)

### 6.1 Composition (15.6)
`src/index.ts` → `loadConfig(process.env)` (19-01) → database client → repositories → services → `createApp(deps)` → `listen` → graceful shutdown.

Middleware order: `helmet` → `trust proxy` → request logger (20.5) → `express.json({ limit: '64kb' })` → `cookieParser` → Origin check (17.6) → `loadSession` → routers → `notFound` → `errorHandler`.

### 6.2 Endpoints

| Method & path | Auth | Purpose | From |
|---|---|---|---|
| `POST /api/auth/register` | — | create account + session | 17-03 |
| `POST /api/auth/login` | — | new session (rate-limited) | 17-03, 17-04 |
| `GET /api/auth/me` | ✓ | current user | 17-03 |
| `POST /api/auth/logout` | — | end session | 17-03 |
| `POST /api/auth/logout-all` | ✓ | end every session | 17-03 |
| `DELETE /api/account` | ✓ | delete the account and all its data | C08 |
| `GET /api/save` · `GET /api/save/meta` · `PUT /api/save` | ✓ | cloud save with revisions | 18-01 |
| `GET /api/leaderboard?skill=&limit=` | — | ranked list | 16-02, C09 |
| `GET /api/time` | — | server time for clock offset | 18-04 |
| `GET /api/health` | — | health check | 20.3 |

Every request and response body is defined by a schema in `@hearthwild/shared` (19.2).

### 6.3 Database (16.1, 17.5, 18.1)

```
users          (id, username, username_lower UNIQUE, password_hash, leaderboard_opt_out, created_at)
sessions       (id_hash PK, user_id FK→users ON DELETE CASCADE, expires_at, created_at)
saves          (user_id PK FK→users ON DELETE CASCADE, data jsonb, revision, updated_at, leaderboard_eligible)
save_history   (user_id FK, revision, data jsonb, created_at, PK (user_id, revision))
skill_xp       (user_id FK, skill, xp, PK (user_id, skill), INDEX (skill, xp DESC))
```

A successful `PUT /api/save` runs **one transaction**: the optimistic update of `saves`, a `save_history` row, the plausibility check (which sets `leaderboard_eligible`), and the upsert of `skill_xp` (18.1).

## 7. Testing strategy (Module 12)

| Layer | Tool | What | Target |
|---|---|---|---|
| Engine | Vitest | every pure function: ticks, batching, level-ups, recipes, offline, migrations, combat maths, data integrity | the most tests; > 90% coverage |
| Shared | Vitest | schemas accept good data and reject bad (including old save versions) | — |
| Store / runtime | Vitest + fake timers | commands call the engine; events reach listeners; persistence timing; sync engine stories | — |
| Components | Testing Library + MSW | what players see and do: start an action, sell, the conflict dialog, login errors | key screens |
| API | supertest + PGlite | every route's success and failure paths, auth and ownership, conflicts, limits | every route |
| End to end | Playwright | play loop, offline catch-up with `page.clock`, two-device sync (12.5), a11y with axe | a handful of journeys |

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | a `tick` takes < 1 ms at normal speeds; no long tasks while playing; initial JS < 250 KB gzipped; LCP < 2.5 s on a mid-range phone (21.3) |
| Offline | the game loads and plays fully offline after the first visit (PWA, 21.1); sync resumes automatically |
| Data safety | the local save is written at least every 5 s and on hide; cloud writes never overwrite another device's progress; history kept for recovery |
| Security | the 20.1 checklist; no secrets in the client; all input validated |
| Accessibility | WCAG 2.2 AA; keyboard and screen-reader playable (21.4) |
| Compatibility | the latest two versions of Chrome, Safari (iOS and macOS), Firefox and Edge; 360 px width and up |

## 9. Decisions to record

Write an ADR for each of these when you make it (some are decided here already; record why):

1. Monorepo with npm workspaces and internal TypeScript packages (19.1).
2. The engine is pure and lives outside React (14.1).
3. Zustand vanilla store with selectors and transient updates (14.2–14.3).
4. Save stored as a `jsonb` document plus extracted `skill_xp` (16.1).
5. Server sessions in an `HttpOnly` cookie rather than JWTs (17.3).
6. Optimistic concurrency with revisions, and the player chooses on conflict (16.4, 18.3).
7. The deployment layout (20.2).
8. Plausibility checks instead of a server-authoritative simulation (18.4).

## 10. Where each exercise reappears

| Course exercise | Becomes |
|---|---|
| 13-01 … 13-08 | the engine package (C02, C06, C07) |
| 14-01 … 14-03 | the store, progress bars and lifecycle (C03, C04, C07) |
| 15-03, 15-04 | validation middleware and error handler (C08) |
| 16-04 | the save repository (C08–C09) |
| 17-01 … 17-04 | auth (C08) |
| 18-01 … 18-04 | cloud saves and sync (C09) |
| 19-01 | `apps/api/src/config.ts` (C08) |

You've already written and tested most of the hard parts. The capstone is about joining them up into something real, and that's a skill in itself.
