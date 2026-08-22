#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  extractBehaviorIds,
  summarizeBenchmarkCoverage,
  validateBenchmarkCoverage,
} = require('./lib/benchmark-coverage');

const ROOT = path.resolve(__dirname, '..');
const benchmarks = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'config', 'benchmarks.json'), 'utf8'),
);
const behaviorSpec = fs.readFileSync(path.join(ROOT, 'docs', 'behavior-spec.md'), 'utf8');
const behaviorIds = extractBehaviorIds(behaviorSpec);
const errors = validateBenchmarkCoverage(benchmarks, behaviorIds);

if (errors.length > 0) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exit(1);
}

const summary = summarizeBenchmarkCoverage(benchmarks, behaviorIds);
if (process.argv.includes('--json')) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  const percent = Math.round(summary.behaviors.ratio * 100);
  process.stdout.write(`Scenarios: ${summary.scenarios}\n`);
  process.stdout.write(
    `Behavior IDs: ${summary.behaviors.covered}/${summary.behaviors.total} (${percent}%)\n`,
  );
  process.stdout.write(
    `Uncovered: ${summary.behaviors.uncovered.join(', ') || 'none'}\n`,
  );
  process.stdout.write(`Holdout scenarios: ${summary.holdoutScenarios.length}\n`);
}
