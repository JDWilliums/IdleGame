import fs from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

/**
 * When SOLUTIONS=1 is set, every import made from an exercise test that points
 * at an exercise file is redirected to the matching file in /solutions (if one
 * exists). This lets the course maintainers prove every test is passable
 * without touching your work. You never need to use this mode yourself.
 */
function useSolutions(): Plugin {
  const toPosix = (p: string) => p.replaceAll('\\', '/');
  return {
    name: 'course:use-solutions',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!importer || !source.startsWith('.')) return null;
      const from = toPosix(importer);
      if (!from.includes('/exercises/') && !from.includes('/solutions/')) return null;

      const exerciseImporter = from.replace('/solutions/', '/exercises/');
      const resolved = await this.resolve(source, exerciseImporter, { skipSelf: true });
      if (!resolved) return null;

      const id = toPosix(resolved.id);
      if (/\.test\.[tj]sx?$/.test(id)) return id;
      const solution = id.replace('/exercises/', '/solutions/');
      return fs.existsSync(solution) ? solution : id;
    },
  };
}

/**
 * In "write your own tests" exercises (Module 12) the learner's TEST file is the
 * exercise. In maintainer mode we run the reference test file from /solutions in
 * its place.
 */
function solutionTestFiles(): string[] {
  if (process.env.SOLUTIONS !== '1' || !fs.existsSync('solutions')) return [];
  return fs
    .readdirSync('solutions', { recursive: true, encoding: 'utf8' })
    .map((file) => `solutions/${file.replaceAll('\\', '/')}`)
    .filter((file) => /\.test\.tsx?$/.test(file));
}
const learnerWrittenTests = solutionTestFiles();

export default defineConfig({
  plugins: [react(), ...(process.env.SOLUTIONS === '1' ? [useSolutions()] : [])],
  test: {
    include: ['exercises/**/*.test.{ts,tsx}', ...learnerWrittenTests],
    exclude: ['**/node_modules/**', ...learnerWrittenTests.map((f) => f.replace(/^solutions\//, 'exercises/'))],
    setupFiles: ['./vitest.setup.ts'],
    // Most exercises are plain logic and run in Node. React exercises opt into a
    // browser-like DOM with a `// @vitest-environment jsdom` comment at the top.
    environment: 'node',
    testTimeout: 15_000,
    restoreMocks: true,
  },
});
