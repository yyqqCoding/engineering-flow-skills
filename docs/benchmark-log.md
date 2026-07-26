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

## 2026-07-25 — Five-workflow architecture revision

Accepted architecture:

- User-visible workflows are `develop`, `diagnose`, `code-design`, `review`, and `handoff`.
- Requirement clarification and completion reconciliation are responsibilities inside `develop` and `diagnose` rather than standalone workflows.
- Boundary/extreme testing and maintainability improvement are conditional hardening passes, not standalone skills and not mandatory stages for every task.
- `code-design` now creates a greenfield proposal or refines an existing design without implementing production code.

Deterministic evidence from the revised working tree:

- `npm test`: 31/31 static, hook, registry, fixture, scorer, and invocation tests passed.
- Claude and Codex explicit-invocation policies agree for all five released skills.
- Both plugin manifests expose every released skill; removed workflow tokens route nothing.
- The behavior corpus now contains 17 scenarios. New `code-design-greenfield` and `code-design-refinement` fixtures have passing public baselines and hidden scorers that are red before a model response.

Behavior smoke evidence:

- Local model execution works through the configured `Wong` provider when the runner sets `BENCH_MODEL_PROVIDER=Wong`. The runner does not require or modify the user's global default provider.
- At candidate fingerprint `b3da9994a223`, single candidate smokes passed for `code-design-greenfield`, `code-design-refinement`, `hidden-effects`, `justified-abstraction`, and `regression-sensitivity`.
- All five candidate runs completed without contamination, routed exactly the requested workflow with invocation precision/recall 1.0, passed public tests, and passed their hidden engineering scorers.
- One baseline smoke for each scenario also passed. Across these single samples, candidate cost was directionally higher: 55 versus 47 tool calls, 509,418 versus 313,809 input tokens, and 505 versus 410 seconds total wall time. These unpaired single runs are too noisy for comparative claims.
- This establishes executable routing and engineering-behavior smoke coverage for the five-workflow revision. Release-level comparison still requires at least three clean current-cohort samples per arm and scenario. Old seven-workflow results must not be averaged into the new cohort, and a real Claude Code run remains required for cross-platform claims.

## 2026-07-26 — Five-workflow release cohort and Claude live validation

Codex environment and protocol:

- Codex CLI with `gpt-5.6-luna`, low reasoning, and the OpenAI-compatible provider loaded from ignored local `.env`
- Seventeen behavior scenarios, exactly three completed uncontaminated samples per arm and current benchmark fingerprint
- Candidate fingerprint `ba813f8b0aae`
- Temporary HOME/CODEX_HOME, isolated fixture workspaces, baseline without the plugin, and candidate with only this plugin

Harness corrections made before the final cohort:

- Incomplete and timed-out model runs exit non-zero and are excluded from behavioral rates and cost metrics.
- `fill-codex-cohort.js` fills only current-fingerprint, current-provider, current-model, and current-reasoning gaps.
- The ambiguity scorer accepts equivalent decision-request wording such as “please choose.”
- The readability scorer no longer mistakes JavaScript `??`, `??=`, or `?.` for nested conditional expressions; a focused regression test preserves that distinction while the unmodified nested-ternary fixture remains red.

### Final Codex aggregate

| Metric | Baseline | Candidate |
|---|---:|---:|
| Engineering pass rate | 45/51 (88.2%) | 51/51 (100%) |
| Explicit invocation checks | n/a | 51/51 |
| False routes / missed routes / collisions | n/a | 0 / 0 / 0 |
| Average duration | 57.9 s | 62.9 s |
| Median duration | 56.4 s | 64.3 s |
| Average tool calls | 7.47 | 8.78 |
| Average input tokens | 75,956 | 88,525 |
| Average output tokens | 1,766 | 1,927 |
| Average question messages | 0.06 | 0.12 |
| Contaminated runs | 0 | 0 |
| Unauthorized commits | 0 | 0 |

Fifteen scenarios were 3/3 in both arms. The two stable differences were:

- `ambiguous-delete`: baseline 0/3, candidate 3/3. Baseline silently chose cascade deletion; candidate identified the related-order policy, asked, and left the workspace unchanged.
- `regression-sensitivity`: baseline 0/3, candidate 3/3. Both arms fixed behavior and left sensitive tests, but only candidate evidence observed red before green.

The candidate adds about 17.6% tool calls and 16.5% input tokens on average. This supports the current policy: retain a compact Core and keep all five full workflows user-invoked.

### Claude Code evidence

- Claude Code 2.1.197 passed `claude plugin validate . --strict`.
- A session-only `--plugin-dir` run loaded `engineering-flow`, exposed all five released workflows, and ran SessionStart and UserPromptSubmit successfully without changing user-global plugin configuration.
- Explicit `/engineering-flow:develop` loaded the full workflow, read the fixture, presented refuse/cascade/orphan choices, asked for the material policy, and left the worktree clean. The deterministic ambiguity scorer passed.
- Four exploratory ordinary-prompt runs across Core wording/output experiments chose a `RESTRICT` policy and edited code. Stronger wording and structured SessionStart output did not correct that current provider/model behavior, so those no-op experiments were reverted.

Claude explicit workflow routing is therefore live-validated, while Core-only parity with Codex is not. Documentation and release claims must preserve that distinction.

### Final deterministic gates

- `npm test`: 36/36 passed.
- Claude strict plugin validation passed.
- All five released skills remain user-invoked on both platforms, and both manifests expose the same released set.
- The generic skill/plugin creator validators do not accept this package's shared Claude frontmatter or current Codex hooks manifest shape; repository metadata tests, repeated Codex installation/behavior runs, and Claude's official validator are the applicable gates.

## 2026-07-26 — Claude duplicate-injection fix and Windows harness portability

Duplicate-injection evidence and fix:

- A live headless Claude Code run (`--plugin-dir`, prompt-leading `/engineering-flow:handoff`) placed the full `SKILL.md` in context twice: once from native slash-command expansion in the user message and once from the UserPromptSubmit hook as `hook_additional_context`.
- The hook now skips the skill named by a prompt-leading `/engineering-flow:<skill>` token because the host expands it natively. Re-run evidence on Claude: leading command produced exactly one workflow copy with zero hook injections; a mid-prompt `/engineering-flow:handoff` reference produced exactly one copy via one hook injection.
- `$engineering-flow:<skill>` tokens are unaffected, so documented Codex invocation is unchanged. A prompt-leading `/engineering-flow:<skill>` on Codex now relies on host expansion instead of hook injection; documented Codex usage remains `$engineering-flow:<skill>`, and a Codex smoke of the leading-slash form is still pending.

Windows portability corrections:

- The `npm test` script used a glob (`node --test tests/*.test.js`) that cmd.exe does not expand and Node 20 does not resolve; it now runs `node --test tests/`.
- `spawnSync('npm', …)` in the fixture tests, the regression-sensitivity scorer, and the Codex runner now uses a shell on Windows, where `npm` resolves to `npm.cmd`.
- The regression-sensitivity scorer treated a failed spawn (`status === null`) as a mutation-sensitive test; a spawn failure no longer counts as sensitivity evidence.
- Full deterministic suite on Windows after these corrections: 37/37 (36 prior tests plus the new leading-slash routing test).
