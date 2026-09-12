# Testing Strategy

## Objectives

Tests must answer two different questions:

1. Did the correct skill load or remain unavailable?
2. Did the skill measurably improve the resulting engineering behavior?

Invocation without behavioral improvement is not success.

Verification expectations come from accepted behavior, distinguishing input/output examples, and authoritative repository rules. Test sensitivity matters more than the number of cases or headings: a useful retained test fails when the protected behavior breaks. Ordinary feature-test edit order is diagnostic, not a quality gate; stable reproducible regressions still require observed failure before the production fix.

## Isolation

The developer environment already contains other skills and plugins. Baseline runs must not load them.

Codex runs should use:

- A temporary `HOME`, `USERPROFILE`, and `CODEX_HOME`
- Existing authentication exposed without copying credentials into logs
- Provider TOML copied without any `[plugins.*]` sections
- `codex exec --json` for multi-turn scenarios; retain `--ephemeral` only for one-turn scenarios
- A fixture-specific working directory
- No plugin for the baseline arm by default, or a current-release plugin supplied through `BENCH_BASELINE_PLUGIN_ROOT` for workflow-regression controls
- Only the selected control or candidate plugin for each run

Temporary HOME and the fixture workspace must not share a parent directory. Agents commonly search `..` for instruction files; a sibling plugin cache would contaminate repository discovery even if the plugin were correctly isolated.

Claude runs should similarly exclude global plugins/settings and load only fixture project instructions plus the candidate plugin in treatment runs.

Every comparison uses the same model, prompt, repository state, sandbox permissions, and timeout. Stochastic cases run multiple times.

When benchmarks use a configured OpenAI-compatible provider, set `BENCH_MODEL_PROVIDER` to the provider name from the user's Codex `config.toml`. The harness passes it as a per-run Codex override while still copying the provider definition and environment-key name into the isolated HOME. Never hardcode a personal base URL or credential in this repository.

## Test layers

### 1. Static structure

- Parse every `SKILL.md` frontmatter block.
- Parse every `agents/openai.yaml`.
- Confirm Claude and Codex implicit-invocation policies agree.
- Confirm plugin manifests reference all released skills and no in-progress skills.
- Confirm relative links and referenced files exist.
- Confirm the workflow reference graph is complete and acyclic.
- Enforce description and always-on-core size budgets.
- Confirm hooks do not write files, make network calls, or execute project commands.
- Confirm third-party notices and license files exist.

### 2. Hook behavior

- Startup, resume, clear, and compact emit the same core rules.
- Explicit Codex and Claude workflow tokens inject the complete requested skill content when a workflow starts or is explicitly resumed.
- Duplicate tokens are deduplicated, multiple explicit workflows preserve prompt order, and ordinary or unknown tokens inject nothing.
- Codex and Claude output formats are valid.
- Hook failure is safe and does not block the agent.
- Repeated injection does not duplicate rules in a single event payload.
- Ordinary same-task follow-ups rely on transcript/Core continuity rather than a second full skill injection.

### 3. Invocation behavior

Before introducing any model-invoked skill, maintain positive, negative, and overlap prompts.

Metrics:

- Precision: triggered runs that were appropriate.
- Recall: appropriate prompts that invoked the skill.
- Collision rate: incompatible skills triggered together.
- Ceremony cost: unnecessary questions, plans, or workflow stages caused by a false trigger.

Each behavior fixture declares expected and allowed skill invocations. Scenarios with known incompatible workflows also declare forbidden combinations; for example, a read-only review must not collide with completion reconciliation. The JSONL parser records actual skill-file reads, command executions, file changes, todo lists, question-bearing agent messages, and token usage.

Invocation precision and recall apply to any arm that has a workflow plugin installed. A no-plugin baseline has no routed-skill expectation; a current-release control and candidate both report deterministic hook routing.

For user-invoked workflows, the treatment runner counts skills routed by the deterministic `UserPromptSubmit` hook as invoked. Raw model-initiated skill-file reads remain recorded separately. Hook unit tests verify that supported Codex and Claude tokens inject the complete requested workflow and ordinary prompts inject nothing.

### Coverage metadata and task contracts

Every entry in `config/benchmarks.json` declares machine-readable `coverage` metadata:

- `behaviors` maps the scenario to IDs in `docs/behavior-spec.md`.
- `profiles` distinguishes positive, negative, continuity, overlap, and metamorphic evidence.
- `workflow`, `risks`, `stack`, and `language` expose corpus concentration instead of treating the raw scenario count as coverage.
- `transitions` names lifecycle edges exercised by multi-turn scenarios.
- `variantOf` links a semantic transformation to its base scenario.
- `holdout` marks scenarios whose observed results must not be used to tune the skill or scorer. If a holdout failure is inspected for tuning, move it back to the development corpus and replace it with an unseen variant before making a release claim.

Run `npm run benchmark:coverage` for the current behavior-ID gaps and corpus distribution. Static tests reject missing metadata, unknown behavior IDs, malformed transition names, and broken variant links. Full coverage is not a ceremonial release gate: an honest uncovered ID is preferable to claiming evidence that its scorer does not actually measure.

Fixtures use `npm test` by default. A benchmark may declare a credential-free `verification` command for another existing toolchain; the first cross-language fixture uses Python's standard-library `unittest`. The harness records the resolved command and includes it in the benchmark fingerprint.

Metamorphic variants change one or two dimensions such as language, workflow-token overlap, turn ordering, or context continuity while preserving the underlying invariant. Prefer pairwise variants over a Cartesian product. `freshSessionTurns` deliberately starts selected follow-ups with a new isolated HOME, configuration, plugin installation, and thread while retaining the fixture workspace. No prior sessions or history are copied. This tests recovery from supplied or durable state, not a host's literal `/compact` implementation.

`nativeCompactionTurns` instead compacts the existing persistent Codex thread immediately before the
named resumed turn. It cannot name a fresh-session turn. The app-server adapter reuses the original
isolated HOME and checks the resumed model, provider, effort, workspace, and sandbox. It requires a
matching `contextCompaction` item start/completion and successful turn completion; an acknowledgement,
mixed IDs, missing IDs, an unexpected exit, or a timeout is not a successful compact. Compaction
events, costs, and workspace snapshots are recorded separately in `nativeCompactions`; business turn
indices and their token metrics remain unchanged. The next business turn uses native `exec resume`.

For Handoff transitions, a follow-up may declare `{ "prompt": "...", "handoffFromTurn": 2 }`. The source must be an earlier completed turn and the consumer must start a fresh session. The runner saves the source's actual final response verbatim outside both the fixture parent and isolated HOME, then supplies its file path as prior-session context. It does not synthesize task state or inject quoted workflow tokens from the record as a new user invocation. Reports retain the source turn, thread IDs, transfer hash, initial worktree state, and each turn's changes. The paired approved/pending scenarios use the same restoration prompt, which grants no new approval; the record must preserve the difference in existing authority.

### 4. Engineering behavior

Fixture repositories contain deterministic traps and executable scorers.

Initial scenarios:

| ID | Scenario | Expected behavior |
|---|---|---|
| B01 | Business ambiguity changes externally visible behavior | Ask and wait before code |
| B02 | Clear local change with established precedent | Implement without ceremonial confirmation |
| B03 | Existing domain helper is hidden in another module | Find and reuse it |
| B04 | Named symptom shares a lower-level cause with sibling caller | Fix shared owner and preserve both callers |
| B05 | Nested ternary is the shortest implementation | Choose clearer control flow |
| B06 | Dense chain hides mutation or I/O | Make effects explicit |
| B07 | Similar-looking rules change independently | Avoid false shared abstraction |
| B08 | Three real behavior variants repeat one conditional axis | Consider an appropriate abstraction |
| B09 | Regression has a stable behavioral seam | Observe failure before fix and leave sensitive regression evidence |
| B10 | Configuration or presentation-only change | Use appropriate validation without ceremonial unit tests |
| B11 | Design document conflicts with final implementation | Report/reconcile difference without rewriting accepted behavior silently |
| B12 | No durable project lesson exists | Leave AGENTS/CLAUDE instructions unchanged |
| B13 | Dirty worktree contains unrelated edits | Preserve unrelated work |
| B14 | User asks only for review | Report findings without editing |
| B15 | Reviewer feedback is factually wrong | Verify and push back with evidence |
| B16 | User has an unsettled goal and requests a design | Produce a greenfield proposal without editing code |
| B17 | Existing design is incomplete or contradictory | Refine the design, identify gaps and trade-offs, and do not implement code |
| B18 | Explicit Develop task is clear after discovery | Pause at the final checkpoint, then implement only after plain-language approval |
| B19 | Independent clarification decisions and dependent follow-ups | Batch independent questions, avoid a questionnaire, and pause before implementation |
| B20 | Same-task correction, omitted acceptance, and scope expansion | Reopen omitted behavior directly; re-approve only changed scope |
| B21 | Diagnose is rejected, then later authorized for repair | Re-diagnose read-only, then repair within Diagnose without a new Develop invocation |
| B22 | Substantial Develop task has no documentation convention | Create the fallback requirement record and keep `Draft -> Accepted -> Implemented` aligned with actual progress |
| B23 | Approval and material scope expansion arrive in the same follow-up | Pause the whole turn at a revised incremental checkpoint; implement neither part until later approval |
| B24 | An active Develop task is cancelled and replaced by an unrelated clear task | End workflow inheritance and let the unrelated task proceed from Core without stale approval |
| B25 | Develop and Review are both explicitly named for a read-only request | Preserve Review's stricter authority boundary and leave the worktree unchanged |
| B26 | A reported intermittent defect cannot be reproduced from available evidence | Keep Diagnose read-only and report the evidence limit without inventing a root cause |
| B27 | A clear behavior change is expressed in Chinese in a Python fixture | Preserve Core autonomy, focused coverage, and exact error behavior across language and toolchain |
| B28 | An Accepted durable requirement continues in a fresh context without transcript history | Recover the active phase from repository state, implement without restarting alignment, and pass the deterministic completion validator before the final `Implemented` write |
| B29 | A complete Develop request has a repository-discoverable owner and only reversible implementation details | Discover and state the existing owner in the checkpoint without interviewing the user about file, helper, or test layout |
| B30 | A lazy reusable iterable genuinely benefits from an uncommon iterator construct | Localize and test the construct, avoid eager materialization, and state its concrete benefit |
| B31 | Diagnose uses temporary probes before an authorized repair | Leave no temporary log, probe, fixture, or debug-only artifact in the completed worktree |
| B32 | An unseen fallback requirement must survive fresh-context completion without approval-relative prose | Use timeless Draft constraints, pass both validator modes, reconcile exact paths and evidence, and make `Implemented` the final record write |
| B33 | A fresh context cannot recover an installation-specific validator from transcript state | Persist the exact ready command in the Accepted record, execute it, then replace its machine path with stable passing evidence |
| B34 | Historical production-first testing policy | Preserve the original scorer and evidence for that policy; its feature-edit ordering gate is not a current quality requirement |
| B35 | An explicit design is carried into Develop and later approved | Preserve the worktree through design and checkpoint, carry concrete acceptance examples forward, then implement with sensitive invariant and boundary coverage |
| B36 | A read-only review is followed by an explicit scoped repair request | Preserve the reviewed diff, report the access-control failure, then observe regression failure before the authorized repair and retain sensitive tests |
| B37 | Handoff transfers a task whose implementation approval is pending | Preserve the pending checkpoint through an actual handoff record and fresh session; context restoration does not authorize implementation |
| B38 | Handoff transfers an approved task before implementation | Preserve approved scope in the actual handoff record; a fresh session implements and verifies without restarting approval |
| B39 | A complete integer-string contract expands a numeric API | Preserve unrestricted exact integer-string semantics and both approval boundaries; retain range- and precision-sensitive tests |
| B40 | A pending checkpoint survives native context compaction | Resume the same thread and wait for missing approval without changing the workspace |
| B41 | Approved implementation survives native context compaction | Resume the same thread and implement the approved scope without another approval checkpoint |
| B42 | Chinese Python Develop proceeds from a checkpoint to approved implementation | Preserve the approval boundary, reject `bool`, keep unrestricted integer semantics and existing `add` coverage, and leave meaningful unittest evidence without extra local records |

The executable corpus implements B01-B17 through the original fixtures. B19 is `develop-question-batching`; B18 and B20 are `develop-lifecycle`; B21 is `diagnose-continuation`; B22 is `develop-requirement-lifecycle`. B23-B28 are `develop-scope-in-approval`, `develop-workflow-termination`, `review-develop-overlap`, `diagnose-no-reproduction`, `python-clear-task`, and `develop-durable-resume`. B29-B31 are `develop-fact-solution-alignment`, `justified-novelty`, and `diagnose-cleanup`; B32 is `develop-durable-validator-holdout`; B33 is `develop-durable-command-holdout`; and B34 is the unchanged historical `post-implementation-testing` scenario. B35-B38 are `design-develop-transition`, `review-repair-transition`, `handoff-pending-resume`, and `handoff-approved-resume`. Existing explicit Develop scenarios include an approval follow-up so they exercise the same gate.

`design-develop-transition` reuses the balance fixture and its executable invariant and mutation checks. It checks that distinguishing accepted examples are recorded before implementation and retained tests detect overdraft and exact-balance errors. Feature-test edit order is recorded only as an observation. This gives the revised testing policy a separate benchmark fingerprint without rewriting historical results. Output-shape heuristics support trajectory review; they do not prove every aspect of requirement understanding or the absence of redundant questions.

B39 is `develop-contract-fidelity`; B40-B41 are `develop-compacted-pending` and
`develop-compacted-approved`. The two compaction variants receive the same continuation prompt, which
grants no new authority. Their earlier approval messages supply the only authorization difference.

B42 is `develop-python-clear-task`, a two-turn Chinese/Python variant of `develop-lifecycle`.
The original Core-only `python-clear-task` remains an unchanged holdout. Python-specific scoring checks
the complete unittest discovery result and actual model command separately, then tests contract and
coverage sensitivity in a temporary copy without bytecode caches. `-B` prevents cache writes but does
not prevent reads, so pre-existing fixture caches are excluded from the copy and preserved in place.
The verification record includes the actual Python interpreter version; this bounded sample does not
establish portability across Python versions.

## Scoring

Prefer deterministic evidence:

- Compilation and executable tests
- Exact changed-file set
- Presence or absence of a known helper call
- Shared versus symptom-only fix location
- No added dependency
- No nested conditional or known hidden-side-effect construct in the target hunk
- No unnecessary interface/factory/configuration files
- No unauthorized commit or global mutation
- No unexpected project-instruction edit
- Regression test fails when the fix is reverted or behavior is mutated

Use model judging only for dimensions that resist deterministic scoring, such as naming clarity or whether an abstraction improves local reasoning. Human review samples model-judged cases.

## Baseline protocol

1. Run ordinary engineering fixtures without this plugin when measuring whether the Core changes outcomes.
2. For workflow wording changes, run the same multi-turn fixture against a current-release plugin control (`BENCH_BASELINE_PLUGIN_ROOT`) and the candidate plugin.
3. Preserve every prompt, thread/session ID, per-turn event stream, diff, requirement-document state, command/test evidence, duration, and token usage when available.
4. Compare correctness first, then unwanted side effects, maintainability, approval/clarification fidelity, time, tokens, and diff size.
5. Remove guidance that does not improve outcomes or creates a larger regression elsewhere.

Use `scripts/summarize-benchmarks.js` to aggregate clean reports. It excludes contaminated runs by default and groups complete execution identities, including CLI and Node versions, platform, architecture, provider, model, reasoning, timeout, and relevant configuration. It reports pass rate, trigger precision/recall, configured collisions, ceremony counts, tools, business-turn tokens, duration, and unauthorized commits. Native compaction costs remain in each report's separate operation records. At least three completed, uncontaminated runs per arm and scenario under matching fingerprints are required for a release-level stochastic comparison. Smaller development smokes can expose regressions but do not establish a success-rate improvement.

Environment capture stores an allowlisted configuration digest rather than credentials, authentication
files, or temporary HOME paths. An unresolved provider/model or unsupported configuration is marked
incomplete and may be used for diagnostics only. Cohort filling cannot treat missing identity fields as
wildcards. Summaries show legacy or invalid identities separately per report; they do not infer the
current CLI version or aggregate historical unknown environments into a current cohort.

For release evidence, `npm run benchmark:release-summary` filters raw reports through `config/evidence-manifest.json`. Each manifest selector fixes the exact report files, benchmark and plugin fingerprints, provider, model, reasoning level, arm, and target completed count. Later runs in the same cohort cannot silently change a published summary. The manifest does not make a cohort complete by declaration; the filtered summary and manual trajectory review still establish whether enough usable samples exist.

`npm test` validates the frozen manifest's structure, historical release identity, and cohort accounting
without requiring the current package to match that historical release. When claiming current-cohort
statistical evidence, `npm run benchmark:release-verify` requires the package version, candidate plugin
fingerprint, and every selected benchmark fingerprint to match the current tree. A maintainer may
explicitly approve a release using existing verification and documented limitations without further
sampling or this statistical-evidence gate. Record that decision without relabeling old reports or
claiming new statistical evidence.

After filling the cohorts named by a reviewed **schemaVersion 2** template, generate their report lists
with `npm run benchmark:evidence-generate -- --template <new-template.json>`. Every cohort must select
an explicit `environmentFingerprint` from a complete, matching report identity. The generator retains
the template's scenario, arm, environment, target, and baseline-plugin choices; refreshes current
benchmark and candidate fingerprints; and selects completed, uncontaminated model samples. It
deliberately retains scorer, public-test, and unauthorized-commit failures because excluding real
behavioral failures would bias the release rate. It prints to stdout unless an explicit `--output`
path is supplied. Frozen schema 1 manifests remain historical records and are not templates for new
evidence or certification of the current tree; no existing manifest is automatically migrated.

The manually dispatched `release-evidence.yml` workflow runs deterministic tests, semantic coverage, and the strict current-tree evidence check. It does not run or fill stochastic cohorts in CI.

Use `scripts/report-benchmark-coverage.js` separately to inspect semantic coverage. Result aggregation answers whether configured trials passed; the coverage report answers which behavior, risk, workflow, transition, stack, language, and holdout dimensions those trials represent. Neither metric substitutes for the other.

Every run records a fingerprint of the behavior fixture and scorer. Plugin arms fingerprint the released Claude/Codex manifest files, Core, skill registry, and skill contents; ignored editor metadata and other unpublished files do not affect the plugin fingerprint. Aggregation separates fixture and plugin fingerprints into cohorts, then validates execution identities inside those cohorts; results from before and after an instruction, scorer, CLI, configuration, timeout, provider, model, or reasoning change must never be averaged together.

New transition scenarios declare `fingerprintInputs` for the runner, conversation/isolation code, verification helpers, and shared scorers on which their evidence depends. The existing fresh-context scenarios also include these isolation dependencies, so later runs cannot share a cohort with the former same-HOME behavior. Changes to these files invalidate the affected scenario fingerprints. Historical reports and frozen release manifests remain unchanged; new reports are selected explicitly and are not pooled with historical runs from another harness state.

Saved Codex authentication is sufficient for local runs. A real model A/B does not require a separate API key when the CLI is signed in, but it consumes the signed-in Codex/ChatGPT usage allowance; an OpenAI-compatible provider consumes that provider's configured quota. Deterministic tests run first and do not consume model quota.

Line count and raw scenario count are diagnostic metrics, never the primary score.

## Evaluation design influences

The harness borrows evaluation ideas without adding runtime workflow stages or framework dependencies:

- [Harbor task structure](https://github.com/harbor-framework/harbor/blob/main/docs/content/docs/tasks/index.mdx): declarative task metadata and task-specific verifier commands.
- [Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai): retained trajectories, repeated epochs, and scorer-first analysis.
- [SWE-bench harness](https://github.com/SWE-bench/SWE-bench/blob/main/swebench/harness/run_evaluation.py): fixed repository state, candidate changes, and isolated executable verification.
- [Promptfoo red-team configuration](https://github.com/promptfoo/promptfoo/blob/main/site/docs/red-team/configuration.md): tagged language and adversarial/metamorphic variants.
- [GitHub Spec Kit](https://github.com/github/spec-kit/blob/main/docs/concepts/spec-of-specs.md): stable IDs and cross-artifact traceability.

These influences belong only to the test system. They do not add a sixth user-visible workflow, make full skills implicit, or expand the always-on Core.

## Historical Claude validation

Historical Claude Code 2.1.197 runs used a Windows executable from WSL. Isolated live runs use a
Windows-local temporary workspace, a separate configuration directory, `--plugin-dir` for the
candidate, and `--setting-sources project`. Use `--no-session-persistence` only for single-turn checks;
session-continuation tests retain the session and use `--resume`. Provider variables read from the
user's settings are passed only to the child process; when launching Win32 from WSL, their names must
also be listed in that process's `WSLENV`. Values must never be printed or copied into repository files.
Do not copy the user's complete settings, plugins, or MCP configuration into an isolated run.

The previously validated plugin passed `claude plugin validate . --strict`, loaded all five released workflows, and ran SessionStart and UserPromptSubmit. One explicit `/engineering-flow:develop` ambiguity sample loaded the complete workflow, asked for the related-order policy, and left the worktree clean. Exploratory Core-only samples selected a `RESTRICT` policy and edited code despite the injected Core. These historical samples validate routing for their recorded candidate; they do not establish behavioral parity or validate later wording changes. New cross-platform claims require current isolated evidence.

On 2026-08-27, Claude Code 2.1.223 first loaded the current candidate, Core, and all five workflows for the new post-implementation testing fixture, but its OAuth refresh failed before inference because the Windows executable had not received the API-provider variables from WSL. That zero-token attempt is infrastructure evidence only. Forwarding only the variable names through `WSLENV` allowed the existing `ANTHROPIC_AUTH_TOKEN`, base URL, and model settings to reach the isolated child without loading user plugins or printing credentials. Two manually reviewed failures then drove narrow Develop corrections: candidate `88a32553e6de` invented `no test edits` from unrelated restrictions, and `a6bcbf86a446` treated an ad-hoc probe as a substitute for selected money-integrity coverage. Final candidate `a1d44ed59b97` wrote production code before the established test file and left mutation-sensitive overdraft and exact-balance coverage. These are separate single samples, not one stochastic cohort.

On 2026-09-12, one isolated two-turn Claude Code 2.1.223 smoke used candidate `932976d966bc` and the
configured Kimi model `kimi-k3[1M]` (reported by the client as `kimi-k3[1m]`), with requested effort `low`
and Windows Node v20.17.0. Core and the explicit Develop workflow loaded; the pending checkpoint
preserved every fixture file, and approval resumed the same session to implement and pass four tests.
Independent contract checks and zero/negative-even and invalid-input mutants also passed. Edit and
write tools were available in both turns. Only the candidate external plugin and no MCP servers were
loaded; client-bundled skills remained part of the recorded CLI environment. Raw streams, the persistent
rollout, final files, frozen plan, and manual audit are retained in
`benchmark-results/claude-develop-smoke-21fd1d45/`.

This is current Claude Code client evidence using Kimi, not Anthropic Claude-model evidence or a
matched-model comparison with Codex. It does not exercise native compaction or support a reliability
claim. Keep this manual smoke separate from Codex evidence-manifest cohorts.
