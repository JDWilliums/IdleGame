// Runs the real TypeScript compiler over a "type test" file and returns any
// errors. Used by exercises that grade your TYPES, not just your runtime code.
// You don't need to edit (or understand) this file.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const TSC = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

/**
 * Type-check `checkFile` (absolute path) with the course's strict settings.
 * Returns a list of human-readable error lines; an empty list means success.
 */
export function typeErrors(checkFile: string): string[] {
  let target = checkFile;
  let cleanup: (() => void) | undefined;

  // Maintainer mode: check the same type tests against /solutions instead.
  if (process.env.SOLUTIONS === '1') {
    const solutionDir = path.dirname(checkFile).replace(`${path.sep}exercises${path.sep}`, `${path.sep}solutions${path.sep}`);
    target = path.join(solutionDir, `.${path.basename(checkFile)}`);
    fs.copyFileSync(checkFile, target);
    cleanup = () => fs.rmSync(target, { force: true });
  }

  const dir = path.join(ROOT, '.progress');
  fs.mkdirSync(dir, { recursive: true });
  const config = path.join(dir, `tsconfig.check-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(
    config,
    JSON.stringify({
      extends: path.relative(dir, path.join(ROOT, 'tsconfig.json')).split(path.sep).join('/'),
      files: [path.relative(dir, target).split(path.sep).join('/')],
      include: [],
    }),
  );

  try {
    const result = spawnSync(process.execPath, [TSC, '-p', config, '--pretty', 'false'], {
      encoding: 'utf8',
    });
    return `${result.stdout}\n${result.stderr}`
      .split(/\r?\n/)
      .filter((line) => line.includes('error TS'))
      .map((line) => line.replace(/^.*?(exercises|solutions)[\\/]/, '$1/').replace(/[\\/]\./, '/'));
  } finally {
    fs.rmSync(config, { force: true });
    cleanup?.();
  }
}
