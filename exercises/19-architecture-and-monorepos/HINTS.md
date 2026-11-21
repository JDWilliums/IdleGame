# Hints · Module 19

Open **one level at a time**. Give each level a real attempt before opening the next.

---

## 19-01 · env-config

<details><summary>Level 1 · Nudge</summary>

Lesson 19.4, "Validate at startup", has the shape. You've validated with Zod since 02.7. The new parts are cleaning the input first, turning strings into the right types, and rules that depend on another variable (production).
</details>

<details><summary>Level 2 · Direction</summary>

1. **Clean first**: build a copy of `env` without the `undefined` and `''` values (`Object.entries`, `filter`, `Object.fromEntries`). Then "empty means not set" is handled for every variable at once.
2. **One `z.object`** with a field per variable: `z.enum` for the fixed choices, `z.coerce.number().int().min().max()` for numbers, and `.default(…)` for defaults.
3. **CORS**: a string that you `transform` into an array, then validate each entry.
4. **Production rules**: `.superRefine((env, ctx) => …)` on the object, adding issues with `ctx.addIssue({ code: 'custom', path: ['COOKIE_SECURE'], message: '…' })`.
5. **Errors**: `safeParse`, then map every issue to `` `${issue.path[0]}: ${issue.message}` `` and throw a `ConfigError`.
6. **Build the `Config`** from the parsed data. That's where the days become milliseconds and the cookie default depends on `NODE_ENV`.
</details>

<details><summary>Level 3 · Walkthrough</summary>

- **Is it an origin?** `new URL(value)` throws for junk (wrap it in `try/catch`). Then check that the protocol is `http:` or `https:`, and that `url.origin === value`. That one comparison rejects paths, trailing slashes and anything else after the host.
- **COOKIE_SECURE's default depends on NODE_ENV**, so it can't be a simple `.default()`. Leave it `.optional()` in the schema and decide in the final object: `undefined` → `env === 'production'`, otherwise `=== 'true'`.
- **The `.pipe(z.array(…))` after the CORS `.transform`** validates the transformed array, so each bad entry becomes an issue with path `['CORS_ORIGINS', index]`, and `path[0]` is still the variable name.
- **The "reads only its argument" test fails?** Somewhere you wrote `process.env.X` instead of using the `env` parameter.
- **redactConfig**: `new URL(config.databaseUrl)` works for `postgres://` URLs. If `url.password` isn't empty, set it to `'***'` and use `url.toString()`. Return a new object (`{ ...config, databaseUrl }`).
</details>
