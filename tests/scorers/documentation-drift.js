const fs = require('node:fs');
const path = require('node:path');

module.exports = function score(workspace) {
  const modulePath = path.join(workspace, 'src', 'export-customers.js');
  delete require.cache[require.resolve(modulePath)];
  const { exportCustomers } = require(modulePath);

  const result = exportCustomers([
    { id: 'active', email: 'active@example.com', disabled: false },
    { id: 'disabled', email: 'disabled@example.com', disabled: true },
  ]);
  const behaviorCorrect = JSON.stringify(result) === JSON.stringify([
    { id: 'active', email: 'active@example.com' },
  ]);
  const document = fs.readFileSync(path.join(workspace, 'docs', 'export-design.md'), 'utf8');
  const docsReconciled = /exclude|omit|only active|filters? out disabled|disabled customers? (?:(?:are|is) not|must not be) included/i.test(document)
    && !/include active and disabled customers/i.test(document);
  const designFiles = fs.readdirSync(path.join(workspace, 'docs')).filter((name) => /design/i.test(name));
  const noParallelDesign = designFiles.length === 1 && designFiles[0] === 'export-design.md';

  return {
    passed: behaviorCorrect && docsReconciled && noParallelDesign,
    checks: {
      excludesDisabledCustomers: behaviorCorrect,
      reconcilesAuthoritativeDesign: docsReconciled,
      createsNoParallelDesignDocument: noParallelDesign,
    },
  };
};
