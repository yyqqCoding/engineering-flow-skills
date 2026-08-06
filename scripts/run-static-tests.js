#!/usr/bin/env node

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const testFiles = fs.readdirSync(path.join(ROOT, 'tests'))
  .filter((name) => name.endsWith('.test.js'))
  .sort()
  .map((name) => path.join('tests', name));

const result = childProcess.spawnSync(process.execPath, ['--test', ...testFiles], {
  cwd: ROOT,
  stdio: 'inherit',
});

if (result.error) throw result.error;
if (result.signal) process.kill(process.pid, result.signal);
process.exitCode = result.status ?? 1;
