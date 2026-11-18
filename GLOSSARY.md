# Glossary

Jargon you'll meet in this course and at work. The lesson where each term is properly explained is in brackets.

| Term | Meaning |
|---|---|
| **API** | Application Programming Interface: the "menu" of operations one piece of software offers another. On the web it usually means an HTTP API (15.4). |
| **Argon2 / scrypt** | Deliberately slow password-hashing algorithms that make brute-forcing stolen hashes expensive (17.2). |
| **Assertion function** | A TS function that throws if a condition is false and tells the compiler the condition holds afterwards (02.7). |
| **Authentication (authn)** | Proving *who* you are (17.1). |
| **Authorization (authz)** | Deciding what you're *allowed* to do (17.1). |
| **Batching** | React grouping several state updates into one re-render (07.1). |
| **Bundler** | A tool (like Vite/Rolldown) that combines your modules into optimized files for the browser (05.3). |
| **Cache invalidation** | Deciding when cached data is stale and must be refetched (10.4). |
| **CI/CD** | Continuous Integration / Continuous Delivery: automatically testing and deploying every change (20.4). |
| **Closure** | A function plus the variables it "remembers" from the scope where it was created (01.2). |
| **Commit (React)** | The phase where React applies changes to the real DOM, after rendering (06.6). |
| **Component** | A function that returns UI (JSX). The building block of React apps (06.2). |
| **Context** | React's way to pass data deep down the tree without passing props through every level (08.2). |
| **Controlled component** | A form input whose value is driven by React state (10.2). |
| **CORS** | Cross-Origin Resource Sharing: browser rules about which origins may read responses from your API (03.4, 17.6). |
| **CSRF** | Cross-Site Request Forgery: tricking a logged-in user's browser into making an unwanted request (17.6). |
| **Delta time (dt)** | Time elapsed since the last frame or tick. Game logic multiplies by it so speed doesn't depend on frame rate (13.4). |
| **Derived state** | A value you can compute from existing state or props. You should compute it, not store it (07.2). |
| **Discriminated union** | A union of object types that share a literal "tag" field (like `type: 'chop'`) used to narrow (02.4). |
| **DOM** | Document Object Model: the browser's live tree of elements that JavaScript can read and modify (03.3). |
| **Effect** | Code that synchronizes a component with something outside React (timers, subscriptions, the network) (07.4). |
| **Endpoint** | A specific URL + HTTP method on an API, e.g. `PUT /api/save` (15.4). |
| **Event loop** | The mechanism that runs JS tasks one at a time, processing queued callbacks when the call stack is empty (01.4). |
| **Fixed timestep** | Advancing a simulation in equal-sized steps regardless of frame timing, for determinism (13.4). |
| **Generic** | A type parameter (`<T>`) that lets functions and types work with many types while staying type-safe (02.5). |
| **Hook** | A function starting with `use` that lets components use React features (state, effects, context) (06.5, 07.7). |
| **HMR** | Hot Module Replacement: updating code in the browser without a full reload (05.3). |
| **Hydration** | Attaching React to server-rendered HTML. Not used in this course's SPA, but you'll hear it (22.6). |
| **Idempotent** | An operation you can repeat with the same result, e.g. `PUT` (15.4). |
| **Immutability** | Never changing an object in place; making a new one instead. React relies on it (01.1). |
| **Index (DB)** | A data structure that speeds up lookups on a column, at the cost of slower writes (16.3). |
| **JSONB** | Postgres's binary JSON column type, used for game save blobs (16.5). |
| **JSX** | The HTML-like syntax inside JavaScript that compiles to function calls (06.2). |
| **JWT** | JSON Web Token: a signed token carrying claims. Often used for auth, with tradeoffs (17.3). |
| **Key (React)** | A stable identity for list items so React can track them between renders (06.4). |
| **Lockfile** | `package-lock.json`: records the exact dependency versions installed (05.2). |
| **Memoization** | Caching a computed result so it isn't recomputed unnecessarily (`useMemo`, `memo`) (09.5). |
| **Middleware** | A function in the request pipeline that can inspect or modify a request or response (15.3). |
| **Migration (DB)** | A versioned script that changes the database schema (16.6). |
| **Migration (save)** | A function that upgrades an old save file to the current format (13.10). |
| **Monorepo** | One repository containing several packages/apps (web, api, shared) (19.1). |
| **Narrowing** | TS refining a broad type to a more specific one through checks (`typeof`, `in`, `===`) (02.3). |
| **Normalization** | Structuring data so each fact is stored once (16.1, 13.3). |
| **OAuth** | A protocol for delegated authorization, the basis of "Sign in with Google" (17.7). |
| **Offline progress** | Progress calculated for the time the player wasn't playing (13.8). |
| **Optimistic concurrency** | Allowing writes only if the data hasn't changed since you read it (revision numbers) (18.3). |
| **Optimistic update** | Updating the UI before the server confirms, rolling back on failure (10.4). |
| **ORM** | Object-Relational Mapper: a library that maps DB tables to code (Drizzle) (16.6). |
| **Origin** | Scheme + host + port, e.g. `https://game.example.com:443` (03.4). |
| **Portal** | Rendering a React child into a different DOM node, e.g. for modals (09.4). |
| **Props** | Inputs passed to a component, like function arguments (06.3). |
| **PWA** | Progressive Web App: a website that can be installed and work offline (21.1). |
| **Race condition** | A bug where the outcome depends on the timing of async events (10.3). |
| **Reconciliation** | React comparing the new element tree with the old to decide what DOM changes to make (06.6). |
| **Reducer** | A pure function `(state, action) => newState` (08.1). |
| **Ref** | A mutable box (`useRef`) whose changes don't cause re-renders (07.3). |
| **Render (React)** | React calling your component function to work out what the UI should look like (06.6). |
| **REST** | An API style built around resources and HTTP verbs (15.4). |
| **Salt** | Random data added to a password before hashing, so identical passwords get different hashes (17.2). |
| **SameSite** | A cookie attribute that controls whether cookies are sent on cross-site requests (17.4). |
| **Schema** | A description of data shape: a DB schema (16.6) or a validation schema (Zod) (02.7). |
| **Seeded RNG** | A random number generator that produces the same sequence from the same seed, which makes tests possible (13.7). |
| **Selector** | A function that picks a slice of state; components re-render only when that slice changes (08.5, 14.2). |
| **Semver** | Semantic versioning, `MAJOR.MINOR.PATCH` (05.2). |
| **Service worker** | A background script that can intercept network requests, enabling offline apps (21.1). |
| **Session** | Server-side record of a logged-in user, referenced by a cookie (17.3). |
| **Side effect** | Anything a function does besides returning a value: mutating, logging, fetching, timers (07.4). |
| **SPA** | Single-Page Application: one HTML page; JS swaps views without full reloads (10.1). |
| **Stale closure** | A function that captured an old value and keeps using it after the value has changed (07.6). |
| **State** | Data that changes over time and affects what's rendered (06.5). |
| **Structural typing** | TS compares types by their shape, not their name (02.1). |
| **Tick** | One step of the game simulation (13.5). |
| **Transaction (DB)** | A group of SQL statements that succeed or fail together (16.4). |
| **Tree shaking** | The bundler removing code you never import (05.3). |
| **Type guard** | A function returning `value is T` that narrows a type (02.7). |
| **Uncontrolled component** | A form input that keeps its own state in the DOM (10.2). |
| **useSyncExternalStore** | The React hook for subscribing to stores outside React (08.5). |
| **XSS** | Cross-Site Scripting: injecting malicious scripts into a page (17.6). |
| **Zod** | A library that validates data at runtime and infers TypeScript types from schemas (02.7). |
