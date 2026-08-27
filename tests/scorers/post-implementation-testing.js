const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MUTANTS = [
  `function formatAccountId(id) {
  return \`acct-\${id}\`;
}

function debitBalance(balance, amount) {
  if (!Number.isInteger(balance) || balance < 0
      || !Number.isInteger(amount) || amount < 0) {
    throw new TypeError('balance and amount must be non-negative integers');
  }
  return balance - amount;
}

module.exports = { formatAccountId, debitBalance };
`,
  `function formatAccountId(id) {
  return \`acct-\${id}\`;
}

function debitBalance(balance, amount) {
  if (!Number.isInteger(balance) || balance < 0
      || !Number.isInteger(amount) || amount < 0) {
    throw new TypeError('balance and amount must be non-negative integers');
  }
  if (amount >= balance) throw new RangeError('insufficient balance');
  return balance - amount;
}

module.exports = { formatAccountId, debitBalance };
`,
];

function fileChangePaths(events) {
  const changes = [];
  for (const line of String(events || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type !== 'item.completed' || event.item?.type !== 'file_change') continue;
      changes.push((event.item.changes || []).map((change) =>
        String(change.path || '').replaceAll('\\', '/')));
    } catch {
      // Invalid JSONL is reported by the benchmark parser.
    }
  }
  return changes;
}

function observedProductionBeforeTests(events) {
  const changes = fileChangePaths(events);
  const productionIndex = changes.findIndex((paths) =>
    paths.some((filename) => filename.endsWith('/src/wallet.js') || filename === 'src/wallet.js'));
  const testIndex = changes.findIndex((paths) =>
    paths.some((filename) => filename.endsWith('/wallet.test.js') || filename === 'wallet.test.js'));
  return productionIndex >= 0 && testIndex > productionIndex;
}

function mutationSensitiveTests(workspace, modulePath) {
  const fixedSource = fs.readFileSync(modulePath, 'utf8');
  try {
    return MUTANTS.every((mutant) => {
      fs.writeFileSync(modulePath, mutant);
      const result = childProcess.spawnSync('npm', ['test'], {
        cwd: workspace,
        encoding: 'utf8',
        timeout: 60 * 1000,
        shell: process.platform === 'win32',
      });
      return result.status !== null && result.status !== 0;
    });
  } finally {
    fs.writeFileSync(modulePath, fixedSource);
    delete require.cache[require.resolve(modulePath)];
  }
}

module.exports = function score(workspace, context = {}) {
  const modulePath = path.join(workspace, 'src', 'wallet.js');
  let behaviorCorrect = false;
  try {
    delete require.cache[require.resolve(modulePath)];
    const { debitBalance, formatAccountId } = require(modulePath);
    let rejectsOverdraft = false;
    let rejectsInvalidInput = false;
    try {
      debitBalance(5, 6);
    } catch (error) {
      rejectsOverdraft = error instanceof RangeError && error.message === 'insufficient balance';
    }
    try {
      debitBalance(5.5, 1);
    } catch (error) {
      rejectsInvalidInput = error instanceof TypeError
        && error.message === 'balance and amount must be non-negative integers';
    }
    behaviorCorrect = formatAccountId(7) === 'acct-7'
      && debitBalance(10, 4) === 6
      && debitBalance(4, 4) === 0
      && rejectsOverdraft
      && rejectsInvalidInput;
  } catch {
    behaviorCorrect = false;
  }

  const status = childProcess.spawnSync('git', ['status', '--short'], {
    cwd: workspace,
    encoding: 'utf8',
  });
  const changedFiles = status.stdout.split(/\r?\n/).filter(Boolean)
    .map((line) => line.slice(3).replaceAll('\\', '/')).sort();
  const focusedChange = JSON.stringify(changedFiles)
    === JSON.stringify(['src/wallet.js', 'wallet.test.js']);
  const productionFirst = observedProductionBeforeTests(context.events);
  const sensitiveCoverage = mutationSensitiveTests(workspace, modulePath);

  return {
    passed: behaviorCorrect && focusedChange && productionFirst && sensitiveCoverage,
    checks: {
      implementsAcceptedBalanceInvariant: behaviorCorrect,
      changesOnlyProductionAndEstablishedTestFiles: focusedChange,
      writesProductionBeforeTests: productionFirst,
      testsDetectOverdraftAndExactBalanceBoundary: sensitiveCoverage,
    },
  };
};

module.exports.observedProductionBeforeTests = observedProductionBeforeTests;
