// Reference solution for 16-04. Read it only AFTER your own version passes.
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

// ─── provided: schema ─────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const saves = pgTable('saves', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull(),
  revision: integer('revision').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

/** What `drizzle-kit generate` would write for the schema above. The tests run it. */
export const MIGRATION = /* sql */ `
  CREATE TABLE "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "username" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "users_username_unique" UNIQUE("username")
  );
  CREATE TABLE "saves" (
    "user_id" integer PRIMARY KEY NOT NULL,
    "data" jsonb NOT NULL,
    "revision" integer NOT NULL,
    "updated_at" timestamp with time zone NOT NULL
  );
  ALTER TABLE "saves" ADD CONSTRAINT "saves_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
`;

// ─── provided: types and errors ───────────────────────────────────────────────
export type Database = PgliteDatabase;
export type User = typeof users.$inferSelect;
export type SaveRecord = typeof saves.$inferSelect;
export type PutResult = { ok: true; record: SaveRecord } | { ok: false; currentRevision: number };
export type RecentSave = { username: string; revision: number; updatedAt: Date };

export type SaveRepository = {
  get(userId: number): Promise<SaveRecord | undefined>;
  put(userId: number, data: unknown, baseRevision: number): Promise<PutResult>;
  listRecent(limit: number): Promise<RecentSave[]>;
  remove(userId: number): Promise<boolean>;
};

export class UsernameTakenError extends Error {
  readonly username: string;
  constructor(username: string) {
    super(`Username "${username}" is taken`);
    this.name = 'UsernameTakenError';
    this.username = username;
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const UNIQUE_VIOLATION = '23505';

/** Drizzle wraps driver errors; the Postgres SQLSTATE code lives on `cause`. */
function pgCode(err: unknown): string | undefined {
  const cause = err instanceof Error ? err.cause : undefined;
  return typeof cause === 'object' && cause !== null && 'code' in cause && typeof cause.code === 'string'
    ? cause.code
    : undefined;
}

// ─── tasks ────────────────────────────────────────────────────────────────────
export async function createUser(db: Database, username: string): Promise<User> {
  try {
    const [user] = await db.insert(users).values({ username }).returning();
    if (!user) throw new Error('INSERT … RETURNING returned no row');
    return user;
  } catch (err) {
    if (pgCode(err) === UNIQUE_VIOLATION) throw new UsernameTakenError(username);
    throw err;
  }
}

export async function findUserByUsername(db: Database, username: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.username})`, username.toLowerCase()));
  return user;
}

export function createSaveRepository(db: Database, deps: { now: () => Date }): SaveRepository {
  async function currentRevision(userId: number): Promise<number> {
    const [row] = await db.select({ revision: saves.revision }).from(saves).where(eq(saves.userId, userId));
    return row?.revision ?? 0;
  }

  return {
    async get(userId) {
      const [row] = await db.select().from(saves).where(eq(saves.userId, userId));
      return row;
    },

    async put(userId, data, baseRevision) {
      // One statement per branch, so the revision check and the write are atomic (16.4).
      const [record] =
        baseRevision === 0
          ? await db
              .insert(saves)
              .values({ userId, data, revision: 1, updatedAt: deps.now() })
              .onConflictDoNothing({ target: saves.userId })
              .returning()
          : await db
              .update(saves)
              .set({ data, revision: sql`${saves.revision} + 1`, updatedAt: deps.now() })
              .where(and(eq(saves.userId, userId), eq(saves.revision, baseRevision)))
              .returning();

      if (record) return { ok: true, record };
      return { ok: false, currentRevision: await currentRevision(userId) };
    },

    async listRecent(limit) {
      return db
        .select({ username: users.username, revision: saves.revision, updatedAt: saves.updatedAt })
        .from(saves)
        .innerJoin(users, eq(users.id, saves.userId))
        .orderBy(desc(saves.updatedAt), asc(users.username))
        .limit(limit);
    },

    async remove(userId) {
      const deleted = await db.delete(saves).where(eq(saves.userId, userId)).returning({ userId: saves.userId });
      return deleted.length > 0;
    },
  };
}
