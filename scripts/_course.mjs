// Shared helpers for the course scripts. You don't need to read this to do the
// course, but you're welcome to — it's plain Node.js and you'll understand all of
// it by the end of Module 15.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const EXERCISES_DIR = path.join(ROOT, 'exercises');
export const COURSE_DIR = path.join(ROOT, 'course');
export const PROGRESS_FILE = path.join(ROOT, 'PROGRESS.md');
const VITEST_BIN = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');

const NUMBERED = /^(\d{2})-/;
export const toPosix = (p) => p.split(path.sep).join('/');

export const color = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

/** Every exercise folder: exercises/<NN-module>/<NN-exercise>/ containing a test file. */
export function listExercises() {
  if (!fs.existsSync(EXERCISES_DIR)) return [];
  const result = [];
  for (const moduleDir of fs.readdirSync(EXERCISES_DIR).sort()) {
    const moduleMatch = moduleDir.match(NUMBERED);
    const modulePath = path.join(EXERCISES_DIR, moduleDir);
    if (!moduleMatch || !fs.statSync(modulePath).isDirectory()) continue;
    for (const exerciseDir of fs.readdirSync(modulePath).sort()) {
      const exerciseMatch = exerciseDir.match(NUMBERED);
      const exercisePath = path.join(modulePath, exerciseDir);
      if (!exerciseMatch || !fs.statSync(exercisePath).isDirectory()) continue;
      const tests = fs.readdirSync(exercisePath).filter((f) => /\.test\.tsx?$/.test(f));
      if (tests.length === 0) continue;
      result.push({
        id: `${moduleMatch[1]}-${exerciseMatch[1]}`,
        module: moduleMatch[1],
        moduleDir,
        name: exerciseDir.replace(NUMBERED, ''),
        dir: exercisePath,
        relDir: toPosix(path.relative(ROOT, exercisePath)),
        hints: toPosix(path.join('exercises', moduleDir, 'HINTS.md')),
        solution: toPosix(path.join('solutions', moduleDir, exerciseDir)),
      });
    }
  }
  return result;
}

/** "01" -> "JavaScript You'll Use Every Day" (read from the module README's first heading). */
export function moduleTitle(moduleNumber) {
  if (!fs.existsSync(COURSE_DIR)) return `Module ${moduleNumber}`;
  const dir = fs.readdirSync(COURSE_DIR).find((d) => d.startsWith(`${moduleNumber}-`));
  if (!dir) return `Module ${moduleNumber}`;
  const readme = path.join(COURSE_DIR, dir, 'README.md');
  if (!fs.existsSync(readme)) return dir;
  const heading = fs.readFileSync(readme, 'utf8').split(/\r?\n/).find((l) => l.startsWith('# '));
  return heading ? heading.replace(/^#\s+(Module\s+\d+\s*[·:-]\s*)?/, '').trim() : dir;
}

export function runVitest(args, { inherit = true } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [VITEST_BIN, ...args], {
      cwd: ROOT,
      stdio: inherit ? 'inherit' : 'ignore',
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}
