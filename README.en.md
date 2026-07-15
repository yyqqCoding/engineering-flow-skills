# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

A compact, evidence-driven development workflow for Codex CLI and Claude Code.

This project combines selected, benchmarked ideas from Superpowers, Matt Pocock's engineering skills, and Ponytail without forcing every task through requirement interviews, saved plans, worktrees, subagents, TDD, formal review, and branch-finishing ceremony. The goal is not to make the model perform more steps. It is to make high-risk work more reliable while keeping simple work direct.

## Status

- The complete 15-scenario A/B corpus has been run in Codex CLI.
- The final candidate passed 47/47 engineering checks, routed 19/19 requested workflows, and produced zero false routes.
- Claude Code plugin metadata and hooks pass static compatibility tests.
- Claude Code is not installed in the current development environment, so real Claude behavioral validation remains outstanding.

The current version is ready for personal Codex CLI use. Cross-platform validation still requires a real Claude Code run.

## Design principles

- Only the 228-word Engineering Core is always active.
- Full workflows load only through explicit user tokens; the model does not guess which workflow to invoke.
- Regressions and high-risk business behavior observe failure first when a stable test seam exists. Configuration, presentation, and mechanical changes do not require ceremonial unit tests.
- Prefer familiar, explicit, locally understandable, debuggable code over minimum line count.
- Reuse behavior only when it has the same domain responsibility and should evolve together; do not abstract visual duplication by default.
- Before completion, gather fresh scope-appropriate evidence and reconcile authoritative documentation. Promote only durable rules to `AGENTS.md` or `CLAUDE.md`.

Design documents:

- [Product design](docs/product-design.md)
- [Behavior specification](docs/behavior-spec.md)
- [Trigger model](docs/trigger-model.md)
- [Testing strategy](docs/testing-strategy.md)
- [A/B benchmark log](docs/benchmark-log.md)

## How it works

Ordinary requests receive only the compact Core:

```text
ordinary user request
    └─ Engineering Core
       ├─ inspect repository state, project rules, relevant code, and tests
       ├─ ask only about ambiguities that materially change the result
       ├─ choose the correct ownership and reuse boundary
       ├─ write clear, maintainable code
       └─ run scope-appropriate verification and reconcile documentation
```

Only explicit tokens load a full workflow:

```text
$engineering-flow:diagnose ...
    └─ UserPromptSubmit hook
       └─ inject complete diagnose/SKILL.md for the current turn only
```

Codex and Claude share the same deterministic routing hook. Ordinary prompts, unknown tokens, and skills that were not explicitly named do not load a full workflow.

## Supported environments

- Codex CLI
- Claude Code

Other agent hosts are intentionally out of scope.

## Installation

### Codex CLI

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

Start a new session after installation so the SessionStart Core is loaded.

For local development, replace `yyqqCoding/engineering-flow-skills` with the absolute repository path:

```bash
codex plugin marketplace add /absolute/path/to/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

### Claude Code

Run these commands inside Claude Code:

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

The Claude Code file layout and hook output pass static tests, but installation and behavior have not yet been exercised on this computer.

## Quick start

For a clear, local, low-risk task, do not invoke a full skill. Describe the change directly:

```text
Add an optional middleName to formatDisplayName. Ignore blank middle names, preserve the export, add focused tests, and do not commit.
```

The Core inspects repository rules, existing behavior, and relevant tests automatically. It pauses only when unresolved details would materially change behavior, interfaces, data, permissions, security, compatibility, or acceptance criteria.

Explicitly invoke a full workflow when you want the deeper process:

```text
Codex CLI:   $engineering-flow:develop Implement batch export, verify it, and reconcile the authoritative design document.
Claude Code: /engineering-flow:develop Implement batch export, verify it, and reconcile the authoritative design document.
```

## Workflow guide

| Workflow | Use it for | Codex example |
|---|---|---|
| `develop` | A complete implementation lifecycle from requirement alignment through verification and documentation | `$engineering-flow:develop Implement order batch export.` |
| `clarify` | Material requirement branches that must be resolved without coding | `$engineering-flow:clarify Define customer deletion behavior. Do not code.` |
| `diagnose` | Existing bugs, regressions, incorrect output, intermittent faults, or measured slowdowns | `$engineering-flow:diagnose Fix month-end renewal dates.` |
| `code-design` | Non-local module boundaries, state, dependencies, variation axes, or abstraction pressure | `$engineering-flow:code-design Evaluate the notification-channel boundary.` |
| `review` | A strict read-only review of a diff, branch, or work in progress | `$engineering-flow:review Review the current permission change without editing.` |
| `verify-and-reconcile` | Complex completion evidence, authoritative docs, migrations, data risk, or durable project rules | `$engineering-flow:verify-and-reconcile Reconcile implementation, tests, and design docs.` |
| `handoff` | A compact, verifiable continuation record for another session | `$engineering-flow:handoff Capture the current task state.` |

In Claude Code, replace `$engineering-flow:` with `/engineering-flow:`.

### 1. Complete development

```text
$engineering-flow:develop
Implement device alarm contacts. Read the existing design and ownership boundaries, add focused tests, and reconcile the authoritative document. Do not commit.
```

Normal mode asks only blocking questions. Reversible implementation details that can be safely inferred from the repository remain autonomous.

Use confirm mode when coding must wait for explicit approval:

```text
$engineering-flow:develop confirm
Implement customer batch deletion. Make sure every material requirement is understood, ask about uncertain details, and do not code until I confirm.
```

The model should return the goal, acceptance behavior, scope, assumptions, and blockers, then wait for approval.

### 2. Requirements only

```text
$engineering-flow:clarify
Define deletion, deactivation, retention, and permission behavior when customers have historical orders. Produce an implementation-ready brief without coding.
```

This is useful when a web discussion or initial design document has not yet become an executable behavioral agreement.

### 3. Diagnose a regression

```text
$engineering-flow:diagnose
Fix calculateRenewalDate moving January 31 into March. Reproduce it first, then fix it and leave a sensitive regression test.
```

The workflow separates symptoms from root causes, checks related callers, and observes failure first when a correct test seam exists.

### 4. Design and maintainability

```text
$engineering-flow:code-design
Notification validation, payload formatting, and transport selection repeat the same channel branching. Evaluate the real variation axis and implement the lowest necessary complexity.
```

A design pattern is not a goal. Use one only when the coupling and change cost it removes exceed the interfaces, files, and indirection it adds.

### 5. Read-only review

```text
$engineering-flow:review
Review the current uncommitted access-control change against docs/access-policy.md. Report material findings with files and lines; do not edit the worktree.
```

Reviewer feedback does not need a separate workflow. The Core treats each reviewer comment as a technical claim to verify before accepting, adjusting, or rejecting it with evidence.

### 6. Completion reconciliation

```text
$engineering-flow:verify-and-reconcile
Recheck acceptance behavior, implementation, test evidence, the authoritative design document, and AGENTS.md. Do not rewrite accepted requirements to excuse the implementation.
```

Use this for multiple acceptance criteria, permissions or data risk, migrations, authoritative documentation changes, or durable project rules. A simple local task usually does not need an explicit completion workflow.

### 7. Cross-session handoff

```text
$engineering-flow:handoff
Create a continuation record with the objective, current state, key files, latest verification, remaining tasks, risks, and Git status.
```

Without an output path, the workflow returns the handoff in the response and does not silently create a file.

## Recommended development flow

```text
requirement statement
  → clarify when material branches remain
  → develop, or implement a clear task directly
  → diagnose regressions
  → use code-design only under real design pressure
  → focused tests or the smallest meaningful validation
  → verify-and-reconcile when completion risk justifies it
  → update authoritative docs
  → promote only durable rules to AGENTS.md / CLAUDE.md
```

This is not a mandatory pipeline. Simple work should remain simple. Escalate the workflow only when task complexity and risk justify it.

## Working with project instructions

- The current user request and project-local `AGENTS.md` or `CLAUDE.md` take precedence over this plugin.
- Business rules, APIs, SQL, fields, and acceptance criteria remain in the project's authoritative documentation.
- The plugin does not impose a documentation layout, branching policy, commit convention, or design pattern.
- A workflow never grants permission to commit, push, publish, create issues, install dependencies, or change global configuration unless the user authorized it.

## Updating

Refresh the Codex marketplace snapshot:

```bash
codex plugin marketplace upgrade engineering-flow
```

After a released version changes, reinstall the plugin:

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin add engineering-flow@engineering-flow
```

Start a new session after updating.

## Uninstalling

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin marketplace remove engineering-flow
```

## Development and testing

Node.js 20 or newer is required:

```bash
npm test
```

Run one isolated Codex behavior sample:

```bash
BENCH_REASONING_EFFORT=low \
  node scripts/run-codex-benchmark.js readability-trap candidate
```

Run repeated A/B samples:

```bash
BENCH_REPETITIONS=3 BENCH_CONCURRENCY=2 \
  npm run benchmark:ab -- readability-trap ambiguous-delete
```

Run only one arm:

```bash
BENCH_ARMS=baseline npm run benchmark:ab -- regression-sensitivity
BENCH_ARMS=candidate npm run benchmark:ab -- regression-sensitivity
```

Summarize results:

```bash
npm run benchmark:summary
npm run benchmark:summary -- false-deduplication
```

Raw results are written to ignored `benchmark-results/` files. The runner isolates global plugins and skills and fingerprints fixtures and candidate contents so different versions are not silently averaged together.

## Known limitations

- Real Claude Code installation and behavior remain unverified in the current development environment.
- The benchmark uses a strong model. The candidate's main value is stabilizing important process boundaries, not making every task more correct.
- Full workflows add context, tool calls, and latency, so they remain explicitly invoked.
- The current version is `0.1.0`; workflow names and details may still change when new evidence justifies it.

## Credits and license

This project references and reorganizes selected ideas from:

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution. The project is licensed under the [MIT License](LICENSE).
