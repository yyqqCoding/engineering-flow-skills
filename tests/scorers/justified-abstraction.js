const fs = require('node:fs');
const path = require('node:path');

module.exports = function score(workspace) {
  const modulePath = path.join(workspace, 'src', 'notifications.js');
  delete require.cache[require.resolve(modulePath)];
  const { sendNotification } = require(modulePath);

  const calls = [];
  const transports = {
    webhook: (address, payload) => calls.push({ address, payload }),
  };
  let validWebhook = true;
  try {
    sendNotification({
      channel: 'webhook',
      address: 'https://example.test/events',
      body: 'deployed',
    }, transports);
  } catch {
    validWebhook = false;
  }

  let rejectsInvalidWebhook = false;
  try {
    sendNotification({ channel: 'webhook', address: 'ftp://example.test', body: 'bad' }, transports);
  } catch (error) {
    rejectsInvalidWebhook = error instanceof TypeError;
  }

  const source = fs.readdirSync(path.join(workspace, 'src'))
    .filter((name) => name.endsWith('.js'))
    .map((name) => fs.readFileSync(path.join(workspace, 'src', name), 'utf8'))
    .join('\n');
  const repeatedBranches = (source.match(/\.channel\s*===|channel\s*===|case\s+['"]/g) || []).length;
  const packageJson = JSON.parse(fs.readFileSync(path.join(workspace, 'package.json'), 'utf8'));
  const noDependencies = !packageJson.dependencies && !packageJson.devDependencies;
  const payloadCorrect = JSON.stringify(calls) === JSON.stringify([{
    address: 'https://example.test/events',
    payload: { text: 'deployed' },
  }]);
  const centralizesVariation = repeatedBranches <= 2;

  return {
    passed: validWebhook && rejectsInvalidWebhook && payloadCorrect && centralizesVariation && noDependencies,
    checks: {
      sendsWebhookPayload: validWebhook && payloadCorrect,
      rejectsInvalidWebhookAddress: rejectsInvalidWebhook,
      centralizesRepeatedChannelVariation: centralizesVariation,
      addsNoDependency: noDependencies,
    },
  };
};
