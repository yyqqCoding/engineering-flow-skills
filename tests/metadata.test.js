const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ROOT,
  listSkillNames,
  parseFrontmatter,
  read,
  readJson,
} = require('./helpers/repository');

const skillConfig = readJson('config/skills.json');
const skillNames = listSkillNames();

test('skill registry matches released skill directories', () => {
  assert.deepEqual(Object.keys(skillConfig).sort(), skillNames);
});

test('skill names, Claude policy, and Codex policy stay synchronized', () => {
  for (const name of skillNames) {
    const frontmatter = parseFrontmatter(read(`skills/${name}/SKILL.md`));
    assert.ok(frontmatter, `${name} must have frontmatter`);
    assert.equal(frontmatter.name, name, `${name} frontmatter name must match its directory`);
    assert.ok(frontmatter.description, `${name} must have a description`);

    const openaiPath = path.join(ROOT, 'skills', name, 'agents', 'openai.yaml');
    assert.ok(fs.existsSync(openaiPath), `${name} must have agents/openai.yaml`);
    const openai = fs.readFileSync(openaiPath, 'utf8');
    assert.match(openai, /display_name:/, `${name} needs a Codex display name`);
    assert.match(openai, /short_description:/, `${name} needs a Codex short description`);

    const expectedUserInvoked = skillConfig[name].invocation === 'user';
    const claudeUserInvoked = frontmatter['disable-model-invocation'] === true;
    const codexUserInvoked = /allow_implicit_invocation:\s*false/.test(openai);

    assert.equal(claudeUserInvoked, expectedUserInvoked, `${name} Claude invocation policy mismatch`);
    assert.equal(codexUserInvoked, expectedUserInvoked, `${name} Codex invocation policy mismatch`);
  }
});

test('model-facing descriptions are narrow and user descriptions are concise', () => {
  for (const [name, config] of Object.entries(skillConfig)) {
    const { description } = parseFrontmatter(read(`skills/${name}/SKILL.md`));
    assert.ok(description.length <= 320, `${name} description is too large for persistent context`);
    assert.doesNotMatch(description, /any coding task|every conversation|1% chance/i, `${name} uses a universal trigger`);

    if (config.invocation === 'model') {
      assert.ok(description.length >= 70, `${name} model description needs observable trigger branches`);
    } else {
      assert.ok(description.length <= 140, `${name} user description should stay human-scannable`);
    }
  }
});

test('the current release keeps every full skill explicitly invoked', () => {
  const implicitSkills = Object.entries(skillConfig)
    .filter(([, config]) => config.invocation === 'model')
    .map(([name]) => name);

  assert.deepEqual(implicitSkills, []);
});

test('skill dependency graph is complete and acyclic', () => {
  for (const [name, config] of Object.entries(skillConfig)) {
    for (const dependency of config.dependencies) {
      assert.ok(skillConfig[dependency], `${name} references unknown dependency ${dependency}`);
      assert.notEqual(dependency, name, `${name} cannot depend on itself`);
    }
  }

  const visiting = new Set();
  const visited = new Set();

  function visit(name, chain = []) {
    if (visiting.has(name)) {
      assert.fail(`skill dependency cycle: ${[...chain, name].join(' -> ')}`);
    }
    if (visited.has(name)) return;

    visiting.add(name);
    for (const dependency of skillConfig[name].dependencies) {
      visit(dependency, [...chain, name]);
    }
    visiting.delete(name);
    visited.add(name);
  }

  for (const name of skillNames) visit(name);
});

test('Claude and Codex manifests expose the released skills', () => {
  const claude = readJson('.claude-plugin/plugin.json');
  const codex = readJson('.codex-plugin/plugin.json');
  const marketplace = readJson('.agents/plugins/marketplace.json');
  const packageJson = readJson('package.json');

  const claudeSkills = claude.skills.map((skillPath) => path.basename(skillPath)).sort();
  assert.deepEqual(claudeSkills, skillNames);
  assert.equal(codex.skills, './skills/');
  assert.equal(claude.version, codex.version);
  assert.equal(claude.version, packageJson.version);
  assert.equal(claude.hooks, './hooks/hooks.json');
  assert.equal(codex.hooks, './hooks/hooks.json');
  assert.equal(marketplace.plugins[0].source.source, 'local');
  assert.equal(marketplace.plugins[0].source.path, '.');
});

test('relative Markdown links resolve', () => {
  const markdownFiles = [];

  function collect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) collect(fullPath);
      else if (entry.name.endsWith('.md')) markdownFiles.push(fullPath);
    }
  }

  collect(ROOT);

  for (const file of markdownFiles) {
    const markdown = fs.readFileSync(file, 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), target);
      assert.ok(fs.existsSync(resolved), `${path.relative(ROOT, file)} links to missing ${target}`);
    }
  }
});
