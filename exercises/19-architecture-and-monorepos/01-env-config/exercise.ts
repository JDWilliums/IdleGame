/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 19-01 · env-config
 * Lesson:  19.4 Config & secrets
 * Run:     npm run watch 19-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · loadConfig(env) → Config
 *   Turn raw environment variables (all strings, any may be missing) into the
 *   typed Config the API uses. Read ONLY the `env` argument, never process.env.
 *   EMPTY STRINGS COUNT AS NOT SET. Unknown variables are ignored.
 *
 *   NODE_ENV          'development' | 'test' | 'production'     default 'development'
 *   PORT              integer 1–65535                            default 3000
 *   DATABASE_URL      REQUIRED; starts with postgres:// or postgresql://
 *   SESSION_TTL_DAYS  integer 1–365                              default 30   (→ sessionTtlMs)
 *   COOKIE_SECURE     'true' | 'false'                           default: true in production, false otherwise
 *   CORS_ORIGINS      comma-separated origins; spaces around commas and empty
 *                     entries are ignored. Each must be an http(s) ORIGIN: no path,
 *                     no trailing slash (e.g. https://hearthwild.com). default: none → []
 *   LOG_LEVEL         'debug' | 'info' | 'warn' | 'error'        default 'info'
 *
 *   Production rules, checked once everything above is valid:
 *     COOKIE_SECURE=false            → issue "COOKIE_SECURE: must be true in production"
 *     any CORS origin using http://  → issue "CORS_ORIGINS: must use https in production"
 *
 *   On any problem, throw new ConfigError(issues) listing EVERY problem found,
 *   each formatted as "<VARIABLE_NAME>: <message>".
 *
 * TASK 2 · redactConfig(config) → Config
 *   A copy that's safe to log: the password in databaseUrl replaced with ***
 *   (postgres://user:***@host:5432/db). URLs without a password are unchanged.
 *   Don't modify the original.
 */

export type Config = {
  env: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  sessionTtlMs: number;
  cookieSecure: boolean;
  corsOrigins: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
};

export class ConfigError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`Invalid configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  throw new Error('Not implemented yet');
}

export function redactConfig(config: Config): Config {
  throw new Error('Not implemented yet');
}
