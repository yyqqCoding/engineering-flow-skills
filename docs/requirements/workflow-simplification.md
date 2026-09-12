# Workflow simplification

Status: Implemented

## Goal

Reduce repeated instructions and unnecessary transitions across the five explicitly invoked workflows while retaining requirement alignment, authorization boundaries, task continuity, and reliable verification.

## Acceptance behavior

- All five workflows remain explicitly invoked on Codex and Claude. Core stays compact; ordinary clear tasks retain autonomy.
- Materiality and authoritative evidence determine whether a question is needed; dependencies determine its timing. Develop keeps one post-checkpoint implementation approval, direct continuation for omissions, and incremental alignment for added scope.
- Verification intent originates in accepted behavior and independently grounded expected results. Functional behavior, interactions, and established boundaries are considered when relevant without a mandatory three-section template or one-test-per-sentence mapping.
- Implementation and verification can proceed in observable behavior slices, with timing chosen by risk. Stable reproducible regressions retain observed failure before production repair. Critical behavior retains sensitive automated coverage when a stable seam exists; explicit no-test requests retain reported evidence gaps.
- Existing design decisions and facts flow into Develop without repeating resolved alignment. The Develop approval gate remains intact. Engineering techniques within a task do not implicitly load another workflow or expand authority.
- Review remains read-only until a later explicit repair request. Authorized selected findings can be repaired without a mandatory new workflow invocation; unresolved product behavior and existing task gates still apply.
- Handoff retains decisions and reasons, verification, unrelated work, and explicit empty states. Its continuation state includes known source phase and approval boundaries without inventing authority.
- User guides and workflow illustrations show independent task entry points and match the actual execution and verification policies.
- Deterministic checks validate metadata, invocation, fixtures, scorers, and relevant harness behavior. New behavioral evidence is recorded with exact inputs and environment, separately from frozen release evidence.

## Out of scope

- Publishing or versioning a release, commits, dependency installation, or user-global configuration changes.
- Reopening implicit skill invocation, redesigning token parsing, adding a workflow/state engine, or replacing the existing requirement finalizer.
- Treating development smokes as a release-level stochastic improvement claim.

## Assumptions

- The user's request to begin optimization authorizes the discussed implementation. The existing `.baseline-plugin/` directory is unrelated work and remains untouched.
- Existing project documentation conventions remain authoritative. This record follows the repository's requirement-document convention.
- The frozen pre-change plugin is `8a4e28e1ca0c`; old cohort results remain historical when fixtures, scorers, or candidate instructions change.

## Solution boundary

- Runtime guidance is owned by Core, the five SKILL.md files, their directly coupled metadata, and the existing Develop record reference.
- Product and behavior specifications define the revised policy; guides and SVG diagrams explain the same policy.
- Focused fixtures/scorers and minimal existing harness extensions exercise requirement-grounded testing and workflow transitions. No general orchestration framework is introduced.

## Test Contract

- Preserve explicit invocation, read-only review, approval after a checkpoint, incremental scope handling, and unrelated changes through deterministic checks and focused behavior scenarios.
- Verify independent business expectations and sensitive automated coverage without scoring feature-test edit order as product correctness. Retain the regression red-before-fix check.
- Exercise design-to-development approval, explicit repair after review, and fresh-context handoff consumption where feasible. Check actual edits and outcomes, not only output headings.
- Run metadata and full deterministic checks after implementation; retain separate named reports for selected isolated model runs and manually review failures.

## Completion evidence

Implementation files:

- Runtime guidance: `hooks/core.md`, `skills/develop/SKILL.md`, `skills/diagnose/SKILL.md`, `skills/code-design/SKILL.md`, `skills/review/SKILL.md`, `skills/handoff/SKILL.md`.
- Coupled metadata and reference: `skills/develop/agents/openai.yaml`, `skills/handoff/agents/openai.yaml`, `skills/develop/references/requirement-records.md`.
- Authoritative policy and verification documentation: `docs/product-design.md`, `docs/behavior-spec.md`, `docs/trigger-model.md`, `docs/testing-strategy.md`, `docs/benchmark-log.md`.
- User documentation: `README.md`, `README.en.md`, `docs/user-guide.md`, `docs/user-guide.zh-CN.md`.
- Workflow illustrations: `assets/readme/workflow-map-light.svg`, `assets/readme/workflow-map-dark.svg`, `assets/readme/workflow-map-mobile-light.svg`, `assets/readme/workflow-map-mobile-dark.svg`.
- Evaluation runtime: `config/benchmarks.json`, `scripts/run-codex-benchmark.js`, `scripts/lib/benchmark-conversation.js`, `scripts/lib/benchmark-fingerprints.js`.

Test files: `tests/hooks.test.js`, `tests/fixtures.test.js`, `tests/benchmark-handoff.test.js`, `tests/workflow-transitions.test.js`, `tests/review-findings.test.js`, `tests/contract-fidelity.test.js`, `tests/scorers/design-develop.js`, `tests/scorers/review-repair.js`, `tests/scorers/handoff-pending.js`, `tests/scorers/handoff-approved.js`, `tests/scorers/handoff-resume.js`, `tests/scorers/workflow-transition-evidence.js`, `tests/scorers/develop-contract-fidelity.js`.

Historical verification for the preceding simplification revision, before the evaluation repair increment:

- `npm test`: 101/101 deterministic checks passed after the final skill and scorer changes, including manifest completeness, synchronized explicit invocation, fresh-session handoff transfer, and scorer sensitivity.
- `npm run benchmark:coverage -- --json`: 41 configured scenarios map all 47 behavior IDs. This is a corpus mapping, not a claim that every model behavior passed.
- `claude plugin validate . --strict`: passed. The four updated workflow SVGs were rendered and visually checked.
- `git diff --check`: passed.
- Isolated Codex development smokes and manual trajectory findings are recorded in [the benchmark log](../benchmark-log.md). Current plugin fingerprint: `55763f92a17e`; frozen v1.0.3 control: `8a4e28e1ca0c`. Reports retain their actual benchmark, plugin, provider, model, and reasoning inputs; changed cohorts are not pooled.

Deviations: No change to the approved implementation scope. Source, documentation, and harness changes are delivered; model behavior is not uniformly passing. Remaining observations include Review repair without prior failing regression evidence, unnecessary requirement records for local tasks, and an unsupported numeric-range restriction in one added-scope checkpoint. The earlier manual review also identified two scorer classification limits; the increment below corrects evaluation defects without changing the original model reports. Historical findings and original failures remain in the benchmark log. This revision has no release-level reliability claim or fresh isolated Claude inference evidence; frozen release manifests and reports are unchanged.

## Evaluation repair increment

The user's subsequent request to start repair authorizes a bounded correction of the recorded scoring
errors and acceptance blind spots. The preceding implementation and evidence remain historical facts.

Acceptance behavior:

- Review accepts the observed equivalent description of managers bypassing organization restrictions,
  while still requiring a concrete permission failure and source location. Correct policy descriptions,
  negated findings, and missing locations do not pass. The observed-failure-before-repair gate remains.
- Handoff scores the local checkpoint, handoff turn, and fresh consumer against their own entry states.
  A record unnecessarily created during the local checkpoint fails that phase alone when subsequent
  turns preserve it and approval remains pending. Changes to a carried requirement record still fail
  preservation, including same-path untracked content changes.
- An independent artifact check for the local fixture distinguishes newly created files from preserved
  pre-existing records. This fixture has no convention requiring a durable requirement record; the
  assertion does not impose a no-document policy on substantial or convention-backed tasks.
- A separate executable scenario checks the full accepted integer-string domain with independently
  grounded expected results, including values outside JavaScript's safe-integer and finite-number
  ranges. It detects unapproved range restrictions, precision loss, and acceptance of invalid formats.
- Focused deterministic regressions cover the known false negatives and neighboring counterexamples.
  Existing release-selected scenarios, raw reports, and release manifests remain unchanged. New
  scoring evidence uses new benchmark fingerprints and is not pooled with historical model results.

Solution boundary: Review and Handoff scorers with their required runner snapshots, focused scorer tests,
one separate contract-fidelity scenario, its registry metadata, and the verification records. Core,
all five skills, invocation metadata, and workflow structure stay frozen at plugin fingerprint `55763f92a17e`.

Test Contract: Observe the two reproducible scorer failures before their fixes; verify that the corrected
checks accept the manually validated behavior and reject actual mutations. Test the numeric contract
through the public API against fixed values and incorrect implementations. Run the affected deterministic
checks, then the repository suite and metadata/fingerprint checks. No model retry loop or new reliability
claim is part of this increment.

Increment implementation:

- Review binds organization-boundary evidence to an actual grant or bypass, including the observed
  equivalent wording, and rejects separate active or passive denials without losing later policy quotes.
- The runner captures initial requirement contents and records individual untracked paths. Checkpoint,
  Handoff, and consumer checks compare their own entry state. Approved consumers preserve carried
  records without inheriting earlier artifact failures; new files and changed requirement contents fail.
- `develop-contract-fidelity` is registered as a separate three-turn scenario. Public API examples and
  mutation checks cover unrestricted integer strings, exact parity, invalid formats, retained coverage,
  the original numeric domain, and both implementation approval boundaries.

Increment verification: Passed

- Before repair, `node --test tests/review-findings.test.js tests/workflow-transitions.test.js tests/contract-fidelity.test.js tests/benchmark-handoff.test.js` reproduced 50 passes and the two recorded failures. The expanded final run passes 66/66, including the runner's real Git/file snapshots and saved report with a stubbed Codex process.
- `npm test`: 151/151 deterministic checks passed, including plugin manifests, synchronized explicit invocation, fixtures, scorers, and runner evidence.
- `npm run benchmark:coverage -- --json`: 42 scenarios map all 47 behavior IDs; this is corpus metadata.
- `claude plugin validate . --strict`: passed. Core, skills, and invocation metadata retain plugin fingerprint `55763f92a17e`; all six evidence manifests and the unrelated `.baseline-plugin/` directory retain their entry hashes.
- `node --test tests/benchmark-coverage.test.js tests/metadata.test.js`: 16/16 passed after the final coverage metadata and documentation updates; `git diff --check` passed.
- Current benchmark fingerprints and the observed failures before correction are recorded in [the benchmark log](../benchmark-log.md). No new model runs, rescored raw reports, pooled cohorts, or model-reliability claim accompany this increment.
