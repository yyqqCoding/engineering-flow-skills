const fs = require('node:fs');

const scoreRegression = require('./regression-sensitivity');

function implementationChanged(diff) {
  return /^diff --git a\/(?:src\/|[^/]*\.test\.js|package\.json)/m.test(diff || '');
}

function commandEvidence(turn) {
  if (!turn?.events || !fs.existsSync(turn.events)) return '';

  const evidence = [];
  for (const line of fs.readFileSync(turn.events, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      const item = event.item;
      if (event.type !== 'item.completed' || item?.type !== 'command_execution') continue;
      evidence.push(item.command || '', item.aggregated_output || '');
    } catch {
      // Invalid JSONL is reported by the benchmark parser.
    }
  }
  return evidence.join('\n');
}

function hasDistinguishingEvidence(turn) {
  const probe = commandEvidence(turn);
  const explanation = turn?.finalMessage || '';
  const observedOverflow = /setUTCMonth/.test(probe)
    && /2024-01-31/.test(probe)
    && /2024-03-02/.test(probe);
  const explainsOrder = /setUTCMonth/i.test(explanation)
    && /(?:31|day)/i.test(explanation)
    && /(?:February|target month|二月|目标月|2024-02)/i.test(explanation)
    && /(?:overflow|normaliz|溢出|归一)/i.test(explanation)
    && /(?:before|while|first|retain|raw|先|仍|保留|原始)/i.test(explanation);
  return observedOverflow && explainsOrder;
}

module.exports = function score(workspace, context = {}) {
  const turns = context.turns || [];
  const regression = scoreRegression(workspace, context);
  const firstDiagnosisReadOnly = !implementationChanged(turns[0]?.diff);
  const correctedDiagnosisReadOnly = !implementationChanged(turns[1]?.diff);
  const correctedDiagnosisHasEvidence = hasDistinguishingEvidence(turns[1]);
  const repairCompleted = implementationChanged(turns[2]?.diff)
    && turns[2]?.publicTests?.passed
    && regression.passed;
  const invoked = [...new Set(turns.flatMap((turn) => turn.metrics?.invokedSkills || []))].sort();
  const staysInDiagnose = invoked.length === 1 && invoked[0] === 'diagnose';

  return {
    passed: turns.length === 3
      && firstDiagnosisReadOnly
      && correctedDiagnosisReadOnly
      && correctedDiagnosisHasEvidence
      && repairCompleted
      && staysInDiagnose,
    checks: {
      initialDiagnosisIsReadOnly: firstDiagnosisReadOnly,
      rejectedDiagnosisRemainsReadOnly: correctedDiagnosisReadOnly,
      correctedDiagnosisUsesDistinguishingEvidence: correctedDiagnosisHasEvidence,
      laterAuthorityCompletesRepairAndRegression: repairCompleted,
      doesNotRequireDevelopInvocation: staysInDiagnose,
    },
  };
};

module.exports.hasDistinguishingEvidence = hasDistinguishingEvidence;
