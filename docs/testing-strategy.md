# Testing Strategy

## Objectives

Tests must answer two different questions:

1. Did the correct skill load or remain unavailable?
2. Did the skill measurably improve the resulting engineering behavior?

Invocation without behavioral improvement is not success.

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

Metamorphic variants change one or two dimensions such as language, workflow-token overlap, turn ordering, or context continuity while preserving the underlying invariant. Prefer pairwise variants over a Cartesian product. `freshSessionTurns` deliberately starts selected follow-ups without the prior thread while retaining the fixture workspace; this tests recovery from durable repository state. It is not evidence for a host's literal `/compact` implementation.

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

The executable corpus implements B01-B17 through the original fixtures. B19 is `develop-question-batching`; B18 and B20 are `develop-lifecycle`; B21 is `diagnose-continuation`; B22 is `develop-requirement-lifecycle`. B23-B28 are `develop-scope-in-approval`, `develop-workflow-termination`, `review-develop-overlap`, `diagnose-no-reproduction`, `python-clear-task`, and `develop-durable-resume`. B29-B31 are `develop-fact-solution-alignment`, `justified-novelty`, and `diagnose-cleanup`; B32 is `develop-durable-validator-holdout`, and B33 is `develop-durable-command-holdout`. Existing explicit Develop scenarios include an approval follow-up so they exercise the same gate.

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

Use `scripts/summarize-benchmarks.js` to aggregate clean reports. It excludes contaminated runs by default, keeps provider, model, and reasoning levels in separate groups, and reports pass rate, trigger precision/recall, configured collisions, ceremony, tools, tokens, duration, and unauthorized commits. At least three clean runs per arm are required before treating a stochastic comparison as evidence.

For release evidence, `npm run benchmark:release-summary` filters raw reports through `config/evidence-manifest.json`. Each manifest selector fixes the exact report files, benchmark and plugin fingerprints, provider, model, reasoning level, arm, and target completed count. Later runs in the same cohort cannot silently change a published summary. The manifest does not make a cohort complete by declaration; the filtered summary and manual trajectory review still establish whether enough usable samples exist.

Use `scripts/report-benchmark-coverage.js` separately to inspect semantic coverage. Result aggregation answers whether configured trials passed; the coverage report answers which behavior, risk, workflow, transition, stack, language, and holdout dimensions those trials represent. Neither metric substitutes for the other.

Every run records a fingerprint of the behavior fixture and scorer. Plugin arms fingerprint the released Claude/Codex manifest files, Core, skill registry, and skill contents; ignored editor metadata and other unpublished files do not affect the plugin fingerprint. Aggregation separates fixture and plugin fingerprints into cohorts, then separates execution environments inside those cohorts; results from before and after an instruction, scorer, provider, model, or reasoning change must never be averaged together.

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

## Claude validation status

Claude Code 2.1.197 is available as a Windows executable from WSL. Isolated live runs use a Windows-local temporary workspace, `--plugin-dir` for the candidate, `--setting-sources project`, and `--no-session-persistence`. Provider variables read from the user's settings are passed only to the child process; when launching Win32 from WSL, their names must also be listed in that process's `WSLENV`. Values must never be printed or copied into repository files.

The current plugin passes `claude plugin validate . --strict`, loads all five released workflows, and runs SessionStart and UserPromptSubmit. One explicit `/engineering-flow:develop` ambiguity sample loaded the complete workflow, asked for the related-order policy, and left the worktree clean. Exploratory Core-only samples selected a `RESTRICT` policy and edited code despite the injected Core. Therefore Claude explicit routing is live-validated, but Core-only behavioral parity with Codex is not established and cross-platform release claims must remain qualified.
