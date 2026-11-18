// Mutation testing helper for the "write your own tests" exercises (Module 12).
//
// The subject code under test contains a few deliberately buggy variants
// ("mutants"), switched on by the COURSE_MUTANT environment variable. This
// helper runs YOUR test file in a separate Vitest process, once against the
// real code and once per mutant. Good tests pass on the real code and FAIL on
// every mutant. You don't need to edit (or understand) this file.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const VITEST = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');

export type RunResult = { passed: boolean; output: string };

function cleanEnv(mutant: string | undefined): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('VITEST') || key === 'NODE_OPTIONS' || key === 'COURSE_MUTANT') continue;
    env[key] = value;
  }
  if (mutant) env.COURSE_MUTANT = mutant;
  env.FORCE_COLOR = '0';
  env.NO_COLOR = '1';
  return env;
}

/**
 * Runs `testFile` (an absolute path to the learner's test file) in a fresh
 * Vitest process. In maintainer mode (SOLUTIONS=1) the reference test file
 * from /solutions is copied in temporarily and run instead.
 */
export function runTests(testFile: string, mutant?: string): RunResult {
  let target = testFile;
  let cleanup: (() => void) | undefined;

  if (process.env.SOLUTIONS === '1') {
    const solution = testFile.replace(`${path.sep}exercises${path.sep}`, `${path.sep}solutions${path.sep}`);
    target = path.join(path.dirname(testFile), `solution-check-${process.pid}${path.extname(testFile)}`.replace(/\.(tsx?)$/, '.test.$1'));
    fs.copyFileSync(solution, target);
    cleanup = () => fs.rmSync(target, { force: true });
  }

  try {
    const rel = path.relative(ROOT, target).split(path.sep).join('/');
    const result = spawnSync(process.execPath, [VITEST, 'run', rel, '--reporter=dot'], {
      cwd: ROOT,
      env: cleanEnv(mutant),
      encoding: 'utf8',
      timeout: 60_000,
    });
    // eslint-disable-next-line no-control-regex
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.replace(/\x1b\[[0-9;]*m/g, '');
    const ranTests = /Tests\s+\d+/.test(output);
    return { passed: result.status === 0 && ranTests, output };
  } finally {
    cleanup?.();
  }
}

/** Counts `it(`/`test(` calls in a test file, ignoring the placeholder. */
export function countTests(testFile: string): number {
  const source = fs.readFileSync(
    process.env.SOLUTIONS === '1'
      ? testFile.replace(`${path.sep}exercises${path.sep}`, `${path.sep}solutions${path.sep}`)
      : testFile,
    'utf8',
  );
  return (source.match(/\b(it|test)(\.each\([^)]*\))?\s*\(/g) ?? []).length;
}
