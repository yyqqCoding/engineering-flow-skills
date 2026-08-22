const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_COHORT_FIELDS = [
  'benchmark',
  'arm',
  'benchmarkFingerprint',
  'pluginFingerprint',
  'modelProvider',
  'model',
  'reasoningEffort',
];

function validateEvidenceManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['evidence manifest must be an object'];
  }
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (typeof manifest.release !== 'string' || !/^\d+\.\d+\.\d+$/.test(manifest.release)) {
    errors.push('release must be a semantic version string');
  }
  if (!Array.isArray(manifest.cohorts) || manifest.cohorts.length === 0) {
    errors.push('cohorts must be a non-empty array');
    return errors;
  }

  const selectors = new Set();
  for (const [index, cohort] of manifest.cohorts.entries()) {
    if (!cohort || typeof cohort !== 'object' || Array.isArray(cohort)) {
      errors.push(`cohorts[${index}] must be an object`);
      continue;
    }
    for (const field of REQUIRED_COHORT_FIELDS) {
      if (typeof cohort[field] !== 'string' || cohort[field].length === 0) {
        errors.push(`cohorts[${index}].${field} must be a non-empty string`);
      }
    }
    if (!['baseline', 'candidate'].includes(cohort.arm)) {
      errors.push(`cohorts[${index}].arm must be baseline or candidate`);
    }
    if (!Number.isInteger(cohort.targetCompleted) || cohort.targetCompleted < 1) {
      errors.push(`cohorts[${index}].targetCompleted must be a positive integer`);
    }
    if (!Array.isArray(cohort.reports)
        || cohort.reports.length < (cohort.targetCompleted || 1)
        || cohort.reports.some((name) => typeof name !== 'string' || !name.endsWith('.json'))
        || new Set(cohort.reports).size !== cohort.reports.length) {
      errors.push(
        `cohorts[${index}].reports must contain at least targetCompleted distinct JSON files`,
      );
    }

    const selector = REQUIRED_COHORT_FIELDS.map((field) => cohort[field]).join('\0');
    if (selectors.has(selector)) errors.push(`cohorts[${index}] duplicates an earlier selector`);
    selectors.add(selector);
  }
  return errors;
}

function reportMatchesCohort(report, cohort) {
  const reportFile = report.reportFile
    || (report.events ? `${path.basename(report.events, '.jsonl')}.json` : null);
  return cohort.reports.includes(reportFile)
    && report.benchmark === cohort.benchmark
    && report.arm === cohort.arm
    && report.benchmarkFingerprint === cohort.benchmarkFingerprint
    && report.pluginFingerprint === cohort.pluginFingerprint
    && report.modelRun?.modelProvider === cohort.modelProvider
    && report.modelRun?.model === cohort.model
    && report.modelRun?.reasoningEffort === cohort.reasoningEffort;
}

function filterReportsByManifest(reports, manifest) {
  const errors = validateEvidenceManifest(manifest);
  if (errors.length > 0) throw new Error(`Invalid evidence manifest:\n- ${errors.join('\n- ')}`);
  return reports.filter((report) => manifest.cohorts.some(
    (cohort) => reportMatchesCohort(report, cohort),
  ));
}

function loadEvidenceManifest(filename) {
  const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const errors = validateEvidenceManifest(manifest);
  if (errors.length > 0) throw new Error(`Invalid evidence manifest:\n- ${errors.join('\n- ')}`);
  return manifest;
}

module.exports = {
  filterReportsByManifest,
  loadEvidenceManifest,
  reportMatchesCohort,
  validateEvidenceManifest,
};
