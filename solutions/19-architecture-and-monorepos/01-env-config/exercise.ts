// Reference solution for 19-01. Read it only AFTER your own version passes.
import { z } from 'zod';

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

const DAY = 24 * 60 * 60 * 1000;

/** True for "https://example.com" or "http://localhost:5173": a bare origin, nothing after it. */
function isHttpOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.origin === value;
  } catch {
    return false;
  }
}

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // z.coerce turns the string into a number; int/min/max then reject '3.5', '0', '70000' and NaN.
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'must be a postgres:// URL'),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    CORS_ORIGINS: z
      .string()
      .default('')
      .transform((raw) =>
        raw
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry !== ''),
      )
      .pipe(z.array(z.string().refine(isHttpOrigin, 'each entry must be an origin like https://example.com'))),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  })
  // Only runs once the fields above are valid, so it can rely on their types.
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (env.COOKIE_SECURE === 'false') {
      ctx.addIssue({ code: 'custom', path: ['COOKIE_SECURE'], message: 'must be true in production' });
    }
    if (env.CORS_ORIGINS.some((origin) => origin.startsWith('http://'))) {
      ctx.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'must use https in production' });
    }
  });

export function loadConfig(env: Record<string, string | undefined>): Config {
  // Empty strings mean "not set": drop them before validation so defaults and "required" apply.
  const present = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== undefined && value !== ''));

  const result = EnvSchema.safeParse(present);
  if (!result.success) {
    throw new ConfigError(result.error.issues.map((issue) => `${String(issue.path[0] ?? 'env')}: ${issue.message}`));
  }

  const e = result.data;
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    sessionTtlMs: e.SESSION_TTL_DAYS * DAY,
    cookieSecure: e.COOKIE_SECURE === undefined ? e.NODE_ENV === 'production' : e.COOKIE_SECURE === 'true',
    corsOrigins: e.CORS_ORIGINS,
    logLevel: e.LOG_LEVEL,
  };
}

export function redactConfig(config: Config): Config {
  const url = new URL(config.databaseUrl);
  if (url.password === '') return { ...config };
  url.password = '***';
  return { ...config, databaseUrl: url.toString() };
}
