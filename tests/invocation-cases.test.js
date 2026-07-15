const assert = require('node:assert/strict');
const test = require('node:test');

const { readJson } = require('./helpers/repository');

const skillConfig = readJson('config/skills.json');
const cases = readJson('tests/cases/invocation.json');

test('every model-invoked skill has positive and negative trigger cases', () => {
  const modelSkills = Object.entries(skillConfig)
    .filter(([, config]) => config.invocation === 'model')
    .map(([name]) => name)
    .sort();

  assert.deepEqual(Object.keys(cases).sort(), modelSkills);

  for (const name of modelSkills) {
    assert.ok(cases[name].positive.length >= 2, `${name} needs at least two positive prompts`);
    assert.ok(cases[name].negative.length >= 2, `${name} needs at least two negative prompts`);
    const prompts = [...cases[name].positive, ...cases[name].negative];
    assert.equal(new Set(prompts).size, prompts.length, `${name} has duplicate prompts`);
  }
});
