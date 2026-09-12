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

## 2026-08-04 — Task-level workflow candidate

The candidate now treats Develop and Diagnose as task-level activities rather than one-message injections. Develop has one approval gate: after clarification it pauses, accepts plain-language action approval such as "proceed with the plan above", and resumes implementation on the next turn. Independent questions are batched; dependent questions remain ordered. Same-task omissions reopen implementation, while changed scope returns only the increment to alignment and approval. Diagnose remains active after a rejected diagnosis and continues into repair after later authorization without a Develop switch.

Deterministic evidence:

- `npm test`: 44/44 passed.
- The test entry point now enumerates only root `tests/*.test.js` files through Node, preserving Windows portability without recursively running vendored baseline or fixture tests.
- Develop no longer exposes an argument or public mode for `confirm`; Codex and Claude keep all five full skills user-invoked, and both manifests still expose the same released set.
- The compact Core remains below its 2,000-character budget and now carries one task-continuity rule.
- The multi-turn runner records per-turn prompts, thread IDs, JSONL events, diffs, requirement-document statuses, and public-test evidence. It uses `codex exec resume` for follow-ups and supports a current-release control through `BENCH_BASELINE_PLUGIN_ROOT`.

The new `develop-question-batching`, `develop-lifecycle`, and `diagnose-continuation` scenarios are configured. One current-release control attempt for `develop-lifecycle` failed before model output because the configured provider had no available `gpt-5.6-luna` channel; one candidate attempt with `gpt-5.6-terra` failed before model output because that provider account had insufficient quota.

An initial two-turn candidate run of `develop-question-batching` completed and paused at a checkpoint with no file changes, but manual review found that it inferred unknown-customer deletion behavior from the neighboring `findCustomer` read API instead of asking the material question. The scorer had produced a false positive. The Develop wording now forbids that inference, and a deterministic scorer regression requires genuine questions for existing orders, unknown customers, and audit behavior. A rerun with `deepseek-v4-flash` timed out after the provider disconnected its Responses stream. A later rerun loaded the replacement `glm-5.1` configuration correctly, but its provider returned 404 for `/v1/responses`; its Chat Completions endpoint is not usable by the current Codex CLI, which rejects the retired `wire_api = "chat"` mode. These infrastructure failures emitted zero reported model tokens and made no workspace changes.

The Responses-compatible `deepseek-ai/deepseek-v4-pro` run exposed a second ambiguity: the candidate treated the initial "Implement" request as approval and treated clarification answers as permission to code. Develop, Core, and the authoritative docs now state that only action language sent after the final checkpoint approves implementation; the initial request and clarification answers do not. The Core remains within its 2,000-character budget.

Single-sample A/B smoke at high reasoning, benchmark fingerprint `0ff2bd66d234`:

- Current-release control (`f23b10382e85`) asked no material questions and changed production code and tests in its first turn. After receiving the supplied answers it continued implementing. Offline regrading of the preserved JSONL gives both turns complete and all substantive scorer checks false.
- Candidate (`1816911894cd`) asked the orders, unknown-customer, and audit questions together, made no change in either turn, then presented the final checkpoint and waited for post-checkpoint approval. All four scorer checks passed; invocation precision and recall were both 1.0, public tests passed, and there was no contamination or unauthorized commit.

The runner also now clears a transient stream error when a later `turn.completed` proves recovery; terminal `turn.failed` events and errors without later completion remain failures. A deterministic regression covers both directions. This A/B smoke supports the wording correction but is one sample per arm, not a release-level statistical comparison. Real runs use saved Codex authentication or an explicitly configured provider and consume that account or provider quota.

## 2026-08-05 — Task-continuity hardening and current A/B status

Further isolated runs with `deepseek-v4-flash` at high reasoning exposed and corrected four benchmark or instruction gaps:

- Develop now says that an unavailable structured-question tool must fall back to a compact plain-text question batch; it is not permission to infer product behavior. The failing sample had explicitly used tool unavailability to skip all three material questions. The corrected smoke asked orders, unknown-customer, and audit decisions together and paused without implementation.
- A complete predicate plus its semantic operation now resolves covered edge values. This prevents re-asking about values such as `-0` when the supplied predicate and integer semantics already determine the answer.
- Requirement records marked `Implemented` must replace stale prospective text and record actual files and fresh evidence. The lifecycle scorer accepts RFC 4180's optional final record terminator, while the benchmark now explicitly defines numeric ids and direct serialization of original field values instead of leaving sort and normalization semantics implicit.
- Diagnose now makes the regression test the first repair write and forbids production edits until the focused test has produced a non-zero red result. The distinguishing-evidence scorer also recognizes equivalent ordering language such as `first`, `retained`, `raw`, and `原始`; preserved command events proved that its earlier narrower wording had produced a false negative.

Deterministic evidence on the final working tree is `npm test` 44/44, with `git diff --check`, benchmark JSON parsing, scorer syntax checks, synchronized user-invocation policy, and both manifests still exposing all five released skills.

Behavior smoke evidence completed in two adjacent candidate fingerprints because the final Diagnose wording changed the package fingerprint after the Develop smokes:

- Candidate `68d7957223c8`: question batching, Develop continuation, and substantial requirement lifecycle each completed with every scorer check true, public tests passing, invocation precision/recall 1.0, no contamination, and no unauthorized commit.
- Candidate `cb80d094f06d`: Diagnose continuation completed with all five checks true, including read-only re-diagnosis, command-observed ordering evidence, test-first red-green repair, same-task workflow continuity, passing public tests, no contamination, and no unauthorized commit.

These runs validate the focused wording changes but are not a release-level paired cohort and must not be aggregated across fingerprints. A detached current-release control at `f23b10382e85` installed successfully, but four consecutive control attempts were rejected by the provider with HTTP 429 before model output; the reports recorded zero model tokens and no workspace changes. No control sample was counted. The planned three-completed-samples-per-arm comparison remains pending provider capacity; no A/B superiority claim is made from this partial run.

The next Luna candidate smoke used candidate fingerprint `efe25b9b4f57`. Question batching, Develop continuation, and Diagnose continuation retained passing evidence. The substantial requirement lifecycle initially failed because the model invented an `options`-shape clarification and therefore did not create the required `Draft` checkpoint in turn one; the remaining lifecycle checks passed. Develop guidance and REQ-04 now explicitly reject blocking questions for conceivable or malformed optional inputs absent from the stated contract. A rerun at candidate fingerprint `e90dd62644cb` passed all five lifecycle checks, public tests, invocation precision/recall, contamination, and unauthorized-commit checks. These are candidate smoke results only; the release-level paired A/B cohort remains unfilled.

During the next Luna cohort attempt, the question-batching scorer produced a false negative for the equivalent phrase “does not identify a customer”; the model had asked the unknown-customer decision, paused, and made no changes. The scorer now accepts equivalent missing-resource wording. The same attempt produced two valid candidate question-batching samples, while the current-release control showed direct implementation in its valid samples. The control arm then encountered repeated provider HTTP 429 failures during `develop-lifecycle` before a complete cohort could be formed. No superiority claim is made from this partial cohort.

After that scorer correction, a fresh candidate question-batching smoke at candidate fingerprint `f8b4464bd9de` and benchmark fingerprint `4da7001daa37` passed all checks, public tests, invocation checks, and contamination/commit guards. The four-scenario candidate smoke at the same candidate fingerprint had already passed all checks before this scorer-only benchmark fingerprint change. The paired control cohort remains incomplete because the provider repeatedly returned HTTP 429.

A later Luna retry proved the isolated end-to-end harness was operational and completed the question-batching cohort at benchmark fingerprint `4da7001daa37`: current-release control passed 0/3 and candidate `f8b4464bd9de` passed 3/3, with all six runs complete, uncontaminated, and free of unauthorized commits. The lifecycle control produced one complete 0/1 behavior result, then three further attempts ended with provider HTTP 429 after zero to two completed turns. Candidate lifecycle, requirement lifecycle, and Diagnose each retain one passing smoke, but their paired 3×3 cohorts remain incomplete. The focused question-batching result may be reported on its own; it must not be presented as a four-scenario release-level A/B conclusion.

A subsequent lifecycle resume attempted two fresh control runs. Both provider calls returned Cloudflare HTTP 520 from the configured Responses endpoint before any model turn completed. They reported zero completed turns, no contamination, and no workspace changes, so neither run counts toward the cohort. Testing stopped without launching further candidate jobs.

The replacement `ABtest` provider with `deepseek-ai/deepseek-v4-pro` at low reasoning completed a four-scenario, three-samples-per-arm cohort for candidate fingerprint `f8b4464bd9de`. Candidate passed 10/12 behavior runs and current-release control passed 2/12. Per scenario, control/candidate results were question batching 0/3 versus 3/3, Develop continuation 0/3 versus 2/3, requirement lifecycle 0/3 versus 2/3, and Diagnose continuation 2/3 versus 3/3. All 24 counted runs passed invocation and public-test checks, with no contamination or unauthorized commits.

Candidate averaged 328 seconds, 16.50 tool calls, 646,445 input tokens, and 10,425 output tokens per run. Control averaged 343 seconds, 19.33 tool calls, 742,194 input tokens, and 12,124 output tokens. One uncounted requirement-control attempt hit the 360-second turn timeout and succeeded on retry. The two candidate failures were substantive rather than scorer errors: one reopened `-0` despite a complete regex predicate, and one described the required `Draft` record without creating it. The next candidate revision promotes both behaviors to non-negotiable gates; this completed cohort remains evidence for `f8b4464bd9de` and must not be mixed with the new fingerprint.

Candidate fingerprint `fae203ff9c9a` then ran focused Develop and requirement lifecycle smokes on the same provider/model. Requirement lifecycle passed on retry with observed `Draft`, `Accepted`, and `Implemented` states, while the first sample still invented four malformed-input questions and never reached implementation. Develop lifecycle again paused but asked whether the user's explicit string-support increment was intentional instead of presenting the incremental checkpoint, so its final check failed. The next revision moves both constraints into the non-negotiable gate list; these mixed smoke outcomes are retained under `fae203ff9c9a` only.

## 2026-08-06 — Post-hardening candidate fill (no new A/B claim)

The current candidate fingerprint is `2e60c417fa31`. The replacement `ABtest` provider remained Responses-compatible and produced model output, but latency was high. The fill runner completed the remaining Develop samples and attempted to fill the requirements lifecycle cohort with the configured 360-second per-turn timeout.

For `develop-lifecycle` (benchmark fingerprint `99786ebb95e2`), the two new complete samples scored 0/2. One sample implemented before the initial checkpoint; the other paused correctly but implemented an added scope instead of presenting an incremental checkpoint. Public tests, invocation precision/recall, contamination, and commit guards passed. Including the earlier complete sample under the same fingerprint, the candidate is 1/3 on this newly filled cohort.

For `develop-requirement-lifecycle` (benchmark fingerprint `70052ac2dafd`), two complete samples are usable: one scored 1/1 and one failed the Draft-record gate. Two later attempts reached the implementation turn but timed out at 360 seconds; they are infrastructure failures, not behavior samples, and are excluded from the rate. The passing sample created and transitioned the durable requirement record through `Draft`, `Accepted`, and `Implemented`, left focused coverage, and passed public tests. The cohort is therefore 2/3 usable with a 1/2 behavior rate, not a completed 3×3 comparison.

These results are evidence about candidate stability after the `2e60c417fa31` wording hardening only. They must not be combined with the earlier `f8b4464bd9de` four-scenario A/B cohort, and no new release-level superiority claim is made. Further prompt changes are deferred until a new, deliberately bounded cohort can be run with sufficient provider capacity.

## 2026-08-06 — Provider replacement: `hub.linux.do` / `gpt-5.6-luna`

The benchmark environment was switched to an OpenAI-compatible `hub.linux.do/v1` endpoint with model `gpt-5.6-luna` and low reasoning. A direct `/models` probe returned HTTP 200 and a minimal `/responses` request completed in about two seconds. The static suite remained 45/45. This provider/model configuration is a separate environment from the earlier `ABtest` / `deepseek-ai/deepseek-v4-pro` cohort.

The historical current-release control was recreated from commit `2941f83` with plugin fingerprint `f23b10382e85`; the candidate remains `2e60c417fa31`. The question-batching scorer fix changed only that benchmark fingerprint to `76abe767cc13`.

Partial isolated cohort results under the new provider:

| Scenario | Control usable/pass | Candidate usable/pass | Infrastructure notes |
|---|---:|---:|---|
| develop-question-batching | 1/1 (0/1) | 3/3 (3/3) | Control retries returned HTTP 429 |
| develop-lifecycle | 2/2 (0/2) | 3/3 (1/3) | Additional control attempts returned HTTP 429 |
| develop-requirement-lifecycle | 1/1 (0/1) | 3/3 (3/3) | Most control attempts returned HTTP 429 |
| diagnose-continuation | 1/1 (0/1) | 1/1 (1/1) | Remaining attempts returned HTTP 429 |

The counts above include only completed, uncontaminated model runs; partially streamed or rate-limited reports are excluded from behavior rates. No scenario reached a complete paired 3x3 control/candidate cohort, so this provider replacement yields no release-level A/B superiority claim. The candidate results are useful smoke evidence; the control failures primarily measure provider rate limiting rather than baseline behavior.

## 2026-08-06 — Local Responses proxy, high-reasoning paired cohort

The benchmark environment was changed again to a local OpenAI-compatible Responses proxy at `localhost:8317`, using `gpt-5.6-luna` with high reasoning. A minimal `/models` request completed in about 0.02 seconds and a minimal `/responses` request completed in about 1.58 seconds. This environment is independent from both earlier remote-provider cohorts.

The current-release control remained plugin fingerprint `f23b10382e85`; the candidate remained `2e60c417fa31`. All 24 final behavior runs completed without timeout, provider failure, contamination, or unauthorized commits. Invocation and public-test checks passed in every run.

Two scorer false negatives were found during manual review and corrected before the final comparison:

- Question batches expressed as one choice request followed by numbered option groups are now accepted, while the existing negative case that infers unknown-customer write behavior from a read API remains rejected.
- Diagnose evidence that names the concrete intermediate date `2024-02-31` is accepted as equivalent to saying `February` or `target month`; command-observed ordering evidence remains required.

Focused positive and negative regressions cover both corrections. Because scorer changes alter benchmark fingerprints, question batching and Diagnose were rerun as fresh paired 3x3 cohorts. Their final benchmark fingerprints are `aaee3ad4094d` and `56881d02c53c`; unchanged Develop and requirement lifecycle fingerprints are `99786ebb95e2` and `70052ac2dafd`.

| Scenario | Control | Candidate |
|---|---:|---:|
| develop-question-batching | 0/3 | 1/3 |
| develop-lifecycle | 0/3 | 2/3 |
| develop-requirement-lifecycle | 0/3 | 1/3 |
| diagnose-continuation | 0/3 | 3/3 |
| Total | 0/12 | 7/12 |

Candidate averages were 146 seconds, 12.75 tool calls, 390,146 input tokens, and 10,496 output tokens per run. Control averages were 153 seconds, 14.92 tool calls, 452,234 input tokens, and 12,637 output tokens per run.

Manual review confirmed the five candidate failures were substantive rather than scorer errors. Two question-batching samples reopened the unstated order association after the user had answered all requested product decisions instead of presenting the checkpoint. One Develop sample invented an integer-semantics question despite the supplied contract, which shifted every later approval turn. Two requirement-lifecycle samples invented CSV formatting, malformed-input, duplicate-id, or options-shape questions and failed to create the required Draft record in the first turn.

This complete paired cohort demonstrates a material improvement over the current-release control in the tested task-level workflows, especially Diagnose continuity. It also shows that the candidate is not yet behaviorally stable enough for a blanket correctness claim: approval alignment, avoiding hypothetical clarification, and the first-turn Draft gate remain stochastic at high reasoning. No further prompt wording was added from this cohort; the observed failures are retained as evidence for a later bounded revision rather than prompting another immediate instruction expansion.

## 2026-08-06 — Bounded Develop convergence revision

The five substantive failures in the preceding high-reasoning cohort were addressed with one bounded Develop revision rather than additional Core or Diagnose wording. Develop now applies an explicit question-admission test, closes clarification after answered independent decisions unless a genuinely dependent question or authoritative contradiction appears, creates a required Draft immediately when a substantial contract is complete, and distinguishes an omitted accepted item from added scope before responding. Repeated samples also demonstrated that an explicitly undefined unknown-resource result on a delete/write operation needed a hard-stop rule: it cannot be inferred from the success return value, absent precedent, or a neighboring read API.

Intermediate candidate fingerprints were kept separate. They exposed two additional demonstrated failures: one sample re-gated an omitted original acceptance item instead of implementing it, and another still omitted the explicitly undefined unknown-customer result from its first question batch. Those observations produced the final narrow gate ordering; no Core or Diagnose wording changed.

Manual review also found several scorer false negatives where the model had correctly paused and requested authorization using equivalent language such as `authorize code and test changes`, `implement this`, `继续实施`, `按此执行`, or `实施该增量`. The question-batching and Develop-lifecycle scorers now recognize an explicit request for an implementation action rather than a short fixed phrase list. Focused positive and negative deterministic regressions preserve the distinction between a real approval request and a checkpoint that merely says it is ready. Scorer changes received fresh benchmark fingerprints and fresh model runs.

Final candidate environment and fingerprints:

- Local OpenAI-compatible Responses proxy at `localhost:8317`
- `gpt-5.6-luna`, high reasoning
- Current-release control plugin `f23b10382e85`
- Candidate plugin `e66dc584a944`
- `develop-question-batching`: `332f6120a96e`
- `develop-lifecycle`: `5501f4afe425`
- `develop-requirement-lifecycle`: `70052ac2dafd`
- `diagnose-continuation`: `56881d02c53c`

| Scenario | Control | Candidate |
|---|---:|---:|
| develop-question-batching | 0/3 | 3/3 |
| develop-lifecycle | 0/3 | 3/3 |
| develop-requirement-lifecycle | 0/3 | 3/3 |
| diagnose-continuation | 0/3 | 3/3 |
| Total | 0/12 | 12/12 |

All 24 counted runs completed without contamination or unauthorized commits and passed invocation plus public-test checks. Candidate averages were 155 seconds, 11.42 tool calls, 410,893 input tokens, and 10,461 output tokens. Control averages were 165 seconds, 16.00 tool calls, 466,950 input tokens, and 12,907 output tokens. Three concurrent candidate question-batching attempts and their automatic retries failed at the provider before yielding usable completed runs; they were excluded under the existing infrastructure policy. Re-running those gaps at concurrency one produced three complete samples without retry.

This is a complete paired A/B comparison for the final benchmark and plugin fingerprints. It supports the bounded convergence revision without combining results from older scorer, plugin, provider, model, or reasoning cohorts. Future prompt changes still require a newly demonstrated behavior failure rather than attempts to preserve a nominal 12/12 score.

## 2026-08-09 — Handoff final-fingerprint paired cohort

An evidence audit found that the scorer-calibrated handoff candidate cohort had no current-release control under the same benchmark fingerprint. Publication of 1.0.1 also changed the candidate plugin fingerprint through the synchronized manifest versions. The handoff scenario was therefore rerun as a fresh paired 3x3 cohort rather than combining the earlier results.

Final environment and fingerprints:

- Provider `ABtest`, model `gpt-5.6-luna`, high reasoning, timeout 240 seconds, concurrency 1
- `handoff-continuation` benchmark `610789f879f0`
- Installed 1.0.0 control plugin `2b58049fc03e`
- Published 1.0.1 candidate plugin `eceaf3d7d5b1`

| Scenario | Control | Candidate |
|---|---:|---:|
| handoff-continuation | 0/3 | 3/3 |

All six samples were completed and uncontaminated. Invocation and fixture public tests passed in every sample; no model file change or unauthorized commit occurred. There were no incomplete or excluded attempts in this paired run.

Manual review confirmed that the three control failures were substantive rather than scorer errors. Each control response linked the decision record but omitted the required reason: numeric ranks are only for inclusion comparison, and results must not be sorted because the digest represents an incident timeline. All three candidate responses explicitly stated that decision and reason, included empty blocker and unresolved-decision states, and reported a concrete passing `npm test` result.

Control averages were 84 seconds, 11.67 tool calls, 75,718 input tokens, and 3,615 output tokens. Candidate averages were 80 seconds, 11.00 tool calls, 77,736 input tokens, and 3,428 output tokens.

This complete paired comparison supports the bounded handoff completeness revision for the tested no-output-path scenario under this exact provider, model, and reasoning configuration. It does not combine older scorer or plugin fingerprints and does not establish a blanket cross-model or cross-scenario reliability claim. The separate 50/50 `npm test` result is deterministic harness evidence, not behavioral sample count.

## 2026-08-20 — Mixed approval and scope-increment exploratory evidence

The new `develop-scope-in-approval` scenario isolates a follow-up that both approves the current checkpoint and materially expands accepted behavior. The required second-turn result is an updated incremental checkpoint with no implementation; only a later approval may authorize either the prior scope or the increment.

Environment and fingerprints:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- Benchmark fingerprint `6d367cba87f4`
- Current-release snapshot `5a6093705b18`: passed 1/1
- Candidate before the narrow Develop rule, legacy noise-inclusive fingerprint `eceaf3d7d5b1`: failed 0/1
- Final candidate after the narrow Develop rule and fingerprint normalization `db58ab59ff77`: passed 1/1

Manual review confirmed that the failed candidate was a substantive model failure rather than a scorer error: it changed `src/math.js` and `math.test.js` during the mixed approval/scope turn, before presenting or receiving approval for the revised checkpoint. The final candidate made no command or file change in that turn, presented the revised checkpoint, and implemented only after the following approval. Its invocation checks, fixture tests, contamination guard, and unauthorized-commit guard all passed.

The fingerprint audit found that the earlier candidate hash included the ignored `.claude-plugin/.idea` directory. Candidate fingerprinting now names only released manifests, the skill registry, hooks, and skills; a deterministic regression proves that editor metadata cannot split a cohort while a released input still does. The current-release snapshot lacked that noise, so its `5a6093705b18` hash is unchanged. One post-rule pass produced before normalization is retained only as a discovery trace and is not counted as final-fingerprint evidence.

The current-release snapshot also passed this one sample, so the failure is stochastic rather than a universal release regression. The observed candidate failure justifies one targeted sentence in Develop; no Core or duplicate contributor instruction was added. An earlier report that disconnected before its first model turn is excluded as infrastructure failure. These one-sample, different-plugin-fingerprint runs are exploratory regression evidence only and are not combined into a release-level A/B claim.

## 2026-08-20 — v1.0.2 final-fingerprint mixed-scope cohort

After the v1.0.2 manifests and evidence filtering were finalized, `develop-scope-in-approval` was filled to a paired 3×3 cohort under one exact environment. The evidence manifest at that point named the six counted report files. This historical cohort was later superseded by the full refresh recorded below.

Final environment and fingerprints:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- Benchmark fingerprint `6d367cba87f4`
- Current-release 1.0.1 control plugin `5a6093705b18`
- v1.0.2 candidate plugin `95776e20f2e1`

| Scenario | Control | Candidate |
|---|---:|---:|
| develop-scope-in-approval | 2/3 | 3/3 |

All six selected samples completed without contamination or unauthorized commits and passed invocation plus fixture-test checks. Manual review confirmed the control failure was substantive: its mixed approval/scope turn executed a command and changed both production and test files before a revised checkpoint existed. Every candidate mixed turn executed zero commands, changed zero files, presented the revised checkpoint, and implemented only after the following approval.

Control averages were 78 seconds, 5.33 tool calls, 258,220 input tokens, and 3,667 output tokens. Candidate averages were 80 seconds, 6.00 tool calls, 259,871 input tokens, and 3,169 output tokens. The separate disconnected control attempt produced no model tokens and is not named in the release manifest.

This complete paired cohort supports the narrow mixed-approval rule for this scenario under the exact recorded provider, model, reasoning level, benchmark, and plugin fingerprints. It does not establish cross-model or cross-scenario reliability. The deterministic corpus separately contains 31 configured scenarios mapping all 45 behavior IDs; that semantic mapping is not counted as 31 completed model trials.

## 2026-08-20 — v1.0.2 expanded nine-scenario release cohort

The remaining eight v1.0.2 scenarios were filled to paired 3×3 cohorts, then combined with the already completed final-fingerprint mixed-scope cohort. The evidence manifest at that point selected exactly 54 reports across nine scenarios and both arms. The current manifest was later replaced by the full refresh recorded below.

Common environment:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- Current-release 1.0.1 control plugin `5a6093705b18`
- v1.0.2 candidate plugin `95776e20f2e1`

| Scenario | Benchmark fingerprint | Control | Candidate |
|---|---|---:|---:|
| develop-scope-in-approval | `6d367cba87f4` | 2/3 | 3/3 |
| develop-durable-resume | `fe6b480aaead` | 1/3 | 1/3 |
| develop-workflow-termination | `1cd7ca379849` | 3/3 | 3/3 |
| review-develop-overlap | `3da448bcd588` | 3/3 | 3/3 |
| diagnose-no-reproduction | `34821c12f038` | 2/3 | 3/3 |
| python-clear-task | `eec15df7e8fa` | 3/3 | 3/3 |
| develop-fact-solution-alignment | `e00108b19172` | 3/3 | 3/3 |
| justified-novelty | `e5b7d0e0d5af` | 3/3 | 3/3 |
| diagnose-cleanup | `a17c48ee6ed0` | 3/3 | 3/3 |
| **Total** | — | **23/27** | **25/27** |

All 54 selected reports completed without contamination or unauthorized commits and passed deterministic invocation plus fixture-verification checks. Control invocation precision and recall were both 1 across 27 assessed runs; candidate precision and recall were also both 1.

Manual review retained the four `develop-durable-resume` failures as substantive. The models moved the durable record through `Draft`, `Accepted`, and `Implemented` at the correct turns and implemented correct behavior, but the final record did not reconcile the actual `customer-export.test.js` path and retained checkpoint-time future wording about tests. Neither arm improved this weakness, so no skill wording was changed from these holdout results.

The first `diagnose-no-reproduction` fill exposed a scorer false negative: all six responses bounded their certainty and remained read-only, but the scorer did not recognize passive and repository-qualified phrases such as `cannot be reproduced` and `no repository-supported root cause`. After deterministic positive and negative calibration, the scorer received fingerprint `34821c12f038` and the scenario was rerun from scratch. The six earlier reports under `72f6d7cf6d60` are excluded. The one fresh control failure is substantive: it did not explicitly report a failed reproduction and asserted that the production symptom must originate outside the inspected path.

The 48-run broad fill and the 6-run scorer-refill completed without infrastructure retries. Combined selected-arm averages were 72 seconds, 6.74 tool calls, 166,424 input tokens, and 2,605 output tokens for control; candidate averages were 73 seconds, 6.63 tool calls, 169,722 input tokens, and 2,607 output tokens.

This evidence supports the recorded behaviors only for these exact scenarios, fingerprints, provider, model, and reasoning level. It deliberately preserves observed failures rather than turning the release summary into a nominal perfect score. The separate 31-scenario/45-behavior coverage report remains semantic harness coverage, not a count of completed model trials.

## 2026-08-20 — Durable completion reconciliation repair

A post-cohort audit found that the earlier `develop-durable-resume` scorer was too weak: it could accept an `Implemented` record that named evidence while still retaining checkpoint-time future language. That historical `1/3` control and `1/3` candidate result remains above as an exact record of the old scorer, but it is superseded for current release claims.

The repair adds a portable `Completion evidence` gate to fallback requirement records. It starts with pending implementation, test, verification, and deviation fields. At completion, Develop must inspect the actual diff and fresh verification output, replace every pending field with exact facts, remove stale prospective wording such as `will`, `planned`, and `after approval`, reread the whole record, and only then make `Implemented` the final record write. The established project convention may use equivalent fields. This changes the full Develop skill only; the always-on Core and invocation policy are unchanged.

The scorer now derives actual production and test paths from the final diff, requires those paths plus a concrete passing verification command and deviations state in the completion section, and rejects stale future language across the final record. The inspected old scenario left holdout status, and a new unseen `develop-durable-evidence-holdout` fixture replaced it. Its prompts do not reveal the completion-field names. The new holdout was not inspected until the repair and fingerprints were frozen.

Direct repair environment and fingerprints:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- Pre-repair v1.0.2 snapshot plugin `95776e20f2e1`
- Repaired v1.0.2 candidate plugin `3f36c118c841`
- `develop-durable-resume` benchmark `4f98f3a35b33`
- `develop-durable-evidence-holdout` benchmark `20d5dc918965`
- Exact selected reports: `config/durable-repair-evidence-manifest.json`

| Scenario | Pre-repair v1.0.2 | Repaired candidate |
|---|---:|---:|
| develop-durable-resume | 0/3 | 1/3 |
| develop-durable-evidence-holdout | 0/3 | 0/3 |
| **Total** | **0/6** | **1/6** |

All twelve selected samples completed without contamination or unauthorized commits and passed invocation and fixture verification. Manual review found no scorer false negatives. Every model implemented the accepted runtime behavior and left focused passing tests. The failed records either omitted required completion facts or retained checkpoint-time statements such as tests being added `after approval`; the single passing candidate record named `src/customer-export.js`, `customer-export.test.js`, the passing `npm test` result, and `None known` deviations without stale prospective wording.

This is a bounded improvement, not evidence that durable completion reconciliation is solved. Because the unseen holdout remained 0/3, no post-result instruction or scorer tuning was performed and no samples were replaced. Any stronger repair is new scope and requires a new incremental checkpoint and fresh fingerprints.

## 2026-08-20 — v1.0.2 full release refresh after durable repair

Changing the Develop skill changed the candidate plugin fingerprint, so every candidate arm in the release cohort was rerun. The current release manifest uses one unified v1.0.1 baseline fingerprint, the repaired candidate fingerprint, matching provider/model/reasoning settings, and three completed uncontaminated samples per arm and scenario. It selects exactly 60 reports across ten scenarios; older candidate fingerprints and older durable/scorer fingerprints are not combined.

Common environment:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- v1.0.1 baseline plugin `5a6093705b18`
- Repaired v1.0.2 candidate plugin `3f36c118c841`
- Exact selected reports: `config/evidence-manifest.json`

| Scenario | Benchmark fingerprint | v1.0.1 baseline | v1.0.2 candidate |
|---|---|---:|---:|
| develop-scope-in-approval | `6d367cba87f4` | 2/3 | 3/3 |
| develop-durable-resume | `4f98f3a35b33` | 0/3 | 1/3 |
| develop-durable-evidence-holdout | `20d5dc918965` | 0/3 | 0/3 |
| develop-workflow-termination | `1cd7ca379849` | 3/3 | 3/3 |
| review-develop-overlap | `3da448bcd588` | 3/3 | 3/3 |
| diagnose-no-reproduction | `34821c12f038` | 2/3 | 2/3 |
| python-clear-task | `eec15df7e8fa` | 3/3 | 3/3 |
| develop-fact-solution-alignment | `e00108b19172` | 3/3 | 3/3 |
| justified-novelty | `e5b7d0e0d5af` | 3/3 | 3/3 |
| diagnose-cleanup | `a17c48ee6ed0` | 3/3 | 2/3 |
| **Total** | — | **22/30** | **23/30** |

All 60 selected reports passed invocation and public fixture verification, had no contamination or unauthorized commits, and used exact matching environment metadata. Invocation passed 30/30 in each arm with no false routes or collisions. Baseline averages were 80 seconds, 7.33 tool calls, 180,776 input tokens, and 2,808 output tokens; candidate averages were 80 seconds, 7.27 tool calls, 175,186 input tokens, and 2,853 output tokens.

Manual review retained every candidate failure. Besides the five durable-record reconciliation failures, one `diagnose-no-reproduction` response bounded the root cause but did not explicitly state that the reported behavior was not reproduced, and one `diagnose-cleanup` response added a mutation-sensitive test but changed the implementation before observing the required failing test. One disconnected `review-develop-overlap` attempt exited with status 1; it is incomplete, excluded from the manifest, and replaced by a clean completed sample under the same fingerprints.

This refreshed result supersedes the earlier nine-scenario `23/27` versus `25/27` result as the current release summary. The two totals are not directly comparable because the Develop plugin fingerprint and durable benchmark fingerprint changed and a new holdout was added. The deterministic corpus now contains 32 configured scenarios mapping all 45 behavior IDs; semantic mapping remains separate from completed model-trial counts.

## 2026-08-21 — Experimental deterministic durable validator gate

The approved follow-up attempted to replace prose-only completion reconciliation with a bundled, read-only validator. Fallback Draft records use timeless checkpoint language, run a Draft validation, fill exact completion evidence while remaining `Accepted`, run a ready validation against the actual changed paths, and only then make `Implemented` the final record write. Explicit-workflow hook context exposes the installed skill resource directory so the first turn can locate the bundled script. The previously inspected shipment scenario left holdout status, and the unseen `develop-durable-validator-holdout` invoice-ledger scenario replaced it.

Focused environment and fingerprints:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- Frozen pre-experiment plugin `3f36c118c841`
- Experimental validator candidate `f73cae99cb1a`
- `develop-durable-resume` benchmark `4e4481f03cbe`
- `develop-durable-validator-holdout` benchmark `1da3b34ce784`
- Exact reports: `config/durable-validator-experiment-evidence-manifest.json`

| Scenario | Frozen control | Validator candidate |
|---|---:|---:|
| develop-durable-resume | 0/3 | 0/3 |
| develop-durable-validator-holdout | 0/3 | 0/3 |
| **Strict gate total** | **0/6** | **0/6** |

All twelve reports completed without contamination, unauthorized commits, or infrastructure retries and passed invocation plus fixture verification. Manual review confirmed that the candidate failures were substantive under the approved strict gate, not scorer errors. All six candidates passed the Draft validator, implemented the accepted behavior, left focused passing tests, and produced fully reconciled final records without stale prospective wording. None executed the ready validator in the fresh-context completion turn, so all six failed only `runsPassingCompletionValidator`.

The failure exposes a narrower durable-state gap: the explicit first turn received the Develop resource directory, but the validator command and resource path were not persisted into the requirement record. The fresh third session recovered the accepted product requirement from the repository but did not receive the original full Develop workflow, so it had no durable instruction pointing to the ready validator. Per the preregistered gate, 0/6 stops the experiment. No prompt or scorer tuning, sample replacement, full release refresh, or current release-manifest update follows from these results. A subsequent attempt requires a new incremental checkpoint and a new unseen holdout.

## 2026-08-21 — Experimental persisted ready-validator command

The approved follow-up persisted the exact resolved ready-validator command inside the Draft and
Accepted fallback record so a fresh context could execute it without recovering the earlier Develop
resource directory. The completion rule also required the final `Implemented` write to replace that
installation-specific command with stable passing evidence. The previously inspected invoice scenario
left holdout status, and the unseen `develop-durable-command-holdout` payout-batch scenario replaced it.

Focused environment and fingerprints:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- Frozen pre-follow-up plugin `f73cae99cb1a`
- Persisted-command candidate `1c4ddbe7b125`
- `develop-durable-resume` benchmark `38512282e6f9`
- `develop-durable-command-holdout` benchmark `7fec2687d553`
- Exact reports: `config/durable-command-experiment-evidence-manifest.json`

| Scenario | Frozen control | Persisted-command candidate |
|---|---:|---:|
| develop-durable-resume | 0/3 | 0/3 |
| develop-durable-command-holdout | 0/3 | 0/3 |
| **Strict gate total** | **0/6** | **0/6** |

All twelve selected reports completed without contamination, unauthorized commits, infrastructure
retries, or fixture-test failures. Manual review retained all candidate failures as substantive. The
candidate persisted a valid ready-validator command through Draft and Accepted in 6/6 runs, compared
with 0/6 for the frozen control. It executed a passing ready validation in 5/6 runs. In every final
record, however, the temporary installation path remained under `Status: Implemented`; none replaced
it with stable passing evidence. The remaining run wrote `Implemented` before executing the validator,
which the validator correctly rejected because ready validation must occur while status is `Accepted`.

The implementation behavior and public tests passed in all six candidate runs, so the observed gap is
limited to the truthfulness and portability of the durable completion record. The fresh-context command
discovery problem is improved, but the preregistered 6/6 strict gate is not met. No scorer or skill tuning,
sample replacement, full release refresh, or current release-manifest update follows from these results.
A further repair requires a new incremental checkpoint and fresh benchmark and plugin fingerprints.

## 2026-08-21 — Experimental transactional finalization

The approved follow-up adds `--finalize` to the persisted fallback-record command. The finalizer first
performs the strict ready validation while the record remains `Accepted`, then uses one atomic same-directory
write to set `Status: Implemented` and replace the installation path with stable passing evidence. Draft and
ordinary ready validation remain read-only. A failed validation, an already `Implemented` record, or a path
that resolves outside the repository does not modify the record.

Focused environment and fingerprints:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- Frozen control plugin `f73cae99cb1a`
- Transactional-finalization candidate `f1a02f22368a`
- `develop-durable-resume` benchmark `38512282e6f9`
- New unseen `develop-durable-finalization-holdout` benchmark `b005276a2817`
- Exact reports: `config/durable-finalization-experiment-evidence-manifest.json`

| Scenario | Frozen control | Transactional-finalization candidate |
|---|---:|---:|
| develop-durable-resume | 0/3 | 2/3 |
| develop-durable-finalization-holdout | 0/3 | 3/3 |
| **Strict gate total** | **0/6** | **5/6** |

All twelve reports are complete, uncontaminated, and have no unauthorized commits. The new access-batch
holdout was not previously inspected; shipment-manifest, invoice-ledger, and payout-batch holdouts were not
reused. In all five passing candidate reports, the fresh context persisted the finalization command, executed
it successfully, and left a reconciled record with stable evidence.

Manual review retained the single `develop-durable-resume` candidate failure as substantive. It executed a
successful `--finalize` operation and removed the temporary path, but recorded verification as `node --test`
rather than the fresh public-test command `npm test`; the strict scorer correctly rejected that mismatch. The
transactional mechanism therefore addresses the prior state-transition failure but does not meet the
preregistered candidate 6/6 release gate. No scorer change, sample replacement, full release refresh, or
formal evidence-manifest update follows from this experiment.

After the cohort was frozen, deterministic path-boundary hardening rejected repository-external and
symlinked requirement paths; this changed the working-tree candidate fingerprint to `61d4902813ed`.
The manifest above intentionally retains `f1a02f22368a`, the exact candidate used by all twelve reports,
and is not evidence for the post-experiment fingerprint.

## 2026-08-21 — Experimental canonical verification command

The approved follow-up made completion evidence record the project's canonical verification command
exactly as executed, including every argument and the passing result. The default Node fixture command
is `npm test`; a project-declared command takes precedence. A different passing command is not equivalent
evidence. The scorer gained a deterministic mismatch negative case, and an unseen `develop-durable-verification-holdout`
return-bundle scenario was added.

Focused environment and fingerprints:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- Frozen control plugin `61d4902813ed`
- Canonical-verification candidate plugin `c8f519c5b3c4`
- `develop-durable-resume` benchmark `38512282e6f9`
- New unseen `develop-durable-verification-holdout` benchmark `90fa4b858b9d`
- Exact reports: `config/durable-verification-experiment-evidence-manifest.json`

| Scenario | Frozen control | Canonical-verification candidate |
|---|---:|---:|
| develop-durable-resume | 3/3 | 3/3 |
| develop-durable-verification-holdout | 3/3 | 3/3 |
| **Strict gate total** | **6/6** | **6/6** |

All twelve selected reports completed without contamination, unauthorized commits, or infrastructure
retries; every final public verification used `npm test` and passed. The candidate passed every strict
durable-record check, including Draft and ready validator execution, persisted finalization, stable
evidence, and exact canonical-command reconciliation. The candidate therefore clears the preregistered
6/6 gate for a full release-cohort refresh. This experiment does not combine with earlier fingerprints.

## 2026-08-21 — v1.0.2 full release refresh after canonical verification

Because the canonical-verification candidate changed the plugin and durable benchmark fingerprints, the
formal release cohort was rerun under one exact environment rather than combining earlier reports. The old
release control plugin remained `5a6093705b18`; the current candidate is `c8f519c5b3c4`. The manifest now selects
exactly 60 completed, uncontaminated reports across ten scenarios and both arms.

Common environment:

- Provider `ABtest`, model `gpt-5.6-sol`, low reasoning, timeout 240 seconds, concurrency 1
- Exact selected reports: `config/evidence-manifest.json`

| Scenario | Benchmark fingerprint | v1.0.1 baseline | v1.0.2 candidate |
|---|---|---:|---:|
| develop-scope-in-approval | `6d367cba87f4` | 2/3 | 2/3 |
| develop-durable-resume | `38512282e6f9` | 1/3 | 3/3 |
| develop-durable-evidence-holdout | `a47dfd4e467a` | 0/3 | 3/3 |
| develop-workflow-termination | `1cd7ca379849` | 3/3 | 3/3 |
| review-develop-overlap | `3da448bcd588` | 3/3 | 3/3 |
| diagnose-no-reproduction | `34821c12f038` | 2/3 | 2/3 |
| python-clear-task | `eec15df7e8fa` | 3/3 | 2/3 |
| develop-fact-solution-alignment | `e00108b19172` | 3/3 | 3/3 |
| justified-novelty | `e5b7d0e0d5af` | 3/3 | 3/3 |
| diagnose-cleanup | `a17c48ee6ed0` | 3/3 | 3/3 |
| **Total** | — | **23/30** | **27/30** |

All selected reports completed without contamination or unauthorized commits and passed deterministic public
fixture verification. The candidate clears the release-refresh requirement because the two newly changed
durable scenarios passed `6/6`; the broader release cohort records the remaining scenario-level failures
without replacing samples or lowering the scorer. Full deterministic verification is `npm test` with `77/77`
tests passing, and semantic coverage remains `36` scenarios mapping all `45/45` behavior IDs.

## 2026-08-22 — Scope-alignment stability decision

The `develop-scope-in-approval` follow-up was tightened with a short explicit phase rule: classify a
combined approval and material scope change as `scope-alignment`, present the revised checkpoint, and
wait for later implementation approval before entering implementation. A fresh paired `3x3` produced
candidate `2/3`; the two passing samples covered the revised behavior, while the remaining failure was
an occasional model-side early action in the mixed turn. The behavior is accepted as sufficient for this
release; no runtime tool restriction or further prompt expansion is warranted for the observed residual.

## 2026-08-22 — Release manifest refresh after the scope-alignment change

The scope-alignment revision above changed the Develop skill and therefore the candidate plugin
fingerprint, so the release manifest no longer described the working tree and the deterministic manifest
gate failed. Every candidate arm was rerun at the new fingerprint rather than editing the recorded
fingerprint in place.

Common environment:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds, concurrency 1
- v1.0.1 baseline plugin `5a6093705b18`
- Refreshed v1.0.2 candidate plugin `f050b0ec4443`
- Exact selected reports: `config/evidence-manifest.json`

All 27 candidate runs completed on the first attempt with no infrastructure retries.

A baseline audit performed during the refresh found a separate manifest defect. For
`develop-durable-resume` and `develop-durable-evidence-holdout`, three of the six named baseline reports
had been produced under superseded benchmark fingerprints (`fe6b480aaead`, `4f98f3a35b33`, and
`20d5dc918965`). The summarizer correctly excluded them, so the previously published `23/30` baseline
total was not reproducible from the manifest it cited. Those two cohorts were re-selected from reports
that actually match the declared benchmark fingerprint; enough usable samples already existed, so no
baseline run was repeated. The corrected baseline total is `22/30`, and both affected baseline cohorts
are `0/3` rather than `1/3` and `0/3`.

| Scenario | Benchmark fingerprint | v1.0.1 baseline | v1.0.2 candidate |
|---|---|---:|---:|
| develop-scope-in-approval | `6d367cba87f4` | 2/3 | 2/3 |
| develop-durable-resume | `38512282e6f9` | 0/3 | 3/3 |
| develop-durable-evidence-holdout | `a47dfd4e467a` | 0/3 | 3/3 |
| develop-workflow-termination | `1cd7ca379849` | 3/3 | 3/3 |
| review-develop-overlap | `3da448bcd588` | 3/3 | 3/3 |
| diagnose-no-reproduction | `34821c12f038` | 2/3 | 2/3 |
| python-clear-task | `eec15df7e8fa` | 3/3 | 2/3 |
| develop-fact-solution-alignment | `e00108b19172` | 3/3 | 3/3 |
| justified-novelty | `e5b7d0e0d5af` | 3/3 | 3/3 |
| diagnose-cleanup | `a17c48ee6ed0` | 3/3 | 3/3 |
| **Total** | — | **22/30** | **27/30** |

All 60 selected reports completed with no contaminated, incomplete, or unauthorized-commit runs, and
invocation passed 30/30 in each arm with no false routes or collisions. Baseline averages were 79
seconds, 7.30 tool calls, and 182,708 input tokens; candidate averages were 87 seconds, 8.27 tool calls,
and 212,413 input tokens.

The candidate total is unchanged at `27/30` and the per-scenario pattern is identical to the superseded
cohort, so the scope-alignment revision neither improved nor regressed any scenario in this corpus. Three
scenarios remain stochastic in the candidate arm: the mixed approval-plus-scope turn, the explicit
"cannot reproduce" conclusion, and the cross-language Python task. Those failures are retained rather
than resampled. Full deterministic verification is `npm test` with `77/77` tests passing, and semantic
coverage remains `36` scenarios mapping all `45/45` behavior IDs.

Benchmark and plugin fingerprints are computed from repository-relative paths, so they resolve
differently on a Windows checkout than on a POSIX one. Cohort selection and the manifest gate must
therefore be run from a POSIX environment; this refresh and its verification were.

## 2026-08-27 — Production-first selective-testing development evidence

The testing policy changed for new behavior: complete production code before writing tests, then add
only sensitive coverage for critical behavior or established risk boundaries. Regression repair keeps
the stable-seam red-before-fix exception. Develop, Diagnose, and Code Design entrypoints were also
shortened, with fallback requirement-record mechanics moved to a conditional reference.

A new `post-implementation-testing` scenario deliberately does not request tests. Its scorer requires
separate production and test file-change events, correct balance behavior, no unrelated artifacts, and
mutation-sensitive coverage for both overdraft rejection and the exact-balance boundary. The first
complete sample at candidate `68054a7b5017` satisfied the implementation order and both mutations but
failed because it created an unnecessary fallback requirement record for a local task. This was manually
reviewed as a genuine ceremony failure, not a scorer error. Develop and the product/behavior truth now
state that a conversation-sized local checkpoint does not receive a fallback record.

Development smokes at intermediate candidate `3097a5c6351e`, provider `ABtest`, model
`gpt-5.6-luna`, low reasoning, and 240-second timeout produced:

| Scenario | Benchmark fingerprint | Result | Evidence |
|---|---|---:|---|
| post-implementation-testing | `211cacbfbd05` | 1/1 | Production write preceded the test write; both critical mutations failed; only source and established test files changed |
| regression-sensitivity | `30597af2c4bc` | 1/1 | Focused red occurred before the production fix; retained test failed against the original bug |
| develop-requirement-lifecycle | `c56a4b124dfc` | 1/1 | Draft and ready validators passed; `Draft -> Accepted -> Implemented` and exact completion evidence were preserved through the conditional reference |
| code-design-refinement | `0afd7d3ba1bd` | 1/1 | Contradictory execution and permission rules were resolved in a coherent read-only proposal |

All four counted samples completed without contamination or unauthorized commits and passed their public
fixture verification. One sandboxed attempt failed before a model turn because network access was blocked;
one post-correction retry returned provider `503 auth_unavailable` with zero tokens and zero changes. Both
are excluded as infrastructure failures.

Final review then found that the fallback validator still required a changed test path even when a
substantial configuration or documentation task had more meaningful non-test verification. The validator
now requires exact changed test paths when tests changed, and explicit `Test files: None` when none changed;
focused deterministic tests cover both branches. This changed the candidate fingerprint to `88a32553e6de`,
so the earlier smokes remain a separate cohort rather than being combined with it. At the final fingerprint,
fresh `post-implementation-testing` and `develop-requirement-lifecycle` samples both passed all scorer,
public-test, invocation, contamination, and commit checks.

These are single development smokes, not release-level stochastic evidence. The v1.0.2 release manifest
remains intentionally tied to `f050b0ec4443`; it must not be relabeled or combined with this changed plugin
and changed benchmark corpus.

The first full deterministic run exposed one infrastructure-policy failure: `npm test` required the frozen
v1.0.2 candidate fingerprint to equal the in-progress worktree. That made every legitimate skill edit fail
before its new release cohort could be collected. The checks are now separated: `npm test` validates manifest
shape and paired cohort accounting, while `npm run benchmark:release-verify` is the explicit release gate for
the package version and current plugin and benchmark fingerprints. The fresh deterministic suite passes
79/79; the explicit release gate correctly reports `f050b0ec4443 != 88a32553e6de` until matching release-level
evidence is collected.

Follow-up release-tooling work added deterministic manifest generation from a reviewed template. The first
real invocation caught and removed a biased eligibility rule that would have excluded scorer failures; the
generator now retains every completed, uncontaminated model sample and excludes only infrastructure or
contamination failures. A manually dispatched release workflow runs deterministic, coverage, and strict
fingerprint gates without launching stochastic model jobs. Repeated stale candidate fingerprints are
reported once rather than once per scenario.

Claude Code 2.1.223 loaded candidate `88a32553e6de`, the current Core, and all five workflows in an isolated
Windows-local fixture, but the initial launch did not forward the API-provider variables through `WSLENV`
and fell back to an expired OAuth session. The attempt consumed zero model tokens and changed no fixture
files, so it is excluded. No further skill text was removed; the later failure-driven corrections leave the
combined Core and skill entrypoints about 31% smaller than the pre-change version.

The user's existing API configuration was then forwarded to only the isolated Claude child, without loading
user plugins or printing credential values. Three manually reviewed Claude trajectories followed:

| Candidate | Result | Review |
|---|---:|---|
| `88a32553e6de` | fail | Production code was written first, but the checkpoint invented `no test edits` from unrelated no-dependency/no-commit constraints and the model kept only an ephemeral probe |
| `a6bcbf86a446` | fail | The checkpoint stopped inventing a direct test prohibition, but the model still used an ad-hoc probe as a substitute for stable money-integrity coverage |
| `a1d44ed59b97` | pass | Production file edit preceded the test edit; final tests detected both overdraft-guard removal and the exact-balance boundary mutation; only the source and established test file changed |

The two failures produced two narrow Develop corrections: silence about tests is neutral, and an ad-hoc probe
cannot replace automated coverage already selected by the risk criteria. At final fingerprint
`a1d44ed59b97`, a fresh Codex `post-implementation-testing` sample also passed every scorer, invocation,
public-test, contamination, and commit check. A `configuration-only` negative sample changed only the requested
JSON configuration and used its existing validator, demonstrating that the correction did not recreate
ceremonial unit testing. These remain development smokes rather than release-level repeated cohorts.

## 2026-08-27 — v1.0.2 final testing-policy release cohort

The release evidence was deliberately narrowed to the two scenarios directly owned by the final testing-policy
change instead of rerunning the older ten-scenario corpus. The earlier broad results remain historical evidence
for plugin `f050b0ec4443`; they are not combined with the final candidate fingerprint.

Common environment:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds
- Released v1.0.1 control plugin `5a6093705b18`
- Final v1.0.2 candidate plugin `a1d44ed59b97`
- Three completed, uncontaminated samples per arm and scenario
- Exact selected reports: `config/evidence-manifest.json`

| Scenario | Benchmark fingerprint | v1.0.1 control | v1.0.2 candidate |
|---|---|---:|---:|
| post-implementation-testing | `211cacbfbd05` | 0/3 | 3/3 |
| configuration-only | `18c7ec0173ac` | 3/3 | 3/3 |
| **Total** | — | **3/6** | **6/6** |

All three control failures were manually reviewed. Each produced correct behavior and passing boundary tests,
but production and test files were written in the same edit event, failing the preregistered production-before-tests
check. Every final candidate run wrote production separately before adding focused tests that detected both the
overdraft-guard and exact-balance mutations. The negative configuration runs changed only the requested JSON and
used the established validator; neither arm added ceremonial tests.

All twelve selected reports completed with no contamination, infrastructure failure, or unauthorized commit.
Invocation and fixture verification passed in every selected report. The deterministic suite passes 84/84,
semantic coverage maps all 46 behavior IDs across 37 configured scenarios, strict Claude plugin validation passes,
and `npm run benchmark:release-verify` matches the final package, benchmark, and candidate fingerprints.

## 2026-09-03 — v1.0.3 Test Contract release cohort

The Test Contract change was evaluated in the six directly affected scenarios rather than rerunning the full
corpus. After the first versioned candidate cohort (`faecfb50224d`) exposed intermittent checkpoints that did not
explicitly say approval was pending, a manual review led to one narrow Develop instruction: every checkpoint must
state that approval is pending. The revised candidate was rerun under a fresh fingerprint; no scorer was relaxed.

Common environment:

- Provider `ABtest`, model `gpt-5.6-luna`, low reasoning, timeout 240 seconds
- Released v1.0.2 control plugin `a1d44ed59b97`
- Final v1.0.3 candidate plugin `8a4e28e1ca0c`
- Three completed, uncontaminated samples per arm and scenario
- Exact selected reports: `config/evidence-manifest.json`

| Scenario | Benchmark fingerprint | v1.0.2 control | v1.0.3 candidate |
|---|---|---:|---:|
| post-implementation-testing | `e31e42b673ce` | 3/3 | 3/3 |
| develop-lifecycle | `f9d3df340e04` | 3/3 | 3/3 |
| develop-requirement-lifecycle | `c56a4b124dfc` | 3/3 | 3/3 |
| develop-scope-in-approval | `6d367cba87f4` | 2/3 | 3/3 |
| code-design-greenfield | `219258d673d1` | 3/3 | 3/3 |
| code-design-refinement | `0afd7d3ba1bd` | 3/3 | 3/3 |
| **Total** | — | **17/18** | **18/18** |

All final selected reports completed without contamination, infrastructure failure, or unauthorized commit.
Invocation and fixture verification passed in every selected report. The deterministic suite passes 84/84,
semantic coverage maps all 47 behavior IDs across 37 configured scenarios, and
`npm run benchmark:release-verify` matches the final package, benchmark, and candidate fingerprints.

## 2026-09-11 — Workflow simplification development evidence

This development revision preserves the five explicit entry points, materiality-based clarification,
Develop's post-checkpoint approval, and failing regression evidence before repair. It removes repeated
workflow instructions, fixed Test Contract category headings, and the global production-before-feature-tests
schedule. Expected results come from accepted rules and distinguishing examples; implementation and
verification can proceed in behavior slices. Existing designs feed the Develop checkpoint, an explicit
request can authorize selected Review repairs within existing task gates, and Handoff preserves the source
phase and known approval boundary.

The pre-change v1.0.3 plugin is frozen at `/tmp/engineering-flow-optimization-E0qX43/baseline-plugin`,
fingerprint `8a4e28e1ca0c`. The initial candidate was `6455004f0452`; the two wording revisions below
produce `4605023f9477` and then `6f87cc877350`. The later Review correction produces `55763f92a17e`.
Package and manifest versions remain `1.0.3`;
the published release manifest and its reports are unchanged. This work does not claim a new release.

| Entry file | Before, bytes | Candidate, bytes |
|---|---:|---:|
| Core | 1,977 | 1,991 |
| Develop | 9,841 | 5,997 |
| Diagnose | 3,893 | 2,856 |
| Code Design | 3,414 | 2,151 |
| Review | 2,378 | 2,286 |
| Handoff | 1,497 | 1,595 |

The five skill files together are 29.2% smaller by UTF-8 bytes; Core plus the five files are 26.6% smaller.
Core retains 265 whitespace-delimited words and stays within its 2,000-character budget. Handoff grows
slightly to preserve phase and authority explicitly. These are text-size measurements, not latency or
engineering-quality improvements.

Four new scenarios exercise design-to-Develop with acceptance-grounded tests, review-to-authorized-repair,
and actual Handoff consumption in fresh approved and pending sessions. The new runner gives every fresh
session a new isolated HOME and thread, transfers only the generated handoff response through a separate
file, and retains source and consumer provenance. Explicit dependency fingerprints cover the changed
runner and shared scorers. The old `post-implementation-testing` scorer remains unchanged as historical
evidence; its production-first criterion is only an observation in the new design-to-Develop scenario.
The six existing fresh-context scenarios also receive runtime, shared-scorer, and validator dependencies
so the new HOME isolation cannot be pooled with their earlier same-HOME evidence. The six benchmark
fingerprints selected by the current v1.0.3 release manifest remain unchanged.

Deterministic verification exposed an existing false success in nested fixture tests: inherited
`NODE_TEST_CONTEXT` made an inner `node --test` skip execution and return zero. A deliberately failing
temporary fixture reproduced the problem. Clearing that marker inside the outer fixture-test worker
restored real execution and a nonzero result, including the older scorers that spawn tests directly.
The hook injection check now verifies the complete actual skill content instead of one obsolete phrase.
This nested-test issue affects deterministic checks; the standalone model runner does not inherit the
outer Node test-worker marker. Historical model reports have not been rescored or relabeled.

Manual review of the new scorers added negative cases for reading only a handoff path, failing to recover
the specific task, treating `Accepted behavior` as implementation approval, and treating `No further
approval is required` as a pending checkpoint. A completed empty handoff is transferred verbatim and
scored as a behavior failure instead of being excluded as an infrastructure failure. At this stage the
full deterministic suite passed 100/100; the later semantic-equivalence case brings the final total to 101.

All four workflow SVGs were rendered and visually checked using the existing system librsvg. The generic
skill-creator frontmatter validator rejects Claude's required `disable-model-invocation` field; the repository's
cross-platform metadata and manifest tests validate that field and both platforms' explicit-only policy.

Exploratory smokes used Codex CLI 0.153.4, provider `ABtest`, model `gpt-5.6-luna`, low reasoning,
and the existing 240-second turn timeout:

| Report | Benchmark fingerprint | Plugin | Result |
|---|---|---|---|
| `regression-sensitivity-candidate-1789104753313-14827.json` | `30597af2c4bc` | `6455004f0452` | Pass |
| `develop-question-batching-candidate-1789104753313-14828.json` | `fb5def7d03a0` | `6455004f0452` | Fail |
| `regression-sensitivity-candidate-1789105691446-21116.json` | `30597af2c4bc` | `4605023f9477` | Pass |
| `develop-question-batching-candidate-1789105691447-21117.json` | `fb5def7d03a0` | `4605023f9477` | Fail |
| `develop-question-batching-baseline-1789106423774-27010.json` | `fb5def7d03a0` | `8a4e28e1ca0c` | Fail |

These reports completed without contamination or unauthorized commits and passed invocation and fixture
tests. Manual trajectory review confirmed the same clarification failure in both candidate revisions and
the control: the model removed the explicitly unresolved unknown-customer result from scope instead of
asking about it. The initial shortening omitted the affirmative statement that this is a product decision;
restoring that statement alone did not resolve the observed failure. The control's matching failure means
these samples do not establish that simplification caused the problem.

Develop now explicitly distinguishes an unanswered write/delete decision from a user exclusion: the word
`undefined` alone does not remove that behavior from scope. The scorer, fixture, and earlier failures remain
unchanged. Samples after this correction belong to `6f87cc877350` and are not pooled with these earlier
fingerprints. All raw reports named here are in `benchmark-results/`.

The clarified Develop wording then passed the focused question and regression scenarios:

| Report | Benchmark fingerprint | Plugin | Result |
|---|---|---|---|
| `develop-question-batching-candidate-1789107208092-29518.json` | `fb5def7d03a0` | `6f87cc877350` | Pass |
| `regression-sensitivity-candidate-1789107208133-29520.json` | `30597af2c4bc` | `6f87cc877350` | Pass |

The question sample asked all three independent material questions together, recorded the answers, and
continued to wait for implementation approval. The regression sample retained a failing test before the
production fix and passing, mutation-sensitive coverage afterward.

The first transition batch used one sample per arm and scenario, with control `8a4e28e1ca0c` and candidate
`6f87cc877350`. Every run completed without contamination or unauthorized commits and passed invocation
and fixture tests. The original scorer results are retained below, including the manually identified false
negative; these rows must not be summarized as a performance improvement.

| Scenario / benchmark fingerprint | Control report and original result | Candidate report and original result |
|---|---|---|
| Design → Develop / `efb833c6c37b` | `design-develop-transition-baseline-1789107589848-807.json` — pass | `design-develop-transition-candidate-1789107589961-808.json` — pass |
| Review → repair / `d30d4db16738` | `review-repair-transition-baseline-1789107670483-4345.json` — fail | `review-repair-transition-candidate-1789107746359-8347.json` — fail |
| Pending Handoff / `4feb7b6f0d9a` | `handoff-pending-resume-baseline-1789107752060-8547.json` — false negative | `handoff-pending-resume-candidate-1789107837216-12304.json` — pass |
| Approved Handoff / `1e883fe5bfb0` | `handoff-approved-resume-baseline-1789107855156-13245.json` — pass | `handoff-approved-resume-candidate-1789107952461-18930.json` — pass |

Manual review found two different causes:

- Both Review repair samples changed production and regression tests in the same edit, then first ran
  passing tests. Their access-control behavior and retained tests were correct, but they did not observe
  failure before repair. Review now states this existing Core gate directly inside its authorized-repair
  paragraph. This narrow correction changes the plugin to `55763f92a17e`.
- The pending control consumed the entire correct handoff, identified the unapproved Develop phase, and
  preserved the worktree. Its response did not repeat `isEven` or use the scorer's expected approval
  phrasing. Product behavior does not require that repetition. The corrected scorer verifies task identity
  in the source record, actual content consumption, explicit pending authority, and the absence of edits.
  A positive test uses the actual failed response. Empty records, path-only probes, vague clean-worktree
  replies, authority confusion, and premature implementation remain negative cases. Original reports have
  not been rescored; the changed helper creates new benchmark fingerprints.

Four retained scenarios were then sampled at `55763f92a17e` under the same model and reasoning settings:

| Report | Benchmark fingerprint | Automated result / manual limit |
|---|---|---|
| `develop-lifecycle-candidate-1789109641603-24371.json` | `f9d3df340e04` | Scorer pass; scope-fidelity limitation below |
| `develop-requirement-lifecycle-candidate-1789109641603-24372.json` | `c56a4b124dfc` | Pass; Draft → Accepted → Implemented and both validator modes observed |
| `code-design-refinement-candidate-1789109826829-32187.json` | `0afd7d3ba1bd` | Pass; read-only proposal identifies execution, permission, and lifecycle gaps |
| `handoff-continuation-candidate-1789109831775-32390.json` | `516a36faaa68` | Pass; current evidence, decisions, pending work, and unrelated edit preserved |

All four completed without contamination or unauthorized commits and passed invocation and fixture tests.
The lifecycle sample correctly paused, implemented after approval, completed the reported omission, and
paused added scope. However, its final incremental checkpoint proposed excluding string values outside the
safe-integer range even though the user's complete regex contract did not exclude them. It also created a
durable record for a small local task. The existing scorer does not measure these fidelity and ceremony
limits. No added-scope code was implemented, and the original requirement was not overwritten, but this
sample is not full evidence of correct requirement understanding. These limits remain explicit instead of
being hidden by its passing automated result or tuned away in the historical scorer.

The final paired transition batch used `BENCH_REPETITIONS=1`, `BENCH_CONCURRENCY=2`, and
`BENCH_TIMEOUT_MS=240000` with the same Codex CLI, provider, model, and reasoning settings above.
The control remains `8a4e28e1ca0c`; the candidate is `55763f92a17e`. Each row below has one completed
sample per arm. The original results are retained without rescoring:

| Scenario / benchmark fingerprint | Control report and original result | Candidate report and original result |
|---|---|---|
| Review → repair / `fb35c7af8da6` | `review-repair-transition-baseline-1789110973693-5731.json` — fail | `review-repair-transition-candidate-1789110973841-5732.json` — fail |
| Pending Handoff / `a46029fa07e7` | `handoff-pending-resume-baseline-1789111080634-10287.json` — pass | `handoff-pending-resume-candidate-1789111084326-10872.json` — fail; unnecessary Draft record |
| Approved Handoff / `7e2c1accc9f8` | `handoff-approved-resume-baseline-1789111161900-14667.json` — pass | `handoff-approved-resume-candidate-1789111204964-17198.json` — pass |

All six reports completed without contamination, timeout, or unauthorized commits and passed invocation
and fixture public tests. Manual trajectory review separates the remaining failures:

- Both Review samples still repaired production before observing a failing regression test. In the
  candidate's turn-2 event stream, `item_3` changes `src/access.js` and `access.test.js` together;
  the following `npm test` is already green. Later test additions also pass. The control changes
  production first and then adds passing tests. Both leave correct access policy and mutation-sensitive
  coverage, but neither satisfies the regression execution order. The local Review reminder therefore
  has not demonstrated reliable enforcement in this sample.
- The Review control also fails `findingIdentifiesPermissionFailureWithLocation`. This is a keyword
  false negative: its finding locates `src/access.js:2` and says managers can access records
  "regardless of active status or organization". The scorer's organization-expression alternatives
  omit this equivalent wording. Correcting this subcheck would not change the overall failure because
  the missing failing regression evidence is real. The original scorer and report remain unchanged.
- The pending Handoff candidate creates `docs/requirements/is-even.md` in turn 1 for a small local task,
  contrary to REQ-05. This unnecessary artifact is a real ceremony failure. The record remains `Draft`
  and byte-for-byte unchanged through Handoff and the fresh consumer; no production or test files are
  edited. Both correctly state that implementation approval is pending. The scorer compares each turn
  with the initial clean worktree, so `preservesPendingApprovalInFreshSession=false` also reflects
  the earlier artifact rather than a new consumer mutation or an approval bypass. Source-record
  identity, complete reading, fresh-session isolation, and pending authority are preserved.
- Both approved Handoff samples transfer the actual approved checkpoint without implementing in the
  handoff turn. The fresh consumers implement and verify the authorized behavior, preserve the existing
  export, retain sensitive tests, and do not restart approval.

The latest shared-scorer fingerprint for Design → Develop is `feafaf62c31f`. That scenario was not rerun
after the shared helper changed; its earlier paired passing reports remain evidence only for
`efb833c6c37b` and their recorded plugin fingerprints. No result is assigned to the unrun combination.

Final deterministic verification is `npm test` **101/101 passed**, including metadata, explicit invocation,
fresh-session transfer, scorer positive/negative cases, and the nested-test failure reproduction.
`npm run benchmark:coverage -- --json` reports 41 scenarios mapping all 47 behavior IDs; this is coverage
metadata, not 47 proven behaviors. `git diff --check` and `claude plugin validate . --strict` pass.
The manifests still reference all five skills with synchronized explicit-only invocation policies.

This is an implemented development revision with recorded behavioral limitations, not a release-level
reliability claim. No pass rates are pooled across changed fingerprints, and no additional wording tuning
or repeated model sampling was used to turn the final failures green. The latest Review regression order,
unnecessary local records, and numeric-range fidelity observations remain unresolved. The two documented
scorer classification limits also remain explicit for future evaluation work. Current Claude validation
checks package structure only; revised wording has no fresh isolated Claude inference evidence. The
frozen v1.0.3 release manifest and reports remain unchanged and do not certify the changed plugin.

## 2026-09-12 — Evaluation repair deterministic evidence

The authorized evaluation repair keeps Core, all five skills, and invocation metadata frozen at plugin
fingerprint `55763f92a17e`. It repairs scoring errors and acceptance blind spots; it does not tune workflow
wording or run another model cohort. The preceding 101/101 result belongs to the earlier simplification
revision and is not the verification result for this increment.

The first fresh focused run used Node `v22.21.1` and reproduced **50 passes, 2 failures**:

```bash
node --test tests/review-findings.test.js tests/workflow-transitions.test.js tests/contract-fidelity.test.js tests/benchmark-handoff.test.js
```

- `rejects a valid grant followed by a separate cross-organization denial`: the Review scorer combined
  a legitimate same-organization grant with a later cross-organization denial. It now includes the
  boundary's denial predicate and recognizes active denial. The observed manager-bypass wording and
  file/line evidence still pass; valid policy, negation, and missing-location examples still fail.
- `a local checkpoint cannot silently change an existing untracked requirement`: Git status, diff,
  and event counts stayed unchanged while a requirement's contents changed. Initial and per-turn
  requirement snapshots now participate in the shared preservation check. The runner captures the
  initial contents before model execution, supplies them to the scorer, and retains them in its report.

Two adjacent defects were also reproduced before their production fixes. A deterministic test executes
the actual runner with a stub Codex process and real Git/file operations: adding a status-free document
inside an already untracked directory initially scored as unchanged. The runner now requests individual
untracked paths with `git status --short --untracked-files=all` at every snapshot. The same test verifies
unchanged records, same-path content changes, new artifacts, and saved initial evidence without using
user authentication or a model provider.

The approved-consumer regression initially had **3 passes, 2 failures**: it treated a preserved existing
requirement as an extra implementation artifact and attributed a checkpoint-created record to the later
consumer again. The consumer now compares non-implementation paths with its Handoff entry state and
requires requirement contents to remain unchanged. It still rejects new records, new ordinary documents,
and modifications to carried requirements. Earlier artifact failures remain in the checkpoint result.

The new `develop-contract-fidelity` scenario has an initial Develop checkpoint, a combined approval and
integer-string increment that requires a revised checkpoint, and separate approval for implementation.
Its independent public API expectations include `9007199254740993 -> false`, negative large integers,
400-digit even and odd strings, invalid formats, and the original JavaScript numeric domain. Mutation
checks reject range exclusions and Number-based parity loss even when ordinary examples pass. The
scenario is separate from the existing lifecycle and release-selected scenarios.

The expanded focused suite passes **66/66**, and `npm test` passes **151/151**, including manifest
completeness, synchronized explicit invocation, fixtures, scorer sensitivity, and runner evidence.
`npm run benchmark:coverage -- --json` reports **42 scenarios mapping all 47 behavior IDs**; this measures
registry coverage, not model success. Both Handoff variants now map their local-artifact checks to
REQ-05. `claude plugin validate . --strict` passes. After the final coverage metadata and documentation
updates, `node --test tests/benchmark-coverage.test.js tests/metadata.test.js` passes **16/16**, and
`git diff --check` passes. The requirement record is reconciled as `Implemented` with these results.

Current affected benchmark fingerprints are:

| Scenario | Benchmark fingerprint |
|---|---|
| develop-contract-fidelity | `0cfc28624e7e` |
| design-develop-transition | `f047c8a9b974` |
| review-repair-transition | `7c311df79824` |
| handoff-pending-resume | `8020982ce40a` |
| handoff-approved-resume | `98abb771d18c` |
| develop-durable-resume | `4ebc9205d943` |
| develop-durable-evidence-holdout | `58ca14f7947a` |
| develop-durable-validator-holdout | `611bf62b4ce9` |
| develop-durable-command-holdout | `62d741fa293b` |
| develop-durable-finalization-holdout | `2edd7f31471a` |
| develop-durable-verification-holdout | `801521abf0ed` |

The durable scenarios also change fingerprint because they declare the shared runner as an input.
Their historical reports do not count as results for these current inputs. All six evidence manifests
and the unrelated `.baseline-plugin/` directory retain their entry hashes; raw model reports remain
unchanged. No stochastic results are pooled or reassigned.

The Review language scorer remains a bounded heuristic. Historical model failures involving repair
before observing a failing regression, unnecessary local requirement records, and an unapproved numeric
range restriction remain observations about those models and inputs. This increment makes the recorded
evaluation distinctions testable; it supplies no new Codex or Claude inference evidence and no claim
that model behavior has become more reliable.

## 2026-09-12 — Sequential behavior optimization: current diagnostics

The user's request to fix the remaining issues one at a time starts a separate increment in
`docs/requirements/workflow-behavior-optimization.md`. The completed evaluation repair above remains
unchanged. The control snapshot is `/tmp/engineering-flow-behavior-idvahw/control`, fingerprint
`55763f92a17e`, matching the entry plugin. The temporary experiment record also retains entry hashes for
existing reports, all six evidence manifests, and the unrelated `.baseline-plugin/` directory.

Current environment: Codex CLI **0.154.0**, Node **v22.21.1**, provider **ABtest**, model
**gpt-5.6-luna**, reasoning **low**, 240-second per-turn timeout, concurrency two. The CLI version differs
from historical 0.153.4 samples. Results below are development diagnostics, not a release comparison.
Before inference, the four affected deterministic test files passed **66/66** again.

The fixed discovery budget was one control sample per target, with no replacement of completed model
failures. Both runs completed without contamination, unauthorized commits, or invocation errors:

| Scenario / benchmark fingerprint | Report | Result and manual verification |
|---|---|---|
| Review repair / `7c311df79824` | `review-repair-transition-baseline-1789216802770-9440.json` | Pass. Turn 2 writes only the regression tests, observes `npm test` exit 1, then first changes production and observes passing tests. The saved rollout confirms two unchanged assertions for cross-organization and inactive-manager access, both violated by the old predicate; the later edit adds a guest test without weakening those assertions. |
| Complete integer-string contract / `0cfc28624e7e` | `develop-contract-fidelity-baseline-1789216802769-9441.json` | Pass. Both approval checkpoints remain intact. The implementation uses exact integer-string arithmetic, rejects malformed inputs, preserves the numeric domain, and retains range/precision-sensitive coverage. Neither checkpoint introduces a range exclusion. |

Review's first failing output reports the file-level `ERR_TEST_FAILURE` rather than individual assertion
stacks. The actual test patch, original predicate, later unchanged assertions, and independent final
4/4 test result support its causal attribution. This single passing sample does not negate earlier
ordering failures or establish improved reliability. Review and numeric-contract guidance stay frozen.

The numeric sample also creates and finalizes `docs/requirements/is-even.md` for the local function task.
Its contract scorer does not measure ceremony, so its passing result does not certify the artifact
decision. Historical local-task traces explicitly infer a required Draft from the absence of a project
documentation convention. Priority 2 therefore changes only Develop's record-selection instruction:
neither a complete contract nor an absent convention alone requires a fallback file or validator.
The existing substantial-task record and approval policies are preserved.

The preregistered cost check is one control/candidate pair each for `handoff-approved-resume` and
`develop-requirement-lifecycle`, one candidate contract run against the control above, and one candidate
`develop-question-batching` guard. The latter checks the actual three unresolved destructive-operation
decisions rather than treating question counts as a measure of unnecessary ceremony. Only one wording
revision is allowed in this experiment, and completed failures will not be retried into passing results.

### Priority 2 — local records with substantial-task and clarification guards

The single Develop clarification produces plugin `932976d966bc`; the frozen control remains
`55763f92a17e`. The candidate snapshot is `/tmp/engineering-flow-behavior-idvahw/cost-candidate`.
Before model execution, the relevant metadata, routing, requirement-validator, transition, and contract
tests passed **60/60**. All six planned runs completed without contamination or unauthorized commits:

| Scenario / benchmark fingerprint | Control report and original result | Candidate report and original result |
|---|---|---|
| Approved Handoff / `98abb771d18c` | `handoff-approved-resume-baseline-1789217699070-17338.json` — fail | `handoff-approved-resume-candidate-1789217699635-17339.json` — pass |
| Substantial requirement lifecycle / `c56a4b124dfc` | `develop-requirement-lifecycle-baseline-1789217941116-23728.json` — pass | `develop-requirement-lifecycle-candidate-1789217972848-24828.json` — pass |
| Complete integer-string contract / `0cfc28624e7e` | `develop-contract-fidelity-baseline-1789216802769-9441.json` — pass; unnecessary local record | `develop-contract-fidelity-candidate-1789218129907-30009.json` — pass; no local record |
| Necessary clarification / `fb5def7d03a0` | Not sampled in this experiment | `develop-question-batching-candidate-1789218176157-30950.json` — pass |

Both candidate local tasks keep checkpoints in the response and leave only the required source/test
changes after approval. The Handoff pair uses the same benchmark inputs and environment: the control
creates `docs/requirements/is-even.md`, while the candidate creates none and resumes implementation
from the transferred approval without restarting a gate. Both substantial-task arms still create and
validate Draft, preserve the explicit Accepted pause, and finalize Implemented after verification.
The clarification guard asks the three actual unresolved deletion decisions and presents the checkpoint
after the answers without treating those answers as implementation approval.

The Handoff control's original `resumesAuthorizedImplementation=false` is partly a scoring defect:
turn 3 runs `npm test && node ... --finalize`; the complete TAP summary passes, but the following record
validator fails. The helper mistakes the whole command's nonzero exit for the test's result. The control
does implement the correct behavior and the runner independently passes 4/4 tests. Its unnecessary
record and later changes to the carried record remain separate failures. The next deterministic repair
will correct this attribution without rewriting the original report.

The candidate instruction is retained on this bounded evidence; Core, Review, numeric-contract wording,
and invocation policies stay unchanged. This is one sample per selected arm/scenario, not a reliability
or average-cost estimate. These reports precede automatic environment identity capture; their manually
recorded current environment and named experiment remain explicit rather than being retroactively
assigned a new identity or pooled with historical CLI versions.

### Priority 3 — native continuation and evidence identity

The two new scenarios, `develop-compacted-pending` and `develop-compacted-approved`, insert actual
native compaction before the final resumed turn. Each receives one candidate diagnostic after the
deterministic protocol and scorer checks. A completed model failure is not retried; a documented
infrastructure defect permits at most one replacement after correction.

The adapter follows the [official app-server protocol](https://learn.chatgpt.com/docs/app-server) and
the installed 0.154.0 JSON schema. It reuses the persistent exec thread and original isolated HOME,
checks the resumed execution environment, requires correlated `contextCompaction` start/completion
and completed-turn events, then closes the server before the existing exec runner resumes the task.
The RPC acknowledgement is insufficient. Compaction has its own raw event stream, token usage, and
workspace snapshots, so it does not shift business-turn indices or masquerade as a fresh-session test.

A separate deterministic audit reproduced cross-environment pooling: summary, cohort filling, and
manifest selection ignored differing CLI versions and timeouts; unset fill provider/model fields acted
as wildcards. The repair records a common environment identity and uses it consistently, while keeping
legacy reports and all six frozen manifests unchanged. Missing historical identity is not inferred from
the current environment.

Before inference, `npm test` passed **193/193**. The protocol audit first exposed six failures involving
event correlation, missing IDs, process exit, terminal errors, session replacement, and record
preservation; the repaired native/transition checks passed **39/39**. Compound-command attribution now
requires a complete, attributable, nonempty test result and cannot count a later validator error as a
regression failure. New evidence manifests use schema 2 with a validated environment fingerprint;
historical schema 1 manifests remain readable without certifying the current tree.

Both preregistered native-compaction diagnostics completed and passed. Their plugin fingerprint is
`932976d966bc`; their complete environment identity is
`4182ee16c81824aca1605ea8d24e52edbf499b40e1d54b643d127872e9006605` (Codex CLI 0.154.0,
ABtest / gpt-5.6-luna / low, 240-second timeout).

| Scenario / benchmark fingerprint | Report | Inspected behavior |
|---|---|---|
| Pending approval / `8d045a2d2da4` | `develop-compacted-pending-candidate-1789221953935-16938.json` | Pass. The original thread completes native compaction with unchanged workspace snapshots; the continuation keeps the checkpoint pending and changes no files. |
| Approved implementation / `784b44856e32` | `develop-compacted-approved-candidate-1789221953922-16939.json` | Pass. The original thread completes native compaction with unchanged workspace snapshots, then implements the prior approved contract without another gate. Only the source and retained sensitive tests change; the model and independent runner both observe passing tests. |

The raw RPC streams contain correlated turn/item start and completion events, and every business turn
uses the original session. Neither run is contaminated or makes an unauthorized commit. These are
single samples of actual host compaction, distinct from the earlier fresh-session Handoff evidence;
they do not establish long-session or release-level reliability. No workflow wording changed in P3.
The full persistent rollouts, including each actual compaction summary, were also copied byte for byte
to the corresponding `*-rollout.jsonl` files beside the reports. Their SHA-256 hashes are
`03f0ec41164bebb0d987c61eeea804d721c47cfb69750201f6fa6f9248b40430` (pending) and
`a8ea7c5487acd237bbecf6d33d15bc38ec7712d166f0a7c80b965761dc3b420c` (approved).

### Priority 4 — bounded language and platform variants

Before further inference, select one candidate sample for `develop-python-clear-task`, a new two-turn
Chinese Develop variant using the existing Python fixture. Keep `python-clear-task` and its holdout
status unchanged. Check approval before writes, Python's `bool` exclusion, unrestricted integer
semantics, preserved `add`, meaningful unittest coverage, and no unnecessary local records. Deterministic
verification must cover the Python-specific output and mutation evidence before running the model.

Also select one isolated two-turn Claude Code Develop smoke on the small JavaScript fixture: an
explicit checkpoint followed by implementation approval. Use the same candidate snapshot, a new
Windows-local workspace and configuration directory, and only the configured provider credential/model
variables in the child environment. Keep write tools available in both turns, verify actual workflow
loading and session continuation, and inspect edits and test evidence. The configured client is Claude
Code 2.1.223 using **Kimi `kimi-k3[1M]`**, so this is client integration evidence, not Anthropic
Claude-model evidence or a matched-model platform comparison.

Budget: one completed sample per selected variant; no replacements for completed model failures.
Permit at most one replacement per variant only for a documented infrastructure defect after correction.
Record exact frozen inputs before launch. If the configured Claude authentication or environment does
not support execution within that bound, retain the failure and report the specific gap.

The Claude smoke was frozen in `/tmp/engineering-flow-behavior-idvahw/claude-smoke-plan.json` after
Windows plugin validation passed. Plugin: `932976d966bc`; benchmark digest:
`ed42098a8febb53234ec17bcd7b2ecfc1db723125edce5939f486a0fc4102016`; environment digest:
`c20ecab523a5015aa76c3ff7151ea43cf9700e8ef95f153938a407ea77df209f`. Each turn has a 240-second
timeout and requested effort `low`. Credentials are excluded from persisted metadata. This manual
smoke uses its own evidence format and is not a Codex evidence-manifest cohort.

The Claude smoke completed both turns in the original session without a retry. Raw evidence and a
manual audit are retained in `benchmark-results/claude-develop-smoke-21fd1d45/`. SessionStart loaded Core
in both turns, native slash-command expansion loaded the exact candidate Develop text, and all five
released workflows were available. Only the candidate external plugin was loaded, with no MCP servers;
the client's bundled skills remained part of the recorded environment and no additional invocation was
observed. The first turn made no file changes and explicitly awaited approval. After approval, only
`src/math.js` and `math.test.js` changed; the original session continued without another approval gate
or a requirement document. The model observed **4/4** passing tests. Independent verification using the
actual Windows Node **v20.17.0** passed the contract, including large integers and rejected invalid
inputs, and the retained tests detected both zero/negative-even and invalid-input-coercion mutants in
a separate copy. The original model workspace and all raw streams were preserved. The client reported
model `kimi-k3[1m]`; this is the configured `kimi-k3[1M]` name normalized by the client, not a sampled
Anthropic model. This single sample supplies client integration evidence only.

The Python scorer is frozen after **25/25** focused checks passed. Two initial regressions showed that
deleted `add` coverage and an old-test-only discovery command could pass; both were corrected before
sampling. A subsequent command audit observed six failing checks covering stderr merging, unassigned
nonzero exit status, escaped shell arguments, wrapped replay, contradictory summaries, and successful
methods alongside skipped subtests. These also pass after the repair. Compound attribution is bounded
to recognized Git follow-up checks; unsupported command forms and quiet ambiguous skip summaries remain
unknown and require manual inspection.

The Python plan is `/tmp/engineering-flow-behavior-idvahw/python-experiment.json`: plugin
`932976d966bc`, benchmark `1f6b1d7dcab2`, scorer and direct dependencies `70a51af86118`, the same complete
Codex environment identity `4182ee16c81824aca1605ea8d24e52edbf499b40e1d54b643d127872e9006605`, and
Python **3.12.3** at `/usr/bin/python3`. Interpreter identity is recorded separately from the generic
Codex/Node environment schema. No Python-version portability or pooled Python cohort is claimed.

The single Python sample, `develop-python-clear-task-candidate-1789227652289-32739.json`, completed
without contamination or an unauthorized commit, but its original score failed two checks. Manual
inspection separates them:

- `implementsAfterApproval` was a scorer false negative. The model changed source and tests, then ran
  the promised complete unittest command followed by `git diff --check`, a source-path diff, and status.
  The three tests passed. The parser recognized the check and status suffixes but rejected the source
  diff. A focused regression first failed **0/1**; the narrow repair accepts that Git diff form while
  preserving the wrapped-replay rejection. The expanded focused checks pass **26/26**.
- `leavesRangeSensitiveCoverage` is an actual behavioral gap. Implementation correctly handles
  unrestricted Python integers, and retained tests detect `add`, bool, and parity mutations, but no
  retained example detects a newly imposed 64-bit limit. Passing production contract checks do not
  replace this missing coverage. The sample remains a failed behavioral guard.

The original report and score remain byte-identical. Its sampled benchmark is `1f6b1d7dcab2`; the
repaired current scorer gives benchmark `9ea51ff588f4`. The exact sampled inputs were archived and their
old fingerprint rechecked in `benchmark-results/python-develop-audit-1789227652289/`, alongside the raw
rollout, final workspace, frozen plan, and separate manual adjudication. This is not a new inference
sample. No completed failure was retried, no old score was rewritten, and no workflow wording was added
to force this guard to pass.

### Priority 5 and final verification

The instruction audit compares the frozen entry plugin `55763f92a17e` with `932976d966bc`. Only the
Develop record-selection paragraph changed, by 153 bytes. Core, the other four skills, references,
validator, hooks, and invocation metadata remain identical to the entry snapshot. The observed
unnecessary-record failures support this change. Five released skills remain explicitly invoked on
both clients. The substantial-task guard explicitly specified its record path, so it does not prove
that autonomous classification of every substantial/local boundary is reliable.

After the last Python scorer correction, `npm test` passes **219/219**, including metadata and
invocation checks; the preceding **218/218** was before that correction. Coverage metadata maps **45
scenarios to all 47 behavior IDs**, without claiming all model outcomes pass. `claude plugin validate .
--strict` passes. The preservation audit checks **4,651** pre-existing files with no missing or changed
bytes, including original reports, six evidence manifests, and `.baseline-plugin/`.

The optimization record remains **Accepted / Verification Pending** because the Python large-integer
coverage guard is not closed. Current native-compaction and Claude Code smokes passed within their
stated bounds; historical intermittent failures, autonomous record classification, longer or repeated
compaction, and other models remain outside the demonstrated result. No release-level reliability or
average-cost improvement is claimed. No repository commit or publication was made.
`git diff --check` also passes. Final deterministic logs, coverage, metadata validation, preservation
results, and current benchmark fingerprints are retained in
`benchmark-results/workflow-optimization-verification-20260912/`. HEAD remains `6dae8e4`.

## 2026-09-13 — Maintainer-approved stable release 1.0.4

The user explicitly accepted the completed implementation and directed a stable release using the
existing results, without further verification or model sampling. This supersedes the additional
release-evidence checkpoint discussed above. Version 1.0.4 therefore uses the recorded 219/219
deterministic result and bounded diagnostics as its accepted release basis; it does not claim a new
statistical reliability result.

Release preparation updates both client manifests, marketplace version, badges, changelog, and
acceptance status. The frozen evidence manifests remain associated with their historical 1.0.3
release; the metadata assertion now checks that historical identity instead of relabeling old
evidence as 1.0.4. The strict current-cohort evidence tool remains available for statistical claims.

The Python sample's missing retained large-integer coverage is accepted as a documented limitation.
Its failed score and raw report remain unchanged. No tests, CI, or inference runs are added for this
release, and unrelated `.baseline-plugin/` work is excluded from the release commit.
