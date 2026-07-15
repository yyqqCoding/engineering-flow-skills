const fs = require('node:fs');
const path = require('node:path');

module.exports = function score(workspace) {
  const modulePath = path.join(workspace, 'src', 'discounts.js');
  delete require.cache[require.resolve(modulePath)];
  const {
    calculateLoyaltyDiscount,
    calculateShippingDiscount,
  } = require(modulePath);

  const source = fs.readFileSync(modulePath, 'utf8');
  const srcFiles = fs.readdirSync(path.join(workspace, 'src')).filter((name) => name.endsWith('.js'));
  const parameterizedPolicyHelper = /(?:function\s+\w+|const\s+\w+\s*=)\s*\([^)]*(?:rate|percentage)[^)]*(?:cap|max)|(?:function\s+\w+|const\s+\w+\s*=)\s*\([^)]*(?:cap|max)[^)]*(?:rate|percentage)/i.test(source);

  const shippingCorrect = calculateShippingDiscount(99) === 0
    && calculateShippingDiscount(200) === 16
    && calculateShippingDiscount(1000) === 40;
  const loyaltyUnchanged = calculateLoyaltyDiscount(99) === 0
    && calculateLoyaltyDiscount(200) === 10
    && calculateLoyaltyDiscount(1000) === 25;
  const policiesRemainIndependent = srcFiles.length === 1 && !parameterizedPolicyHelper;

  return {
    passed: shippingCorrect && loyaltyUnchanged && policiesRemainIndependent,
    checks: {
      shippingPolicyChanged: shippingCorrect,
      loyaltyPolicyUnchanged: loyaltyUnchanged,
      avoidsCouplingIndependentPolicies: policiesRemainIndependent,
    },
  };
};
