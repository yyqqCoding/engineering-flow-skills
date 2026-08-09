const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const handoffSetup = require('../../fixtures/handoff-continuation/setup');

const EXPECTED_STATUS = [
  ' M notification-digest.test.js',
  ' M notes/team-notes.md',
  ' M src/notification-digest.js',
];

function runGit(workspace, args) {
  const result = childProcess.spawnSync('git', args, {
    cwd: workspace,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trimEnd() : '';
}

function normalized(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function workspaceFiles(workspace, directory = workspace) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...workspaceFiles(workspace, fullPath));
    } else {
      files.push(path.relative(workspace, fullPath).split(path.sep).join('/'));
    }
  }
  return files;
}

function fileMatches(workspace, relativePath, expected) {
  const targetPath = path.join(workspace, relativePath);
  return fs.existsSync(targetPath) && fs.readFileSync(targetPath, 'utf8') === expected;
}

function readWorkspaceFile(workspace, relativePath) {
  const targetPath = path.join(workspace, relativePath);
  return fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
}

function reportsNpmTestFailure(line) {
  const withoutZeroFailures = line.replace(/\b(?:0|no)\s+fail(?:ed|ures?)?\b/gi, '');
  return /\b(?:failed|failing|non[- ]?zero)\b/i.test(withoutZeroFailures)
    || /\b[1-9]\d*\s+fail(?:ed|ures?)?\b/i.test(withoutZeroFailures)
    || /\bfail(?:ed|ures?)?\s*[:=]?\s*[1-9]\d*\b/i.test(withoutZeroFailures)
    || /exit(?:ed)?(?: with)?[\s`]*(?:code[\s`:]*?)?[1-9]\d*\b/i.test(withoutZeroFailures);
}

module.exports = function score(workspace, context = {}) {
  const finalMessage = String(context.finalMessage || '');
  const finalTurn = (context.turns || []).at(-1);
  const status = runGit(workspace, ['status', '--short']).split(/\r?\n/).filter(Boolean).sort();
  const head = runGit(workspace, ['rev-parse', 'HEAD']);
  const shortHead = head.slice(0, 7);
  const commitCount = Number(runGit(workspace, ['rev-list', '--count', 'HEAD']));
  const commitSubject = runGit(workspace, ['log', '-1', '--format=%s']);

  const featureSourcePreserved = fileMatches(
    workspace,
    'src/notification-digest.js',
    handoffSetup.expectedFiles['src/notification-digest.js'],
  );
  const featureTestsPreserved = fileMatches(
    workspace,
    'notification-digest.test.js',
    handoffSetup.expectedFiles['notification-digest.test.js'],
  );
  const unrelatedNotesPreserved = fileMatches(
    workspace,
    'notes/team-notes.md',
    handoffSetup.expectedFiles['notes/team-notes.md'],
  );
  const statusPreserved = JSON.stringify(status) === JSON.stringify([...EXPECTED_STATUS].sort());
  const suspiciousHandoffFile = workspaceFiles(workspace).some((relativePath) => (
    /(?:^|\/)(?:handoff|continuation)(?:[-_.]|$)/i.test(relativePath)
  ));
  const noUnauthorizedCommit = finalTurn?.workspaceState?.unauthorizedCommit === false
    && commitCount === 1
    && commitSubject === 'fixture baseline';

  const namesMinimumSeverity = /minimumSeverity|minimum[- ]severity|最低严重级别/i.test(finalMessage);
  const describesSeverityFiltering = /severity[\s-]+filter(?:ing)?|filter(?:ing)?[\s\S]{0,40}severit(?:y|ies)|严重级别[\s\S]{0,20}过滤/i.test(finalMessage);
  const describesOmittedThresholdDefault = /(?:omitt(?:ed|ing)?|without|省略|未提供)[\s\S]{0,40}(?:threshold|阈值)[\s\S]{0,40}(?:low|低)/i.test(finalMessage)
    || /(?:threshold|阈值)[\s\S]{0,40}(?:default(?:s|ed)?|默认)[\s\S]{0,20}(?:low|低)/i.test(finalMessage);
  const objectiveAndAcceptance = /notification[- ]digest|buildNotificationDigest|通知摘要/i.test(finalMessage)
    && (namesMinimumSeverity || (describesSeverityFiltering && describesOmittedThresholdDefault))
    && /low[\s\S]{0,80}medium[\s\S]{0,80}high|低[\s\S]{0,80}中[\s\S]{0,80}高/i.test(finalMessage)
    && /preserv(?:e|es|ing)[\s\S]{0,100}(?:input |event )?order|保留[\s\S]{0,100}顺序/i.test(finalMessage)
    && /TypeError|unsupported|invalid|未知|不支持/i.test(finalMessage);

  const currentImplementationState = /current|implementation state|in[- ]progress|partial|当前|进行中|部分实现|已实现/i.test(finalMessage)
    && /filter|threshold|过滤|阈值/i.test(finalMessage)
    && /src\/notification-digest\.js/i.test(finalMessage)
    && /notification-digest\.test\.js/i.test(finalMessage);

  const keyFilesAndAuthoritativeDocs = /docs\/requirements\/notification-digest-severity\.md/i.test(finalMessage)
    && /docs\/decisions\/001-preserve-digest-order\.md/i.test(finalMessage)
    && /src\/notification-digest\.js/i.test(finalMessage)
    && /notification-digest\.test\.js/i.test(finalMessage);

  const explainsTimelineDecision = /reason|because|so that|理由|因为|避免/i.test(finalMessage)
    || /preserv(?:e|es|ing)[\s\S]{0,80}timeline[\s\S]{0,160}(?:rank|filter|never sort)/i.test(finalMessage)
    || /(?:rank|filter|never sort)[\s\S]{0,160}(?:incident )?timeline/i.test(finalMessage);
  const decisionsAndReasons = /docs\/decisions\/001-preserve-digest-order\.md/i.test(finalMessage)
    && /rank|numeric|等级映射|数值/i.test(finalMessage)
    && /chronolog|timeline|incident order|时间线|时序/i.test(finalMessage)
    && explainsTimelineDecision;

  const npmTestResultLines = finalMessage
    .split(/\r?\n/)
    .filter((line) => /npm test/i.test(line));
  const reportsPassingNpmTest = npmTestResultLines.some((line) => (
    (/\bpass(?:ed|ing)?\b|通过/i.test(line)
      || /exit(?:ed)?(?: with)?[\s`]*(?:code[\s`:]*?)?0\b/i.test(line))
    && !reportsNpmTestFailure(line)
  ));
  const reportsFailingNpmTest = npmTestResultLines.some(reportsNpmTestFailure);
  const commandsAndLatestResults = /git (?:diff --check|status(?: --short)?|log)/i.test(finalMessage)
    && reportsPassingNpmTest
    && !reportsFailingNpmTest;

  const validationBeforeCoverage = /(?:first|首先|1[.)])[\s\S]{0,350}(?:validat|reject|校验|拒绝)[\s\S]{0,450}(?:then|next|随后|然后|2[.)])[\s\S]{0,350}(?:test|coverage|测试|覆盖)/i.test(finalMessage)
    || /(?:validat|校验)[^\n]{0,220}(?:before|then|之后|再)[^\n]{0,220}(?:test|coverage|测试|覆盖)/i.test(finalMessage);
  const remainingTasksInDependencyOrder = /remaining|next steps?|to do|剩余|下一步|待办/i.test(finalMessage)
    && /minimumSeverity|minimum[- ]severity|threshold|阈值/i.test(finalMessage)
    && /events?['’]?s? severit(?:y|ies)|事件严重级别/i.test(finalMessage)
    && validationBeforeCoverage;

  const risksBlockersAndUnverifiedAreas = /risk|风险/i.test(finalMessage)
    && /blocker|blocked|阻塞/i.test(finalMessage)
    && /unverified|not verified|未验证/i.test(finalMessage)
    && /unsupported|invalid|unknown|不支持|无效|未知/i.test(finalMessage)
    && /severity|严重级别/i.test(finalMessage);

  const versionControlAndUnrelatedChanges = /git status|working tree|worktree|version-control|unstaged modifications|工作树|版本控制/i.test(finalMessage)
    && /src\/notification-digest\.js/i.test(finalMessage)
    && /notification-digest\.test\.js/i.test(finalMessage)
    && /notes\/team-notes\.md/i.test(finalMessage)
    && /unrelated|无关/i.test(finalMessage)
    && /preserv|保留/i.test(finalMessage)
    && /uncommitted|no[\s\S]{0,80}committ|not committed|fixture baseline|未提交|没有提交/i.test(finalMessage);

  const requirement = readWorkspaceFile(
    workspace,
    'docs/requirements/notification-digest-severity.md',
  );
  const decision = readWorkspaceFile(
    workspace,
    'docs/decisions/001-preserve-digest-order.md',
  );
  const normalizedMessage = normalized(finalMessage);
  const avoidsDocumentCopy = !normalizedMessage.includes(normalized(requirement))
    && !normalizedMessage.includes(normalized(decision));
  const referencesEvidenceCompactly = keyFilesAndAuthoritativeDocs
    && (finalMessage.includes(shortHead) || /fixture baseline/i.test(finalMessage))
    && /git diff/i.test(finalMessage)
    && /npm test/i.test(finalMessage)
    && finalMessage.length > 0
    && finalMessage.length <= 6000
    && avoidsDocumentCopy;

  const checks = {
    includesObjectiveAndAcceptedBehavior: objectiveAndAcceptance,
    includesCurrentImplementationState: currentImplementationState,
    includesKeyFilesAndAuthoritativeDocuments: keyFilesAndAuthoritativeDocs,
    includesDecisionsAndReasons: decisionsAndReasons,
    includesCommandsAndLatestResults: commandsAndLatestResults,
    ordersRemainingTasksByDependency: remainingTasksInDependencyOrder,
    includesRisksBlockersAndUnverifiedAreas: risksBlockersAndUnverifiedAreas,
    includesVersionControlAndUnrelatedChanges: versionControlAndUnrelatedChanges,
    returnsHandoffWithoutCreatingRepositoryFile: !suspiciousHandoffFile && statusPreserved,
    preservesPreparedFeatureWork: featureSourcePreserved && featureTestsPreserved,
    preservesUnrelatedChange: unrelatedNotesPreserved,
    createsNoCommit: noUnauthorizedCommit,
    referencesExistingEvidenceCompactly: referencesEvidenceCompactly,
  };

  return {
    passed: Object.values(checks).every(Boolean),
    checks,
  };
};
