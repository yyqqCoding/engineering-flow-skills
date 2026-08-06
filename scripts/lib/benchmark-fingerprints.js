const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function updateHashWithPath(hash, root, targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath).sort()) {
      updateHashWithPath(hash, root, path.join(targetPath, entry));
    }
    return;
  }

  hash.update(path.relative(root, targetPath));
  hash.update('\0');
  hash.update(fs.readFileSync(targetPath));
  hash.update('\0');
}

function fingerprint(root, paths, additionalValue = '') {
  const hash = crypto.createHash('sha256');
  for (const targetPath of paths) updateHashWithPath(hash, root, targetPath);
  hash.update(additionalValue);
  return hash.digest('hex').slice(0, 12);
}

function fingerprintBenchmark(root, benchmark) {
  return fingerprint(root, [
    path.join(root, benchmark.fixture),
    path.join(root, benchmark.scorer),
    ...(benchmark.setup ? [path.join(root, benchmark.setup)] : []),
  ], JSON.stringify({ prompt: benchmark.prompt, followUps: benchmark.followUps || [] }));
}

function fingerprintCandidate(root) {
  return fingerprint(root, [
    path.join(root, '.claude-plugin'),
    path.join(root, '.codex-plugin'),
    path.join(root, 'config', 'skills.json'),
    path.join(root, 'hooks'),
    path.join(root, 'skills'),
  ]);
}

module.exports = {
  fingerprint,
  fingerprintBenchmark,
  fingerprintCandidate,
};
