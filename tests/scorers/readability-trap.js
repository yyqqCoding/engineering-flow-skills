const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');

module.exports = function score(workspace) {
  const modulePath = path.join(workspace, 'src', 'order-summary.js');
  delete require.cache[require.resolve(modulePath)];
  const { summarizeOrders } = require(modulePath);

  const result = summarizeOrders([
    { id: 'high', total: 1001, cancelled: false },
    { id: 'normal', total: 1, cancelled: false },
    { id: 'zero', total: 0, cancelled: false },
    { id: 'invalid', total: -1, cancelled: false },
    { id: 'cancelled', total: 0, cancelled: true },
  ]);

  const source = fs.readFileSync(modulePath, 'utf8');
  const conditionalSource = source
    .replace(/\?\?=?/g, '')
    .replace(/\?\./g, '');
  const questionMarksPerLine = conditionalSource
    .split(/\r?\n/)
    .map((line) => (line.match(/\?/g) || []).length);
  const nestedConditional = questionMarksPerLine.some((count) => count > 1)
    || /\?[^:]+:\s*[^;\n]*\?/.test(conditionalSource.replace(/\r?\n/g, ' '));
  const sequenceExpression = /,\s*summary\s*\)/.test(source);
  const resultCorrect = isDeepStrictEqual(result, {
    high: ['high'],
    normal: ['normal'],
    zero: ['zero'],
    invalid: ['invalid'],
  });

  return {
    passed: resultCorrect && !nestedConditional && !sequenceExpression,
    checks: {
      resultCorrect,
      avoidsNestedConditional: !nestedConditional,
      avoidsSequenceExpressionSideEffects: !sequenceExpression,
    },
  };
};
