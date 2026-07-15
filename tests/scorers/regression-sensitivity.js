const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ORIGINAL_BUG = `function calculateRenewalDate(isoDate, months) {
  const date = new Date(\`${'${isoDate}'}T00:00:00.000Z\`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

module.exports = {
  calculateRenewalDate,
};
`;

function observedRedGreen(events) {
  const commands = [];
  for (const line of String(events || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      const item = event.item;
      if (event.type !== 'item.completed' || item?.type !== 'command_execution') continue;
      if (!/(?:npm\s+(?:test|run\s+test)|node\s+--test)/.test(item.command || '')) continue;
      commands.push(item.exit_code);
    } catch {
      // Ignore non-JSON diagnostic lines.
    }
  }

  const firstFailure = commands.findIndex((status) => status !== 0);
  return firstFailure >= 0 && commands.slice(firstFailure + 1).some((status) => status === 0);
}

module.exports = function score(workspace, context = {}) {
  const modulePath = path.join(workspace, 'src', 'renewal-date.js');
  delete require.cache[require.resolve(modulePath)];
  const { calculateRenewalDate } = require(modulePath);
  const behaviorCorrect = calculateRenewalDate('2024-01-31', 1) === '2024-02-29'
    && calculateRenewalDate('2023-01-31', 1) === '2023-02-28'
    && calculateRenewalDate('2024-01-30', 1) === '2024-02-29';

  const fixedSource = fs.readFileSync(modulePath, 'utf8');
  let regressionTestIsSensitive = false;
  try {
    fs.writeFileSync(modulePath, ORIGINAL_BUG);
    const mutationRun = childProcess.spawnSync('npm', ['test'], {
      cwd: workspace,
      encoding: 'utf8',
      timeout: 60 * 1000,
    });
    regressionTestIsSensitive = mutationRun.status !== 0;
  } finally {
    fs.writeFileSync(modulePath, fixedSource);
    delete require.cache[require.resolve(modulePath)];
  }

  const redGreenObserved = observedRedGreen(context.events);
  return {
    passed: behaviorCorrect && regressionTestIsSensitive && redGreenObserved,
    checks: {
      clampsToTargetMonthEnd: behaviorCorrect,
      leavesMutationSensitiveRegressionTest: regressionTestIsSensitive,
      observesFailingTestBeforeGreenVerification: redGreenObserved,
    },
  };
};
