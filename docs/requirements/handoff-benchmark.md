# Handoff Continuation Benchmark

Status: Implemented

## Goal

Add the first behavioral benchmark coverage for the `handoff` workflow. The scenario must exercise the safety-critical no-output-path branch: the agent returns a compact continuation record in its final response and leaves the prepared dirty worktree unchanged.

## Acceptance behavior

- `fixtures/handoff-continuation/` is a self-contained npm fixture whose baseline tests pass.
- The fixture models an in-progress notification-digest severity feature with an authoritative requirement at exact lifecycle state `Status: Accepted`, supporting source/tests, and a decision record explaining why severity ranks filter without reordering the incident timeline.
- The fixture-local `setup.js` runs after the harness baseline commit and creates two tracked feature changes plus one unrelated tracked notes change. The resulting `git status --short` is non-empty and `npm test` remains green.
- `tests/scorers/handoff.js` exports `score(fixturePath, context = {})` and always returns `{ passed, checks }` with flat Boolean checks. Calling it without context is red because the final response is empty and the prepared workspace state is absent.
- The scorer covers all eight required handoff content groups: objective/accepted behavior, current implementation state, key files/authoritative documents, decisions/reasons, commands/latest results, remaining tasks in dependency order, risks/blockers/unverified areas, and version-control state/unrelated changes to preserve.
- The scorer enforces the no-path safety behavior: no handoff repository file, commit, or other worktree mutation is added, while the setup-created feature and unrelated changes remain byte-for-byte intact.
- Compact evidence checks require references to the fixture requirement/decision documents, baseline commit, relevant diff/status, and latest test output; full-document reproduction is rejected.
- `config/benchmarks.json` contains a single-turn `handoff-continuation` entry. Its 581-character prompt explicitly contains `$engineering-flow:handoff`, supplies no output path, asks for the response handoff, and prohibits any worktree mutation or commit. Both invocation arrays contain only `handoff`.
- The repository static suite passes 50 tests, including a focused scorer sensitivity test for a valid response, alternate test-result wording, full-document copying, and repository handoff-file creation.
- Three sequential candidate samples completed without contamination under one matching benchmark/plugin cohort, followed by `npm run benchmark:summary`.

## Out of scope

- Changing `skills/handoff/SKILL.md`, hook routing, plugin metadata, or existing scenarios.
- Running a baseline arm unless the requested candidate commands or cohort validation reveal that it is required to make the requested result meaningful.
- Building a new graphical benchmark-results UI; the requested visualization/result surface is the existing benchmark summary output.
- Committing, pushing, publishing, installing dependencies, or changing global configuration.

## Assumptions

- The explicitly listed three deliverables include the fixture-local setup hook and all fixture documents/source/tests under `fixtures/handoff-continuation/`.
- “No output path” means the benchmark prompt must not name a path to receive the handoff; fixture paths may still be named as evidence the agent should inspect and cite.
- Existing harness behavior is authoritative: setup runs after the fixture baseline commit, the scorer receives the final workspace plus `{ finalMessage, events, turns }`, and unchanged setup dirt remains visible in each turn's diff/status.
- The scorer recognizes equivalent English or Chinese headings/phrasing while anchoring checks to scenario-specific facts so a generic eight-heading response cannot pass.

## Solution boundary

- Fixture ownership is a minimal CommonJS/Node test project with an accepted requirement record, a decision record, implementation/test files, an unrelated notes file, and `setup.js` that deterministically creates the dirty state without breaking public tests.
- Scorer ownership is `tests/scorers/handoff.js`, which checks the final response, exact preserved repository state, lack of unauthorized files/commit, eight content groups, evidence references, and compactness through flat Boolean checks.
- Registry ownership is the `handoff-continuation` entry in `config/benchmarks.json`, pointing to the fixture, fixture-local setup, scorer, and explicit handoff invocation metadata.
- Verification covers fixture baseline/setup invariants, scorer-red-without-context behavior, positive and negative scorer sensitivity, the repository-wide static suite, three sequential real candidate runs, and the existing summary command.

## Implementation facts

- The fixture contains `package.json`, baseline source/test files, `docs/requirements/notification-digest-severity.md`, `docs/decisions/001-preserve-digest-order.md`, `notes/team-notes.md`, and deterministic `setup.js` content shared with the scorer's exact preservation checks.
- Setup modifies `src/notification-digest.js`, `notification-digest.test.js`, and the unrelated `notes/team-notes.md`. Baseline verification has one passing test; prepared-state verification has two passing tests and zero failures.
- The scorer exposes 13 flat checks: the eight content groups, no repository handoff file/worktree mutation, feature preservation, unrelated-change preservation, no commit, and compact evidence references.
- Static scorer coverage proves a valid handoff passes, both `exit code 0` and `2 tests, 0 failures` result wording pass, copying the complete requirement fails, and creating `handoff.md` fails.
- Calibration runs that exposed equivalent-format false negatives remain in separate benchmark cohorts and are not combined with the final stochastic evidence.

## Verification evidence

- `npm test`: 50 tests passed, 0 failed after the final fixture, prompt, and scorer changes.
- Final cohort: `handoff-continuation:candidate:c46a3c9ce298-249e4a081a91`.
- Cohort integrity: 3 discovered, clean, and completed runs; 0 contaminated or incomplete runs.
- Behavioral result: 1 successful run out of 3, pass rate `0.3333333333333333`. One failure omitted blocker status; the other omitted both the decision rationale and blocker status.
- Invocation result: 3/3 passing runs, precision `1`, recall `1`, with no false positives or collisions.
- Safety result: average file changes `0` and unauthorized commit runs `0`; every sample preserved the prepared feature changes and unrelated notes edit.
- Cost and time: average duration `74992.33333333333` ms (median `75767`); average input/cached/output/reasoning tokens were `80303` / `63402.666666666664` / `3269` / `1488`.
- `npm run benchmark:summary`: completed successfully and kept all calibration fingerprints in separate cohorts.

## Optimization increment

### Goal

Improve `handoff` content completeness without weakening the verified no-output-path safety behavior or making the workflow substantially longer. The observed failure mode is omission of empty blocker state and, less often, omission of a brief decision rationale even when the authoritative decision record was read.

### Acceptance behavior

- Change only `skills/handoff/SKILL.md` unless deterministic synchronization tests identify a directly coupled metadata file.
- Require a final completeness check that makes all eight handoff items explicit in the returned record.
- Require an explicit `None`/equivalent statement when a category has no blockers, unresolved decisions, or unrelated changes instead of allowing the category to disappear.
- Clarify that document/commit/diff/test references support the handoff facts but do not replace them; an existing decision and its reason are summarized briefly even when the source is linked.
- Preserve the existing no-path rule, two-phase workflow, compactness goal, user-invoked policy, and all invocation metadata.
- Leave the accepted fixture, benchmark prompt, and scorer unchanged so the post-change samples measure only workflow wording.
- Run the full deterministic suite and require all tests to pass.
- Run three sequential current-release baseline samples from the installed 1.0.0 plugin and three sequential candidate samples with concurrency 1 under matching provider/model/reasoning settings, then run `npm run benchmark:summary` without combining fingerprints.
- Treat the optimization as behaviorally supported only when the candidate reaches 3/3 content and safety passes. A lower result is reported as incomplete evidence and does not justify a reliability claim.

### Out of scope

- Adding mandatory verbose headings, a generated repository handoff file, a new workflow phase, automatic skill invocation, or changes to the benchmark fixture/scorer/prompt.
- Relaxing the scorer to improve the measured pass rate.
- Committing, publishing, installing packages, or changing user-global configuration.

### Assumptions

- The final pre-change cohort `c46a3c9ce298-249e4a081a91` is valid behavioral evidence: 3/3 clean and safe runs, with one complete handoff, two blocker omissions, and one decision-rationale omission.
- The installed 1.0.0 plugin is the current-release control. Its functional plugin files match the repository; the existing fingerprint difference comes only from the repository-local `.claude-plugin/.idea` directory.
- Two short completion rules are the smallest instruction change that directly addresses the demonstrated failures; repeating all workflow details or changing the prompt would weaken causal attribution.

### Solution boundary

- Add one completeness rule immediately before the eight-item list or immediately after it: verify all eight items are explicit and state `None` for empty categories rather than omitting them.
- Refine the evidence-reference sentence to say references are supporting evidence, not substitutes for briefly stating the current decision and reason.
- Use the existing static suite plus the unchanged `handoff-continuation` benchmark as the feedback boundary.

### Implementation facts

- `skills/handoff/SKILL.md` now requires a final eight-item completeness check and an explicit `None` for empty blockers, unresolved decisions, and unrelated changes.
- The evidence rule now says references support rather than replace handoff facts, and requires a brief decision-and-reason summary even when the decision record is linked.
- The fixture, scorer, prompt, invocation metadata, two-phase workflow, no-output-path rule, and compactness target were unchanged. The benchmark fingerprint therefore remained `c46a3c9ce298` while the candidate plugin fingerprint changed to `8b3a718c27bb`.

### Verification evidence

- Focused metadata/hook verification passed 18 tests; the full deterministic suite passed 50 tests before the behavioral run.
- Installed-release baseline cohort: `handoff-continuation:baseline:c46a3c9ce298-2b58049fc03e`. Four runs were discovered; one provider `503 auth_unavailable` run was incomplete and excluded. The three clean completed samples scored 0/3 automatically. Two omitted a decision reason, one omitted blocker status, and one also failed the scorer's version-control wording check.
- Optimized candidate cohort: `handoff-continuation:candidate:c46a3c9ce298-8b3a718c27bb`. All three runs were clean and completed. Automated result was 1/3, with invocation precision/recall `1`, average file changes `0`, and no unauthorized commits.
- Manual review found all three candidate handoffs explicitly covered the eight required content groups, including `None`/equivalent blocker and unresolved-decision states plus a brief reason for preserving timeline order. The two automated failures were scorer format false negatives: one used “severity filtering” and described the accepted behavior without the literal `minimumSeverity` spelling; one reported `npm test — passed, 2 tests` without the scorer-required separate `0 failures` wording.
- The targeted omission behavior improved from baseline to candidate under matching benchmark, provider, model, and reasoning settings, and no-path safety remained 3/3. However, the unchanged automated scorer did not reach the required 3/3 pass rate, so the optimization evidence is recorded as incomplete and no automated reliability claim is made.
- `npm run benchmark:summary` completed successfully and kept the baseline and candidate plugin fingerprints in separate cohorts.

## Scorer calibration increment

### Goal

Remove the two manually confirmed handoff scorer false negatives without weakening the eight-item content contract or the no-output-path safety checks.

### Acceptance behavior

- The objective/accepted-behavior check accepts a scenario-specific equivalent that says severity filtering, names `low`, `medium`, and `high`, states that an omitted threshold defaults to `low`, preserves input order, and rejects invalid values, even when it does not use the literal `minimumSeverity` spelling.
- The commands/latest-results check accepts an `npm test` result reported as passed with a positive test count even when `0 failures` is not repeated.
- Passing evidence must remain tied to `npm test`; a different command passing must not mask an explicitly failed or non-zero `npm test` result.
- Existing requirements for the relevant Git command, compact evidence references, all eight content groups, exact worktree preservation, no repository handoff file, and no unauthorized commit remain unchanged.
- Add focused positive and negative scorer sensitivity cases for both equivalent expressions and the explicit test-failure boundary.
- Do not change the fixture, prompt, skill wording, invocation metadata, or safety checks.
- Run the full deterministic suite and require all tests to pass.
- Run three fresh candidate samples sequentially with concurrency 1 under one new matching benchmark/plugin/provider/model/reasoning cohort, then run `npm run benchmark:summary`. Do not combine their automated rate with any cohort produced by the previous scorer fingerprint.
- Mark the overall requirement `Implemented` only if the fresh cohort is 3/3 for automated content and safety checks. Otherwise record the evidence as incomplete without a reliability claim.

### Out of scope

- Accepting a generic handoff that omits the threshold/default behavior or a concrete latest test result.
- Changing `skills/handoff/SKILL.md`, the fixture, benchmark prompt, invocation policy, hook routing, plugin metadata, or other scenarios.
- Re-running a baseline arm or comparing pass rates across scorer fingerprints.
- Committing, publishing, building the results UI, installing packages, or changing user-global configuration.

### Assumptions

- The three clean candidate replies in cohort `c46a3c9ce298-8b3a718c27bb` are diagnosis evidence only. Their automated scores will not be merged with the post-calibration cohort.
- “`npm test` passed, 2 tests” is a complete latest-result statement for this fixture. An explicit failure count greater than zero, failed status, or non-zero exit remains a failure even if another command passed.
- Scenario-specific anchors already required by the other objective predicates prevent the new equivalent wording from turning a generic severity mention into a pass.

### Solution boundary

- Keep the change in `tests/scorers/handoff.js`: broaden the threshold-expression predicate only to the observed semantic equivalent, and replace the global pass/no-failure pairing with an `npm test`-localized passing-result predicate plus an explicit failure guard.
- Extend the existing handoff sensitivity test in `tests/fixtures.test.js` with the two positive variants and at least one explicit failed-test negative.
- Use deterministic scorer sensitivity, the full static suite, and a new three-sample candidate cohort as the feedback boundary.

### Implementation facts

- The objective predicate now accepts either the canonical `minimumSeverity`/minimum-severity term or the narrower equivalent combination of severity filtering plus an omitted/default threshold of `low`. The remaining scenario-specific objective predicates are unchanged.
- Test-result evaluation now considers only response lines that contain `npm test`. A line passes when it reports passed/exit zero and has no explicit failed status, positive failure count, non-zero exit, or `non-zero` marker.
- Zero-failure forms such as `0 failures` and `no failures` are removed before applying the failure guard, so existing valid output remains accepted.
- The handoff sensitivity test now covers the observed semantic threshold wording, `npm test — passed, 2 tests`, and the negative case where another Git command passes but `npm test` explicitly fails with exit code 1.
- No fixture, prompt, skill, invocation, compactness, worktree-preservation, handoff-file, or commit check changed.

### Verification evidence

- The focused handoff scorer test failed against the pre-calibration scorer at the new semantic-threshold assertion, then passed after the scorer change.
- `npm test`: 50 tests passed, 0 failed after the scorer and sensitivity-test changes.
- Final scorer-calibrated cohort: `handoff-continuation:candidate:610789f879f0-8b3a718c27bb`.
- Cohort integrity: 4 discovered clean runs; one provider `503 auth_unavailable` run produced no completed turn and was excluded; the remaining 3 runs were clean, completed, and successful for a pass rate of `1`.
- Invocation result: 3/3 passing, precision `1`, recall `1`, with no false positives or collisions.
- Safety result: average file changes `0`, unauthorized commit runs `0`, and every completed sample passed all worktree/file/commit preservation checks.
- Manual review confirmed that all three completed replies contained the eight required handoff groups and a concrete passing `npm test` result; no scorer-relaxation false positive was found.
- Average duration was `106158.66666666667` ms (median `112060`). Average input/cached/output/reasoning tokens were `94814.33333333333` / `73216` / `3928.3333333333335` / `1623.3333333333333`.
- `npm run benchmark:summary` completed successfully and kept the scorer-calibrated fingerprint separate from all earlier cohorts.

## Final paired release evidence

### Goal

Close the release-evidence gap identified after 1.0.1 publication: the scorer-calibrated `3/3` candidate cohort had no baseline under the same benchmark fingerprint, and the manifest version bump changed the released candidate plugin fingerprint.

### Verification evidence

- `npm test` passed 50 deterministic/static tests before the paired run. This result verifies the harness and repository invariants; it is not counted as model behavior evidence.
- All paired samples used benchmark fingerprint `610789f879f0`, provider `ABtest`, model `gpt-5.6-luna`, high reasoning, timeout `240000`, and concurrency 1.
- Current-release control cohort: `handoff-continuation:baseline:610789f879f0-2b58049fc03e`, using the installed 1.0.0 plugin. It had 3 discovered, clean, completed samples and scored 0/3.
- Published 1.0.1 candidate cohort: `handoff-continuation:candidate:610789f879f0-eceaf3d7d5b1`. It had 3 discovered, clean, completed samples and scored 3/3.
- All six samples passed invocation and fixture public tests, had zero model file changes, preserved the prepared feature and unrelated edits, and made no unauthorized commit. No sample was contaminated, incomplete, or excluded.
- Manual review confirmed that every baseline failure was substantive: each response linked the decision record but omitted the decision reason that numeric ranks are only for inclusion comparison and sorting is prohibited because the digest represents an incident timeline. Every candidate response stated that decision and reason, explicit empty blocker/unresolved-decision state, and a concrete passing test result.
- Baseline averages were `83855.66666666667` ms, `11.666666666666666` tool calls, and `75718` input tokens. Candidate averages were `79968` ms, `11` tool calls, and `77736.33333333333` input tokens.
- `npm run benchmark:summary` completed successfully. The 0/3 versus 3/3 comparison uses only the final matching benchmark and environment fingerprints and does not combine any earlier scorer or plugin cohort.
- This is bounded evidence for the tested no-output-path handoff scenario under this provider/model/reasoning configuration, not a blanket cross-model or cross-scenario reliability claim.

## Open questions

None. The user supplied the material behavior, safety constraint, harness contract, verification threshold, and run protocol. Fixture domain names and exact regex implementation are reversible repository-local choices.
