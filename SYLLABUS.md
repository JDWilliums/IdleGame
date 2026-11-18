# Syllabus

Hours are estimates for reading, typing out the examples and doing the exercises. Take longer if you need to. Speed isn't the goal.

| Part | Modules | Hours |
|---|---|---|
| 0 · Orientation | 00 | 3 |
| 1 · Foundations | 01–05 | 75 |
| 2 · React | 06–12 + projects P1, P2 | 130 |
| 3 · Game Programming | 13–14 | 40 |
| 4 · Backend | 15–18 | 75 |
| 5 · Shipping to Production | 19–21 | 30 |
| 6 · Capstone | milestones C01–C12 | 130 |
| 7 · Career Ready | 22 | 15 |
| | **Total** | **≈ 500** |

**Prerequisite map.** If a later module feels impossible, the cause is usually one of these earlier lessons:

| If you're struggling with… | Revisit… |
|---|---|
| React state "not updating" | 01.1 (references), 07.1 (snapshots) |
| `useEffect` loops and stale values | 01.2 (closures), 07.4–07.6 |
| TypeScript errors in React props | 02.3–02.5 |
| Game timing being wrong | 01.4 (event loop), 13.4 (game loop) |
| Fetch/CORS/cookie errors | 03.2, 03.4, 17.4 |
| Layout breaking on mobile | 04.3–04.5 |

---

## Part 0 · Orientation

### Module 00 · Start Here (3h) · [`course/00-start-here`](course/00-start-here/README.md)
How the course works, setting up a professional dev environment, and how to learn effectively (with AI as a tutor, not a crutch).

| # | Lesson |
|---|---|
| 00.1 | [How this course works](course/00-start-here/01-how-this-course-works.md) |
| 00.2 | [Set up your machine](course/00-start-here/02-set-up-your-machine.md) |
| 00.3 | [Learning like a professional](course/00-start-here/03-learning-like-a-professional.md) |

Exercise: `00-01` hello-course

---

## Part 1 · Foundations

### Module 01 · JavaScript You'll Use Every Day (12h) · [`course/01-javascript-refresher`](course/01-javascript-refresher/README.md)
The parts of JavaScript that React and game loops depend on: references, immutability, closures, the event loop and async code.

| # | Lesson |
|---|---|
| 01.1 | [Values, references & immutability](course/01-javascript-refresher/01-values-references-and-immutability.md) |
| 01.2 | [Functions & closures](course/01-javascript-refresher/02-functions-and-closures.md) |
| 01.3 | [Array & object power tools](course/01-javascript-refresher/03-arrays-and-objects-power-tools.md) |
| 01.4 | [The event loop, timers & promises](course/01-javascript-refresher/04-the-event-loop-timers-and-promises.md) |
| 01.5 | [async/await & error handling](course/01-javascript-refresher/05-async-await-and-errors.md) |
| 01.6 | [Modules](course/01-javascript-refresher/06-modules.md) |

Exercises: `01-01` immutable-updates · `01-02` closures · `01-03` data-transforms · `01-04` async-control-flow

### Module 02 · TypeScript in Depth (20h) · [`course/02-typescript`](course/02-typescript/README.md)
Finish your TypeScript education: how the compiler thinks, narrowing, discriminated unions, generics, type operators, and validating untrusted data at runtime.

| # | Lesson |
|---|---|
| 02.1 | [How TypeScript thinks](course/02-typescript/01-how-typescript-thinks.md) |
| 02.2 | [Object types & interfaces](course/02-typescript/02-object-types-and-interfaces.md) |
| 02.3 | [Unions & narrowing](course/02-typescript/03-unions-and-narrowing.md) |
| 02.4 | [Discriminated unions](course/02-typescript/04-discriminated-unions.md) |
| 02.5 | [Generics](course/02-typescript/05-generics.md) |
| 02.6 | [Type operators & utility types](course/02-typescript/06-type-operators-and-utility-types.md) |
| 02.7 | [Validating unknown data](course/02-typescript/07-validating-unknown-data.md) |

Exercises: `02-01` typed-game-data · `02-02` narrowing · `02-03` discriminated-unions · `02-04` generics · `02-05` type-level · `02-06` validate-with-zod

### Module 03 · How the Web Works (10h) · [`course/03-how-the-web-works`](course/03-how-the-web-works/README.md)
What happens between typing a URL and seeing pixels: DNS, HTTP, the DOM, browser storage, `fetch` and CORS.

| # | Lesson |
|---|---|
| 03.1 | [From URL to pixels](course/03-how-the-web-works/01-from-url-to-pixels.md) |
| 03.2 | [HTTP in depth](course/03-how-the-web-works/02-http-in-depth.md) |
| 03.3 | [The browser: DOM, events & storage](course/03-how-the-web-works/03-the-browser-dom-events-and-storage.md) |
| 03.4 | [fetch, JSON & CORS](course/03-how-the-web-works/04-fetch-json-and-cors.md) |

Exercises: `03-01` urls-and-query-strings · `03-02` typed-api-client · `03-03` vanilla-dom

### Module 04 · HTML & CSS, Mobile-First (20h) · [`course/04-html-css-mobile-first`](course/04-html-css-mobile-first/README.md)
Semantic, accessible HTML and modern CSS layout, designed for phones first and scaled up for desktop.

| # | Lesson |
|---|---|
| 04.1 | [Semantic HTML & accessibility](course/04-html-css-mobile-first/01-semantic-html-and-accessibility.md) |
| 04.2 | [Box model, display & positioning](course/04-html-css-mobile-first/02-box-model-display-and-positioning.md) |
| 04.3 | [Flexbox](course/04-html-css-mobile-first/03-flexbox.md) |
| 04.4 | [Grid](course/04-html-css-mobile-first/04-grid.md) |
| 04.5 | [Responsive, mobile-first design](course/04-html-css-mobile-first/05-responsive-mobile-first-design.md) |
| 04.6 | [CSS architecture, variables & theming](course/04-html-css-mobile-first/06-css-architecture-variables-and-theming.md) |

Project: **P1** [Game UI shell in pure HTML & CSS](course/projects/P1-game-ui-shell.md)

### Module 05 · Tools of the Trade (10h) · [`course/05-tools-of-the-trade`](course/05-tools-of-the-trade/README.md)
The professional toolchain: terminal and git workflows, npm and semver, bundlers and Vite, linting and formatting, and debugging.

| # | Lesson |
|---|---|
| 05.1 | [The terminal & git like a professional](course/05-tools-of-the-trade/01-terminal-and-git.md) |
| 05.2 | [npm, packages & semver](course/05-tools-of-the-trade/02-npm-packages-and-semver.md) |
| 05.3 | [Bundlers & Vite](course/05-tools-of-the-trade/03-bundlers-and-vite.md) |
| 05.4 | [Linting, formatting & type-checking](course/05-tools-of-the-trade/04-linting-formatting-and-typechecking.md) |
| 05.5 | [Debugging & DevTools](course/05-tools-of-the-trade/05-debugging-and-devtools.md) |

---

## Part 2 · React

### Module 06 · React Fundamentals (15h) · [`course/06-react-fundamentals`](course/06-react-fundamentals/README.md)
The React mental model: components, JSX, props, lists, events, state, and what "rendering" actually means.

| # | Lesson |
|---|---|
| 06.1 | [Thinking in React](course/06-react-fundamentals/01-thinking-in-react.md) |
| 06.2 | [JSX & components](course/06-react-fundamentals/02-jsx-and-components.md) |
| 06.3 | [Props, children & composition](course/06-react-fundamentals/03-props-children-and-composition.md) |
| 06.4 | [Lists, keys & conditional rendering](course/06-react-fundamentals/04-lists-keys-and-conditional-rendering.md) |
| 06.5 | [Events & state](course/06-react-fundamentals/05-events-and-state.md) |
| 06.6 | [How React renders](course/06-react-fundamentals/06-how-react-renders.md) |

Exercises: `06-01` skill-card · `06-02` item-list · `06-03` counter-and-toggle · `06-04` filterable-inventory

### Module 07 · State & Effects (20h) · [`course/07-state-and-effects`](course/07-state-and-effects/README.md)
The most important module in the course. State snapshots, structuring and lifting state, refs, effects and their cleanup, timers and stale closures, and custom hooks.

| # | Lesson |
|---|---|
| 07.1 | [State as a snapshot](course/07-state-and-effects/01-state-as-a-snapshot.md) |
| 07.2 | [Structuring & lifting state](course/07-state-and-effects/02-structuring-and-lifting-state.md) |
| 07.3 | [Refs](course/07-state-and-effects/03-refs.md) |
| 07.4 | [Effects & synchronization](course/07-state-and-effects/04-effects-and-synchronization.md) |
| 07.5 | [You might not need an effect](course/07-state-and-effects/05-you-might-not-need-an-effect.md) |
| 07.6 | [Timers & stale closures](course/07-state-and-effects/06-timers-and-stale-closures.md) |
| 07.7 | [Custom hooks](course/07-state-and-effects/07-custom-hooks.md) |

Exercises: `07-01` snapshot-bugs · `07-02` lifting-state · `07-03` use-interval · `07-04` use-local-storage · `07-05` countdown-timer

### Module 08 · Managing Complex State (14h) · [`course/08-complex-state`](course/08-complex-state/README.md)
Reducers, context, Immer and external stores, which is everything you need to manage game state.

| # | Lesson |
|---|---|
| 08.1 | [useReducer](course/08-complex-state/01-use-reducer.md) |
| 08.2 | [Context](course/08-complex-state/02-context.md) |
| 08.3 | [Reducer + context](course/08-complex-state/03-reducer-plus-context.md) |
| 08.4 | [Immer](course/08-complex-state/04-immer.md) |
| 08.5 | [External stores & Zustand](course/08-complex-state/05-external-stores-and-zustand.md) |

Exercises: `08-01` inventory-reducer · `08-02` settings-context · `08-03` build-your-own-store · `08-04` zustand-shop

### Module 09 · React + TypeScript Patterns & Performance (14h) · [`course/09-react-patterns`](course/09-react-patterns/README.md)
Typing components properly, reusable component patterns, error boundaries, Suspense, portals, and making React fast.

| # | Lesson |
|---|---|
| 09.1 | [Typing components](course/09-react-patterns/01-typing-components.md) |
| 09.2 | [Generic & polymorphic components](course/09-react-patterns/02-generic-and-polymorphic-components.md) |
| 09.3 | [Composition patterns](course/09-react-patterns/03-composition-patterns.md) |
| 09.4 | [Error boundaries, Suspense & portals](course/09-react-patterns/04-error-boundaries-suspense-and-portals.md) |
| 09.5 | [Performance](course/09-react-patterns/05-performance.md) |

Exercises: `09-01` generic-select-list · `09-02` compound-tabs · `09-03` accessible-modal · `09-04` render-performance

### Module 10 · Routing, Forms & Server Data (12h) · [`course/10-routing-forms-data`](course/10-routing-forms-data/README.md)
Multi-page apps with React Router, forms that validate properly, and fetching server data without bugs.

| # | Lesson |
|---|---|
| 10.1 | [Client-side routing](course/10-routing-forms-data/01-client-side-routing.md) |
| 10.2 | [Forms](course/10-routing-forms-data/02-forms.md) |
| 10.3 | [Fetching data the hard way](course/10-routing-forms-data/03-fetching-data-the-hard-way.md) |
| 10.4 | [TanStack Query](course/10-routing-forms-data/04-tanstack-query.md) |

Exercises: `10-01` signup-form · `10-02` use-fetch

### Module 11 · Styling React Apps (10h) · [`course/11-styling`](course/11-styling/README.md)
Styling options compared, Tailwind CSS, design tokens and theming, accessible component libraries, and motion.

| # | Lesson |
|---|---|
| 11.1 | [Styling approaches](course/11-styling/01-styling-approaches.md) |
| 11.2 | [Tailwind CSS](course/11-styling/02-tailwind-css.md) |
| 11.3 | [Design tokens & theming](course/11-styling/03-design-tokens-and-theming.md) |
| 11.4 | [Accessible components & motion](course/11-styling/04-accessible-components-and-motion.md) |

### Module 12 · Testing (14h) · [`course/12-testing`](course/12-testing/README.md)
Write tests that give you confidence: Vitest, Testing Library, network mocking, end-to-end tests with Playwright, and TDD.

| # | Lesson |
|---|---|
| 12.1 | [Why & what to test](course/12-testing/01-why-and-what-to-test.md) |
| 12.2 | [Vitest fundamentals](course/12-testing/02-vitest-fundamentals.md) |
| 12.3 | [Testing React components](course/12-testing/03-testing-react-components.md) |
| 12.4 | [Mocking the network & testing hooks](course/12-testing/04-mocking-the-network.md) |
| 12.5 | [End-to-end tests with Playwright](course/12-testing/05-end-to-end-with-playwright.md) |

Exercises: `12-01` write-unit-tests · `12-02` write-component-tests

Project: **P2** [Pocket Forge, a React mini idle game](course/projects/P2-pocket-forge.md)

---

## Part 3 · Game Programming

### Module 13 · The Idle Game Engine (25h) · [`course/13-idle-game-engine`](course/13-idle-game-engine/README.md)
How idle games actually work: data-driven design, game state, the game loop, ticks, XP curves, randomness, offline progress, numbers and save migrations.

| # | Lesson |
|---|---|
| 13.1 | [Anatomy of an idle game](course/13-idle-game-engine/01-anatomy-of-an-idle-game.md) |
| 13.2 | [Data-driven design](course/13-idle-game-engine/02-data-driven-design.md) |
| 13.3 | [Designing game state](course/13-idle-game-engine/03-designing-game-state.md) |
| 13.4 | [The game loop](course/13-idle-game-engine/04-the-game-loop.md) |
| 13.5 | [Actions & ticks](course/13-idle-game-engine/05-actions-and-ticks.md) |
| 13.6 | [XP curves & levelling](course/13-idle-game-engine/06-xp-curves-and-levelling.md) |
| 13.7 | [Randomness & loot tables](course/13-idle-game-engine/07-randomness-and-loot-tables.md) |
| 13.8 | [Offline progress](course/13-idle-game-engine/08-offline-progress.md) |
| 13.9 | [Numbers & formatting](course/13-idle-game-engine/09-numbers-and-formatting.md) |
| 13.10 | [Saving, versioning & migrations](course/13-idle-game-engine/10-saving-versioning-and-migrations.md) |

Exercises: `13-01` game-data · `13-02` xp-curve · `13-03` fixed-timestep-loop · `13-04` action-ticks · `13-05` seeded-rng-and-loot · `13-06` offline-progress · `13-07` format-numbers · `13-08` save-migrations

### Module 14 · Connecting the Engine to React (12h) · [`course/14-engine-meets-react`](course/14-engine-meets-react/README.md)
Keeping a fast-ticking engine outside React, subscribing to it efficiently, smooth progress bars, page lifecycle and multiple tabs.

| # | Lesson |
|---|---|
| 14.1 | [Architecture: the engine lives outside React](course/14-engine-meets-react/01-architecture-engine-outside-react.md) |
| 14.2 | [Building the game store](course/14-engine-meets-react/02-building-the-game-store.md) |
| 14.3 | [Rendering fast updates](course/14-engine-meets-react/03-rendering-fast-updates.md) |
| 14.4 | [Page lifecycle & multiple tabs](course/14-engine-meets-react/04-page-lifecycle-and-multiple-tabs.md) |
| 14.5 | [Web Workers (optional)](course/14-engine-meets-react/05-web-workers.md) |

Exercises: `14-01` game-store · `14-02` smooth-progress-bar · `14-03` use-page-visibility

---

## Part 4 · Backend

### Module 15 · Node.js & Express (18h) · [`course/15-node-and-express`](course/15-node-and-express/README.md)
Node as a runtime, HTTP servers from scratch, Express 5, REST API design, validation, error handling, structure and testing.

| # | Lesson |
|---|---|
| 15.1 | [Node: the runtime](course/15-node-and-express/01-node-the-runtime.md) |
| 15.2 | [HTTP from scratch](course/15-node-and-express/02-http-from-scratch.md) |
| 15.3 | [Express fundamentals](course/15-node-and-express/03-express-fundamentals.md) |
| 15.4 | [Designing REST APIs](course/15-node-and-express/04-designing-rest-apis.md) |
| 15.5 | [Validation & error handling](course/15-node-and-express/05-validation-and-error-handling.md) |
| 15.6 | [Structuring a backend](course/15-node-and-express/06-structuring-a-backend.md) |
| 15.7 | [Testing APIs](course/15-node-and-express/07-testing-apis.md) |

Exercises: `15-01` raw-http-server · `15-02` express-routes · `15-03` validation-middleware · `15-04` error-handling

### Module 16 · Databases & SQL (18h) · [`course/16-databases`](course/16-databases/README.md)
Relational modelling, SQL from the ground up, joins, indexes, transactions, PostgreSQL in practice, and Drizzle ORM. Exercises run on a real Postgres engine (PGlite), so you don't need Docker.

| # | Lesson |
|---|---|
| 16.1 | [Relational thinking](course/16-databases/01-relational-thinking.md) |
| 16.2 | [SQL fundamentals](course/16-databases/02-sql-fundamentals.md) |
| 16.3 | [Joins, aggregates & indexes](course/16-databases/03-joins-aggregates-and-indexes.md) |
| 16.4 | [Constraints, transactions & concurrency](course/16-databases/04-constraints-transactions-and-concurrency.md) |
| 16.5 | [Postgres in practice](course/16-databases/05-postgres-in-practice.md) |
| 16.6 | [Drizzle ORM](course/16-databases/06-drizzle-orm.md) |

Exercises: `16-01` sql-basics · `16-02` joins-and-aggregates · `16-03` transactions · `16-04` drizzle-repository

### Module 17 · Authentication & Security (22h) · [`course/17-auth-and-security`](course/17-auth-and-security/README.md)
Passwords, sessions vs JWTs, cookies, building session auth yourself, CSRF, XSS, CORS, rate limiting, OAuth, and auth in the frontend.

| # | Lesson |
|---|---|
| 17.1 | [Auth concepts & threat modelling](course/17-auth-and-security/01-auth-concepts-and-threats.md) |
| 17.2 | [Storing passwords](course/17-auth-and-security/02-storing-passwords.md) |
| 17.3 | [Sessions vs JWTs](course/17-auth-and-security/03-sessions-vs-jwts.md) |
| 17.4 | [Cookies in depth](course/17-auth-and-security/04-cookies-in-depth.md) |
| 17.5 | [Implementing session auth](course/17-auth-and-security/05-implementing-session-auth.md) |
| 17.6 | [Web security essentials](course/17-auth-and-security/06-web-security-essentials.md) |
| 17.7 | [OAuth & social login](course/17-auth-and-security/07-oauth-and-social-login.md) |
| 17.8 | [Auth in the frontend](course/17-auth-and-security/08-auth-in-the-frontend.md) |

Exercises: `17-01` password-hashing · `17-02` session-tokens · `17-03` auth-middleware · `17-04` rate-limiter

### Module 18 · Cloud Saves & Sync (15h) · [`course/18-cloud-saves`](course/18-cloud-saves/README.md)
The feature that makes the game playable across devices: the save API, local-first saving, conflicts, trusting time, and a sync engine.

| # | Lesson |
|---|---|
| 18.1 | [Designing the save API](course/18-cloud-saves/01-designing-the-save-api.md) |
| 18.2 | [Local-first saving](course/18-cloud-saves/02-local-first-saving.md) |
| 18.3 | [Conflicts & concurrency](course/18-cloud-saves/03-conflicts-and-concurrency.md) |
| 18.4 | [Trusting time & cheating](course/18-cloud-saves/04-trusting-time-and-cheating.md) |
| 18.5 | [The sync engine](course/18-cloud-saves/05-the-sync-engine.md) |

Exercises: `18-01` save-endpoint · `18-02` conflict-resolution · `18-03` sync-state-machine · `18-04` trusted-offline-time

---

## Part 5 · Shipping to Production

### Module 19 · Architecture & Monorepos (6h) · [`course/19-architecture-and-monorepos`](course/19-architecture-and-monorepos/README.md)

| # | Lesson |
|---|---|
| 19.1 | [Monorepos & workspaces](course/19-architecture-and-monorepos/01-monorepos-and-workspaces.md) |
| 19.2 | [Shared code](course/19-architecture-and-monorepos/02-shared-code.md) |
| 19.3 | [Structuring a real app](course/19-architecture-and-monorepos/03-structuring-a-real-app.md) |
| 19.4 | [Config & secrets](course/19-architecture-and-monorepos/04-config-and-secrets.md) |

Exercise: `19-01` env-config

### Module 20 · Deployment & DevOps (12h) · [`course/20-deployment`](course/20-deployment/README.md)

| # | Lesson |
|---|---|
| 20.1 | [What "production" means](course/20-deployment/01-what-production-means.md) |
| 20.2 | [Choosing hosting & domains](course/20-deployment/02-choosing-hosting.md) |
| 20.3 | [Deploying the frontend, API & database](course/20-deployment/03-deploying-frontend-api-and-database.md) |
| 20.4 | [CI with GitHub Actions](course/20-deployment/04-ci-with-github-actions.md) |
| 20.5 | [Observability](course/20-deployment/05-observability.md) |

### Module 21 · PWA, Performance & Accessibility (10h) · [`course/21-pwa-performance-a11y`](course/21-pwa-performance-a11y/README.md)

| # | Lesson |
|---|---|
| 21.1 | [Progressive Web Apps](course/21-pwa-performance-a11y/01-progressive-web-apps.md) |
| 21.2 | [Mobile polish](course/21-pwa-performance-a11y/02-mobile-polish.md) |
| 21.3 | [Web performance](course/21-pwa-performance-a11y/03-web-performance.md) |
| 21.4 | [Accessibility in depth](course/21-pwa-performance-a11y/04-accessibility-in-depth.md) |

---

## Part 6 · Capstone: Build Your Idle Game (130h) · [`capstone/`](capstone/README.md)

No starter code and no tests. You get a [game design](capstone/GAME-DESIGN.md), an [architecture guide](capstone/ARCHITECTURE.md), and milestones with user stories and acceptance criteria, the same way work arrives at a job.

| # | Milestone |
|---|---|
| C01 | [Repo, monorepo & CI](capstone/milestones/C01-project-setup.md) |
| C02 | [Game data & engine core](capstone/milestones/C02-engine-core.md) |
| C03 | [App shell & navigation](capstone/milestones/C03-app-shell.md) |
| C04 | [Skills UI & live progress](capstone/milestones/C04-skills-ui.md) |
| C05 | [Bank & items](capstone/milestones/C05-bank-and-items.md) |
| C06 | [Processing skills](capstone/milestones/C06-processing-skills.md) |
| C07 | [Local saves, offline progress & migrations](capstone/milestones/C07-local-saves-and-offline.md) |
| C08 | [API, database & accounts](capstone/milestones/C08-api-db-and-accounts.md) |
| C09 | [Cloud saves & cross-device sync](capstone/milestones/C09-cloud-sync.md) |
| C10 | [Shop, equipment & economy](capstone/milestones/C10-shop-and-equipment.md) |
| C11 | [Combat](capstone/milestones/C11-combat.md) |
| C12 | [PWA, polish & launch](capstone/milestones/C12-launch.md) |

---

## Part 7 · Career Ready

### Module 22 · Career Ready (15h) · [`course/22-career-ready`](course/22-career-ready/README.md)

| # | Lesson |
|---|---|
| 22.1 | [Working in a real codebase](course/22-career-ready/01-working-in-a-real-codebase.md) |
| 22.2 | [Pull requests & code review](course/22-career-ready/02-pull-requests-and-code-review.md) |
| 22.3 | [AI tools at work](course/22-career-ready/03-ai-tools-at-work.md) |
| 22.4 | [Portfolio, CV & GitHub](course/22-career-ready/04-portfolio-cv-and-github.md) |
| 22.5 | [Interview preparation](course/22-career-ready/05-interview-preparation.md) |
| 22.6 | [What to learn next](course/22-career-ready/06-what-to-learn-next.md) |

> **Tip:** you don't have to wait until the end for Module 22. Read 22.4 and 22.5 around the time you start the capstone, so you can apply for jobs while you build.
