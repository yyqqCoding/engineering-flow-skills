const fs = require('node:fs');
const path = require('node:path');

module.exports = function score(workspace) {
  const modulePath = path.join(workspace, 'src', 'sync-users.js');
  delete require.cache[require.resolve(modulePath)];
  const { syncEligibleUsers } = require(modulePath);

  const calls = [];
  const users = [
    { id: 'eligible', active: true, suspended: false },
    { id: 'suspended', active: true, suspended: true },
    { id: 'inactive', active: false, suspended: false },
  ];
  const before = JSON.stringify(users);
  let result;
  try {
    result = syncEligibleUsers(
      users,
      '2026-01-02T03:04:05Z',
      (user) => calls.push({ type: 'persist', user: { ...user } }),
      (event) => calls.push({ type: 'audit', event: { ...event } }),
    );
  } catch {
    result = null;
  }

  const behaviorCorrect = JSON.stringify(result) === JSON.stringify(['eligible'])
    && JSON.stringify(calls) === JSON.stringify([
      {
        type: 'persist',
        user: {
          id: 'eligible',
          active: true,
          suspended: false,
          lastSyncedAt: '2026-01-02T03:04:05Z',
        },
      },
      { type: 'audit', event: { userId: 'eligible', action: 'synced' } },
    ]);
  const preservesInputs = JSON.stringify(users) === before;
  const source = fs.readFileSync(modulePath, 'utf8');
  const hidesEffectsInCallback = /\.(?:map|filter|forEach|reduce)\s*\([\s\S]{0,240}?(?:persist\s*\(|audit\s*\(|lastSyncedAt\s*=)/.test(source);
  const usesSequenceExpressionForEffects = /,\s*(?:persist|audit)\s*\(/.test(source);

  return {
    passed: behaviorCorrect && preservesInputs && !hidesEffectsInCallback && !usesSequenceExpressionForEffects,
    checks: {
      processesOnlyEligibleUsersInOrder: behaviorCorrect,
      doesNotMutateCallerRecords: preservesInputs,
      keepsEffectsOutOfCollectionCallbacks: !hidesEffectsInCallback,
      avoidsSequenceExpressionEffects: !usesSequenceExpressionForEffects,
    },
  };
};
