const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { ROOT } = require('./helpers/repository');
const {
  hasStaleProspectiveLanguage,
  hasStableReadyValidatorEvidence,
  isTestPath,
  parseArguments,
  finalizeRecord,
  validateRecord,
} = require('../skills/develop/scripts/validate-requirement-record');

const validatorPath = path.join(
  ROOT,
  'skills',
  'develop',
  'scripts',
  'validate-requirement-record.js',
);

function record(status, fields, solution = 'Keep the change within the existing module boundary.') {
  return [
    '# Customer export',
    `Status: ${status}`,
    '## Goal',
    'Export accepted customer rows.',
    '## Acceptance behavior',
    '- The export preserves original field values.',
    '## Out of scope',
    '- Additional formats.',
    '## Assumptions',
    '- CommonJS remains the public module convention.',
    '## Solution boundary',
    solution,
    '## Completion evidence',
    `Implementation files: ${fields.implementation}`,
    `Test files: ${fields.tests}`,
    `Verification: ${fields.verification}`,
    `Deviations: ${fields.deviations}`,
    `Ready validator: ${fields.readyValidator || '`node "/plugin/skills/develop/scripts/validate-requirement-record.js" --record docs/requirements/customer-export.md --mode ready --finalize`'}`,
  ].join('\n\n');
}

test('draft validator requires one timeless pending completion gate', () => {
  const valid = record('Draft', {
    implementation: 'Pending',
    tests: 'Pending',
    verification: 'Pending',
    deviations: 'None known',
  });
  const draftInput = {
    markdown: valid,
    mode: 'draft',
    recordPath: 'docs/requirements/customer-export.md',
  };
  assert.deepEqual(validateRecord(draftInput), []);

  const stale = valid.replace(
    'Keep the change within the existing module boundary.',
    'Focused tests will be added after approval.',
  );
  assert.match(validateRecord({ ...draftInput, markdown: stale }).join('\n'), /timeless/);
});

test('ready validator checks accepted state, changed paths, evidence, and stale wording', () => {
  const valid = record('Accepted', {
    implementation: '`src/customer-export.js`',
    tests: '`customer-export.test.js`',
    verification: '`npm test` — passed, 5 tests',
    deviations: 'None known',
  });
  const input = {
    markdown: valid,
    mode: 'ready',
    changed: ['src/customer-export.js', 'customer-export.test.js'],
    recordPath: 'docs/requirements/customer-export.md',
  };

  assert.deepEqual(validateRecord(input), []);
  assert.match(
    validateRecord({ ...input, markdown: valid.replace('Accepted', 'Implemented') }).join('\n'),
    /Status: Accepted/,
  );
  assert.match(
    validateRecord({ ...input, markdown: valid.replace('None known', 'Tests planned later') })
      .join('\n'),
    /stale prospective/,
  );
  assert.match(
    validateRecord({ ...input, changed: [...input.changed, 'src/serializer.js'] }).join('\n'),
    /src\/serializer\.js/,
  );
  assert.deepEqual(validateRecord({
    ...input,
    changed: [...input.changed, 'notes.txt'],
    ignores: ['notes.txt'],
  }), []);
});

test('validator argument and test-path parsing stay explicit', () => {
  assert.deepEqual(parseArguments([
    '--record', 'docs/requirements/export.md',
    '--mode', 'ready',
    '--finalize',
    '--ignore', 'notes.txt',
  ]), {
    record: 'docs/requirements/export.md',
    mode: 'ready',
    finalize: true,
    ignores: ['notes.txt'],
  });
  assert.throws(
    () => parseArguments(['--record', 'docs/requirements/export.md', '--mode', 'draft', '--finalize']),
    /--finalize requires --mode ready/,
  );
  assert.equal(isTestPath('customer-export.test.js'), true);
  assert.equal(isTestPath('tests/customer-export.js'), true);
  assert.equal(isTestPath('src/customer-export.js'), false);
  assert.equal(hasStaleProspectiveLanguage('The API will be rejected by policy.'), false);
  assert.equal(hasStaleProspectiveLanguage('Tests will be added after approval.'), true);
  assert.equal(hasStableReadyValidatorEvidence(
    '`validate-requirement-record.js --mode ready` — passed',
  ), true);
  assert.equal(hasStableReadyValidatorEvidence(
    '`node /tmp/plugin/validate-requirement-record.js --mode ready` — passed',
  ), false);
});

test('finalization writes Implemented status and stable evidence together', () => {
  const accepted = record('Accepted', {
    implementation: '`src/customer-export.js`',
    tests: '`customer-export.test.js`',
    verification: '`npm test` — passed, 5 tests',
    deviations: 'None known',
  });

  const finalized = finalizeRecord(accepted);
  assert.match(finalized, /^Status: Implemented$/m);
  assert.match(finalized, /Ready validator: `validate-requirement-record\.js --mode ready` — passed/);
  assert.doesNotMatch(finalized, /plugin[\\/]skills[\\/]develop[\\/]scripts[\\/]validate-requirement-record\.js/);
  assert.equal(finalizeRecord(finalized), null);
});

test('finalization rejects invalid or out-of-order records without producing output', () => {
  const accepted = record('Accepted', {
    implementation: '`src/customer-export.js`',
    tests: '`customer-export.test.js`',
    verification: '`npm test` — passed, 5 tests',
    deviations: 'None known',
  });
  const invalid = accepted.replace('`src/customer-export.js`', 'Pending');

  assert.equal(finalizeRecord(invalid), null);
  assert.equal(finalizeRecord(accepted.replace('Status: Accepted', 'Status: Implemented')), null);
});

test('ready CLI is read-only and derives changed and untracked paths from Git', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-record-validator-'));
  const repository = path.join(temporaryRoot, 'repository');
  fs.mkdirSync(path.join(repository, 'src'), { recursive: true });
  fs.writeFileSync(path.join(repository, 'src', 'customer-export.js'), 'module.exports = {};\n');
  fs.writeFileSync(path.join(repository, 'customer-export.test.js'), '// baseline\n');
  childProcess.spawnSync('git', ['init', '-b', 'main'], { cwd: repository });
  childProcess.spawnSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: repository });
  childProcess.spawnSync('git', ['config', 'user.name', 'Test'], { cwd: repository });
  childProcess.spawnSync('git', ['add', '.'], { cwd: repository });
  childProcess.spawnSync('git', ['commit', '-m', 'baseline'], { cwd: repository });

  fs.appendFileSync(path.join(repository, 'src', 'customer-export.js'), '// implementation\n');
  fs.appendFileSync(path.join(repository, 'customer-export.test.js'), '// focused test\n');
  fs.mkdirSync(path.join(repository, 'docs', 'requirements'), { recursive: true });
  fs.writeFileSync(path.join(repository, 'docs', 'requirements', 'customer-export.md'), record(
    'Accepted',
    {
      implementation: '`src/customer-export.js`',
      tests: '`customer-export.test.js`',
      verification: '`npm test` — passed, 5 tests',
      deviations: 'None known',
    },
  ));
  const before = childProcess.spawnSync('git', ['status', '--short'], {
    cwd: repository,
    encoding: 'utf8',
  }).stdout;
  const result = childProcess.spawnSync(process.execPath, [
    validatorPath,
    '--record', 'docs/requirements/customer-export.md',
    '--mode', 'ready',
  ], {
    cwd: repository,
    encoding: 'utf8',
  });
  const after = childProcess.spawnSync('git', ['status', '--short'], {
    cwd: repository,
    encoding: 'utf8',
  }).stdout;

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /ready for the final Implemented write/);
  assert.equal(after, before);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

test('finalize CLI commits status and evidence atomically and rejects repeats', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-record-finalize-'));
  const repository = path.join(temporaryRoot, 'repository');
  fs.mkdirSync(path.join(repository, 'src'), { recursive: true });
  fs.writeFileSync(path.join(repository, 'src', 'customer-export.js'), 'module.exports = {};\n');
  fs.writeFileSync(path.join(repository, 'customer-export.test.js'), '// baseline\n');
  childProcess.spawnSync('git', ['init', '-b', 'main'], { cwd: repository });
  childProcess.spawnSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: repository });
  childProcess.spawnSync('git', ['config', 'user.name', 'Test'], { cwd: repository });
  childProcess.spawnSync('git', ['add', '.'], { cwd: repository });
  childProcess.spawnSync('git', ['commit', '-m', 'baseline'], { cwd: repository });

  fs.appendFileSync(path.join(repository, 'src', 'customer-export.js'), '// implementation\n');
  fs.appendFileSync(path.join(repository, 'customer-export.test.js'), '// focused test\n');
  fs.mkdirSync(path.join(repository, 'docs', 'requirements'), { recursive: true });
  const recordPath = path.join(repository, 'docs', 'requirements', 'customer-export.md');
  fs.writeFileSync(recordPath, record('Accepted', {
    implementation: '`src/customer-export.js`',
    tests: '`customer-export.test.js`',
    verification: '`npm test` — passed, 5 tests',
    deviations: 'None known',
  }));
  const result = childProcess.spawnSync(process.execPath, [
    validatorPath,
    '--record', 'docs/requirements/customer-export.md',
    '--mode', 'ready',
    '--finalize',
  ], { cwd: repository, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const finalized = fs.readFileSync(recordPath, 'utf8');
  assert.match(finalized, /^Status: Implemented$/m);
  assert.match(finalized, /Ready validator: `validate-requirement-record\.js --mode ready` — passed/);
  assert.doesNotMatch(finalized, /\/plugin[\\/]skills[\\/]develop[\\/]scripts/);

  const repeatBefore = finalized;
  const repeat = childProcess.spawnSync(process.execPath, [
    validatorPath,
    '--record', 'docs/requirements/customer-export.md',
    '--mode', 'ready',
    '--finalize',
  ], { cwd: repository, encoding: 'utf8' });
  assert.notEqual(repeat.status, 0);
  assert.equal(fs.readFileSync(recordPath, 'utf8'), repeatBefore);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

test('failed finalization leaves the Accepted record byte-for-byte unchanged', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-record-finalize-fail-'));
  const repository = path.join(temporaryRoot, 'repository');
  fs.mkdirSync(path.join(repository, 'src'), { recursive: true });
  fs.writeFileSync(path.join(repository, 'src', 'customer-export.js'), 'module.exports = {};\n');
  fs.writeFileSync(path.join(repository, 'customer-export.test.js'), '// baseline\n');
  childProcess.spawnSync('git', ['init', '-b', 'main'], { cwd: repository });
  childProcess.spawnSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: repository });
  childProcess.spawnSync('git', ['config', 'user.name', 'Test'], { cwd: repository });
  childProcess.spawnSync('git', ['add', '.'], { cwd: repository });
  childProcess.spawnSync('git', ['commit', '-m', 'baseline'], { cwd: repository });
  fs.appendFileSync(path.join(repository, 'src', 'customer-export.js'), '// implementation\n');
  fs.appendFileSync(path.join(repository, 'customer-export.test.js'), '// focused test\n');
  fs.mkdirSync(path.join(repository, 'docs', 'requirements'), { recursive: true });
  const recordPath = path.join(repository, 'docs', 'requirements', 'customer-export.md');
  fs.writeFileSync(recordPath, record('Accepted', {
    implementation: 'Pending',
    tests: '`customer-export.test.js`',
    verification: '`npm test` — passed, 5 tests',
    deviations: 'None known',
  }));
  const before = fs.readFileSync(recordPath, 'utf8');
  const result = childProcess.spawnSync(process.execPath, [
    validatorPath,
    '--record', 'docs/requirements/customer-export.md',
    '--mode', 'ready',
    '--finalize',
  ], { cwd: repository, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(recordPath, 'utf8'), before);
  assert.match(fs.readFileSync(recordPath, 'utf8'), /^Status: Accepted$/m);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});

test('finalization rejects records whose resolved path escapes the repository', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-record-finalize-path-'));
  const repository = path.join(temporaryRoot, 'repository');
  const externalDirectory = path.join(temporaryRoot, 'external');
  fs.mkdirSync(path.join(repository, 'src'), { recursive: true });
  fs.mkdirSync(path.join(repository, 'docs'), { recursive: true });
  fs.mkdirSync(externalDirectory, { recursive: true });
  fs.writeFileSync(path.join(repository, 'src', 'customer-export.js'), 'module.exports = {};\n');
  fs.writeFileSync(path.join(repository, 'customer-export.test.js'), '// baseline\n');
  childProcess.spawnSync('git', ['init', '-b', 'main'], { cwd: repository });
  childProcess.spawnSync('git', ['config', 'user.email', 'test@example.invalid'], { cwd: repository });
  childProcess.spawnSync('git', ['config', 'user.name', 'Test'], { cwd: repository });
  childProcess.spawnSync('git', ['add', '.'], { cwd: repository });
  childProcess.spawnSync('git', ['commit', '-m', 'baseline'], { cwd: repository });
  fs.appendFileSync(path.join(repository, 'src', 'customer-export.js'), '// implementation\n');
  fs.appendFileSync(path.join(repository, 'customer-export.test.js'), '// focused test\n');
  const externalRecord = path.join(externalDirectory, 'customer-export.md');
  fs.writeFileSync(externalRecord, record('Accepted', {
    implementation: '`src/customer-export.js`',
    tests: '`customer-export.test.js`',
    verification: '`npm test` — passed, 5 tests',
    deviations: 'None known',
  }));
  fs.symlinkSync(externalDirectory, path.join(repository, 'docs', 'requirements'));
  const before = fs.readFileSync(externalRecord, 'utf8');
  const result = childProcess.spawnSync(process.execPath, [
    validatorPath,
    '--record', 'docs/requirements/customer-export.md',
    '--mode', 'ready',
    '--finalize',
  ], { cwd: repository, encoding: 'utf8' });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /parent must stay inside/);
  assert.equal(fs.readFileSync(externalRecord, 'utf8'), before);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
});
