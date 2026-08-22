const fs = require('node:fs');
const path = require('node:path');

function explainsBenefit(message) {
  const text = String(message || '');
  return /iterator|iterable|generator|Symbol\.iterator/i.test(text)
    && /lazy|on demand|without (?:an? )?(?:array|allocation|materializing)|memory/i.test(text);
}

module.exports = function score(workspace, context = {}) {
  const modulePath = path.join(workspace, 'src', 'integer-range.js');
  const testPath = path.join(workspace, 'integer-range.test.js');
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { createIntegerRange, isAscending } = require(modulePath);
    const range = createIntegerRange(2, 5);
    const first = [...range];
    const second = [...range];
    let rejectsInvalidBounds = false;
    let rejectsDescendingBounds = false;
    try {
      createIntegerRange(1.5, 3);
    } catch (error) {
      rejectsInvalidBounds = error instanceof TypeError
        && error.message === 'bounds must be integers';
    }
    try {
      createIntegerRange(3, 2);
    } catch (error) {
      rejectsDescendingBounds = error instanceof RangeError
        && error.message === 'start must not exceed end';
    }
    behaviorCorrect = isAscending(1, 3) === true
      && JSON.stringify(first) === '[2,3,4,5]'
      && JSON.stringify(second) === '[2,3,4,5]'
      && rejectsInvalidBounds
      && rejectsDescendingBounds;
  } catch {
    behaviorCorrect = false;
  }

  const source = fs.readFileSync(modulePath, 'utf8');
  const tests = fs.readFileSync(testPath, 'utf8');
  const usesLocalizedIterator = /Symbol\.iterator|function\s*\*/.test(source)
    && !/Array\.from|new\s+Array|\.fill\s*\(|\.push\s*\(|new\s+Set\s*\(/.test(source);
  const testsNovelBoundary = /createIntegerRange/.test(tests)
    && /reus|twice|second|Symbol\.iterator|\.next\s*\(/i.test(tests);
  const benefitJustified = explainsBenefit(context.finalMessage);
  const packageJson = JSON.parse(fs.readFileSync(path.join(workspace, 'package.json'), 'utf8'));
  const noDependencies = !packageJson.dependencies && !packageJson.devDependencies;

  return {
    passed: behaviorCorrect
      && usesLocalizedIterator
      && testsNovelBoundary
      && benefitJustified
      && noDependencies,
    checks: {
      returnsReusableIntegerIterable: behaviorCorrect,
      localizesLazyIteratorWithoutMaterialization: usesLocalizedIterator,
      testsTheUncommonIteratorBoundary: testsNovelBoundary,
      statesConcreteBenefit: benefitJustified,
      addsNoDependency: noDependencies,
    },
  };
};

module.exports.explainsBenefit = explainsBenefit;
