#!/usr/bin/env node
// Usage:
//   npm run progress            run every exercise's tests, tick them in PROGRESS.md, print a report
//   npm run progress -- --fast  skip the tests; just recount the boxes you ticked by hand
//
// Lessons, projects and capstone milestones are ticked BY YOU in PROGRESS.md.
// Exercises are ticked BY THIS SCRIPT, based on whether their tests pass.
import fs from 'node:fs';
import path from 'node:path';
import { PROGRESS_FILE, ROOT, color, listExercises, moduleTitle, runVitest, toPosix } from './_course.mjs';

const fast = process.argv.includes('--fast');
const exercises = listExercises();
const RESULTS = path.join(ROOT, '.progress', 'results.json');

// ── 1. Work out which exercises pass ──────────────────────────────────────────
const passed = new Set();
if (!fast) {
  console.log(color.dim(`\nRunning the tests for ${exercises.length} exercises (this takes ~30s)…`));
  fs.mkdirSync(path.dirname(RESULTS), { recursive: true });
  fs.rmSync(RESULTS, { force: true });
  await runVitest(['run', 'exercises', '--reporter=json', `--outputFile=${RESULTS}`], { inherit: false });
  if (!fs.existsSync(RESULTS)) {
    console.log(color.red('Could not run the tests. Try `npm install`, then `npm test` to see the error.'));
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
  const fileStatus = new Map(); // relDir -> boolean (all files in that dir passed)
  for (const file of report.testResults) {
    const rel = toPosix(path.relative(ROOT, file.name));
    const dir = rel.slice(0, rel.lastIndexOf('/'));
    const ok =
      file.status === 'passed' &&
      file.assertionResults.length > 0 &&
      file.assertionResults.every((a) => a.status === 'passed');
    fileStatus.set(dir, (fileStatus.get(dir) ?? true) && ok);
  }
  for (const ex of exercises) if (fileStatus.get(ex.relDir)) passed.add(ex.id);
}

// ── 2. Update PROGRESS.md ─────────────────────────────────────────────────────
const original = fs.readFileSync(PROGRESS_FILE, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
const EXERCISE_LINE = /^(\s*-\s\[)([ xX])(\]\s+Exercise\s+`(\d{2}-\d{2})`.*)$/;
const LESSON_LINE = /^\s*-\s\[([ xX])\]\s+Lesson\s+`(\d{2})\.(\d+)`\s*(.*)$/;
const PROJECT_LINE = /^\s*-\s\[([ xX])\]\s+(Project|Milestone)\s+`([A-Z]\d+)`\s*(.*)$/;

const modules = new Map(); // "01" -> { lessons: [done,total], exercises: [done,total] }
const bucket = (m) => {
  if (!modules.has(m)) modules.set(m, { lessons: [0, 0], exercises: [0, 0] });
  return modules.get(m);
};
const projects = { Project: [0, 0], Milestone: [0, 0] };
let nextUp = null;

const lines = original.split(/\r?\n/).map((line) => {
  const ex = line.match(EXERCISE_LINE);
  if (ex) {
    const id = ex[4];
    const done = fast ? ex[2].toLowerCase() === 'x' : passed.has(id);
    const b = bucket(id.slice(0, 2)).exercises;
    b[1]++;
    if (done) b[0]++;
    else nextUp ??= `Exercise ${id} → npm run check ${id}`;
    return `${ex[1]}${done ? 'x' : ' '}${ex[3]}`;
  }
  const lesson = line.match(LESSON_LINE);
  if (lesson) {
    const b = bucket(lesson[2]).lessons;
    b[1]++;
    if (lesson[1].toLowerCase() === 'x') b[0]++;
    else nextUp ??= `Lesson ${lesson[2]}.${lesson[3]} ${lesson[4]}`;
    return line;
  }
  const project = line.match(PROJECT_LINE);
  if (project) {
    const b = projects[project[2]];
    b[1]++;
    if (project[1].toLowerCase() === 'x') b[0]++;
    else nextUp ??= `${project[2]} ${project[3]} ${project[4]}`;
  }
  return line;
});

// ── 3. Build the report ───────────────────────────────────────────────────────
const bar = ([done, total], width = 20) => {
  if (total === 0) return '─'.repeat(width);
  const filled = Math.round((done / total) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
};
const pct = ([done, total]) => (total === 0 ? 0 : Math.round((done / total) * 100));
const sum = (pick) =>
  [...modules.values()].reduce((acc, m) => [acc[0] + pick(m)[0], acc[1] + pick(m)[1]], [0, 0]);

const allLessons = sum((m) => m.lessons);
const allExercises = sum((m) => m.exercises);
const everything = [
  allLessons[0] + allExercises[0] + projects.Project[0] + projects.Milestone[0],
  allLessons[1] + allExercises[1] + projects.Project[1] + projects.Milestone[1],
];
const today = new Date().toISOString().slice(0, 10);

const md = [
  `**Overall: ${pct(everything)}%** \`${bar(everything, 30)}\` — last updated ${today}${fast ? ' (fast mode: exercises not re-tested)' : ''}`,
  '',
  `| | Done | Progress |`,
  `|---|---|---|`,
  `| Lessons | ${allLessons[0]} / ${allLessons[1]} | \`${bar(allLessons)}\` |`,
  `| Exercises | ${allExercises[0]} / ${allExercises[1]} | \`${bar(allExercises)}\` |`,
  `| Projects | ${projects.Project[0]} / ${projects.Project[1]} | \`${bar(projects.Project)}\` |`,
  `| Capstone milestones | ${projects.Milestone[0]} / ${projects.Milestone[1]} | \`${bar(projects.Milestone)}\` |`,
  '',
  `**Next up:** ${nextUp ?? 'Nothing — you finished the course. Go get that job! 🎉'}`,
];

const START = '<!-- progress:start -->';
const END = '<!-- progress:end -->';
let output = lines.join(eol);
const s = output.indexOf(START);
const e = output.indexOf(END);
if (s !== -1 && e !== -1) {
  output = output.slice(0, s + START.length) + eol + md.join(eol) + eol + output.slice(e);
}
if (output !== original) fs.writeFileSync(PROGRESS_FILE, output);

// ── 4. Print it ───────────────────────────────────────────────────────────────
console.log(`\n${color.bold('Your progress')}  ${color.green(bar(everything, 30))} ${pct(everything)}%\n`);
for (const [num, m] of [...modules.entries()].sort()) {
  const title = moduleTitle(num).padEnd(38).slice(0, 38);
  const lessonCol = `${m.lessons[0]}/${m.lessons[1]} lessons`.padEnd(14);
  const exCol = m.exercises[1] ? `${m.exercises[0]}/${m.exercises[1]} exercises` : '';
  const complete = m.lessons[0] === m.lessons[1] && m.exercises[0] === m.exercises[1];
  const line = `  ${num}  ${title} ${bar([m.lessons[0] + m.exercises[0], m.lessons[1] + m.exercises[1]], 12)}  ${lessonCol} ${exCol}`;
  console.log(complete ? color.green(line) : line);
}
console.log(`\n  Projects: ${projects.Project[0]}/${projects.Project[1]}   Capstone milestones: ${projects.Milestone[0]}/${projects.Milestone[1]}`);
console.log(`\n  ${color.bold('Next up:')} ${color.cyan(nextUp ?? 'You are done!')}`);
console.log(color.dim(`\n  PROGRESS.md updated. Commit it: git add PROGRESS.md && git commit -m "Progress update"\n`));
