const COVERAGE_PROFILES = new Set([
  'continuity',
  'metamorphic',
  'negative',
  'overlap',
  'positive',
]);

const WORKFLOW_OWNERS = new Set([
  'code-design',
  'core',
  'develop',
  'diagnose',
  'handoff',
  'review',
]);

function extractBehaviorIds(markdown) {
  return [...String(markdown || '').matchAll(/^###\s+([A-Z]+-\d+):/gm)]
    .map((match) => match[1]);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function validateStringArray(errors, scenarioName, fieldName, values, { required = true } = {}) {
  if (!Array.isArray(values)) {
    if (required) errors.push(`${scenarioName} coverage.${fieldName} must be an array`);
    return;
  }
  if (required && values.length === 0) {
    errors.push(`${scenarioName} coverage.${fieldName} must not be empty`);
  }
  if (values.some((value) => typeof value !== 'string' || value.trim() === '')) {
    errors.push(`${scenarioName} coverage.${fieldName} must contain non-empty strings`);
  }
  const duplicates = duplicateValues(values);
  if (duplicates.length > 0) {
    errors.push(`${scenarioName} coverage.${fieldName} contains duplicates: ${duplicates.join(', ')}`);
  }
}

function validateBenchmarkCoverage(benchmarks, behaviorIds) {
  const errors = [];
  const knownBehaviors = new Set(behaviorIds);

  for (const [scenarioName, benchmark] of Object.entries(benchmarks)) {
    const coverage = benchmark.coverage;
    if (!coverage || typeof coverage !== 'object' || Array.isArray(coverage)) {
      errors.push(`${scenarioName} must declare coverage metadata`);
      continue;
    }

    validateStringArray(errors, scenarioName, 'behaviors', coverage.behaviors);
    validateStringArray(errors, scenarioName, 'profiles', coverage.profiles);
    validateStringArray(errors, scenarioName, 'risks', coverage.risks);
    validateStringArray(errors, scenarioName, 'transitions', coverage.transitions, { required: false });

    for (const behaviorId of coverage.behaviors || []) {
      if (!knownBehaviors.has(behaviorId)) {
        errors.push(`${scenarioName} references unknown behavior ${behaviorId}`);
      }
    }
    for (const profile of coverage.profiles || []) {
      if (!COVERAGE_PROFILES.has(profile)) {
        errors.push(`${scenarioName} uses unknown coverage profile ${profile}`);
      }
    }
    for (const transition of coverage.transitions || []) {
      if (!/^[a-z0-9-]+->[a-z0-9-]+$/.test(transition)) {
        errors.push(`${scenarioName} has invalid transition ${transition}`);
      }
    }

    if (!WORKFLOW_OWNERS.has(coverage.workflow)) {
      errors.push(`${scenarioName} has invalid coverage.workflow ${coverage.workflow}`);
    }
    for (const fieldName of ['stack', 'language']) {
      if (typeof coverage[fieldName] !== 'string' || coverage[fieldName].trim() === '') {
        errors.push(`${scenarioName} coverage.${fieldName} must be a non-empty string`);
      }
    }
    if (typeof coverage.holdout !== 'boolean') {
      errors.push(`${scenarioName} coverage.holdout must be boolean`);
    }

    if (coverage.variantOf !== undefined) {
      if (typeof coverage.variantOf !== 'string' || !benchmarks[coverage.variantOf]) {
        errors.push(`${scenarioName} coverage.variantOf must reference a configured benchmark`);
      } else if (coverage.variantOf === scenarioName) {
        errors.push(`${scenarioName} cannot be its own coverage variant`);
      }
      if (!(coverage.profiles || []).includes('metamorphic')) {
        errors.push(`${scenarioName} variants must include the metamorphic profile`);
      }
    }
  }

  for (const scenarioName of Object.keys(benchmarks)) {
    const visited = new Set([scenarioName]);
    let current = benchmarks[scenarioName]?.coverage?.variantOf;
    while (current) {
      if (visited.has(current)) {
        errors.push(`${scenarioName} has a cyclic coverage.variantOf chain`);
        break;
      }
      visited.add(current);
      current = benchmarks[current]?.coverage?.variantOf;
    }
  }

  return [...new Set(errors)].sort();
}

function increment(group, key) {
  group[key] = (group[key] || 0) + 1;
}

function sortObject(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function summarizeBenchmarkCoverage(benchmarks, behaviorIds) {
  const behaviorToScenarios = Object.fromEntries(
    behaviorIds.map((behaviorId) => [behaviorId, []]),
  );
  const byProfile = {};
  const byWorkflow = {};
  const byStack = {};
  const byLanguage = {};
  const transitions = {};
  const holdoutScenarios = [];

  for (const [scenarioName, benchmark] of Object.entries(benchmarks)) {
    const coverage = benchmark.coverage || {};
    for (const behaviorId of coverage.behaviors || []) {
      if (behaviorToScenarios[behaviorId]) behaviorToScenarios[behaviorId].push(scenarioName);
    }
    for (const profile of coverage.profiles || []) increment(byProfile, profile);
    for (const transition of coverage.transitions || []) increment(transitions, transition);
    if (coverage.workflow) increment(byWorkflow, coverage.workflow);
    if (coverage.stack) increment(byStack, coverage.stack);
    if (coverage.language) increment(byLanguage, coverage.language);
    if (coverage.holdout) holdoutScenarios.push(scenarioName);
  }

  const sortedBehaviorMap = Object.fromEntries(
    Object.entries(behaviorToScenarios).map(([behaviorId, scenarios]) => [
      behaviorId,
      scenarios.sort(),
    ]),
  );
  const coveredBehaviors = behaviorIds.filter(
    (behaviorId) => sortedBehaviorMap[behaviorId].length > 0,
  );

  return {
    scenarios: Object.keys(benchmarks).length,
    behaviors: {
      total: behaviorIds.length,
      covered: coveredBehaviors.length,
      ratio: behaviorIds.length === 0 ? null : coveredBehaviors.length / behaviorIds.length,
      uncovered: behaviorIds.filter((behaviorId) => !coveredBehaviors.includes(behaviorId)),
      scenarios: sortedBehaviorMap,
    },
    profiles: sortObject(byProfile),
    workflows: sortObject(byWorkflow),
    stacks: sortObject(byStack),
    languages: sortObject(byLanguage),
    transitions: sortObject(transitions),
    holdoutScenarios: holdoutScenarios.sort(),
  };
}

module.exports = {
  COVERAGE_PROFILES,
  WORKFLOW_OWNERS,
  extractBehaviorIds,
  summarizeBenchmarkCoverage,
  validateBenchmarkCoverage,
};
