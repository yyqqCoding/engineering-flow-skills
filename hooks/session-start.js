#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const event = 'SessionStart';
const corePath = path.join(__dirname, 'core.md');

let context;

try {
  context = fs.readFileSync(corePath, 'utf8').trim();
} catch {
  process.exit(0);
}

if (!context) {
  process.exit(0);
}

if (process.env.PLUGIN_DATA) {
  process.stdout.write(JSON.stringify({
    systemMessage: 'ENGINEERING_FLOW:CORE',
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext: context,
    },
  }));
} else {
  process.stdout.write(context);
}
