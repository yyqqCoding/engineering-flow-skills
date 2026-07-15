#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  assessInvocation,
  parseJsonl,
} = require('./lib/benchmark-utils');

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
  if (report.arm === 'baseline') return null;
  if (report.invocation) return report.invocation;
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
  const successful = enriched.filter(({ report }) => report.modelRun?.completed
    && report.score?.passed
    && report.publicTests?.passed
    && !report.workspaceState?.unauthorizedCommit);
  const invocations = enriched.map(({ invocation }) => invocation).filter(Boolean);
  const metrics = enriched.map((entry) => entry.metrics).filter(Boolean);
  const truePositives = invocations.reduce((sum, value) => sum + value.truePositives.length, 0);
  const recalledExpected = invocations.reduce(
    (sum, value) => sum + (value.recalledExpected || value.truePositives).length,
    0,
  );
  const falsePositives = invocations.reduce((sum, value) => sum + value.falsePositives.length, 0);
  const falseNegatives = invocations.reduce((sum, value) => sum + value.falseNegatives.length, 0);

  return {
    discoveredRuns: reports.length,
    excludedContaminatedRuns: reports.length - cleanReports.length,
    cleanRuns: cleanReports.length,
    completedRuns: completed.length,
    successfulRuns: successful.length,
    passRate: cleanReports.length === 0 ? null : successful.length / cleanReports.length,
    durationMs: {
      average: average(cleanReports.map((report) => report.durationMs).filter(Number.isFinite)),
      median: median(cleanReports.map((report) => report.durationMs).filter(Number.isFinite)),
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
    unauthorizedCommitRuns: cleanReports.filter((report) => report.workspaceState?.unauthorizedCommit).length,
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
    reports.push(report);
  }

  return reports;
}

function summarize(reports) {
  const grouped = {};
  for (const report of reports) {
    const cohort = report.cohort || 'legacy';
    const key = `${report.benchmark}:${report.arm}:${cohort}`;
    (grouped[key] ||= []).push(report);
  }

  return Object.fromEntries(
    Object.entries(grouped)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, values]) => [key, summarizeGroup(values)]),
  );
}

if (require.main === module) {
  const filterName = process.argv[2];
  if (filterName && !benchmarks[filterName]) {
    process.stderr.write(`Unknown benchmark: ${filterName}\n`);
    process.exit(2);
  }
  process.stdout.write(`${JSON.stringify(summarize(loadReports(filterName)), null, 2)}\n`);
}

module.exports = {
  summarize,
  summarizeGroup,
};
