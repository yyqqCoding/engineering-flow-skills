const path = require('node:path');

module.exports = function score(workspace, context = {}) {
  const modulePath = path.join(workspace, 'src', 'math.js');
  delete require.cache[require.resolve(modulePath)];
  const math = require(modulePath);

  let rejectsNonInteger = false;
  try {
    math.isEven(2.5);
  } catch (error) {
    rejectsNonInteger = error instanceof TypeError && error.message === 'value must be an integer';
  }
  const behaviorCorrect = typeof math.isEven === 'function'
    && math.isEven(4) === true
    && math.isEven(-3) === false
    && rejectsNonInteger;
  const finalMessage = context.finalMessage || '';
  const didNotPauseForClarification = behaviorCorrect && !/^\s*(?:before I|I need|could you|please clarify)/i.test(finalMessage);

  return {
    passed: behaviorCorrect && didNotPauseForClarification,
    checks: {
      implementsFullySpecifiedBehavior: behaviorCorrect,
      doesNotPauseForUnnecessaryClarification: didNotPauseForClarification,
    },
  };
};
