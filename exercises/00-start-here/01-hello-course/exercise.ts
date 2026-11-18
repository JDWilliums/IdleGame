/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 00-01 · hello-course
 * Lesson:  00.2 Set up your machine
 * Run:     npm run watch 00-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This exercise is about the WORKFLOW, not the code. You'll practise the loop
 * you'll use ~60 more times in this course:
 *
 *   1. read the instructions (here) and the tests (exercise.test.ts)
 *   2. run the tests in watch mode and watch them fail
 *   3. write code until they pass
 *   4. `npm run progress`, then commit
 *
 * TASK 1 — welcomeMessage(name)
 *   Return exactly:  "Welcome to Idle Game Academy, <name>!"
 *   If the name is empty or only whitespace, use "adventurer" instead.
 *   Trim whitespace from the name, e.g. "  Sam " → "Sam".
 *
 * TASK 2 — totalHours(modules)
 *   Given a list of modules like [{ title: 'TS', hours: 20 }, ...],
 *   return the sum of all `hours`. An empty list totals 0.
 *
 * TASK 3 — weeksToFinish(totalHours, hoursPerWeek)
 *   Return how many whole weeks it takes to study `totalHours` at
 *   `hoursPerWeek`. Partial weeks count as a full week (round UP).
 *   e.g. weeksToFinish(500, 15) → 34
 *   If hoursPerWeek is 0 or negative, throw an Error (you'd never finish!).
 */

export type CourseModule = {
  title: string;
  hours: number;
};

export function welcomeMessage(name: string): string {
  // TODO: replace this line with your implementation
  throw new Error('Not implemented yet');
}

export function totalHours(modules: CourseModule[]): number {
  // TODO
  throw new Error('Not implemented yet');
}

export function weeksToFinish(totalHours: number, hoursPerWeek: number): number {
  // TODO
  throw new Error('Not implemented yet');
}
