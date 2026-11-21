import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigError, loadConfig, redactConfig, type Config } from './exercise';

const DAY = 24 * 60 * 60 * 1000;
const DB = 'postgres://hearthwild:devpassword@localhost:5432/hearthwild';

/** The variable names mentioned in a ConfigError's issues. */
function problems(env: Record<string, string | undefined>): string[] {
  try {
    loadConfig(env);
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    for (const issue of error.issues) expect(issue).toMatch(/^[A-Z_]+: .+/);
    return [...new Set(error.issues.map((issue) => issue.split(':')[0] ?? ''))].sort();
  }
  return [];
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('loadConfig: defaults', () => {
  it('needs only DATABASE_URL in development', () => {
    expect(loadConfig({ DATABASE_URL: DB })).toEqual({
      env: 'development',
      port: 3000,
      databaseUrl: DB,
      sessionTtlMs: 30 * DAY,
      cookieSecure: false,
      corsOrigins: [],
      logLevel: 'info',
    } satisfies Config);
  });

  it('defaults COOKIE_SECURE to true in production', () => {
    expect(loadConfig({ DATABASE_URL: DB, NODE_ENV: 'production' }).cookieSecure).toBe(true);
    expect(loadConfig({ DATABASE_URL: DB, NODE_ENV: 'test' }).cookieSecure).toBe(false);
  });

  it('treats empty strings as not set', () => {
    const config = loadConfig({ DATABASE_URL: DB, PORT: '', SESSION_TTL_DAYS: '', CORS_ORIGINS: '', LOG_LEVEL: '' });
    expect(config).toMatchObject({ port: 3000, sessionTtlMs: 30 * DAY, corsOrigins: [], logLevel: 'info' });
    expect(problems({ DATABASE_URL: '' })).toEqual(['DATABASE_URL']);
  });

  it('ignores unknown variables', () => {
    expect(() => loadConfig({ DATABASE_URL: DB, HOME: '/root', PATH: '/usr/bin' })).not.toThrow();
  });
});

describe('loadConfig: parsing', () => {
  it('parses a full production config', () => {
    expect(
      loadConfig({
        NODE_ENV: 'production',
        PORT: '8080',
        DATABASE_URL: 'postgresql://app:pw@db.internal:5432/hearthwild',
        SESSION_TTL_DAYS: '14',
        COOKIE_SECURE: 'true',
        CORS_ORIGINS: 'https://hearthwild.com, https://www.hearthwild.com',
        LOG_LEVEL: 'warn',
      }),
    ).toEqual({
      env: 'production',
      port: 8080,
      databaseUrl: 'postgresql://app:pw@db.internal:5432/hearthwild',
      sessionTtlMs: 14 * DAY,
      cookieSecure: true,
      corsOrigins: ['https://hearthwild.com', 'https://www.hearthwild.com'],
      logLevel: 'warn',
    });
  });

  it("parses COOKIE_SECURE strictly: 'false' is false, not truthy", () => {
    expect(loadConfig({ DATABASE_URL: DB, COOKIE_SECURE: 'false' }).cookieSecure).toBe(false);
    expect(loadConfig({ DATABASE_URL: DB, COOKIE_SECURE: 'true' }).cookieSecure).toBe(true);
    expect(problems({ DATABASE_URL: DB, COOKIE_SECURE: 'yes' })).toEqual(['COOKIE_SECURE']);
    expect(problems({ DATABASE_URL: DB, COOKIE_SECURE: '1' })).toEqual(['COOKIE_SECURE']);
  });

  it('splits CORS origins, ignoring spaces and empty entries', () => {
    expect(loadConfig({ DATABASE_URL: DB, CORS_ORIGINS: ' https://a.example ,http://localhost:5173,, ' }).corsOrigins).toEqual([
      'https://a.example',
      'http://localhost:5173',
    ]);
  });

  it('rejects CORS entries that are not bare http(s) origins', () => {
    for (const bad of ['https://a.example/', 'https://a.example/path', 'a.example', 'ftp://a.example', '*']) {
      expect(problems({ DATABASE_URL: DB, CORS_ORIGINS: `https://ok.example,${bad}` }), bad).toEqual(['CORS_ORIGINS']);
    }
  });

  it('validates numbers', () => {
    for (const bad of ['0', '65536', 'abc', '3.5', '-1']) {
      expect(problems({ DATABASE_URL: DB, PORT: bad }), `PORT=${bad}`).toEqual(['PORT']);
    }
    for (const bad of ['0', '366', 'week']) {
      expect(problems({ DATABASE_URL: DB, SESSION_TTL_DAYS: bad }), `SESSION_TTL_DAYS=${bad}`).toEqual(['SESSION_TTL_DAYS']);
    }
  });

  it('validates DATABASE_URL and the enums', () => {
    expect(problems({ DATABASE_URL: 'mysql://localhost/db' })).toEqual(['DATABASE_URL']);
    expect(problems({ DATABASE_URL: DB, NODE_ENV: 'staging' })).toEqual(['NODE_ENV']);
    expect(problems({ DATABASE_URL: DB, LOG_LEVEL: 'loud' })).toEqual(['LOG_LEVEL']);
  });
});

describe('loadConfig: errors', () => {
  it('reports every problem at once', () => {
    expect(problems({ PORT: 'abc', LOG_LEVEL: 'loud', COOKIE_SECURE: 'maybe' })).toEqual([
      'COOKIE_SECURE',
      'DATABASE_URL',
      'LOG_LEVEL',
      'PORT',
    ]);
  });

  it('throws a ConfigError whose message lists the issues', () => {
    let error: unknown;
    try {
      loadConfig({ PORT: 'abc' });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ConfigError);
    const { issues, message } = error as ConfigError;
    expect(issues.length).toBeGreaterThanOrEqual(2);
    for (const issue of issues) expect(message).toContain(issue);
  });

  it('applies the production rules', () => {
    const prod = { NODE_ENV: 'production', DATABASE_URL: DB };
    expect(() => loadConfig({ ...prod, COOKIE_SECURE: 'false' })).toThrow('COOKIE_SECURE: must be true in production');
    expect(() => loadConfig({ ...prod, CORS_ORIGINS: 'https://a.example,http://b.example' })).toThrow(
      'CORS_ORIGINS: must use https in production',
    );
    expect(problems({ ...prod, COOKIE_SECURE: 'false', CORS_ORIGINS: 'http://b.example' })).toEqual([
      'COOKIE_SECURE',
      'CORS_ORIGINS',
    ]);
    // the same values are fine outside production
    expect(() => loadConfig({ DATABASE_URL: DB, COOKIE_SECURE: 'false', CORS_ORIGINS: 'http://b.example' })).not.toThrow();
  });

  it('reads only its argument, never process.env', () => {
    vi.stubEnv('DATABASE_URL', DB);
    vi.stubEnv('PORT', '9999');
    expect(problems({})).toEqual(['DATABASE_URL']);
    expect(loadConfig({ DATABASE_URL: DB }).port).toBe(3000);
  });
});

describe('redactConfig', () => {
  it('hides the database password', () => {
    const config = loadConfig({ DATABASE_URL: 'postgres://app:s3cr3t@db.example.com:5432/hearthwild?sslmode=require' });
    expect(redactConfig(config).databaseUrl).toBe('postgres://app:***@db.example.com:5432/hearthwild?sslmode=require');
    expect(JSON.stringify(redactConfig(config))).not.toContain('s3cr3t');
  });

  it('leaves URLs without a password alone, and keeps the other fields', () => {
    const config = loadConfig({ DATABASE_URL: 'postgres://db.example.com/hearthwild', PORT: '4000' });
    expect(redactConfig(config)).toEqual(config);
  });

  it('does not modify the original', () => {
    const config = loadConfig({ DATABASE_URL: DB });
    redactConfig(config);
    expect(config.databaseUrl).toBe(DB);
  });
});
