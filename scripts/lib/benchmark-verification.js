const childProcess = require('node:child_process');

const DEFAULT_VERIFICATION = Object.freeze({
  command: 'npm',
  args: ['test'],
});

function verificationForBenchmark(benchmark = {}) {
  const verification = benchmark.verification || DEFAULT_VERIFICATION;
  if (typeof verification.command !== 'string' || verification.command.trim() === '') {
    throw new Error('benchmark verification.command must be a non-empty string');
  }
  if (!Array.isArray(verification.args)
      || verification.args.some((argument) => typeof argument !== 'string')) {
    throw new Error('benchmark verification.args must be an array of strings');
  }

  return {
    command: verification.command,
    args: [...verification.args],
  };
}

function runFixtureVerification(workspace, benchmark, options = {}) {
  const verification = verificationForBenchmark(benchmark);
  const result = childProcess.spawnSync(verification.command, verification.args, {
    cwd: workspace,
    encoding: 'utf8',
    timeout: options.timeoutMs || 60 * 1000,
    // npm resolves to npm.cmd on Windows, which spawnSync only runs through a shell.
    shell: process.platform === 'win32' && verification.command === 'npm',
  });

  return {
    command: verification.command,
    args: verification.args,
    passed: result.status === 0 && !result.error,
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error.message || result.error) : null,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

module.exports = {
  DEFAULT_VERIFICATION,
  runFixtureVerification,
  verificationForBenchmark,
};
