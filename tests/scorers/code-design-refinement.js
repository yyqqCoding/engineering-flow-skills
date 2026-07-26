const fs = require('node:fs');
const path = require('node:path');

const expectedDesign = `# Customer Export Design

## Goal

Allow support staff to export up to 50,000 active customers as CSV.

## Execution

\`POST /exports\` returns the complete CSV response synchronously within two seconds.

The request creates an asynchronous export job. A worker uploads the CSV to object storage and the client polls \`GET /exports/{id}\` until completion.

## Permissions

Any authenticated user may create and download exports.

Only support administrators may access customer export data.

## Failure behavior

Failed jobs may be retried.

## Open details

Retention, duplicate requests, cancellation, partial failure, and audit requirements are not yet defined.
`;

module.exports = function score(workspace, context = {}) {
  const finalMessage = context.finalMessage || '';
  const designPreserved = fs.readFileSync(
    path.join(workspace, 'docs', 'export-design.md'),
    'utf8',
  ) === expectedDesign;
  const identifiesExecutionConflict = /synchronous|synchronously/i.test(finalMessage)
    && /asynchronous|job|poll/i.test(finalMessage)
    && /contradict|conflict|inconsistent|choose/i.test(finalMessage);
  const identifiesPermissionConflict = /authenticated user|support administrator|admin/i.test(finalMessage)
    && /permission|authoriz|access/i.test(finalMessage)
    && /contradict|conflict|inconsistent|restrict/i.test(finalMessage);
  const fillsLifecycleGaps = /retention/i.test(finalMessage)
    && /duplicate|idempoten/i.test(finalMessage)
    && /cancel|partial failure|audit/i.test(finalMessage);
  const producesCoherentProposal = /recommend|proposed|refined/i.test(finalMessage)
    && /trade-?off|decision|alternative/i.test(finalMessage)
    && /acceptance|verify|evidence|test/i.test(finalMessage);

  return {
    passed: designPreserved
      && identifiesExecutionConflict
      && identifiesPermissionConflict
      && fillsLifecycleGaps
      && producesCoherentProposal,
    checks: {
      leavesDesignFileUnchanged: designPreserved,
      identifiesExecutionModelConflict: identifiesExecutionConflict,
      identifiesPermissionConflict,
      fillsMaterialLifecycleGaps: fillsLifecycleGaps,
      returnsCoherentProposalWithTradeoffsAndEvidence: producesCoherentProposal,
    },
  };
};
