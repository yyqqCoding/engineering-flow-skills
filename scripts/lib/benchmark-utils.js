const path = require('node:path');

function redactSecrets(value) {
  return String(value || '')
    .replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
    .replace(/(api[_-]?key\s*[=:]\s*)["']?[^\s"']+/gi, '$1[REDACTED_API_KEY]');
}

function withoutConfiguredPlugins(toml) {
  const output = [];
  let skipSection = false;

  for (const line of toml.split(/\r?\n/)) {
    const section = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (section) {
      skipSection = section[1] === 'plugins' || section[1].startsWith('plugins.');
    }
    if (!skipSection) output.push(line);
  }

  return output.join('\n');
}

function visitStrings(value, visitor) {
  if (typeof value === 'string') {
    visitor(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) visitStrings(entry, visitor);
    return;
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) visitStrings(entry, visitor);
  }
}

function looksLikeQuestion(message) {
  const text = String(message || '');
  if (/[?？]/.test(text)) return true;
  if (/\b(?:please\s+)?(?:clarify|confirm)\b/i.test(text)) return true;
  if (/(?:是否|哪一|哪种|如何|请确认|需要.{0,8}确认)/.test(text)) return true;

  return text.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    return /^(?:what|which|when|where|who|why|how|should|could|would|do|does|is|are|can|may)\b.*[:：]$/i.test(trimmed);
  });
}

function parseJsonl(events) {
  const eventTypes = {};
  const itemTypes = {};
  const invokedSkills = new Set();
  const usage = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
  };
  let parsedEvents = 0;
  let invalidLines = 0;
  let agentMessages = 0;
  let questionMessages = 0;
  let commandExecutions = 0;
  let fileChanges = 0;
  let todoLists = 0;
  let otherToolCalls = 0;
  let turns = 0;

  for (const line of String(events || '').split(/\r?\n/)) {
    if (!line.trim()) continue;

    let event;
    try {
      event = JSON.parse(line);
    } catch {
      invalidLines += 1;
      continue;
    }

    parsedEvents += 1;
    eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;

    visitStrings(event, (text) => {
      const normalized = text.replaceAll('\\', '/');
      for (const match of normalized.matchAll(/(?:^|\/)skills\/([^/\s"']+)\/SKILL\.md/g)) {
        invokedSkills.add(match[1]);
      }
    });

    if (event.type === 'item.completed' && event.item) {
      const itemType = event.item.type || 'unknown';
      itemTypes[itemType] = (itemTypes[itemType] || 0) + 1;

      if (itemType === 'agent_message') {
        agentMessages += 1;
        if (looksLikeQuestion(event.item.text)) questionMessages += 1;
      } else if (itemType === 'command_execution') {
        commandExecutions += 1;
      } else if (itemType === 'file_change') {
        fileChanges += 1;
      } else if (itemType === 'todo_list') {
        todoLists += 1;
      } else if (!['error', 'reasoning'].includes(itemType)) {
        otherToolCalls += 1;
      }
    }

    if (event.type === 'turn.completed') {
      turns += 1;
      usage.inputTokens += event.usage?.input_tokens || 0;
      usage.cachedInputTokens += event.usage?.cached_input_tokens || 0;
      usage.outputTokens += event.usage?.output_tokens || 0;
      usage.reasoningOutputTokens += event.usage?.reasoning_output_tokens || 0;
    }
  }

  return {
    parsedEvents,
    invalidLines,
    eventTypes,
    itemTypes,
    turns,
    agentMessages,
    questionMessages,
    todoLists,
    commandExecutions,
    fileChanges,
    otherToolCalls,
    toolCalls: commandExecutions + fileChanges + otherToolCalls,
    invokedSkills: [...invokedSkills].sort(),
    usage,
  };
}

function assessInvocation(invokedSkills, policy = {}) {
  const invoked = new Set(invokedSkills || []);
  const expected = new Set(policy.expected || []);
  const allowed = new Set(policy.allowed || policy.expected || []);
  const truePositives = [...invoked].filter((name) => allowed.has(name)).sort();
  const recalledExpected = [...invoked].filter((name) => expected.has(name)).sort();
  const falsePositives = [...invoked].filter((name) => !allowed.has(name)).sort();
  const falseNegatives = [...expected].filter((name) => !invoked.has(name)).sort();
  const collisions = (policy.forbiddenTogether || [])
    .filter((combination) => combination.every((name) => invoked.has(name)))
    .map((combination) => [...combination].sort());
  const precision = invoked.size === 0 ? null : truePositives.length / invoked.size;
  const recall = expected.size === 0 ? null : recalledExpected.length / expected.size;

  return {
    expected: [...expected].sort(),
    allowed: [...allowed].sort(),
    invoked: [...invoked].sort(),
    truePositives,
    recalledExpected,
    falsePositives,
    falseNegatives,
    collisions,
    precision,
    recall,
    passed: falsePositives.length === 0 && falseNegatives.length === 0 && collisions.length === 0,
  };
}

function detectContamination(output) {
  const normalized = String(output || '').replaceAll('\\', '/');
  const globalSkillPath = /(?:\/home\/[^/\s]+|\/root|[A-Za-z]:\/Users\/[^/\s]+)\/\.codex\/(?:skills|superpowers)(?:\/|\s|$)/i;
  const globalSuperpowersPlugin = /(?:\/home\/[^/\s]+|\/root|[A-Za-z]:\/Users\/[^/\s]+)\/\.codex\/plugins\/cache\/[^\s"']*superpowers/i;
  return globalSkillPath.test(normalized)
    || globalSuperpowersPlugin.test(normalized)
    || /superpowers:/i.test(normalized);
}

function relativeStatusPath(statusLine) {
  const rawPath = statusLine.slice(3).trim();
  return rawPath.includes(' -> ') ? rawPath.split(' -> ').at(-1) : rawPath;
}

function statusPaths(status) {
  return String(status || '')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(relativeStatusPath)
    .map((entry) => entry.split(path.sep).join('/'));
}

module.exports = {
  assessInvocation,
  detectContamination,
  looksLikeQuestion,
  parseJsonl,
  redactSecrets,
  statusPaths,
  withoutConfiguredPlugins,
};
