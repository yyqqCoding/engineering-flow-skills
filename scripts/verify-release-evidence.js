#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  fingerprintBenchmark,
  fingerprintCandidate,
} = require('./lib/benchmark-fingerprints');
const { validateEvidenceManifest } = require('./lib/evidence-manifest');

const ROOT = path.resolve(__dirname, '..');

function verifyReleaseEvidence(root, manifest, benchmarks, packageJson) {
  const errors = validateEvidenceManifest(manifest);
  if (manifest.release !== packageJson.version) {
    errors.push(
      `manifest release ${manifest.release} does not match package version ${packageJson.version}`,
    );
  }

  const candidateFingerprint = fingerprintCandidate(root);
  const cohorts = manifest.cohorts || [];
  for (const benchmarkName of new Set(cohorts.map((cohort) => cohort.benchmark))) {
    const benchmark = benchmarks[benchmarkName];
    if (!benchmark) {
      errors.push(`unknown benchmark: ${benchmarkName}`);
      continue;
    }

    const benchmarkFingerprint = fingerprintBenchmark(root, benchmark);
    const recorded = new Set(cohorts
      .filter((cohort) => cohort.benchmark === benchmarkName)
      .map((cohort) => cohort.benchmarkFingerprint));
    if (recorded.size !== 1) {
      errors.push(`${benchmarkName} cohorts disagree on the benchmark fingerprint`);
    } else if (!recorded.has(benchmarkFingerprint)) {
      errors.push(
        `${benchmarkName} benchmark fingerprint is stale: `
          + `${[...recorded][0]} != ${benchmarkFingerprint}`,
      );
    }
  }

  const recordedCandidateFingerprints = new Set(cohorts
    .filter((cohort) => cohort.arm === 'candidate')
    .map((cohort) => cohort.pluginFingerprint));
  if (recordedCandidateFingerprints.size !== 1) {
    errors.push('candidate cohorts disagree on the plugin fingerprint');
  } else if (!recordedCandidateFingerprints.has(candidateFingerprint)) {
    errors.push(
      `candidate plugin fingerprint is stale: `
        + `${[...recordedCandidateFingerprints][0]} != ${candidateFingerprint}`,
    );
  }

  return [...new Set(errors)];
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

if (require.main === module) {
  const errors = verifyReleaseEvidence(
    ROOT,
    readJson('config/evidence-manifest.json'),
    readJson('config/benchmarks.json'),
    readJson('package.json'),
  );

  if (errors.length > 0) {
    process.stderr.write(`Release evidence is not current:\n- ${errors.join('\n- ')}\n`);
    process.exit(1);
  }

  process.stdout.write('Release evidence matches the current package and benchmark inputs.\n');
}

module.exports = { verifyReleaseEvidence };
