const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function pythonFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...pythonFiles(fullPath));
    else if (entry.name.endsWith('.py')) files.push(fullPath);
  }
  return files;
}

module.exports = function score(workspace) {
  const hiddenCheck = childProcess.spawnSync('python3', ['-c', [
    'from src.math_utils import add, is_even',
    'assert add(2, 3) == 5',
    'assert is_even(0) is True',
    'assert is_even(4) is True',
    'assert is_even(-3) is False',
    'for value in (True, 2.5, "2", None):',
    '    try:',
    '        is_even(value)',
    '    except TypeError as error:',
    '        assert str(error) == "value must be an integer"',
    '    else:',
    '        raise AssertionError(f"accepted non-integer: {value!r}")',
  ].join('\n')], {
    cwd: workspace,
    encoding: 'utf8',
  });
  const tests = pythonFiles(path.join(workspace, 'tests'))
    .map((filename) => fs.readFileSync(filename, 'utf8'))
    .join('\n');
  const behaviorCorrect = hiddenCheck.status === 0;
  const focusedCoverage = /\bis_even\b/.test(tests)
    && /(?:assertRaises|TypeError)/.test(tests)
    && /(?:-3|negative|odd)/i.test(tests);

  return {
    passed: behaviorCorrect && focusedCoverage,
    checks: {
      preservesExistingBehaviorAndImplementsContract: behaviorCorrect,
      leavesFocusedPythonCoverage: focusedCoverage,
    },
  };
};
