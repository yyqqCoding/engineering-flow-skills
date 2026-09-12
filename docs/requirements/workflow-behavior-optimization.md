# Workflow behavior optimization

Status: Implemented

## Goal

Correct the remaining demonstrated workflow failures, one at a time, while preserving the simplified
five-workflow structure, requirement fidelity, explicit authority, and useful verification.

## Acceptance behavior

1. Authorized Review repair observes a focused regression fail before changing production behavior
   when a stable automated seam exists, then retains sensitive passing coverage. Develop preserves
   the complete accepted input domain, exact results, and the incremental approval boundary.
2. Ordinary local tasks keep their checkpoint in the conversation when no project convention or
   durable coordination need requires a record. Necessary questions, substantive records, and
   meaningful verification remain available.
3. Same-task continuation preserves the active phase and approved scope. Pending approval does not
   become implementation authority, and already approved work does not restart approval. Evidence
   distinguishes native resume, fresh-session recovery, and actual host compaction.
4. Verification exposes platform, language, and task-size gaps. Add bounded independent variants
   where the existing harness can test the same invariants; report unsupported environments or
   unexecuted cases without presenting structural validation as model evidence.
5. Retain only instruction changes supported by inspected failures and bounded verification. Remove
   ineffective experimental wording when the comparison supplies no support; do not expand Core or
   add a workflow engine, universal templates, or compulsory artifacts.

## Out of scope

- Commits, publishing, dependency installation, user-global configuration changes, or implicit workflow
  invocation.
- Reopening the completed evaluation repair in `workflow-simplification.md` or rewriting its history.
- Pooling reports across changed fixtures, scorers, plugin fingerprints, CLI versions, providers,
  models, reasoning levels, or other recorded environment inputs.
- A release-level reliability claim from a small development sample.

## Assumptions

- The user's follow-up “逐个修复” approves the previously discussed optimization priorities and this
  sequential implementation. No further approval is pending.
- The existing `.baseline-plugin/` directory is unrelated user work and remains untouched.
- The completed evaluation repair supplies deterministic evidence only. Historical Review ordering,
  unnecessary local records, and proposed numeric-range restrictions still need behavioral evaluation.
- This repository's substantial requirement-record convention applies to this multi-step work; it does
  not justify creating durable records for the small benchmark fixtures.

## Solution boundary

Start with frozen Core and skills at plugin fingerprint `55763f92a17e`. Capture a separate control
snapshot before changing runtime guidance. For each finding, inspect fresh or preserved raw evidence,
change the narrow owning instruction or evaluation defect, verify that increment, and only then move
to the next priority. Maintain the existing invocation metadata, benchmark isolation, and raw reports.

## Test Contract

- Run the relevant deterministic scorer, harness, fixture, and metadata checks before model evaluation.
- Initial discovery: one isolated frozen-control sample each for `review-repair-transition` and
  `develop-contract-fidelity`, with current scorers and the configured provider/model/reasoning.
- For each inspected failure, allow at most one narrowly scoped instruction revision and one candidate
  diagnostic sample before manual review. Stop that experiment on a completed outcome; do not retry
  model failures until they pass. Infrastructure retries require a recorded external cause and a bound.
- Keep follow-on cost, continuity, and generalization evaluations bounded and record their selected
  cases before executing them. Check substantive durable tasks when changing the local-record rule.
- Review actual command/edit order, expected results, approval state, question necessity, and artifacts;
  raw counts and scorer success alone do not establish useful behavior.
- Run full deterministic checks and synchronized plugin metadata validation after the final changes.
  Record exact scenario, plugin, environment, sample count, failures, and evidence limitations.

## Progress and evidence

- Priority 1 — requirement fidelity and regression verification: Current diagnostic passed. Both
  frozen-control runs completed without contamination; the numeric implementation preserves the full
  domain and the Review rollout establishes a relevant failing test before production repair. Keep
  those instructions unchanged. One sample per scenario does not resolve historical intermittency.
- Priority 2 — local task cost: Implemented and verified within the development sample. The entry contract sample unnecessarily created and
  finalized `docs/requirements/is-even.md`; historical raw traces also explain the mistaken inference
  from an absent documentation convention. A narrow Develop record-selection clarification is under
  evaluation. Run one control and candidate each for `handoff-approved-resume` and
  `develop-requirement-lifecycle`; run one candidate `develop-contract-fidelity` against its existing
  control and one candidate `develop-question-batching` as a necessary-question guard. All six runs
  completed without contamination. Candidate local checkpoints create no records; the substantial
  explicitly requested Draft/Accepted/Implemented lifecycle and three necessary clarification questions pass. No completed
  model failure was replaced and no additional wording revision was made. Candidate: `932976d966bc`.
- Priority 3 — approval and continuation: Implemented and verified within the development sample.
  Two native-compaction scenarios retain the original thread and separate compaction evidence from
  business turns. After **193/193** deterministic checks passed, one candidate sample per scenario
  passed: pending approval remains pending, while granted approval resumes implementation without a
  repeated gate. Raw RPC lifecycle, original sessions, unchanged compaction snapshots, and test/edit
  evidence were inspected. No replacements or wording changes were needed. Command-result attribution
  and cross-environment evidence grouping were corrected before these runs; historical reports remain
  unchanged. Exact fingerprints and reports are recorded in `docs/benchmark-log.md`.
- Priority 4 — generalization: Diagnostics completed; one behavioral guard remains failed. The
  two-turn isolated Claude Code/Kimi JavaScript smoke passed approval, implementation, and sensitive
  test checks with write tools available throughout. The single Chinese Python Develop sample preserves
  approval and the full production contract but omits retained large-integer boundary coverage. An
  independent mutation detects that omission. The sample's separate compound-command false negative
  was repaired and verified deterministically; the original report remains unchanged and the overall
  sample remains failed. No model-failure or infrastructure replacement was used. The original Python
  holdout is unchanged, and actual client/model/interpreter identities and frozen inputs are recorded.
- Priority 5 — instruction maintenance: Audited. Keep only the supported Develop record-selection
  change (+153 bytes); Core, the other skills, references, hooks, and invocation metadata match the
  entry snapshot. The substantial guard checks an explicitly requested record; it does not establish
  reliable autonomous classification for every task size. No new prompt wording was added after the
  Python failure.

## Current implementation and verification

Implementation files: `skills/develop/SKILL.md`, `config/benchmarks.json`,
`scripts/run-codex-benchmark.js`, `scripts/lib/benchmark-conversation.js`,
`scripts/lib/benchmark-compaction.js`, `scripts/lib/benchmark-environment.js`,
`scripts/lib/benchmark-fingerprints.js`, `scripts/lib/evidence-manifest.js`,
`scripts/fill-codex-cohort.js`, `scripts/generate-evidence-manifest.js`,
`scripts/summarize-benchmarks.js`, `scripts/verify-release-evidence.js`,
`tests/scorers/workflow-transition-evidence.js`, `tests/scorers/handoff-resume.js`,
`tests/scorers/develop-compacted.js`, `tests/scorers/develop-compacted-pending.js`,
`tests/scorers/develop-compacted-approved.js`, `tests/scorers/develop-python-clear-task.js`,
`tests/scorers/python-test-evidence.js`, `docs/testing-strategy.md`, `docs/benchmark-log.md`.

Test files: `tests/command-evidence.test.js`, `tests/benchmark-environment.test.js`,
`tests/benchmark-summary.test.js`, `tests/evidence-generation.test.js`,
`tests/benchmark-compaction.test.js`, `tests/benchmark-compaction-runner.test.js`,
`tests/benchmark-handoff.test.js`, `tests/develop-python-clear-task.test.js`,
`tests/python-command-evidence.test.js`, `tests/metadata.test.js`.

- `npm test`: **219/219 passed** after the final scorer correction.
- Final Python scorer checks: **26/26 passed**, including the observed command regression.
- `npm run benchmark:coverage -- --json`: 45 scenarios map all 47 behavior IDs; metadata only.
- `claude plugin validate . --strict`: passed. Five-skill manifests and explicit invocation agree.
- `git diff --check`: passed. Final check artifacts and current fingerprints are retained in
  `benchmark-results/workflow-optimization-verification-20260912/`.
- All 4,651 inventoried pre-existing files retain their bytes, including raw reports, six evidence
  manifests, and the unrelated `.baseline-plugin/` directory.
- Full raw reports and separate manual adjudications are listed in `docs/benchmark-log.md`. The Python
  sample retains its original failed score and sampled fingerprint; it was not rerun or pooled with
  the repaired scorer.

Recorded acceptance gap: Python Develop must retain evidence protecting its explicit unrestricted
integer domain. The observed implementation is correct, but its tests would accept an imposed 64-bit
limit. This kept verification pending before the release decision below. Historical stochastic failures and unsampled
environments remain limitations; no overall reliability improvement is established.

## Release acceptance — 2026-09-13

After reviewing the remaining gap and existing results, the user explicitly accepted completion and
directed a stable release without further verification or sampling. This decision authorizes the
1.0.4 release, including its required commit, push, and tag, and supersedes the prior additional-release-
evidence checkpoint for this delivery.

Accepted deviation: The Python sample's missing retained large-integer coverage remains an observed
limitation. Its original failed score, sampled fingerprint, and raw artifacts remain unchanged. The
implementation is accepted with that limitation; no additional instruction change or inference run is
required by this release decision.

Verification: Accepted by the user on existing evidence. The prior 219/219 deterministic result and
bounded diagnostics are retained; no new test, CI, or model run is claimed for release preparation.
