/**
 * Test helper for the database exercises (Module 16+).
 *
 * Starts ONE in-memory Postgres (PGlite) per test file, because starting one takes
 * about a second, and gives every test a brand-new schema by dropping and
 * re-creating it before each test (a few milliseconds). Tests never see each
 * other's data.
 *
 *   const getDb = useTestDatabase(SCHEMA, SEED);
 *   it('…', async () => { const db = getDb(); … });
 */
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach } from 'vitest';

export function useTestDatabase(...setupSql: string[]): () => PGlite {
  let db: PGlite | undefined;

  beforeAll(async () => {
    db = new PGlite();
    await db.waitReady;
  });

  beforeEach(async () => {
    if (!db) throw new Error('database not started');
    await db.exec(['DROP SCHEMA public CASCADE;', 'CREATE SCHEMA public;', ...setupSql].join('\n'));
  });

  afterAll(async () => {
    await db?.close();
  });

  return () => {
    if (!db) throw new Error('useTestDatabase: call getDb() inside a test, not at the top of the file');
    return db;
  };
}
