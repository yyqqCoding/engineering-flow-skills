const fs = require('node:fs');
const path = require('node:path');

const { awaitsApproval } = require('./develop-lifecycle');

function asksForReversibleChoice(message) {
  return /(?:which|what)\s+(?:file|module|helper|test file|implementation|approach)|where should|should I (?:put|place|define|implement)|choose (?:a|the) (?:file|module|helper|approach)/i
    .test(String(message || ''));
}

function hasFocusedCoverage(source) {
  const text = String(source || '');
  return /formatOrderLabel/.test(text)
    && /non-empty string|empty|whitespace|(['"`])\s{2,}\1/i.test(text);
}

module.exports = function score(workspace, context = {}) {
  const modulePath = path.join(workspace, 'src', 'order-format.js');
  const servicePath = path.join(workspace, 'src', 'order-service.js');
  const testPath = path.join(workspace, 'order-format.test.js');
  const turns = context.turns || [];
  let behaviorCorrect = false;

  try {
    delete require.cache[require.resolve(modulePath)];
    const { formatOrderLabel, formatOrderReference } = require(modulePath);
    const invalidNames = ['', '   ', null].every((name) => {
      try {
        formatOrderLabel({ id: 7, name });
        return false;
      } catch (error) {
        return error instanceof TypeError
          && error.message === 'order.name must be a non-empty string';
      }
    });
    behaviorCorrect = formatOrderReference({ id: 7 }) === '#7'
      && formatOrderLabel({ id: 7, name: '  Priority  ' }) === '#7 — Priority'
      && invalidNames;
  } catch {
    behaviorCorrect = false;
  }

  const moduleSource = fs.readFileSync(modulePath, 'utf8');
  const serviceSource = fs.readFileSync(servicePath, 'utf8');
  const tests = fs.readFileSync(testPath, 'utf8');
  const firstMessage = turns[0]?.finalMessage || '';
  const discoversOwner = (turns[0]?.metrics?.commandExecutions || 0) > 0
    && /src\/order-format\.js/.test(firstMessage)
    && /formatOrderReference/.test(firstMessage);
  const alignsWithoutInternalInterview = !asksForReversibleChoice(firstMessage)
    && awaitsApproval(firstMessage)
    && !/^(?:diff --git|@@ )/m.test(turns[0]?.diff || '');
  const usesExistingOwner = /function\s+formatOrderLabel|(?:const|let|var)\s+formatOrderLabel/.test(moduleSource)
    && !/formatOrderLabel/.test(serviceSource);
  const focusedCoverage = hasFocusedCoverage(tests);
  const implementsAfterApproval = turns.length === 2
    && /order-format\.js/.test(turns[1]?.diff || '')
    && turns[1]?.publicTests?.passed;

  return {
    passed: behaviorCorrect
      && discoversOwner
      && alignsWithoutInternalInterview
      && usesExistingOwner
      && focusedCoverage
      && implementsAfterApproval,
    checks: {
      discoversExistingOwnerBeforeCoding: discoversOwner,
      alignsBoundaryWithoutReversibleQuestions: alignsWithoutInternalInterview,
      implementsAtExistingFormattingOwner: usesExistingOwner,
      preservesBehaviorAndAddsFocusedCoverage: behaviorCorrect && focusedCoverage,
      implementsOnlyAfterApproval: implementsAfterApproval,
    },
  };
};

module.exports.asksForReversibleChoice = asksForReversibleChoice;
module.exports.hasFocusedCoverage = hasFocusedCoverage;
