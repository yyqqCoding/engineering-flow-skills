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
- `codex exec --ephemeral --json`
- A fixture-specific working directory
- No candidate plugin for baseline runs
- Only this candidate plugin for treatment runs

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
- Explicit Codex and Claude workflow tokens inject the complete requested skill content for that turn.
- Duplicate tokens are deduplicated, multiple explicit workflows preserve prompt order, and ordinary or unknown tokens inject nothing.
- Codex and Claude output formats are valid.
- Hook failure is safe and does not block the agent.
- Repeated injection does not duplicate rules in a single event payload.

### 3. Invocation behavior

Before introducing any model-invoked skill, maintain positive, negative, and overlap prompts.

Metrics:

- Precision: triggered runs that were appropriate.
- Recall: appropriate prompts that invoked the skill.
- Collision rate: incompatible skills triggered together.
- Ceremony cost: unnecessary questions, plans, or workflow stages caused by a false trigger.

Each behavior fixture declares expected and allowed skill invocations. Scenarios with known incompatible workflows also declare forbidden combinations; for example, a read-only review must not collide with completion reconciliation. The JSONL parser records actual skill-file reads, command executions, file changes, todo lists, question-bearing agent messages, and token usage.

Invocation precision and recall apply only to candidate runs because baseline environments do not contain the candidate skills.

For user-invoked workflows, the treatment runner counts skills routed by the deterministic `UserPromptSubmit` hook as invoked. Raw model-initiated skill-file reads remain recorded separately. Hook unit tests verify that supported Codex and Claude tokens inject the complete requested workflow and ordinary prompts inject nothing.

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

The executable corpus implements all 17 scenarios. B03 is represented by `existing-capability`; B06 by `hidden-effects`; B09 by `regression-sensitivity`; B10 by `configuration-only`; B05 by `readability-trap`; B01 by `ambiguous-delete`; B02 by `clear-simple-task`; B04 by `shared-root-cause`; B16 by `code-design-greenfield`; and B17 by `code-design-refinement`.

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

1. Run each fixture without this plugin.
2. Preserve prompt, output events, diff, command evidence, duration, and token usage when available.
3. Run the same fixture with only this plugin installed.
4. Compare correctness first, then unwanted side effects, maintainability, ceremony, time, tokens, and diff size.
5. Remove guidance that does not improve outcomes or creates a larger regression elsewhere.

Use `scripts/summarize-benchmarks.js` to aggregate clean reports. It excludes contaminated runs by default and reports pass rate, trigger precision/recall, configured collisions, ceremony, tools, tokens, duration, and unauthorized commits. At least three clean runs per arm are required before treating a stochastic comparison as evidence.

Every run records a fingerprint of the behavior fixture and scorer. Candidate runs also fingerprint the plugin manifests, Core, skill registry, and skill contents. Aggregation separates fingerprints into cohorts; results from before and after an instruction change must never be averaged together.

Line count is a diagnostic metric, never the primary score.

## Claude validation status

Claude Code 2.1.197 is available as a Windows executable from WSL. Isolated live runs use a Windows-local temporary workspace, `--plugin-dir` for the candidate, `--setting-sources project`, and `--no-session-persistence`. Provider variables read from the user's settings are passed only to the child process; when launching Win32 from WSL, their names must also be listed in that process's `WSLENV`. Values must never be printed or copied into repository files.

The current plugin passes `claude plugin validate . --strict`, loads all five released workflows, and runs SessionStart and UserPromptSubmit. One explicit `/engineering-flow:develop` ambiguity sample loaded the complete workflow, asked for the related-order policy, and left the worktree clean. Exploratory Core-only samples selected a `RESTRICT` policy and edited code despite the injected Core. Therefore Claude explicit routing is live-validated, but Core-only behavioral parity with Codex is not established and cross-platform release claims must remain qualified.
