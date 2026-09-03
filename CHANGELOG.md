# Changelog

All notable changes to Engineering Flow are documented here.

## 1.0.3 - 2026-09-03

Adds requirement-derived Test Contracts to Develop and Code Design, with release evidence for the focused workflow changes.

### Added

- Test Contracts derived at the alignment checkpoint for functional correctness, feature interaction, and boundary conditions.
- Explicit Test Contract fulfillment after production implementation, with supplementary evidence reported as deviations.
- A six-scenario paired release cohort covering Develop lifecycle, requirement lifecycle, approval scope, post-implementation testing, and both Code Design modes.

### Changed

- Develop and Code Design now derive verification intent from accepted behavior instead of selecting tests only after implementation.
- Develop checkpoints explicitly state that approval is pending before implementation can begin.
- The post-implementation benchmark scorer recognizes ordered production and test changes within one batched file-change event.
- Release evidence records the current candidate fingerprint and exact selected reports without mixing superseded cohorts.

### Updating from 1.0.2

- Codex CLI users refresh the marketplace, reinstall the plugin, and start a new session.
- Claude Code users update the marketplace and plugin, then start a new session.

## 1.0.2 - 2026-08-27

Adds production-first, risk-selective testing guidance, reduces workflow prompt weight, and hardens release evidence without adding another workflow.

### Added

- Machine-readable behavior, risk, workflow, transition, stack, language, and holdout coverage for every benchmark, with a deterministic coverage report.
- Focused scenarios for mixed approval plus scope expansion, durable fresh-context recovery, durable completion-evidence holdout, workflow termination, explicit workflow overlap, unreproduced diagnosis, cross-language verification, fact/solution alignment, justified novelty, and debug-artifact cleanup.
- Fixture-specific verification commands, a standard-library Python fixture, GitHub Actions CI, a release evidence manifest, and a separate direct durable-repair evidence manifest for exact cohort selection.
- A mutation-sensitive production-before-tests scenario, a no-test configuration control, deterministic evidence generation, and a strict release-evidence workflow.
- A final same-environment paired release cohort with three completed samples per arm for the two testing-policy scenarios.

### Changed

- Develop pauses the whole turn when approval of an earlier checkpoint is bundled with a material scope increment, then waits for approval of the revised checkpoint.
- New behavior is implemented before tests are added; afterward, only critical contract, regression, and boundary coverage is selected. Regression repair retains the stable-seam red-before-fix exception.
- Develop, Diagnose, and Code Design are shorter, and fallback requirement-record mechanics load only when a substantial task needs them.
- Portable requirement records carry a pending completion-evidence gate; completion replaces it with exact implementation paths, test paths, verification results, and deviations while removing stale checkpoint-time future language.
- Requirement completion accepts explicit `Test files: None` when non-test verification is more appropriate.
- Benchmark summaries keep provider, model, and reasoning levels separate and can filter reports through an exact evidence manifest.
- Plugin fingerprints include only released manifests, the skill registry, hooks, and skills, so ignored editor metadata cannot split cohorts.
- Codex and Claude contributor instructions are synchronized, and repository text files use LF line endings.

### Updating from 1.0.1

- Codex CLI users refresh the marketplace, reinstall the plugin, and start a new session.
- Claude Code users update the marketplace and plugin, then start a new session.

## 1.0.1 - 2026-08-09

Adds behavioral coverage and reliability hardening for cross-session handoffs.

### Added

- A real `handoff-continuation` benchmark with an accepted requirement, decision record, in-progress feature changes, and an unrelated worktree edit that must be preserved.
- Deterministic scorer coverage for all eight required handoff content groups, compact evidence references, no-path response behavior, and exact dirty-worktree preservation.

### Changed

- Handoff now explicitly checks all eight content groups and states empty blockers, unresolved decisions, and unrelated changes instead of omitting them.
- Decision references now support rather than replace a brief decision-and-reason summary.
- The benchmark scorer accepts equivalent threshold and passing-test wording while retaining explicit failure, file-mutation, and unauthorized-commit guards.

### Updating from 1.0.0

- Codex CLI users refresh the marketplace, reinstall the plugin, and start a new session.
- Claude Code users update the marketplace and plugin, then start a new session.

## 1.0.0 - 2026-08-07

First stable release of the task-level workflow contract for Codex CLI and Claude Code.

### Added

- Five explicit workflows for development, diagnosis, code design, review, and handoff.
- Task continuity across clarification, approval, correction, repair, resume, and compaction.
- Convergent clarification with batched independent questions and sequenced dependent questions.
- Risk-matched verification, substantial requirement records, and isolated behavioral benchmarks.

### Changed

- Replaced the separate `develop confirm` path with one approval-gated `develop` workflow.
- Clarification answers no longer authorize implementation; action language after the final checkpoint does.
- Diagnose can continue from investigation into an authorized repair without switching workflows.
- Kept full workflows user-invoked on both supported hosts while loading only the compact Core by default.

### Updating from 0.1.0

- Codex CLI users refresh the marketplace, remove and add the plugin again, then start a new session.
- Claude Code users update the marketplace and plugin, then start a new session.
- Existing prompts that invoke `develop confirm` should invoke `develop` and approve after its final checkpoint.
