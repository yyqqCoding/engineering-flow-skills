const {
  completionEvidenceSection,
  fieldValue,
  hasReadyValidatorCommand,
  hasStableReadyValidatorEvidence,
  hasStaleProspectiveLanguage,
} = require('../../skills/develop/scripts/validate-requirement-record');

function changedPaths(diff) {
  return [...String(diff || '').matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm)]
    .map((match) => match[2]);
}

function implementationChanged(diff) {
  return changedPaths(diff).some((file) => (
    file.startsWith('src/') || /\.test\.[^/]+$/.test(file) || file === 'package.json'
  ));
}

function hasRequirementState(turn, requirementPath, expected) {
  return (turn?.requirementDocuments || []).some((document) => (
    document.path === requirementPath && document.status === expected
  ));
}

function requirementContent(turn, requirementPath) {
  return (turn?.requirementDocuments || []).find(
    (document) => document.path === requirementPath,
  )?.content || '';
}

function persistsReadyValidator(turn, requirementPath) {
  const requirement = requirementContent(turn, requirementPath);
  const value = fieldValue(completionEvidenceSection(requirement), 'Ready validator');
  return hasReadyValidatorCommand(value, requirementPath);
}

function observedValidatorPass(events, mode) {
  for (const line of String(events || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      const item = event.item;
      if (event.type !== 'item.completed' || item?.type !== 'command_execution') continue;
      if (/validate-requirement-record\.js\b/.test(item.command || '')
          && new RegExp(`--mode(?:=|\\s+)${mode}\\b`).test(item.command || '')
          && item.exit_code === 0) return true;
    } catch {
      // Ignore non-JSON diagnostic lines.
    }
  }
  return false;
}

function observedDraftValidatorPass(events) {
  return observedValidatorPass(events, 'draft');
}

function observedReadyValidatorPass(events) {
  return observedValidatorPass(events, 'ready');
}

function reconcilesCompletionEvidence(requirement, finalTurn) {
  const section = completionEvidenceSection(requirement);
  const paths = changedPaths(finalTurn?.diff);
  const implementationPaths = paths.filter((file) => !/\.test\.[^/]+$/.test(file));
  const testPaths = paths.filter((file) => /\.test\.[^/]+$/.test(file));
  const implementationValue = fieldValue(section, 'Implementation files');
  const testValue = fieldValue(section, 'Test files');
  const verificationValue = fieldValue(section, 'Verification');
  const deviationsValue = fieldValue(section, 'Deviations');
  const readyValidatorValue = fieldValue(section, 'Ready validator');
  const verification = finalTurn?.publicTests;
  const command = [verification?.command, ...(verification?.args || [])]
    .filter(Boolean)
    .join(' ');

  return section.length > 0
    && implementationPaths.length > 0
    && testPaths.length > 0
    && implementationPaths.every((file) => implementationValue.includes(file))
    && testPaths.every((file) => testValue.includes(file))
    && command.length > 0
    && verificationValue.includes(command)
    && /pass(?:ed)?|0 failures|通过/i.test(verificationValue)
    && deviationsValue.length > 0
    && hasStableReadyValidatorEvidence(readyValidatorValue)
    && !hasStaleProspectiveLanguage(requirement);
}

module.exports = {
  changedPaths,
  completionEvidenceSection,
  hasStaleProspectiveLanguage,
  hasRequirementState,
  implementationChanged,
  observedDraftValidatorPass,
  observedReadyValidatorPass,
  observedValidatorPass,
  persistsReadyValidator,
  reconcilesCompletionEvidence,
  requirementContent,
};
