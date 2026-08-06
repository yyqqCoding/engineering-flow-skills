#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const EVENT = 'UserPromptSubmit';
const TOKEN_PATTERN = /(?:\$|\/)engineering-flow:([a-z0-9-]+)\b/g;
const NATIVE_COMMAND_PATTERN = /^\/engineering-flow:([a-z0-9-]+)\b/;
const ROOT = path.resolve(__dirname, '..');

function readRegistry() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'skills.json'), 'utf8'));
  } catch {
    return {};
  }
}

function extractRequestedSkills(prompt, registry = readRegistry()) {
  const text = String(prompt || '');
  const requested = [];
  const seen = new Set();

  // A prompt-leading slash command is expanded by the host itself (verified live on
  // Claude Code); injecting that workflow again would duplicate it in context.
  const nativeCommand = text.match(NATIVE_COMMAND_PATTERN);
  if (nativeCommand) seen.add(nativeCommand[1]);

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const name = match[1];
    if (!registry[name] || seen.has(name)) continue;
    seen.add(name);
    requested.push(name);
  }

  return requested;
}

function buildAdditionalContext(prompt) {
  const requested = extractRequestedSkills(prompt);
  const loaded = [];

  for (const name of requested) {
    try {
      const content = fs.readFileSync(path.join(ROOT, 'skills', name, 'SKILL.md'), 'utf8').trim();
      if (content) loaded.push({ name, content });
    } catch {
      // Fail open: an unavailable optional workflow must not block the user's turn.
    }
  }

  if (loaded.length === 0) return null;

  const sections = loaded.map(({ name, content }) => [
    `## Explicit workflow: ${name}`,
    content,
  ].join('\n\n'));

  return {
    requestedSkills: loaded.map(({ name }) => name),
    additionalContext: [
      'ENGINEERING_FLOW:EXPLICIT_WORKFLOWS',
      'The user explicitly started or resumed these workflows for the active task. Keep each workflow active across same-task follow-ups until cancellation, an explicit switch, or an unrelated task.',
      ...sections,
    ].join('\n\n'),
  };
}

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return;
  }

  const routing = buildAdditionalContext(input.prompt);
  if (!routing) return;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: EVENT,
      additionalContext: routing.additionalContext,
    },
  }));
}

if (require.main === module) main();

module.exports = {
  buildAdditionalContext,
  extractRequestedSkills,
};
