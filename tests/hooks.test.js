const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { ROOT, read, readJson } = require('./helpers/repository');

const hookPath = path.join(ROOT, 'hooks', 'session-start.js');
const promptHookPath = path.join(ROOT, 'hooks', 'user-prompt-submit.js');
const core = read('hooks/core.md').trim();

function runHook(environment = {}) {
  const env = { ...process.env, ...environment };
  delete env.PLUGIN_DATA;
  Object.assign(env, environment);
  return childProcess.spawnSync(process.execPath, [hookPath], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
  });
}

test('core stays compact and contains no workflow takeover language', () => {
  assert.ok(core.length <= 2000, `core is ${core.length} characters; budget is 2000`);
  assert.doesNotMatch(core, /brainstorm|worktree|subagent|must write a plan|commit your work/i);
  assert.match(core, /minimum lines/i);
  assert.match(core, /never infer how related data is handled/i);
  assert.match(core, /workflow remains active for the same task/i);
  assert.match(core, /fresh scope-appropriate verification/i);
});

test('Claude SessionStart receives raw static core context', () => {
  const result = runHook();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, core);
});

test('Codex SessionStart receives hookSpecificOutput JSON without writing state', () => {
  const pluginData = fs.mkdtempSync(path.join(os.tmpdir(), 'engineering-flow-plugin-data-'));
  const before = fs.readdirSync(pluginData);
  const result = runHook({ PLUGIN_DATA: pluginData });
  const after = fs.readdirSync(pluginData);

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.systemMessage, 'ENGINEERING_FLOW:CORE');
  assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.equal(output.hookSpecificOutput.additionalContext, core);
  assert.deepEqual(after, before, 'hook must not persist state');
});

test('hook manifest covers session reset boundaries and explicit prompt routing', () => {
  const manifest = readJson('hooks/hooks.json');
  assert.deepEqual(Object.keys(manifest.hooks), ['SessionStart', 'UserPromptSubmit']);
  assert.equal(manifest.hooks.SessionStart.length, 1);
  assert.equal(manifest.hooks.SessionStart[0].matcher, 'startup|resume|clear|compact');
  assert.equal(manifest.hooks.UserPromptSubmit.length, 1);
  assert.equal(manifest.hooks.UserPromptSubmit[0].matcher, undefined);
});

test('hook source has no mutation, process execution, or network behavior', () => {
  for (const filename of ['hooks/session-start.js', 'hooks/user-prompt-submit.js']) {
    const source = read(filename);
    assert.doesNotMatch(source, /writeFile|appendFile|mkdir|unlink|rename|child_process|exec\(|spawn\(|fetch\(|https?\./);
    assert.match(source, /readFileSync/);
  }
});

function runPromptHook(prompt) {
  return childProcess.spawnSync(process.execPath, [promptHookPath], {
    cwd: ROOT,
    input: JSON.stringify({
      hook_event_name: 'UserPromptSubmit',
      prompt,
    }),
    encoding: 'utf8',
  });
}

test('explicit Codex skill tokens inject the complete requested workflow', () => {
  const result = runPromptHook('$engineering-flow:diagnose Fix the regression.');
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(output.hookSpecificOutput.additionalContext, /ENGINEERING_FLOW:EXPLICIT_WORKFLOWS/);
  assert.match(output.hookSpecificOutput.additionalContext, /active task/i);
  assert.match(output.hookSpecificOutput.additionalContext, /# Diagnose/);
  assert.match(output.hookSpecificOutput.additionalContext, /observe red before the fix/i);
});

test('prompt-leading Claude slash commands rely on native expansion and are not re-injected', () => {
  const result = runPromptHook('/engineering-flow:review Review this diff.');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '', 'leading slash command must not be duplicated by the hook');
});

test('mid-prompt Claude skill tokens use the same deterministic router', () => {
  const result = runPromptHook('Please apply /engineering-flow:review to this diff.');
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.match(output.hookSpecificOutput.additionalContext, /# Review/);
});

test('explicit prompt routing preserves order and deduplicates workflows', () => {
  const result = runPromptHook(
    '$engineering-flow:diagnose then /engineering-flow:handoff '
      + 'and $engineering-flow:diagnose again.',
  );
  assert.equal(result.status, 0, result.stderr);
  const context = JSON.parse(result.stdout).hookSpecificOutput.additionalContext;
  assert.equal((context.match(/## Explicit workflow: diagnose/g) || []).length, 1);
  assert.equal((context.match(/## Explicit workflow: handoff/g) || []).length, 1);
  assert.ok(
    context.indexOf('## Explicit workflow: diagnose')
      < context.indexOf('## Explicit workflow: handoff'),
  );
});

test('ordinary prompts and unknown workflow tokens inject nothing', () => {
  for (const prompt of [
    'Fix this local bug.',
    '$engineering-flow:missing Do something.',
    '$engineering-flow:clarify This removed workflow must not route.',
    '$engineering-flow:verify-and-reconcile This removed workflow must not route.',
  ]) {
    const result = runPromptHook(prompt);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
  }
});
