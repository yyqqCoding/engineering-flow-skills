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
