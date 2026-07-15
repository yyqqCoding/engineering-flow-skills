# Engineering Flow Skills

A compact, evidence-driven development workflow for Codex CLI and Claude Code.

The project combines selected ideas from Superpowers, Matt Pocock's engineering skills, and Ponytail while avoiding their main failure modes: mandatory ceremony, workflow sprawl, and optimizing code for line count instead of maintainability.

## Status

Initial Codex-validated release candidate. The full 15-scenario A/B corpus passes for the candidate, deterministic explicit routing is verified in Codex CLI, and Claude-compatible metadata/hooks pass static tests. Real Claude Code behavioral validation remains outstanding.

## Product direction

- A very small always-on engineering core.
- Deterministic explicit invocation for all full workflows; only the compact Core is automatic.
- Test-first development where it produces valuable behavioral evidence, not as ceremony.
- The smallest clear change at the correct ownership boundary.
- Documentation reconciled with actual behavior after verification.
- Project instructions updated only with durable, reusable rules.

See:

- [`docs/product-design.md`](docs/product-design.md)
- [`docs/behavior-spec.md`](docs/behavior-spec.md)
- [`docs/trigger-model.md`](docs/trigger-model.md)
- [`docs/testing-strategy.md`](docs/testing-strategy.md)

## Supported environments

- Codex CLI
- Claude Code

Other agent hosts are intentionally out of scope.

## Install

Codex CLI:

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

For local development, replace `yyqqCoding/engineering-flow-skills` with the checked-out repository path.

Claude Code compatibility files are included, but real Claude behavior tests have not yet run in the current environment because the `claude` executable is unavailable.

Invoke a full workflow explicitly after installation:

```text
Codex CLI:   $engineering-flow:develop
Claude Code: /engineering-flow:develop
```

Replace `develop` with `clarify`, `diagnose`, `code-design`, `review`, `verify-and-reconcile`, or `handoff`. Supplied review feedback is verified by the automatic Core before any requested change is applied.

The prompt hook expands only these explicit namespaced tokens into full workflow instructions. Ordinary prompts receive the compact Core but no full skill.

## Tests

```bash
npm test
```

Run one isolated Codex behavior sample:

```bash
BENCH_REASONING_EFFORT=low \
  node scripts/run-codex-benchmark.js readability-trap candidate
```

Raw behavior results are written under ignored `benchmark-results/` files.

Run repeated A/B samples with bounded concurrency:

```bash
BENCH_REPETITIONS=3 BENCH_CONCURRENCY=2 \
  npm run benchmark:ab -- readability-trap ambiguous-delete
```

Use `BENCH_ARMS=baseline` or `BENCH_ARMS=candidate` to run only one arm.

The runner prints a heartbeat to stderr every 15 seconds by default. Override it with `BENCH_HEARTBEAT_MS`; set it to `0` to disable heartbeats.

Summarize all clean local results, or one benchmark:

```bash
npm run benchmark:summary
npm run benchmark:summary -- false-deduplication
```

The summary reports behavioral pass rate, invocation precision/recall, configured workflow collisions, question/plan ceremony, tool calls, token usage, duration, contamination, and unauthorized commits. Existing global Codex plugins and skills are excluded from valid evidence.

Each report also records a fixture fingerprint and, for candidate runs, a plugin-content fingerprint. Summaries keep different cohorts separate so wording or trigger changes cannot silently contaminate later averages.
