#!/usr/bin/env node

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const benchmarks = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'benchmarks.json'), 'utf8'));
const requestedNames = process.argv.slice(2);
const benchmarkNames = requestedNames.length > 0 ? requestedNames : Object.keys(benchmarks);
const repetitions = Number(process.env.BENCH_REPETITIONS || 3);
const concurrency = Number(process.env.BENCH_CONCURRENCY || 2);
const arms = (process.env.BENCH_ARMS || 'baseline,candidate').split(',').filter(Boolean);

function validateOptions() {
  const unknown = benchmarkNames.filter((name) => !benchmarks[name]);
  if (unknown.length > 0) {
    throw new Error(`Unknown benchmarks: ${unknown.join(', ')}`);
  }
  if (!Number.isInteger(repetitions) || repetitions < 1) {
    throw new Error('BENCH_REPETITIONS must be a positive integer');
  }
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('BENCH_CONCURRENCY must be a positive integer');
  }
  if (arms.length === 0 || arms.some((arm) => !['baseline', 'candidate'].includes(arm))) {
    throw new Error('BENCH_ARMS must contain baseline, candidate, or both');
  }
}

function buildJobs() {
  const jobs = [];
  for (const benchmark of benchmarkNames) {
    for (let repetition = 1; repetition <= repetitions; repetition += 1) {
      for (const arm of arms) jobs.push({ benchmark, arm, repetition });
    }
  }
  return jobs;
}

function runJob(job) {
  return new Promise((resolve) => {
    process.stderr.write(
      `[ab] starting ${job.benchmark}/${job.arm} (${job.repetition}/${repetitions})\n`,
    );
    const child = childProcess.spawn(
      process.execPath,
      [path.join(__dirname, 'run-codex-benchmark.js'), job.benchmark, job.arm],
      {
        cwd: ROOT,
        env: process.env,
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    let diagnostics = '';
    child.stderr.on('data', (chunk) => {
      const output = chunk.toString('utf8');
      diagnostics += output;
      process.stderr.write(output);
    });
    child.on('error', (error) => {
      diagnostics += `${error.stack || error.message || error}\n`;
    });
    child.on('close', (status, signal) => {
      const succeeded = status === 0;
      process.stderr.write(
        `[ab] ${succeeded ? 'completed' : 'failed'} ${job.benchmark}/${job.arm}`
          + ` (${job.repetition}/${repetitions}, status=${status}, signal=${signal || 'none'})\n`,
      );
      resolve({ ...job, succeeded, status, signal, diagnostics });
    });
  });
}

async function runQueue(jobs) {
  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < jobs.length) {
      const job = jobs[nextIndex];
      nextIndex += 1;
      results.push(await runJob(job));
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(concurrency, jobs.length) },
    () => worker(),
  ));
  return results;
}

async function main() {
  validateOptions();
  const jobs = buildJobs();
  process.stderr.write(
    `[ab] queued ${jobs.length} runs across ${benchmarkNames.length} benchmarks`
      + ` with concurrency ${Math.min(concurrency, jobs.length)}\n`,
  );
  const results = await runQueue(jobs);
  const failures = results.filter((result) => !result.succeeded);
  process.stderr.write(`[ab] finished ${results.length - failures.length}/${results.length} runs successfully\n`);
  if (failures.length > 0) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message || error}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  buildJobs,
  runQueue,
  validateOptions,
};
