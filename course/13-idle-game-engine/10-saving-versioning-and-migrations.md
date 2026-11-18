# 13.10 · Saving, versioning & migrations

> ⏱ 2.5 hours · Module 13 · The Idle Game Engine

## What you'll learn
- Serialising game state, and where to store it locally
- When to save: autosave cadence and lifecycle events
- **Versioned save formats** and **migration chains**
- Validating after migrating, and refusing saves from the future
- Protecting players: backups, corruption handling, export/import

---

## The stakes

The worst bug an idle game can ship is **losing progress**. Players forgive bugs, slow updates and ugly UI, but not a wiped 300-hour save. Saving deserves your most careful engineering and your most thorough tests.

## Serialising

Because you designed state to be serialisable (13.3), saving is just:

```ts
const text = JSON.stringify(state);
const state = JSON.parse(text);           // → unknown, which MUST be validated (02.7)
```

Locally, save to `localStorage` for small saves (simple and synchronous), or to **IndexedDB** for large ones or for storing several slots and backups (async, using a wrapper like `idb-keyval`). The cloud save is added in Module 18, and the local save remains the instant, offline-capable copy.

## When to save

| Trigger | Why |
|---|---|
| **every ~30–60 s** while playing (an autosave interval) | bounds how much a crash can lose |
| **`visibilitychange` → hidden** | the user switched tabs or apps, and may never come back (03.3) |
| **`pagehide`** | the page is being unloaded or cached |
| **after important events** (a purchase, a rare drop, a level up), debounced | so big moments are never lost |

Don't save on every tick (ten times a second): `localStorage` writes are synchronous (03.3) and would waste battery. Debounce the "after important events" trigger (01.2).

## Versioning

Your save format **will** change: new skills, renamed items, restructured state. Old saves still have to load. Every save carries a version number:

```ts
{ "version": 3, "skills": { … }, "bank": { … }, … }
```

and the game keeps a `CURRENT_SAVE_VERSION`.

## Migrations: a chain of small steps

Write **one migration per version bump**. Each transforms version N into N+1:

```ts
// v1: the original format (an array of items, XP directly per skill)
type SaveV1 = { version: 1; gold: number; xp: Record<string, number>; items: { id: string; qty: number }[] };
// v2: skills became objects; the items array became a bank record
type SaveV2 = { version: 2; gold: number; skills: Record<string, { xp: number }>; bank: Record<string, number> };
// v3: renamed 'log' → 'oak_log', added settings
type SaveV3 = { version: 3; gold: number; skills: …; bank: …; settings: { sound: boolean } };

const migrations = {
  1: (s: SaveV1): SaveV2 => ({
    version: 2,
    gold: s.gold,
    skills: Object.fromEntries(Object.entries(s.xp).map(([id, xp]) => [id, { xp }])),
    bank: Object.fromEntries(s.items.map((i) => [i.id, i.qty])),
  }),
  2: (s: SaveV2): SaveV3 => {
    const { log, ...rest } = s.bank;
    return {
      ...s,
      version: 3,
      bank: log ? { ...rest, oak_log: (rest.oak_log ?? 0) + log } : rest,   // merge, don't overwrite!
      settings: { sound: true },
    };
  },
};
```

Loading runs them in order:

```
raw JSON ─► read version ─► v1? ─► migrate 1→2 ─► migrate 2→3 ─► validate as V3 ─► ✅ use it
                           └─► v3? ───────────────────────────► validate as V3 ─► ✅
                           └─► v4+? (from a newer game version) ─► ❌ refuse, and don't overwrite!
```

Rules:
- **Migrations are pure and never change once released.** A player could be loading a v1 save two years from now. Write a new migration instead of editing an old one.
- **Validate each version's shape** (Zod schemas per version), or at least validate the final result against the current schema.
- **Test every migration with a real old save** fixture (a JSON file in your tests). When you release a version, save a sample of its format into your fixtures.
- **Refuse saves from the future.** If a player opens an old cached version of your PWA after playing the new one, the save says `version: 4` but the code only knows 3. Never "fix" it by downgrading or overwriting. Show "Please refresh to update the game".

## Validate, then trust

After migrating, validate against the **current** schema (02.7). If it fails, the save is corrupt or a migration has a bug:
- **Don't overwrite the stored save** with a fresh one.
- Keep the raw text in a **backup slot** (`save.corrupt.<timestamp>`), and tell the player clearly.
- Load from the last known-good backup if you keep one.

## Backups

Cheap insurance:
- Keep the **previous** save in a second key (`save.backup`) before writing a new one, so a bad write can be recovered.
- Before running migrations, store the original (`save.pre-v3`).
- The cloud save (Module 18) is the ultimate backup. Even then, keep local backups for offline play.

## Export and import

Let players copy their save as text and paste it back: a backup they control, and a lifesaver for support requests.

```ts
export function exportSave(state: GameState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(state));   // UTF-8 bytes (handles emoji and accents)
  return btoa(String.fromCharCode(...bytes));                      // → base64 text
}
// (Newer browsers also offer Uint8Array.prototype.toBase64(), which is simpler where it's supported.)
```

Import must go through the **exact same** migrate-and-validate pipeline. An imported save is untrusted input.

## Putting it together

```ts
export type LoadResult =
  | { ok: true; save: SaveV3; migratedFrom: number }
  | { ok: false; error: string };

export function loadSave(text: string): LoadResult {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, error: 'Save is not valid JSON' }; }
  // read the version, refuse unknown/future versions, run the migrations, validate the result…
}
```

You'll build exactly this in exercise 13-08, with three versions and fixture saves.

## Check your understanding

1. Why not save on every tick?
2. Why must released migrations never be edited?
3. What should the loader do with a save whose version is higher than the game knows?
4. A migration renames `log` to `oak_log`. The player already has some `oak_log` too. What must the migration do?
5. Why must imported saves go through the same pipeline as loaded ones?

<details><summary>Answers</summary>

1. `localStorage` writes are synchronous and relatively expensive. Ten a second wastes CPU and battery for no benefit. An interval plus lifecycle events is enough.
2. Players may load old saves at any point in the future. If a migration changes after release, saves that already passed through the old version would end up different from ones migrated later, so outcomes become inconsistent and data can be lost.
3. Refuse to load it and *don't overwrite it*. It came from a newer game version, so ask the player to update or refresh.
4. Add the old quantity to the existing `oak_log` quantity (merge), not replace it.
5. They're untrusted input that may be old, edited or corrupt. Migrations and validation protect the game state from bad data.
</details>

**Practice:** exercise `13-08` save-migrations → `npm run watch 13-08`

---
[← Numbers & formatting](09-numbers-and-formatting.md) · [Module overview](README.md) · [Next module: Connecting the Engine to React →](../14-engine-meets-react/README.md)
