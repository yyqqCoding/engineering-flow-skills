# Changelog

All notable changes to Engineering Flow are documented here.

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
