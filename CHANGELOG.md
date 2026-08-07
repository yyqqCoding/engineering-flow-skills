# Changelog

All notable changes to Engineering Flow are documented here.

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
