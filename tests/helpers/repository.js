const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function listSkillNames() {
  return fs.readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(ROOT, 'skills', name, 'SKILL.md')))
    .sort();
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;

  const result = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const property = line.match(/^([a-zA-Z0-9_-]+):(?:\s*(.*))?$/);
    if (!property) continue;

    const [, key, rawValue = ''] = property;

    if (rawValue === '>' || rawValue === '|') {
      const chunks = [];
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        chunks.push(lines[index + 1].trim());
        index += 1;
      }
      result[key] = chunks.join(' ');
      continue;
    }

    const unquoted = rawValue.replace(/^(["'])(.*)\1$/, '$2');
    if (unquoted === 'true') result[key] = true;
    else if (unquoted === 'false') result[key] = false;
    else result[key] = unquoted;
  }

  return result;
}

module.exports = {
  ROOT,
  listSkillNames,
  parseFrontmatter,
  read,
  readJson,
};
