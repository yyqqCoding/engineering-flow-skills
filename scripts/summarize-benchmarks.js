#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  assessInvocation,
  parseJsonl,
} = require('./lib/benchmark-utils');
const {
  filterReportsByManifest,
  loadEvidenceManifest,
} = require('./lib/evidence-manifest');
const { environmentFingerprint } = require('./lib/benchmark-environment');

const ROOT = path.resolve(__dirname, '..');
const RESULT_DIR = path.join(ROOT, 'benchmark-results');
const benchmarks = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'benchmarks.json'), 'utf8'));

function average(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function reportMetrics(report) {
  if (report.metrics) return report.metrics;
  if (!report.events || !fs.existsSync(report.events)) return null;
  return parseJsonl(fs.readFileSync(report.events, 'utf8'));
}

function reportInvocation(report, metrics) {
  if (report.invocation) return report.invocation;
  if (report.arm === 'baseline') return null;
  const policy = benchmarks[report.benchmark]?.invocation;
  return metrics && policy ? assessInvocation(metrics.invokedSkills, policy) : null;
}

function summarizeGroup(reports) {
  const cleanReports = reports.filter((report) => !report.modelRun?.contaminated);
  const enriched = cleanReports.map((report) => {
    const metrics = reportMetrics(report);
    return {
      report,
      metrics,
      invocation: reportInvocation(report, metrics),
    };
  });
  const completed = enriched.filter(({ report }) => report.modelRun?.completed);
  const successful = completed.filter(({ report }) => report.modelRun?.completed
    && report.score?.passed
    && report.publicTests?.passed
    && !report.workspaceState?.unauthorizedCommit);
  const invocations = completed.map(({ invocation }) => invocation).filter(Boolean);
  const metrics = completed.map((entry) => entry.metrics).filter(Boolean);
  const truePositives = invocations.reduce((sum, value) => sum + value.truePositives.length, 0);
  const recalledExpected = invocations.reduce(
    (sum, value) => sum + (value.recalledExpected || value.truePositives).length,
    0,
  );
  const falsePositives = invocations.reduce((sum, value) => sum + value.falsePositives.length, 0);
  const falseNegatives = invocations.reduce((sum, value) => sum + value.falseNegatives.length, 0);

  return {
    environmentIdentityVerified: reports.length > 0
      && environmentFingerprint(reports[0]) !== null
      && reports.every(report => environmentFingerprint(report) === environmentFingerprint(reports[0])),
    discoveredRuns: reports.length,
    excludedContaminatedRuns: reports.length - cleanReports.length,
    cleanRuns: cleanReports.length,
    excludedIncompleteRuns: cleanReports.length - completed.length,
    completedRuns: completed.length,
    successfulRuns: successful.length,
    passRate: completed.length === 0 ? null : successful.length / completed.length,
    durationMs: {
      average: average(completed.map(({ report }) => report.durationMs).filter(Number.isFinite)),
      median: median(completed.map(({ report }) => report.durationMs).filter(Number.isFinite)),
    },
    invocation: {
      assessedRuns: invocations.length,
      passingRuns: invocations.filter((value) => value.passed).length,
      precision: truePositives + falsePositives === 0
        ? null
        : truePositives / (truePositives + falsePositives),
      recall: recalledExpected + falseNegatives === 0
        ? null
        : recalledExpected / (recalledExpected + falseNegatives),
      runsWithFalsePositive: invocations.filter((value) => value.falsePositives.length > 0).length,
      runsWithCollision: invocations.filter((value) => value.collisions?.length > 0).length,
    },
    ceremony: {
      averageQuestionMessages: average(metrics.map((value) => value.questionMessages)),
      averageTodoLists: average(metrics.map((value) => value.todoLists)),
    },
    tools: {
      averageToolCalls: average(metrics.map((value) => value.toolCalls)),
      averageCommandExecutions: average(metrics.map((value) => value.commandExecutions)),
      averageFileChanges: average(metrics.map((value) => value.fileChanges)),
    },
    tokens: {
      averageInput: average(metrics.map((value) => value.usage.inputTokens)),
      averageCachedInput: average(metrics.map((value) => value.usage.cachedInputTokens)),
      averageOutput: average(metrics.map((value) => value.usage.outputTokens)),
      averageReasoningOutput: average(metrics.map((value) => value.usage.reasoningOutputTokens)),
    },
    unauthorizedCommitRuns: completed.filter(
      ({ report }) => report.workspaceState?.unauthorizedCommit,
    ).length,
  };
}

function loadReports(filterName) {
  if (!fs.existsSync(RESULT_DIR)) return [];
  const reports = [];

  for (const filename of fs.readdirSync(RESULT_DIR)) {
    if (!filename.endsWith('.json')) continue;
    const report = JSON.parse(fs.readFileSync(path.join(RESULT_DIR, filename), 'utf8'));
    if (!report.benchmark || !report.arm) continue;
    if (filterName && report.benchmark !== filterName) continue;
    report.reportFile = filename;
    reports.push(report);
  }

  return reports;
}

function summarize(reports) {
  const grouped = {};
  for (const [index, report] of reports.entries()) {
    const cohort = report.cohort || 'legacy';
    const provider = report.modelRun?.modelProvider || 'unknown-provider';
    const model = report.modelRun?.model || 'unknown-model';
    const reasoning = report.modelRun?.reasoningEffort || 'unknown-reasoning';
    const environment = environmentFingerprint(report);
    // Historical files remain inspectable, but an unknown CLI/configuration is not a shared cohort.
    const identity = environment ? `environment=${environment}`
      : `legacy-report=${report.reportFile || report.events || `input-${index + 1}`}`;
    const key = `${report.benchmark}:${report.arm}:${cohort}`
      + `:provider=${provider}:model=${model}:reasoning=${reasoning}:${identity}`;
    (grouped[key] ||= []).push(report);
  }

  return Object.fromEntries(
    Object.entries(grouped)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, values]) => [key, summarizeGroup(values)]),
  );
}

function parseArguments(args) {
  let filterName = null;
  let manifestPath = null;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--manifest') {
      manifestPath = args[index + 1];
      if (!manifestPath) throw new Error('--manifest requires a path');
      index += 1;
    } else if (value.startsWith('-')) {
      throw new Error(`Unknown option: ${value}`);
    } else if (filterName) {
      throw new Error(`Unexpected argument: ${value}`);
    } else {
      filterName = value;
    }
  }
  return { filterName, manifestPath };
}

if (require.main === module) {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
  const { filterName, manifestPath } = options;
  if (filterName && !benchmarks[filterName]) {
    process.stderr.write(`Unknown benchmark: ${filterName}\n`);
    process.exit(2);
  }
  let reports = loadReports(filterName);
  if (manifestPath) {
    const resolvedManifest = path.resolve(ROOT, manifestPath);
    reports = filterReportsByManifest(reports, loadEvidenceManifest(resolvedManifest));
  }
  process.stdout.write(`${JSON.stringify(summarize(reports), null, 2)}\n`);
}

module.exports = {
  parseArguments,
  summarize,
  summarizeGroup,
};
