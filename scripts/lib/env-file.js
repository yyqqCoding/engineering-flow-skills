const fs = require('node:fs');

function parseValue(rawValue) {
  const value = rawValue.trim();
  if (value.length < 2) return value;

  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    const inner = value.slice(1, -1);
    if (quote === "'") return inner;
    return inner
      .replaceAll('\\n', '\n')
      .replaceAll('\\r', '\r')
      .replaceAll('\\t', '\t')
      .replaceAll('\\"', '"')
      .replaceAll('\\\\', '\\');
  }

  return value;
}

function loadEnvFile(filename, environment = process.env) {
  if (!fs.existsSync(filename)) return environment;

  const source = fs.readFileSync(filename, 'utf8');
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const normalized = line.startsWith('export ') ? line.slice(7).trim() : line;
    const separator = normalized.indexOf('=');
    if (separator < 1) continue;

    const key = normalized.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (Object.hasOwn(environment, key)) continue;

    environment[key] = parseValue(normalized.slice(separator + 1));
  }

  return environment;
}

module.exports = {
  loadEnvFile,
  parseValue,
};
