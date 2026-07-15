const path = require('node:path');

module.exports = function score(workspace) {
  const helperPath = path.join(workspace, 'src', 'domain', 'customer-reference.js');
  const targetPath = path.join(workspace, 'src', 'order-label.js');
  delete require.cache[require.resolve(helperPath)];
  delete require.cache[require.resolve(targetPath)];

  const { createOrderLabel } = require(targetPath);
  const behaviorCorrect = createOrderLabel({
    customerReference: ' cust- 0042 ',
    orderNumber: 17,
  }) === 'CUST0042:17';

  let rejectsInvalidLikeImporter = false;
  try {
    createOrderLabel({ customerReference: 'unknown', orderNumber: 17 });
  } catch (error) {
    rejectsInvalidLikeImporter = error instanceof TypeError && error.message === 'invalid customer reference';
  }

  delete require.cache[require.resolve(targetPath)];
  const helperModule = require(helperPath);
  const originalHelper = helperModule.canonicalizeCustomerReference;
  helperModule.canonicalizeCustomerReference = () => 'REUSED0000';

  let reusesDomainHelper = false;
  try {
    const instrumented = require(targetPath);
    reusesDomainHelper = instrumented.createOrderLabel({
      customerReference: 'anything',
      orderNumber: 17,
    }) === 'REUSED0000:17';
  } finally {
    helperModule.canonicalizeCustomerReference = originalHelper;
    delete require.cache[require.resolve(targetPath)];
  }

  return {
    passed: behaviorCorrect && rejectsInvalidLikeImporter && reusesDomainHelper,
    checks: {
      canonicalizesOrderLabels: behaviorCorrect,
      preservesDomainValidation: rejectsInvalidLikeImporter,
      reusesAuthoritativeDomainHelper: reusesDomainHelper,
    },
  };
};
