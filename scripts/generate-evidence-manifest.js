#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  fingerprintBenchmark,
  fingerprintCandidate,
} = require('./lib/benchmark-fingerprints');
const { matchesCohortIdentity, validateEvidenceManifest } = require('./lib/evidence-manifest');

const ROOT = path.resolve(__dirname, '..');

function isReleaseEvidence(report) {
  return report.modelRun?.completed === true
    && report.modelRun?.status === 0
    && !report.modelRun?.timedOut
    && !report.modelRun?.error
    && !report.modelRun?.contaminated
    && (report.metrics?.turns || 0) > 0;
}

function reportFilename(report) {
  return report.reportFile
    || (report.events ? `${path.basename(report.events, '.jsonl')}.json` : null);
}

function generateEvidenceManifest(root, template, benchmarks, packageJson, reports) {
  const templateErrors = validateEvidenceManifest(template);
  if (templateErrors.length > 0) {
    throw new Error(`Invalid evidence template:\n- ${templateErrors.join('\n- ')}`);
  }
  if (template.schemaVersion !== 2) {
    throw new Error('New evidence requires a schemaVersion 2 template with an explicit environmentFingerprint. '
      + 'Version 1 manifests remain historical records.');
  }

  const candidateFingerprint = fingerprintCandidate(root);
  const cohorts = template.cohorts.map((templateCohort) => {
    const benchmark = benchmarks[templateCohort.benchmark];
    if (!benchmark) throw new Error(`Unknown benchmark: ${templateCohort.benchmark}`);

    const cohort = {
      ...templateCohort,
      benchmarkFingerprint: fingerprintBenchmark(root, benchmark),
      pluginFingerprint: templateCohort.arm === 'candidate'
        ? candidateFingerprint
        : templateCohort.pluginFingerprint,
      reports: [],
    };
    cohort.reports = reports
      .filter((report) => matchesCohortIdentity(report, cohort)
        && isReleaseEvidence(report))
      .map(reportFilename)
      .filter(Boolean)
      .sort()
      .slice(0, cohort.targetCompleted);

    if (cohort.reports.length < cohort.targetCompleted) {
      throw new Error(
        `${cohort.benchmark}/${cohort.arm} has ${cohort.reports.length}`
          + `/${cohort.targetCompleted} matching clean reports`,
      );
    }
    return cohort;
  });

  return {
    ...template,
    release: packageJson.version,
    cohorts,
  };
}

function parseArguments(args) {
  const options = { template: null, output: null, results: 'benchmark-results' };
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!['--template', '--output', '--results'].includes(key)) {
      throw new Error(`Unknown option: ${key}`);
    }
    options[key.slice(2)] = args[index + 1];
    if (!options[key.slice(2)]) throw new Error(`${key} requires a path`);
    index += 1;
  }
  if (!options.template) throw new Error('--template requires a path');
  return options;
}

function readReports(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((filename) => filename.endsWith('.json'))
    .map((filename) => ({
      ...JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8')),
      reportFile: filename,
    }));
}

if (require.main === module) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const templatePath = path.resolve(ROOT, options.template);
    const generated = generateEvidenceManifest(
      ROOT,
      JSON.parse(fs.readFileSync(templatePath, 'utf8')),
      JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'benchmarks.json'), 'utf8')),
      JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')),
      readReports(path.resolve(ROOT, options.results)),
    );
    const output = `${JSON.stringify(generated, null, 2)}\n`;
    if (options.output) fs.writeFileSync(path.resolve(ROOT, options.output), output);
    else process.stdout.write(output);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  generateEvidenceManifest,
  isReleaseEvidence,
  parseArguments,
};
