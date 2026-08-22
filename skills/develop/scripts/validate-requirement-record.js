#!/usr/bin/env node

const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const MODES = new Set(['draft', 'ready']);

function completionEvidenceSection(markdown) {
  const text = String(markdown || '');
  const heading = /^##\s+Completion evidence\s*$/im.exec(text);
  if (!heading) return '';

  const remainder = text.slice(heading.index + heading[0].length);
  const nextHeading = /^##\s/m.exec(remainder);
  return nextHeading ? remainder.slice(0, nextHeading.index) : remainder;
}

function withoutCompletionEvidence(markdown) {
  const text = String(markdown || '');
  const heading = /^##\s+Completion evidence\s*$/im.exec(text);
  if (!heading) return text;

  const remainder = text.slice(heading.index + heading[0].length);
  const nextHeading = /^##\s/m.exec(remainder);
  const end = nextHeading
    ? heading.index + heading[0].length + nextHeading.index
    : text.length;
  return `${text.slice(0, heading.index)}${text.slice(end)}`;
}

function fieldValue(section, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(section || '').match(
    new RegExp(`^(?:[-*]\\s*)?${escaped}:\\s*(.+)$`, 'im'),
  )?.[1]?.trim() || '';
}

function hasStaleProspectiveLanguage(markdown) {
  return /\bpending\b|\bplanned\b|\bwill (?:add|create|implement|verify|run|write|update)\b|\bwill be (?:added|created|implemented|verified|run|written|updated)\b|\bto be (?:added|created|implemented|verified|run|written|updated)\b|\b(?:before|after) (?:later )?(?:implementation )?approval\b|待添加|待创建|待实现|待验证/i
    .test(String(markdown || ''));
}

function requirementStatus(markdown) {
  return String(markdown || '').match(/^Status:\s*([^\r\n]+)$/im)?.[1]?.trim() || '';
}

function hasReadyValidatorCommand(value, recordPath) {
  const command = String(value || '').match(/^`(.+)`$/)?.[1] || '';
  const normalizedRecord = String(recordPath || '').replaceAll('\\', '/');
  return /(?:^|[\\/])validate-requirement-record\.js(?:"|'|\s|$)/.test(command)
    && /--mode(?:=|\s+)ready\b/.test(command)
    && /--finalize(?:\s|$)/.test(command)
    && command.includes(`--record ${normalizedRecord}`);
}

function hasStableReadyValidatorEvidence(value) {
  const text = String(value || '');
  return /validate-requirement-record\.js\s+--mode\s+ready/.test(text)
    && /pass(?:ed)?|通过/i.test(text)
    && !/[\\/]validate-requirement-record\.js/.test(text);
}

function parseArguments(argv) {
  const options = { ignores: [], finalize: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--record') {
      options.record = argv[index + 1];
      index += 1;
    } else if (value === '--mode') {
      options.mode = argv[index + 1];
      index += 1;
    } else if (value === '--ignore') {
      options.ignores.push(argv[index + 1]);
      index += 1;
    } else if (value === '--finalize') {
      options.finalize = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${value}`);
    }
  }

  if (!options.record) throw new Error('--record requires a repository-relative path');
  if (!MODES.has(options.mode)) throw new Error('--mode must be draft or ready');
  if (options.finalize && options.mode !== 'ready') {
    throw new Error('--finalize requires --mode ready');
  }
  if (options.ignores.some((value) => !value)) throw new Error('--ignore requires a path');
  return options;
}

const STABLE_READY_EVIDENCE = 'Ready validator: `validate-requirement-record.js --mode ready` — passed';

function finalizeRecord(markdown) {
  const text = String(markdown || '');
  if (requirementStatus(text).toLowerCase() !== 'accepted') return null;
  if (hasStaleProspectiveLanguage(text)) return null;

  const section = completionEvidenceSection(text);
  if (!section || !fieldValue(section, 'Implementation files')
      || !fieldValue(section, 'Test files') || !fieldValue(section, 'Verification')
      || !fieldValue(section, 'Deviations')) return null;

  const withImplementedStatus = text.replace(/^Status:\s*Accepted\s*$/im, 'Status: Implemented');
  return withImplementedStatus.replace(
    /^(\s*(?:[-*]\s*)?)Ready validator:\s*.*$/im,
    `$1${STABLE_READY_EVIDENCE}`,
  );
}

function writeAtomic(filename, contents) {
  const directory = path.dirname(filename);
  const basename = path.basename(filename);
  const temporaryDirectory = fs.mkdtempSync(path.join(directory, `.${basename}.finalize-`));
  const temporaryFile = path.join(temporaryDirectory, basename);
  try {
    fs.writeFileSync(temporaryFile, contents, { encoding: 'utf8', mode: fs.statSync(filename).mode });
    fs.renameSync(temporaryFile, filename);
  } catch (error) {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

function runGit(cwd, args) {
  const result = childProcess.spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }
  return result.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
}

function changedPaths(cwd) {
  return [...new Set([
    ...runGit(cwd, ['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD', '--', '.']),
    ...runGit(cwd, ['ls-files', '--others', '--exclude-standard']),
  ].map((value) => value.replaceAll('\\', '/')))];
}

function resolveRecordPath(repositoryRoot, recordPath) {
  const absoluteRecord = path.resolve(repositoryRoot, recordPath);
  const relativeRecord = path.relative(repositoryRoot, absoluteRecord).replaceAll('\\', '/');
  if (relativeRecord.startsWith('../') || path.isAbsolute(relativeRecord)) {
    throw new Error('--record must stay inside the current repository');
  }

  const realRepositoryRoot = fs.realpathSync(repositoryRoot);
  const realParent = fs.realpathSync(path.dirname(absoluteRecord));
  const relativeParent = path.relative(realRepositoryRoot, realParent);
  if (relativeParent.startsWith('../') || path.isAbsolute(relativeParent)) {
    throw new Error('--record parent must stay inside the current repository');
  }
  if (fs.lstatSync(absoluteRecord).isSymbolicLink()) {
    throw new Error('--record must not be a symbolic link');
  }
  return { absoluteRecord, relativeRecord };
}

function isTestPath(filename) {
  return /(?:^|\/)(?:test|tests|__tests__)(?:\/|$)|(?:^|\/)(?:test_.+|.+(?:\.test|\.spec|_test))\.[^/]+$/i
    .test(filename);
}

function validateRecord({ markdown, mode, changed = [], recordPath, ignores = [] }) {
  const errors = [];
  const section = completionEvidenceSection(markdown);
  const implementationValue = fieldValue(section, 'Implementation files');
  const testValue = fieldValue(section, 'Test files');
  const verificationValue = fieldValue(section, 'Verification');
  const deviationsValue = fieldValue(section, 'Deviations');
  const readyValidatorValue = fieldValue(section, 'Ready validator');
  const status = requirementStatus(markdown);

  if (!section) errors.push('missing ## Completion evidence section');

  if (mode === 'draft') {
    if (status.toLowerCase() !== 'draft') errors.push('draft validation requires Status: Draft');
    for (const [label, value] of [
      ['Implementation files', implementationValue],
      ['Test files', testValue],
      ['Verification', verificationValue],
    ]) {
      if (value.toLowerCase() !== 'pending') errors.push(`${label} must be Pending in Draft`);
    }
    if (!deviationsValue || deviationsValue.toLowerCase() === 'pending') {
      errors.push('Deviations must state the currently known value');
    }
    if (!hasReadyValidatorCommand(readyValidatorValue, recordPath)) {
      errors.push('Ready validator must persist the resolved ready command for this record');
    }
    if (hasStaleProspectiveLanguage(withoutCompletionEvidence(markdown))) {
      errors.push('Draft checkpoint fields must use timeless wording outside Completion evidence');
    }
    return errors;
  }

  if (status.toLowerCase() !== 'accepted') {
    errors.push('ready validation requires Status: Accepted before the final status write');
  }
  if (hasStaleProspectiveLanguage(markdown)) {
    errors.push('record still contains Pending or stale prospective language');
  }
  if (!hasReadyValidatorCommand(readyValidatorValue, recordPath)) {
    errors.push('Ready validator must still contain the persisted ready command');
  }

  const ignored = new Set(ignores.map((value) => value.replaceAll('\\', '/')));
  const normalizedRecord = recordPath.replaceAll('\\', '/');
  const scopedChanges = changed.filter((value) => value !== normalizedRecord && !ignored.has(value));
  const testPaths = scopedChanges.filter(isTestPath);
  const implementationPaths = scopedChanges.filter((value) => !isTestPath(value));

  if (implementationPaths.length === 0) errors.push('no changed implementation path found');
  if (testPaths.length === 0) errors.push('no changed test path found');
  for (const filename of implementationPaths) {
    if (!implementationValue.includes(filename)) {
      errors.push(`Implementation files omits changed path: ${filename}`);
    }
  }
  for (const filename of testPaths) {
    if (!testValue.includes(filename)) errors.push(`Test files omits changed path: ${filename}`);
  }
  if (!/`[^`]+`/.test(verificationValue) || !/pass(?:ed)?|0 failures|通过/i.test(verificationValue)) {
    errors.push('Verification must name a command in backticks and its passing result');
  }
  if (!deviationsValue) errors.push('Deviations must state the confirmed result');
  return errors;
}

function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    const repositoryRoot = runGit(process.cwd(), ['rev-parse', '--show-toplevel'])[0];
    const { absoluteRecord, relativeRecord } = resolveRecordPath(repositoryRoot, options.record);
    const markdown = fs.readFileSync(absoluteRecord, 'utf8');
    const errors = validateRecord({
      markdown,
      mode: options.mode,
      changed: options.mode === 'ready' ? changedPaths(repositoryRoot) : [],
      recordPath: relativeRecord,
      ignores: options.ignores,
    });
    if (errors.length > 0) {
      process.stderr.write(`Requirement record validation failed:\n- ${errors.join('\n- ')}\n`);
      process.exitCode = 1;
      return;
    }
    if (options.finalize) {
      const finalized = finalizeRecord(markdown);
      if (!finalized) {
        throw new Error('finalization requires an Accepted record with complete ready evidence');
      }
      writeAtomic(absoluteRecord, finalized);
      process.stdout.write(`Requirement record finalized as Implemented: ${relativeRecord}\n`);
      return;
    }
    process.stdout.write(
      options.mode === 'ready'
        ? `Requirement record is ready for the final Implemented write: ${relativeRecord}\n`
        : `Draft requirement record is valid: ${relativeRecord}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = {
  changedPaths,
  completionEvidenceSection,
  finalizeRecord,
  fieldValue,
  hasReadyValidatorCommand,
  hasStableReadyValidatorEvidence,
  hasStaleProspectiveLanguage,
  isTestPath,
  parseArguments,
  requirementStatus,
  resolveRecordPath,
  validateRecord,
  withoutCompletionEvidence,
  writeAtomic,
};
