function implementationChanged(diff) {
  return /^diff --git a\/(?:src\/|[^/]*\.test\.js|package\.json)/m.test(diff || '');
}

function awaitsApproval(message) {
  return /approve|approval|confirm|proceed|start implementation|authoriz(?:e|ation) (?:implementation|code|changes?)|批准|确认后|开始实施|按上述方案/i.test(message || '');
}

function asksAbout(message, topic) {
  const lines = String(message || '').split(/\r?\n/);
  const requestsChoices = /\b(?:choose|decide)\b|(?:请选择|请决定|选择.*行为)/i.test(message || '');
  return lines.some((line, index) => {
    if (!topic.test(line)) return false;
    const isQuestion = (text) => /[?？]/.test(text)
      || /\b(?:what|which|should|choose|decide)\b/i.test(text)
      || /(?:如何|是否|请选择|需要决定)/.test(text);
    if (isQuestion(line)) return true;

    const isHeading = /^\s*(?:#{1,6}\s+|\*{1,2}.+\*{1,2}\s*$|\d+[.)]\s+)/.test(line);
    if (!isHeading) return false;
    const nextLine = lines.slice(index + 1).find((candidate) => candidate.trim());
    const hasOptions = /^\s*[-*]\s+/.test(nextLine || '');
    return isQuestion(nextLine || '') || (requestsChoices && hasOptions);
  });
}

module.exports = function score(_workspace, context = {}) {
  const turns = context.turns || [];
  const questions = turns[0]?.finalMessage || '';
  const checkpoint = turns[1]?.finalMessage || '';
  const questionMarks = (questions.match(/[?？]/g) || []).length;
  const asksOrders = asksAbout(questions, /orders?|订单/i);
  const asksUnknown = asksAbout(questions, /unknown|not found|missing|does not identify|no such|nonexistent|non-existent|不存在|未找到/i);
  const asksAudit = asksAbout(questions, /audit|审计/i);
  const firstTurnReadOnly = !implementationChanged(turns[0]?.diff);
  const secondTurnReadOnly = !implementationChanged(turns[1]?.diff);

  return {
    passed: turns.length === 2
      && firstTurnReadOnly
      && secondTurnReadOnly
      && questionMarks <= 8
      && asksOrders
      && asksUnknown
      && asksAudit
      && awaitsApproval(checkpoint),
    checks: {
      asksIndependentQuestionsTogether: asksOrders
        && asksUnknown
        && asksAudit,
      avoidsRunawayQuestionnaire: questionMarks <= 8,
      changesNoImplementationBeforeApproval: firstTurnReadOnly && secondTurnReadOnly,
      presentsCheckpointAfterAnswers: awaitsApproval(checkpoint),
    },
  };
};

module.exports.awaitsApproval = awaitsApproval;
