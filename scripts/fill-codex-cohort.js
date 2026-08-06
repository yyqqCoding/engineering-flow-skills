#!/usr/bin/env node

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const {
  fingerprintBenchmark,
  fingerprintCandidate,
} = require('./lib/benchmark-fingerprints');
const { loadEnvFile } = require('./lib/env-file');

const ROOT = path.resolve(__dirname, '..');
loadEnvFile(path.join(ROOT, '.env'));
const RESULT_DIR = path.join(ROOT, 'benchmark-results');
const benchmarks = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'benchmarks.json'), 'utf8'));
const requestedNames = process.argv.slice(2);
const benchmarkNames = requestedNames.length > 0 ? requestedNames : Object.keys(benchmarks);
const targetCompleted = Number(process.env.BENCH_TARGET_COMPLETED || 3);
const concurrency = Number(process.env.BENCH_CONCURRENCY || 1);
const maxAttempts = Number(process.env.BENCH_MAX_ATTEMPTS || 6);
const retryDelayMs = Number(process.env.BENCH_RETRY_DELAY_MS || 15000);
const arms = (process.env.BENCH_ARMS || 'baseline,candidate').split(',').filter(Boolean);
const baselinePluginRoot = process.env.BENCH_BASELINE_PLUGIN_ROOT
  ? path.resolve(process.env.BENCH_BASELINE_PLUGIN_ROOT)
  : null;

function validateOptions() {
  const unknown = benchmarkNames.filter((name) => !benchmarks[name]);
  if (unknown.length > 0) throw new Error(`Unknown benchmarks: ${unknown.join(', ')}`);
  for (const [name, value] of Object.entries({ targetCompleted, concurrency, maxAttempts })) {
    if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  }
  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    throw new Error('BENCH_RETRY_DELAY_MS must be a non-negative number');
  }
  if (arms.length === 0 || arms.some((arm) => !['baseline', 'candidate'].includes(arm))) {
    throw new Error('BENCH_ARMS must contain baseline, candidate, or both');
  }
}

function loadReports() {
  if (!fs.existsSync(RESULT_DIR)) return [];
  return fs.readdirSync(RESULT_DIR)
    .filter((filename) => filename.endsWith('.json'))
    .map((filename) => JSON.parse(fs.readFileSync(path.join(RESULT_DIR, filename), 'utf8')));
}

function isUsable(report) {
  return report.modelRun?.status === 0
    && !report.modelRun?.timedOut
    && !report.modelRun?.error
    && !report.modelRun?.contaminated
    && (report.metrics?.turns || 0) > 0;
}

function matchesEnvironment(report) {
  const provider = process.env.BENCH_MODEL_PROVIDER || '';
  const model = process.env.BENCH_MODEL || '';
  const effort = process.env.BENCH_REASONING_EFFORT || 'medium';
  return (!provider || report.modelRun?.modelProvider === provider)
    && (!model || report.modelRun?.model === model)
    && report.modelRun?.reasoningEffort === effort;
}

function buildMissingJobs(reports) {
  const candidateFingerprint = fingerprintCandidate(ROOT);
  const baselineFingerprint = baselinePluginRoot ? fingerprintCandidate(baselinePluginRoot) : null;
  const jobs = [];

  for (const benchmarkName of benchmarkNames) {
    const benchmarkFingerprint = fingerprintBenchmark(ROOT, benchmarks[benchmarkName]);
    for (const arm of arms) {
      const completed = reports.filter((report) => report.benchmark === benchmarkName
        && report.arm === arm
        && report.benchmarkFingerprint === benchmarkFingerprint
        && (report.pluginFingerprint || null)
          === (arm === 'candidate' ? candidateFingerprint : baselineFingerprint)
        && matchesEnvironment(report)
        && isUsable(report)).length;
      const missing = Math.max(0, targetCompleted - completed);
      process.stderr.write(
        `[fill] ${benchmarkName}/${arm}: ${completed}/${targetCompleted} usable, missing ${missing}\n`,
      );
      for (let index = 0; index < missing; index += 1) jobs.push({ benchmarkName, arm });
    }
  }

  return jobs;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function runAttempt(job, attempt) {
  return new Promise((resolve) => {
    process.stderr.write(
      `[fill] starting ${job.benchmarkName}/${job.arm}, attempt ${attempt}/${maxAttempts}\n`,
    );
    const child = childProcess.spawn(
      process.execPath,
      [path.join(__dirname, 'run-codex-benchmark.js'), job.benchmarkName, job.arm],
      {
        cwd: ROOT,
        env: process.env,
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    child.stderr.on('data', (chunk) => process.stderr.write(chunk));
    child.on('error', (error) => {
      process.stderr.write(`${error.stack || error.message || error}\n`);
    });
    child.on('close', (status, signal) => resolve({
      succeeded: status === 0,
      status,
      signal,
    }));
  });
}

async function runJob(job) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await runAttempt(job, attempt);
    if (result.succeeded) {
      process.stderr.write(`[fill] completed ${job.benchmarkName}/${job.arm}\n`);
      return true;
    }
    process.stderr.write(
      `[fill] infrastructure failure ${job.benchmarkName}/${job.arm}`
        + ` (status=${result.status}, signal=${result.signal || 'none'})\n`,
    );
    if (attempt < maxAttempts) await delay(retryDelayMs);
  }
  return false;
}

async function runQueue(jobs) {
  let nextIndex = 0;
  const results = [];

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
  const jobs = buildMissingJobs(loadReports());
  process.stderr.write(
    `[fill] queued ${jobs.length} missing runs with concurrency ${Math.min(concurrency, jobs.length)}\n`,
  );
  const results = await runQueue(jobs);
  const failures = results.filter((succeeded) => !succeeded).length;
  process.stderr.write(`[fill] completed ${results.length - failures}/${results.length} missing runs\n`);
  if (failures > 0) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message || error}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  buildMissingJobs,
  isUsable,
  validateOptions,
};
