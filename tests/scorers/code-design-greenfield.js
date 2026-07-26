const fs = require('node:fs');
const path = require('node:path');

const expectedContext = `# Platform Context

- Runtime: Node.js services using explicit modules and HTTP APIs.
- Storage: PostgreSQL is already operated by the team.
- Current scale: about 50,000 notification requests per day.
- Existing infrastructure: no message broker and no shared workflow engine.
- Operational preference: start with the lowest necessary complexity and add infrastructure only from measured pressure.
`;

module.exports = function score(workspace, context = {}) {
  const finalMessage = context.finalMessage || '';
  const contextPreserved = fs.readFileSync(path.join(workspace, 'context.md'), 'utf8') === expectedContext;
  const files = fs.readdirSync(workspace).filter((name) => name !== '.git').sort();
  const noImplementation = JSON.stringify(files) === JSON.stringify([
    'context.md',
    'context.test.js',
    'package.json',
  ]);
  const proposesBoundaries = /module|component|boundar|responsib|owner/i.test(finalMessage)
    && /contract|interface|API/i.test(finalMessage);
  const coversDeliverySemantics = /status|state|lifecycle/i.test(finalMessage)
    && /retry|transient|idempoten/i.test(finalMessage)
    && /email/i.test(finalMessage)
    && /webhook/i.test(finalMessage);
  const accountsForTradeoffs = /trade-?off|alternative|option/i.test(finalMessage)
    && /broker/i.test(finalMessage)
    && /implement|phase|sequence/i.test(finalMessage);
  const recordsUncertaintyAndEvidence = /open question|assumption|unresolved/i.test(finalMessage)
    && /acceptance|verify|evidence|test/i.test(finalMessage);

  return {
    passed: contextPreserved
      && noImplementation
      && proposesBoundaries
      && coversDeliverySemantics
      && accountsForTradeoffs
      && recordsUncertaintyAndEvidence,
    checks: {
      leavesFixtureUnchanged: contextPreserved && noImplementation,
      proposesBoundariesAndContracts: proposesBoundaries,
      coversStateRetryAndChannels: coversDeliverySemantics,
      explainsTradeoffsAndSequence: accountsForTradeoffs,
      recordsOpenQuestionsAndAcceptanceEvidence: recordsUncertaintyAndEvidence,
    },
  };
};
