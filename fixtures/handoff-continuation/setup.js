const fs = require('node:fs');
const path = require('node:path');

const featureSource = `const SEVERITY_RANK = {
  low: 0,
  medium: 1,
  high: 2,
};

function buildNotificationDigest(events, options = {}) {
  const minimumSeverity = options.minimumSeverity || 'low';
  const minimumRank = SEVERITY_RANK[minimumSeverity];

  return events
    .filter((event) => SEVERITY_RANK[event.severity] >= minimumRank)
    .map((event) => ({
      title: event.title,
      severity: event.severity,
    }));
}

module.exports = {
  buildNotificationDigest,
};
`;

const featureTests = `const assert = require('node:assert/strict');
const test = require('node:test');

const { buildNotificationDigest } = require('./src/notification-digest');

test('builds a digest in event order', () => {
  const events = [
    { title: 'Queue delayed', severity: 'medium' },
    { title: 'Queue recovered', severity: 'low' },
  ];

  assert.deepEqual(buildNotificationDigest(events), events);
});

test('filters by minimum severity without reordering events', () => {
  const events = [
    { title: 'Database unavailable', severity: 'high' },
    { title: 'Retry delayed', severity: 'medium' },
    { title: 'Traffic recovered', severity: 'high' },
    { title: 'Cache warmed', severity: 'low' },
  ];

  assert.deepEqual(
    buildNotificationDigest(events, { minimumSeverity: 'high' }),
    [
      { title: 'Database unavailable', severity: 'high' },
      { title: 'Traffic recovered', severity: 'high' },
    ],
  );
});
`;

const unrelatedNotes = `# Team Notes

Release window: Tuesday.

Unrelated draft: rename the operator dashboard heading. Preserve this edit.
`;

const expectedFiles = {
  'src/notification-digest.js': featureSource,
  'notification-digest.test.js': featureTests,
  'notes/team-notes.md': unrelatedNotes,
};

function setup(workspace) {
  for (const [relativePath, content] of Object.entries(expectedFiles)) {
    fs.writeFileSync(path.join(workspace, relativePath), content);
  }
}

setup.expectedFiles = expectedFiles;

module.exports = setup;
