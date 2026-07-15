# Benchmark Log

## 2026-07-14 — Initial Codex feasibility run

Environment:

- Codex CLI 0.144.3
- Configured model: `gpt-5.6-sol`
- Reasoning effort: low for the clean comparison runs
- Isolated temporary HOME/CODEX_HOME
- Existing global Superpowers excluded
- Candidate installed from the local marketplace
- One run per arm; results are preliminary, not statistical claims

### Isolation failures discovered

1. Linking only `auth.json` caused the temporary Codex environment to fall back to the default provider. Provider TOML is also required.
2. Copying `config.toml` unchanged re-enabled `superpowers@openai-curated` and invalidated both arms.
3. Setting only `CODEX_HOME` still allowed discovery of skills under the real `$HOME/.codex`.
4. Placing the temporary HOME beside the fixture workspace allowed broad `find ..` searches to see plugin-cache instruction files.

The harness now uses a separate temporary HOME, strips all `[plugins.*]` config sections, installs only the candidate plugin for treatment runs, and marks any Superpowers path access as contamination.

### Clean single-run results

| Scenario | Arm | Result | Duration | Notes |
|---|---|---:|---:|---|
| Shared root cause | Baseline | Pass | 57.3 s | Found shared `debit`, added both regression tests |
| Shared root cause | Candidate | Pass | 90.6 s | Loaded `diagnose` and `verify-and-reconcile` |
| Shared root cause, pruned skills | Candidate | Pass | 94.9 s | Loaded shortened `diagnose` only |
| Readability trap | Baseline | Pass | 61.2 s | Replaced nested ternary/reducer with explicit flow |
| Readability trap | Candidate | Pass | 80.9 s | Loaded `code-design` and completion audit |
| Readability trap, narrowed trigger | Candidate | Pass | 83.1 s | Used Core only; no specialist skill loaded |
| Ambiguous customer deletion | Baseline | Pass | 242.6 s | Asked for deletion policy, no diff |
| Ambiguous customer deletion | Candidate | Pass | 21.8 s | Core asked the material data-lifecycle question, no diff |

### Interpretation

- The strong baseline already handles the current shared-root and readability traps correctly. Heavy automatic skills do not yet show a correctness benefit and add visible process/read cost.
- The readability rule belongs in the compact Core for ordinary tasks. `code-design` should remain reserved for module boundaries, real variation, state modeling, or abstraction pressure.
- Routine focused fixes should not automatically load the full documentation/instruction reconciliation audit.
- The requirement Core can detect a destructive data-lifecycle ambiguity without starting a full clarification workflow.
- Timing varies heavily between calls. More repetitions and harder fixtures are required before making latency or quality claims.

### Next benchmark work

- Repeat each arm at least three times.
- Run the newly added false-deduplication, justified-abstraction, dirty-worktree, read-only-review, incorrect-review-feedback, documentation-drift, no-AGENTS-update, and clear-simple-task fixtures.
- Run the same corpus in Claude Code before cross-platform release claims.

## 2026-07-14 — Corpus and harness expansion

Implemented but not yet behaviorally sampled:

- Eight deterministic fixtures covering false deduplication, justified abstraction, dirty-worktree preservation, read-only review, incorrect feedback, documentation drift, unnecessary instruction updates, and unnecessary clarification.
- Fixture setup hooks for pre-existing tracked and untracked changes.
- Streaming JSONL persistence with periodic heartbeat output.
- JSONL metrics for skill reads, command/file tool calls, question messages, todo lists, tokens, and turns.
- Scenario-specific expected/allowed skill policies and incompatible-workflow detection.
- Clean-run aggregation with contamination exclusion and unauthorized-commit reporting.

These additions expand what can be measured; they do not yet demonstrate that the candidate improves these behaviors. Clean repeated A/B runs remain required.

### False-deduplication trigger pruning

Three clean low-reasoning runs per arm produced the same correct behavior in every run: the shipping rule changed, loyalty remained unchanged, and neither arm coupled the independent policies.

| Arm | Pass rate | Average duration | Average tool calls | Average input tokens |
|---|---:|---:|---:|---:|
| Baseline | 3/3 | 43.2 s | 4 | 47,324 |
| Candidate with `code-design` | 3/3 | 58.1 s | 7 | 83,688 |

The automatic `code-design` load had 100% trigger precision for the old policy but no demonstrated outcome benefit. It added about 34.6% duration, 75% tool calls, and 76.9% input tokens in this fixture. The trigger is therefore narrowed: ordinary local reuse and false-deduplication decisions remain in Core, while the full skill is reserved for non-local architectural pressure. The pruned candidate must be rerun before treating the overhead reduction as verified.

The first run with a narrower model-facing description still loaded `code-design` for the same local duplication prompt. Because negative trigger wording did not create a reliable boundary, `code-design` is now user-invoked on both Codex and Claude. Maintainability, semantic reuse, and novelty-tax rules remain in Core; the full design workflow is available explicitly and from the user-invoked development workflow when deeper analysis is wanted. Post-policy behavior runs are still required.

After that metadata change, Codex stopped loading `code-design` but incorrectly selected `diagnose` for the policy-change prompt. The diagnosis description is therefore tightened to require a user-reported failure of existing behavior and to explicitly exclude requested features, policy changes, refactors, and ambiguity. This new trigger policy also requires fresh behavioral evidence.

A second run with the stronger exclusion still loaded `diagnose`. Together with the existing shared-root-cause runs, which showed no correctness improvement over the strong baseline, this demonstrates that automatic diagnosis currently adds cost without a reliable trigger boundary. `diagnose` is therefore user-invoked on both platforms. The shared-root-cause benchmark now invokes it explicitly; Core continues to provide root-cause and shared-owner guidance for ordinary bug requests.

With both design and diagnosis made explicit, the next run selected `verify-and-reconcile` for the same local task because an authoritative document was present. That interpretation is defensible, but it still loads a full completion workflow where Core already requires fresh verification and documentation reconciliation. To prevent workflow substitution, `verify-and-reconcile` is now also user-invoked. Only `review-feedback` remains model-invoked because supplied reviewer feedback is a narrow, externally observable trigger.

The next run, with `review-feedback` as the only remaining implicit skill, loaded it even though the prompt contained no reviewer feedback. This confirms workflow substitution rather than a single bad description. All full skills are now user-invoked on Codex and Claude. SessionStart Core remains automatic, so routine requirement alignment, maintainability, safety, focused testing, fresh verification, and documentation reconciliation still apply without an explicit command.

Three clean runs of the all-explicit candidate preserved 3/3 correctness and eliminated full-skill reads, but still averaged 85.9 seconds, 6.7 tool calls, and 81,254 input tokens versus the baseline's 43.2 seconds, 4 tool calls, and 47,324 input tokens. Event inspection showed repeated instruction discovery, broad parent searches, and separate red/green edits for a local policy change. Core is therefore reduced from 307 words to a smaller one-pass repository discovery rule, and test-first wording is limited to regressions or high-risk behavior with a stable seam. The reduced Core requires a fresh cohort before efficiency conclusions.

The reduced-Core cohort completed 3/3 runs correctly with no full-skill reads, no questions, no contamination, and no unauthorized commits. It averaged 72.0 seconds with a 48.0-second median, 5 tool calls, and 60,593 input tokens. The same baseline cohort averaged 43.2 seconds with a 44.6-second median, 4 tool calls, and 47,324 input tokens. Median latency is now close, while the remaining stable cost is roughly one repository/verification command and 28% more input tokens. Other fixtures must show whether that residual Core cost buys ambiguity, safety, or documentation improvements.

An initial explicit `code-design` smoke prompt used the unqualified `$code-design` name. Codex reported that the skill was unavailable, although Core alone still passed the justified-abstraction scorer. Plugin skills are namespaced, so Codex benchmark prompts now use `$engineering-flow:<skill>`; Claude documentation uses `/engineering-flow:<skill>`. Namespaced invocation still requires a fresh smoke run.

The namespaced `$engineering-flow:code-design` smoke run loaded the correct skill with precision/recall 1.0, passed the justified-abstraction scorer and public tests, added no dependency, produced no question or unauthorized commit, and showed no contamination. This is one run, so it validates invocation plumbing rather than comparative quality.

## 2026-07-15 — Completed Codex A/B corpus

Environment and protocol:

- Codex CLI 0.144.3 with configured `gpt-5.6-sol`
- Low reasoning effort, isolated HOME/CODEX_HOME, candidate-only plugin install
- Fifteen deterministic behavior scenarios
- At least three clean samples per arm and current cohort; same-cohort smoke samples are retained, so a few groups contain four runs
- No global Superpowers access, contaminated run, or unauthorized commit in the final evidence

### Final aggregate

| Metric | Baseline | Candidate |
|---|---:|---:|
| Engineering pass rate | 48/49 | 47/47 |
| Explicit invocation recall | n/a | 19/19 |
| Unexpected full-skill invocations | n/a | 0 |
| Average duration | 64.2 s | 109.2 s |
| Median duration | 55.4 s | 73.8 s |
| Average tool calls | 4.43 | 5.77 |
| Average input tokens | 49,590 | 64,819 |
| Average question messages | 0.12 | 0.13 |
| Unauthorized commits | 0 | 0 |

Wall-clock results are directional only. The arms ran in separate batches and the final candidate batch contained several 4–5 minute provider-latency outliers. Tool and token costs are more stable: the candidate used about 30% more tool calls and 31% more input tokens overall.

### Scenario outcomes

| Scenario | Baseline | Candidate |
|---|---:|---:|
| Shared root cause | 3/3 | 3/3 |
| Readability trap | 3/3 | 3/3 |
| Ambiguous deletion | 3/3 | 3/3 |
| False deduplication | 3/3 | 3/3 |
| Justified abstraction | 3/3 | 3/3 |
| Dirty worktree | 3/3 | 3/3 |
| Read-only review | 3/3 | 3/3 |
| Incorrect review feedback | 3/3 | 4/4 |
| Documentation drift | 3/3 | 3/3 |
| No AGENTS update | 3/3 | 3/3 |
| Clear simple task | 3/3 | 3/3 |
| Existing capability reuse | 4/4 | 3/3 |
| Hidden effects | 4/4 | 3/3 |
| Regression sensitivity | 3/4 | 4/4 |
| Configuration only | 4/4 | 3/3 |

The only baseline engineering failure fixed the behavior and left a mutation-sensitive regression test, but did not observe that test fail before the implementation change. Every final candidate regression run observed red before green. This is modest evidence for the Core's regression rule, not a broad claim that every task needs TDD.

### Routing and workflow pruning

Relying on the model to read a namespaced skill file was not deterministic. Before host-level routing, only 6 of 21 requested skill reads were observed in one cohort; stronger generic Core wording reached 20 of 22 in another cohort but still failed stochastically. A canary proved that missing file reads were real rather than hidden automatic expansion.

Codex 0.144.3 supports `UserPromptSubmit`. The final plugin uses that hook to parse only `$engineering-flow:<skill>` or `/engineering-flow:<skill>` and inject the complete requested `SKILL.md` for the current turn. Final invocation recall is 19/19 with zero unexpected full-skill routes. Ordinary prompts still receive no full workflow.

The standalone `review-feedback` skill was removed. Its full-workflow cohort produced correct behavior even when the file was not read, and the baseline was also 3/3. The durable rule—verify reviewer claims against code and requirements before applying them—now lives in the 228-word Core. The final Core-only feedback cohort is 4/4.

### Release interpretation

- The strong baseline already solves fourteen of fifteen fixtures perfectly, so automatic full workflows are not justified.
- The candidate closes one observed regression-process gap and preserves 100% engineering correctness, but carries measurable context and tool cost.
- Full workflows therefore remain explicit and should be used when the user wants the deeper process, not as routine automatic ceremony.
- Codex behavior is validated locally. Claude metadata and hook output are statically tested, but a real Claude Code run remains required before claiming cross-platform behavioral validation.
