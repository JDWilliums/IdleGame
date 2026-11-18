#!/usr/bin/env node
// Usage:
//   npm run check 02-03     run the tests for exercise 02-03 once
//   npm run watch 02-03     re-run them every time you save a file
//   npm run check list      list every exercise and its id
import { color, listExercises, runVitest } from './_course.mjs';

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const id = args.find((a) => !a.startsWith('--'));
const exercises = listExercises();

function printList() {
  let current = '';
  for (const ex of exercises) {
    if (ex.moduleDir !== current) {
      current = ex.moduleDir;
      console.log(`\n${color.bold(current)}`);
    }
    console.log(`  ${color.cyan(ex.id)}  ${ex.name}`);
  }
  console.log();
}

if (!id || id === 'list') {
  if (!id) {
    console.log(`\nUsage: ${color.cyan('npm run check <id>')}   e.g. npm run check 01-01`);
    console.log(`       ${color.cyan('npm run watch <id>')}   re-run tests on every save`);
  }
  printList();
  process.exit(0);
}

const normalised = id.replace(/^(\d)-/, '0$1-').replace(/-(\d)$/, '-0$1');
const exercise = exercises.find((ex) => ex.id === normalised);
if (!exercise) {
  console.log(color.red(`\nNo exercise with id "${id}".`) + ' Here are the valid ids:');
  printList();
  process.exit(1);
}

console.log(color.dim(`\n▶ Exercise ${exercise.id} · ${exercise.name} · ${exercise.relDir}\n`));
const code = await runVitest([watch ? 'watch' : 'run', exercise.relDir]);

if (!watch) {
  if (code === 0) {
    console.log(color.green(color.bold(`\n✔ Exercise ${exercise.id} passed!`)));
    console.log(`  • Record it:            ${color.cyan('npm run progress')}`);
    console.log(`  • Compare with mine:    ${exercise.solution}/  ${color.dim('(read it AFTER you pass)')}`);
    console.log(`  • Commit your work:     git add -A && git commit -m "Complete exercise ${exercise.id}"\n`);
  } else {
    console.log(color.yellow(color.bold(`\n✘ Not passing yet — that's normal.`)));
    console.log('  1. Read the FIRST failing test name: it describes the behaviour that is missing.');
    console.log('  2. Read the error: "expected X, received Y" tells you exactly what to change.');
    console.log(`  3. Still stuck after 20 minutes? Tiered hints: ${color.cyan(`${exercise.hints}`)} (section ${exercise.id})`);
    console.log(`  4. Then follow the stuck protocol in ${color.cyan('STUCK.md')}\n`);
  }
}
process.exit(code);
