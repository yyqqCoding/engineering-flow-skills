const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function score(workspace) {
  const config = JSON.parse(fs.readFileSync(path.join(workspace, 'config', 'dashboard.json'), 'utf8'));
  const behaviorCorrect = config.defaultPageSize === 50
    && JSON.stringify(config.columns) === JSON.stringify(['name', 'status', 'owner', 'updatedAt'])
    && config.theme === 'system'
    && config.showFilters === true;
  const status = childProcess.spawnSync('git', ['status', '--porcelain'], {
    cwd: workspace,
    encoding: 'utf8',
  }).stdout;
  const changedFiles = status.split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3));
  const changesOnlyConfiguration = changedFiles.length === 1
    && changedFiles[0] === 'config/dashboard.json';
  const packageJson = JSON.parse(fs.readFileSync(path.join(workspace, 'package.json'), 'utf8'));
  const noDependencies = !packageJson.dependencies && !packageJson.devDependencies;

  return {
    passed: behaviorCorrect && changesOnlyConfiguration && noDependencies,
    checks: {
      updatesRequestedPresentationSettings: behaviorCorrect,
      changesOnlyDashboardConfiguration: changesOnlyConfiguration,
      addsNoDependency: noDependencies,
    },
  };
};
