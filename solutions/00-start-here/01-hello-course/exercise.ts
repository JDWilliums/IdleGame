// Reference solution for 00-01. Read it only AFTER your own version passes.

export type CourseModule = {
  title: string;
  hours: number;
};

export function welcomeMessage(name: string): string {
  const trimmed = name.trim();
  // `||` falls back when the left side is falsy, and "" is falsy.
  return `Welcome to Idle Game Academy, ${trimmed || 'adventurer'}!`;
}

export function totalHours(modules: CourseModule[]): number {
  // reduce with an explicit starting value (0) so an empty array works.
  return modules.reduce((sum, module) => sum + module.hours, 0);
}

export function weeksToFinish(totalHours: number, hoursPerWeek: number): number {
  if (hoursPerWeek <= 0) {
    throw new Error(`hoursPerWeek must be positive, got ${hoursPerWeek}`);
  }
  return Math.ceil(totalHours / hoursPerWeek);
}
