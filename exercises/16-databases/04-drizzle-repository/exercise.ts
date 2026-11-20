/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 16-04 · drizzle-repository
 * Lesson:  16.6 Drizzle ORM
 * Run:     npm run watch 16-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build the real save repository for the game's API with Drizzle. This is the
 * piece that Module 18's save endpoint will call.
 *
 * The Drizzle schema (users, saves) and the SQL migration that creates those
 * tables are provided. Use the query builder (db.select / insert / update /
 * delete). The `sql` template is fine for small expressions. No raw query strings.
 *
 * TASK 1 · createUser(db, username) → User
 *   Insert and return the new user. If the username is taken, throw
 *   new UsernameTakenError(username). Hint: Drizzle wraps the driver's error;
 *   the Postgres code is on err.cause. Any other error is rethrown untouched.
 *
 * TASK 2 · findUserByUsername(db, username) → User | undefined
 *   Case-insensitive.
 *
 * TASK 3 · createSaveRepository(db, { now }) → SaveRepository
 *   get(userId)                     → SaveRecord | undefined
 *   put(userId, data, baseRevision) → PutResult
 *       Same rules as 16-03's saveWithRevision: baseRevision 0 creates the
 *       save at revision 1 (conflict if one exists); otherwise update only if
 *       the stored revision matches, bumping it by 1. updatedAt = deps.now().
 *       Success  → { ok: true, record: <the saved row> }
 *       Conflict → { ok: false, currentRevision } (0 if there's no save)
 *       Saving for a user that doesn't exist should fail (let the foreign
 *       key error propagate).
 *   listRecent(limit)               → RecentSave[]
 *       Newest updatedAt first, ties by username, joined with users.
 *   remove(userId)                  → boolean (true if a save was deleted)
 */
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

// ─── your code ────────────────────────────────────────────────────────────────
export async function createUser(db: Database, username: string): Promise<User> {
  throw new Error('Not implemented yet');
}

export async function findUserByUsername(db: Database, username: string): Promise<User | undefined> {
  throw new Error('Not implemented yet');
}

export function createSaveRepository(db: Database, deps: { now: () => Date }): SaveRepository {
  return {
    async get(userId) {
      throw new Error('Not implemented yet');
    },
    async put(userId, data, baseRevision) {
      throw new Error('Not implemented yet');
    },
    async listRecent(limit) {
      throw new Error('Not implemented yet');
    },
    async remove(userId) {
      throw new Error('Not implemented yet');
    },
  };
}
