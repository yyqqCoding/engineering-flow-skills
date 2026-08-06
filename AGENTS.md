# AGENTS.md

This repository contains a portable development workflow for Codex CLI and Claude Code.

## Working rules

- Treat `docs/product-design.md` and `docs/behavior-spec.md` as the product source of truth.
- Add instructions only when they correct a demonstrated model failure; remove no-op guidance.
- Keep the always-on core short. Full workflows must not be injected into every conversation.
- Keep Codex and Claude invocation metadata synchronized.
- User-invoked workflows must stay user-invoked on both platforms.
- Keep full skills user-invoked unless isolated positive, negative, and overlap benchmarks justify reopening one.
- Treat an explicitly invoked workflow as owning the same task across answers, approval, correction, resume, and compaction. End inheritance only on cancellation, an explicit workflow switch, or unrelated work.
- `develop` has one approval-gated entry point. Clarification answers are not implementation approval; omitted accepted behavior resumes implementation, while added scope receives an incremental checkpoint.
- Keep substantial requirement records in the project's authoritative convention or `docs/requirements/<feature-slug>.md`, with `Draft`, `Accepted`, and `Implemented` reflecting actual progress.
- Do not make commits, publish packages, or change user-global configuration unless explicitly requested.
- Use deterministic tests before model-judged tests. Behavioral benchmarks must isolate global plugins and skills.
- Never combine behavioral results across changed fixtures, scorers, plugin fingerprints, providers, models, or reasoning levels. Manually review model failures before changing instructions or scorers.

## Repository structure

- `docs/`: product, behavior, invocation, and testing design.
- `hooks/`: minimal lifecycle hooks that emit the compact Core and route explicitly named workflows.
- `skills/`: shared Agent Skills packages.
- `fixtures/`: isolated repositories used by behavioral tests.
- `tests/`: static and behavioral test harnesses.
- `scripts/`: isolated benchmark runners, cohort filling, summaries, and deterministic test orchestration.

## Completion

Before claiming a change complete:

- Run the smallest relevant static tests.
- Confirm plugin manifests reference every released skill.
- Confirm explicit/implicit invocation policies agree across Codex and Claude.
- Record behavioral evidence when changing skill wording or trigger descriptions.
- For a release-level stochastic claim, require at least three completed, uncontaminated samples per arm and scenario under matching benchmark and environment fingerprints.
