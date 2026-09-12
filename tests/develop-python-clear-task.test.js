const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { promptsForBenchmark, readRequirementStates } = require('../scripts/lib/benchmark-conversation');
const { fingerprintBenchmark } = require('../scripts/lib/benchmark-fingerprints');
const { runFixtureVerification } = require('../scripts/lib/benchmark-verification');
const benchmarks = require('../config/benchmarks.json');
const benchmark = benchmarks['develop-python-clear-task'];
const ROOT = path.resolve(__dirname, '..');
const score = require(path.join(ROOT, benchmark.scorer));

const CORRECT = `def add(left, right):
    return left + right


def is_even(value):
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError('value must be an integer')
    return value % 2 == 0
`;

const SENSITIVE_TESTS = `import unittest

from src.math_utils import add, is_even


class IsEvenTest(unittest.TestCase):
    def test_preserves_add(self):
        self.assertEqual(add(2, 3), 5)

    def test_integer_parity(self):
        for value, expected in [(0, True), (4, True), (1, False), (-3, False), (-4, True)]:
            with self.subTest(value=value):
                self.assertIs(is_even(value), expected)

    def test_rejects_non_integers(self):
        for value in (True, False, 2.0, 2.5, '2', None, [], {}):
            with self.subTest(value=value):
                with self.assertRaisesRegex(TypeError, '^value must be an integer$'):
                    is_even(value)

    def test_unbounded_integers(self):
        for value, expected in [(2 ** 63, True), (2 ** 63 + 1, False),
                                (-(2 ** 63 + 1), False), (10 ** 400, True),
                                (10 ** 400 + 1, False), (-(10 ** 400 + 1), False)]:
            with self.subTest(value=value):
                self.assertIs(is_even(value), expected)
`;

function git(workspace, args) {
  const result = childProcess.spawnSync('git', args, { cwd: workspace, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function snapshot(workspace, fields = {}) {
  return {
    finalMessage: '', metrics: { fileChanges: 0 },
    diff: git(workspace, ['diff', '--', '.']),
    workspaceState: {
      status: git(workspace, ['status', '--short', '--untracked-files=all']),
      head: git(workspace, ['rev-parse', 'HEAD']).trim(), unauthorizedCommit: false,
    },
    requirementDocuments: readRequirementStates(workspace),
    ...fields,
  };
}

function fixture(t, { source = CORRECT, tests = SENSITIVE_TESTS, testPath = 'tests/test_is_even.py', existingRecord = false } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-python-develop-'));
  const workspace = path.join(directory, 'workspace');
  fs.cpSync(path.join(ROOT, benchmark.fixture), workspace, { recursive: true });
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  git(workspace, ['init', '-b', 'main']);
  git(workspace, ['config', 'user.email', 'test@example.invalid']);
  git(workspace, ['config', 'user.name', 'Test']);
  git(workspace, ['add', '.']);
  git(workspace, ['commit', '-m', 'fixture baseline']);
  if (existingRecord) {
    fs.mkdirSync(path.join(workspace, 'docs/requirements'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'docs/requirements/existing.md'), '# Existing work\n\nStatus: Draft\n');
  }
  const checkpoint = snapshot(workspace, { index: 1, finalMessage: '需求与验证 checkpoint 已对齐，等待你批准实施。' });
  const initial = { ...checkpoint.workspaceState, diff: checkpoint.diff,
    requirementDocuments: structuredClone(checkpoint.requirementDocuments) };
  fs.writeFileSync(path.join(workspace, 'src/math_utils.py'), source);
  if (tests !== null) {
    fs.mkdirSync(path.dirname(path.join(workspace, testPath)), { recursive: true });
    if (testPath.includes('/contracts/')) fs.writeFileSync(path.join(workspace, 'tests/contracts/__init__.py'), '');
    fs.writeFileSync(path.join(workspace, testPath), tests);
  }
  const publicTests = runFixtureVerification(workspace, benchmark);
  const events = path.join(directory, 'implementation.jsonl');
  fs.writeFileSync(events, JSON.stringify({ type: 'item.completed', item: {
    type: 'command_execution', command: 'python3 -B -m unittest discover -s tests',
    exit_code: publicTests.status, aggregated_output: publicTests.stdout + publicTests.stderr,
  } }) + '\n');
  const implementation = snapshot(workspace, {
    index: 2, publicTests, events, metrics: { fileChanges: tests === null ? 1 : 2 },
    finalMessage: '已按批准范围实现，约定的 unittest 验证通过。',
  });
  return { directory, workspace, context: { turns: [checkpoint, implementation], initialWorkspaceState: initial } };
}

function digestFiles(directory) {
  const files = {};
  function read(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) read(filename);
      else files[path.relative(directory, filename)] = crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
    }
  }
  read(directory);
  return files;
}

test('Python Develop registration preserves the Core holdout and fingerprints all executed dependencies', () => {
  const prompts = promptsForBenchmark(benchmark);
  assert.equal(prompts.length, 2);
  assert.match(prompts[0], /^\$engineering-flow:develop /);
  assert.match(prompts[0], /bool.*不另设数值范围/);
  assert.match(prompts[0], /本回合不写文件/);
  assert.match(prompts[1], /^批准/);
  assert.deepEqual(benchmark.verification, score.VERIFICATION);
  assert.deepEqual(benchmark.invocation, { expected: ['develop'], allowed: ['develop'] });
  assert.equal(benchmark.fixture, 'fixtures/python-clear-task');
  assert.equal(benchmark.coverage.workflow, 'develop');
  assert.equal(benchmark.coverage.stack, 'python');
  assert.equal(benchmark.coverage.language, 'zh-CN');
  assert.equal(benchmark.coverage.holdout, false);
  assert.equal(benchmark.coverage.variantOf, 'develop-lifecycle');
  for (const dependency of [
    'scripts/run-codex-benchmark.js', 'scripts/lib/benchmark-environment.js',
    'scripts/lib/benchmark-compaction.js', 'scripts/lib/benchmark-conversation.js',
    'scripts/lib/benchmark-fingerprints.js', 'scripts/lib/benchmark-utils.js',
    'scripts/lib/benchmark-verification.js', 'scripts/lib/env-file.js',
    'tests/scorers/workflow-transition-evidence.js', 'tests/scorers/python-test-evidence.js',
  ]) assert.ok(benchmark.fingerprintInputs.includes(dependency), dependency);
  assert.match(fingerprintBenchmark(ROOT, benchmark), /^[a-f0-9]{12}$/);
  const holdout = benchmarks['python-clear-task'];
  assert.equal(holdout.coverage.holdout, true);
  assert.equal(holdout.coverage.workflow, 'core');
  assert.deepEqual(holdout.invocation, { expected: [], allowed: [] });
  assert.deepEqual(holdout.verification.args, ['-m', 'unittest', 'discover', '-s', 'tests']);
  assert.equal(holdout.scorer, 'tests/scorers/python-clear-task.js');
});

test('approved Python implementation passes with sensitive coverage in ordinary or nested unittest layouts', (t) => {
  for (const testPath of ['tests/test_is_even.py', 'tests/contracts/test_is_even.py']) {
    const { workspace, context } = fixture(t, { testPath });
    const before = digestFiles(workspace);
    const result = score(workspace, context);
    assert.equal(result.passed, true, JSON.stringify(result));
    assert.deepEqual(digestFiles(workspace), before);
  }
});

test('hidden Python checks preserve exact values, exceptions, add behavior, and unlimited integer range', (t) => {
  const cases = [
    [CORRECT.replace('isinstance(value, bool) or ', ''), 'rejectsBooleans'],
    [CORRECT.replace('return value % 2 == 0', 'return int(value % 2 == 0)'), 'returnsExactIntegerParity'],
    [CORRECT.replace('return value % 2 == 0', 'return abs(float(value)) % 2 == 0'), 'acceptsUnboundedIntegers'],
    [CORRECT.replace('return value % 2 == 0', "if abs(value) > 2 ** 63 - 1:\n        raise TypeError('value must be an integer')\n    return value % 2 == 0"), 'acceptsUnboundedIntegers'],
    [CORRECT.replace('value must be an integer', 'integer required'), 'rejectsOtherNonIntegers'],
    [CORRECT.replace('raise TypeError', 'raise ValueError'), 'rejectsOtherNonIntegers'],
    [CORRECT.replace('return left + right', 'return int(left) + int(right)'), 'preservesExistingAdd'],
  ];
  for (const [source, check] of cases) {
    const { workspace } = fixture(t, { source, tests: null });
    const before = digestFiles(workspace);
    const result = score.inspectPythonContract(workspace);
    assert.equal(result.checks[check], false, check);
    assert.deepEqual(digestFiles(workspace), before);
  }
});

test('correct production behavior and keyword comments cannot replace sensitive Python tests', (t) => {
  const { workspace, context } = fixture(t, { tests: '# is_even bool TypeError negative odd unlimited integer\n' });
  const result = score(workspace, context);
  assert.equal(result.checks.acceptsUnboundedIntegers, true);
  assert.equal(result.checks.rejectsBooleans, true);
  assert.equal(result.checks.leavesBooleanSensitiveCoverage, false);
  assert.equal(result.checks.leavesParitySensitiveCoverage, false);
  assert.equal(result.checks.leavesRangeSensitiveCoverage, false);
  assert.equal(result.passed, false);
});

test('ordinary parity and input tests still leave an untested range boundary', (t) => {
  const ordinary = SENSITIVE_TESTS.slice(0, SENSITIVE_TESTS.indexOf('    def test_unbounded_integers'));
  const { workspace, context } = fixture(t, { tests: ordinary });
  const result = score(workspace, context);
  assert.equal(result.checks.leavesBooleanSensitiveCoverage, true);
  assert.equal(result.checks.leavesParitySensitiveCoverage, true);
  assert.equal(result.checks.leavesRangeSensitiveCoverage, false);
  assert.equal(result.passed, false);
});

test('existing add coverage must survive even when unittest files are reorganized', (t) => {
  for (const preserveAdd of [false, true]) {
    const tests = preserveAdd ? SENSITIVE_TESTS : SENSITIVE_TESTS.replace(
      '    def test_preserves_add(self):\n        self.assertEqual(add(2, 3), 5)\n\n', '',
    );
    const { workspace, context } = fixture(t, { tests });
    fs.rmSync(path.join(workspace, 'tests/test_math_utils.py'));
    const implementation = context.turns[1];
    implementation.workspaceState.status = git(workspace, ['status', '--short', '--untracked-files=all']);
    implementation.diff = git(workspace, ['diff', '--', '.']);
    implementation.publicTests = runFixtureVerification(workspace, benchmark);
    fs.writeFileSync(implementation.events, JSON.stringify({ type: 'item.completed', item: {
      type: 'command_execution', command: 'python3 -B -m unittest discover -s tests',
      exit_code: implementation.publicTests.status,
      aggregated_output: implementation.publicTests.stdout + implementation.publicTests.stderr,
    } }) + '\n');
    assert.equal(implementation.publicTests.passed, true);
    const result = score(workspace, context);
    assert.equal(result.passed, preserveAdd, JSON.stringify(result));
    assert.equal(result.checks.retainsExistingAddCoverage, preserveAdd);
  }
});

test('correct final Python behavior does not excuse checkpoint writes or missing approval', (t) => {
  const { workspace, context } = fixture(t);
  for (const fields of [
    { diff: 'diff --git a/src/math_utils.py b/src/math_utils.py\n' },
    { diff: 'diff --git a/tests/test_math_utils.py b/tests/test_math_utils.py\n' },
    { metrics: { fileChanges: 1 } },
    { finalMessage: '需求已记录。' },
  ]) {
    const changed = structuredClone(context);
    Object.assign(changed.turns[0], fields);
    assert.equal(score(workspace, changed).passed, false, JSON.stringify(fields));
  }
});

test('runner verification alone does not prove the model ran unittest after approval', (t) => {
  const { workspace, context } = fixture(t);
  assert.equal(context.turns[1].publicTests.passed, true);
  delete context.turns[1].events;
  const result = score(workspace, context);
  assert.equal(result.checks.implementsAfterApproval, false);
  assert.equal(result.passed, false);
});

test('Python local scope preserves existing records but rejects new artifacts and same-path content edits', (t) => {
  const { workspace, context } = fixture(t, { existingRecord: true });
  assert.equal(score(workspace, context).passed, true);
  const changed = structuredClone(context);
  changed.turns[0].requirementDocuments[0].content += 'Changed during checkpoint.\n';
  assert.equal(score(workspace, changed).checks.localCheckpointLeavesWorkspaceUnchanged, false);
  changed.turns[0] = context.turns[0];
  changed.turns[1].requirementDocuments[0].content += 'Changed during implementation.\n';
  assert.equal(score(workspace, changed).checks.keepsLocalTaskScope, false);
  for (const filename of ['docs/requirements/is-even.md', 'requirements.txt', 'report.md']) {
    const extra = structuredClone(context);
    extra.turns[1].workspaceState.status += `?? ${filename}\n`;
    assert.equal(score(workspace, extra).checks.keepsLocalTaskScope, false, filename);
  }
});

test('stale Python bytecode is ignored without changing original files or caches', (t) => {
  const { workspace, context } = fixture(t);
  const filename = path.join(workspace, 'src/math_utils.py');
  fs.writeFileSync(filename, CORRECT.replace('return value % 2 == 0', 'return value % 2 == 1'));
  const sourceStat = fs.statSync(filename);
  const compiled = childProcess.spawnSync('python3', ['-B', '-c',
    'import py_compile; py_compile.compile("src/math_utils.py", doraise=True)'], {
    cwd: workspace, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(compiled.status, 0, compiled.stderr);
  fs.writeFileSync(filename, CORRECT);
  fs.utimesSync(filename, sourceStat.atime, sourceStat.mtime);
  const before = digestFiles(workspace);
  assert.equal(score(workspace, context).passed, true);
  assert.deepEqual(digestFiles(workspace), before);
});

test('missing implementations and unauthorized commits cannot pass Python Develop', (t) => {
  const { workspace, context } = fixture(t);
  context.turns[1].workspaceState.unauthorizedCommit = true;
  assert.equal(score(workspace, context).checks.doesNotCommit, false);
  const before = digestFiles(path.join(ROOT, benchmark.fixture));
  assert.equal(score(path.join(ROOT, benchmark.fixture)).passed, false);
  assert.deepEqual(digestFiles(path.join(ROOT, benchmark.fixture)), before);
});
