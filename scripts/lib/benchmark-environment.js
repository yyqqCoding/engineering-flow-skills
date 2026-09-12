const childProcess = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const IDENTITY_FIELDS = [
  'schemaVersion', 'cliName', 'cliVersion', 'nodeVersion', 'platform', 'arch',
  'modelProvider', 'model', 'reasoningEffort', 'timeoutMs', 'configurationFingerprint',
];
const CONFIGURATION_KEYS = new Set([
  'approval_policy', 'profile', 'service_tier', 'web_search', 'personality',
  'model_context_window', 'model_auto_compact_token_limit', 'model_reasoning_summary',
  'model_verbosity', 'developer_instructions', 'compact_prompt',
]);
const PROVIDER_KEYS = new Set([
  'base_url', 'wire_api', 'request_max_retries', 'stream_max_retries',
  'stream_idle_timeout_ms', 'websocket_connect_timeout_ms', 'supports_websockets',
  'requires_openai_auth',
]);

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function createBenchmarkEnvironment(values = {}) {
  const identity = Object.fromEntries(IDENTITY_FIELDS.map(field => [field, values[field] ?? null]));
  identity.schemaVersion = 1;
  const complete = IDENTITY_FIELDS.every((field) => {
    if (field === 'schemaVersion') return true;
    if (field === 'timeoutMs') return Number.isInteger(identity[field]) && identity[field] > 0;
    if (field === 'configurationFingerprint') return /^[a-f0-9]{64}$/.test(identity[field] || '');
    return typeof identity[field] === 'string' && identity[field].trim() !== '';
  });
  return { ...identity, complete, fingerprint: complete ? hash(identity) : null };
}

function environmentFingerprint(report) {
  const environment = report?.environment;
  if (environment?.schemaVersion !== 1 || environment.complete !== true) return null;
  const canonical = createBenchmarkEnvironment(environment);
  if (!canonical.complete || environment.fingerprint !== canonical.fingerprint) return null;
  // Existing report fields remain readable, but cannot contradict the complete identity.
  for (const field of ['modelProvider', 'model', 'reasoningEffort', 'timeoutMs']) {
    if (Object.hasOwn(report.modelRun || {}, field)
        && report.modelRun[field] !== environment[field]) return null;
  }
  return canonical.fingerprint;
}

function matchesEnvironment(report, expected) {
  const fingerprint = environmentFingerprint({ environment: expected });
  return fingerprint !== null && environmentFingerprint(report) === fingerprint;
}

function withoutComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote === '"' && char === '\\') {
      index += 1;
    } else if (quote && char === quote) {
      quote = null;
    } else if (!quote && (char === '"' || char === "'")) {
      quote = char;
    } else if (!quote && char === '#') {
      return value.slice(0, index).trim();
    }
  }
  return value.trim();
}

function configurationString(value) {
  const source = withoutComment(value);
  if (/^'[^']*'$/.test(source)) return source.slice(1, -1);
  try {
    const parsed = JSON.parse(source);
    return typeof parsed === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function endpointIdentity(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.username = '';
    url.password = '';
    url.hash = '';
    const publicQuery = [];
    for (const [key, parameter] of url.searchParams) {
      if (['api-version', 'api_version'].includes(key)) publicQuery.push([key, parameter]);
      else if (!/^(?:api[_-]?key|key|token|access[_-]?token|auth|authorization|password|secret|signature|sig)$/i.test(key)) {
        // An unknown query may route requests differently; do not certify it after dropping data.
        return null;
      }
    }
    url.search = '';
    for (const [key, parameter] of publicQuery) url.searchParams.append(key, parameter);
    return url.toString();
  } catch {
    return null;
  }
}

function configurationFingerprint({ env, codexHome, modelProvider }) {
  const entries = [];
  let hasProviderEndpoint = modelProvider === 'openai';
  const endpointOverride = env.BENCH_BASE_URL ? endpointIdentity(env.BENCH_BASE_URL) : null;
  if (env.BENCH_BASE_URL && !endpointOverride) return null;
  if (endpointOverride) hasProviderEndpoint = true;
  const temporaryPaths = [...new Set([
    codexHome, env.CODEX_HOME, env.HOME, env.USERPROFILE, os.homedir(),
  ].filter(Boolean))]
    .sort((left, right) => right.length - left.length);
  const normalize = value => temporaryPaths.reduce(
    (result, directory) => result.replaceAll(directory, '<isolated-home>'), value,
  );

  // This is an allowlist of execution settings, not a TOML configuration resolver. Unknown/default
  // model selections remain incomplete, and auth files, secret assignments, headers and plugin paths
  // never enter the digest. The selected endpoint distinguishes aliases reused for different servers.
  const files = fs.existsSync(codexHome)
    ? fs.readdirSync(codexHome, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.toml')).map(entry => entry.name).sort()
    : [];
  for (const filename of files) {
    let section = '';
    for (const rawLine of fs.readFileSync(path.join(codexHome, filename), 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      const header = line.match(/^\[([^\[\]]+)\]\s*(?:#.*)?$/);
      if (header) {
        section = header[1].split('.').map(part => part.trim().replace(/^["']|["']$/g, '')).join('.');
        continue;
      }
      const assignment = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(.*)$/);
      if (!assignment) continue;
      const [, key, rawValue] = assignment;
      let value = withoutComment(rawValue);
      const providerSection = section === `model_providers.${modelProvider}`
        || (section.startsWith('profiles.') && section.endsWith(`.model_providers.${modelProvider}`));
      if (providerSection && PROVIDER_KEYS.has(key)) {
        if (endpointOverride && ['base_url', 'wire_api'].includes(key)) continue;
        if (key === 'base_url') {
          value = endpointIdentity(configurationString(rawValue));
          if (!value) return null;
          hasProviderEndpoint = true;
        }
      } else if ((section === '' || section.startsWith('profiles.')) && CONFIGURATION_KEYS.has(key)) {
        // Model, reasoning and sandbox are explicit command overrides, not inherited settings.
      } else if ((section === 'features' || /^profiles\.[^.]+\.features$/.test(section))
          && /^(?:true|false)$/.test(value)) {
        // Feature names and booleans contain no credential values.
      } else if (section === 'sandbox_workspace_write'
          && ['network_access', 'exclude_tmpdir_env_var', 'exclude_slash_tmp'].includes(key)) {
        // Paths assigned to temporary workspaces are not environment identity.
      } else if (section === 'shell_environment_policy'
          && ['inherit', 'ignore_default_excludes', 'include_only', 'exclude'].includes(key)) {
        // Selectors name environment variables; their credential values are never read here.
      } else {
        continue;
      }
      if (value.includes('"""') || value.includes("'''")) return null;
      entries.push([filename, section, key, normalize(value)]);
    }
  }
  if (!hasProviderEndpoint) return null;
  const inheritedEndpoint = modelProvider === 'openai' && env.OPENAI_BASE_URL
    ? endpointIdentity(env.OPENAI_BASE_URL) : null;
  if (modelProvider === 'openai' && env.OPENAI_BASE_URL && !inheritedEndpoint) return null;
  return hash({
    settings: entries,
    overrides: { sandbox: 'workspace-write', bypassHookTrust: true,
      endpoint: endpointOverride, wireApi: endpointOverride ? 'responses' : null },
    inheritedEndpoint,
    executionEnvironment: Object.fromEntries(
      ['NODE_TEST_CONTEXT', 'NODE_OPTIONS', 'TZ', 'LANG', 'LC_ALL'].map(key => [key, normalize(env[key] || '')]),
    ),
  });
}

function captureBenchmarkEnvironment({
  env = process.env,
  codexHome = path.join(os.homedir(), '.codex'),
  timeoutMs = Number(env.BENCH_TIMEOUT_MS || 240000),
  cliVersion,
} = {}) {
  if (cliVersion === undefined) {
    const result = childProcess.spawnSync('codex', ['--version'], {
      env, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024,
    });
    cliVersion = result.status === 0 ? result.stdout.trim() : null;
  }
  const modelProvider = env.BENCH_MODEL_PROVIDER || null;
  let configuration = null;
  try {
    configuration = configurationFingerprint({ env, codexHome, modelProvider });
  } catch {
    // A missing or unreadable configuration cannot be certified as a matching environment.
  }
  return createBenchmarkEnvironment({
    cliName: 'codex', cliVersion,
    nodeVersion: process.version, platform: process.platform, arch: process.arch,
    modelProvider, model: env.BENCH_MODEL || null,
    reasoningEffort: env.BENCH_REASONING_EFFORT || 'medium', timeoutMs,
    configurationFingerprint: configuration,
  });
}

module.exports = {
  captureBenchmarkEnvironment,
  createBenchmarkEnvironment,
  environmentFingerprint,
  matchesEnvironment,
};
