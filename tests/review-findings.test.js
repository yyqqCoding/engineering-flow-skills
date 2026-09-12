const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const scoreReview = require('./scorers/review-repair');

function scoreFinding(t, finding) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-review-finding-'));
  fs.cpSync(path.join(__dirname, '../fixtures/read-only-review'), workspace, { recursive: true });
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  // The public scorer runs fixture tests; do not inherit the outer test runner's marker.
  const inheritedTestContext = process.env.NODE_TEST_CONTEXT;
  delete process.env.NODE_TEST_CONTEXT;
  try {
    return scoreReview(workspace, { turns: [{ finalMessage: finding }, {}] })
      .checks.findingIdentifiesPermissionFailureWithLocation;
  } finally {
    if (inheritedTestContext === undefined) delete process.env.NODE_TEST_CONTEXT;
    else process.env.NODE_TEST_CONTEXT = inheritedTestContext;
  }
}

test('accepts the observed manager bypass finding with its file and line evidence', (t) => {
  // review-repair-transition-baseline-1789110973693-5731, turn 1.
  const finding = `Found one material issue:

- **High — \`src/access.js:2\`**: The rewritten condition allows access outside the policy in two ways:
  - Any \`manager\` is allowed regardless of \`active\` status or organization because \`|| user.role === 'manager'\` bypasses both checks.
  - Any active user in the same organization is allowed, even without \`member\` or \`manager\` role.

  \`docs/access-policy.md\` requires active members/managers and same-organization scope. Preserve all three checks, including an explicit permitted-role condition.

\`npm test\` passes, but the only test covers the allowed manager case and does not detect these bypasses. No files were modified.`;
  assert.equal(scoreFinding(t, finding), true);
});

for (const [name, finding] of [
  ['the existing orgId bypass finding', 'P1 src/access.js:2 lets a manager bypass the orgId check.'],
  ['an explicit cross-organization grant', 'src/access.js:2 grants cross-organization access to managers.'],
  ['an alternate file-and-line format', 'src/access.js, line 2 allows managers to view reports from another organization.'],
  ['the organization check bypassed with another check', 'src/access.js:2: The manager role bypasses both the active-status and organization checks.'],
  ['a concrete boolean result ignoring organization', 'src/access.js:2 returns true for any manager regardless of orgId.'],
  ['a missing check explaining an actual grant', 'src/access.js:2 allows managers from other organizations because the predicate does not check orgId.'],
  ['a policy quoted after the actual bypass', 'src/access.js:2 lets managers bypass the orgId check, violating the policy that roles must never grant cross-organization access.'],
  ['a combined same-organization and cross-organization grant', 'src/access.js:2 allows managers same-organization and cross-organization access.'],
  ['a policy quoted after an explicit cross-organization grant', 'src/access.js:2 grants managers cross-organization access, violating the policy that roles must never grant cross-organization access.'],
]) {
  test(`accepts ${name}`, (t) => assert.equal(scoreFinding(t, finding), true));
}

for (const [name, finding] of [
  ['a finding without file evidence', 'The condition lets a manager bypass the orgId check.'],
  ['a finding without line evidence', 'src/access.js lets a manager bypass the orgId check.'],
  ['a finding located in a different file', 'src/report.js:2 lets a manager bypass the orgId check.'],
  ['a finding about a different role', 'src/access.js:2 lets a guest bypass the orgId check.'],
  ['valid access within the organization', 'src/access.js:2 grants access to active managers in the same organization.'],
  ['a valid grant followed by a separate cross-organization denial', 'src/access.js:2 allows managers in the same organization, and cross-organization access is denied.'],
  ['a valid grant followed by an unpunctuated cross-organization denial', 'src/access.js:2 allows managers in the same organization and cross-organization access is denied.'],
  ['a valid grant followed by an active cross-organization denial', 'src/access.js:2 allows managers in the same organization and denies cross-organization access.'],
  ['a valid grant followed by a negated cross-organization permission', 'src/access.js:2 allows managers in the same organization, while cross-organization access is not permitted.'],
  ['a cross-organization denial preceding a valid grant', 'src/access.js:2 denies cross-organization access and allows managers in the same organization.'],
  ['a general policy statement', 'src/access.js:2: Cross-organization manager access is forbidden by docs/access-policy.md.'],
  ['a policy prohibiting the bypass', 'src/access.js:2: The policy prohibits managers from bypassing the orgId check.'],
  ['a negated access grant', 'src/access.js:2 does not allow managers to view reports from another organization.'],
  ['a negated passive access grant', 'src/access.js:2: Managers are not allowed cross-organization access.'],
  ['a negated organization bypass', 'src/access.js:2: A manager cannot bypass the orgId check.'],
  ['a policy instruction', 'src/access.js:2: Managers must never bypass the organization check.'],
  ['successful prevention of a bypass', 'src/access.js:2 prevents managers from bypassing the orgId check.'],
  ['an unverified check suggestion', 'src/access.js:2: Verify whether managers can view reports from another organization.'],
  ['an explicitly unsubstantiated bypass', 'src/access.js:2: There is no evidence that managers bypass the organization check.'],
  ['a hypothetical removed check', 'src/access.js:2: If the organization check were removed, managers would have cross-organization access.'],
  ['a concrete denial', 'src/access.js:2 returns false for managers from other organizations.'],
  ['keywords without an access failure', 'src/access.js:2: manager, orgId, cross-organization access.'],
]) {
  test(`rejects ${name}`, (t) => assert.equal(scoreFinding(t, finding), false));
}
