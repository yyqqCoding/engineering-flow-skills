# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

A compact, evidence-driven development workflow for Codex CLI and Claude Code.

After simplification, the project exposes only five workflows: `develop`, `diagnose`, `code-design`, `review`, and `handoff`. Requirement clarification, completion reconciliation, boundary testing, and maintainability improvement no longer require separate invocations. The relevant workflow performs them internally when evidence justifies the work.

> Describe ordinary work directly. Explicitly choose one workflow for deeper tasks.

## Start here: what do the five workflows do?

| Workflow | Use it for | Outcome | Edits code? |
|---|---|---|---|
| `develop` | Features, refactors, tests, and maintainability work | Implements, verifies, and reconciles necessary documentation | Yes |
| `diagnose` | Bugs, regressions, incorrect output, intermittent faults, and slowdowns | Reproduces and locates the root cause; fixes it when requested | Depends on the request |
| `code-design` | Create a solution from scratch or refine an existing design | Produces an implementation-ready proposal | No |
| `review` | Review a diff, branch, or uncommitted work | Reports evidence-backed findings by impact | No, strictly read-only |
| `handoff` | Continue in another session or with another agent | Produces a compact continuation record | No |

Codex uses `$engineering-flow:<workflow>`. Claude Code uses `/engineering-flow:<workflow>`.

### 1. `develop`: the main implementation workflow

Use it when you need to:

- Implement a feature or complete a substantial change.
- Refactor, add tests, or improve existing code without changing public behavior.
- Establish repository facts, requirement details, and solution boundaries before coding.
- Finish with focused verification, justified boundary hardening, and documentation reconciliation.

`develop` provides a complete development lifecycle without making every task ceremonial:

1. Inspect project instructions, authoritative docs, Git state, relevant code, tests, and callers.
2. Align the goal, acceptance behavior, scope, facts, and solution decisions that could materially change the result.
3. Ask only blocking questions. Infer reversible internal details from repository precedent.
4. Implement the smallest complete change and gather feedback through meaningful tests, compilation, linting, or integration checks.
5. Add boundary coverage only for applicable risk, and improve structure only under demonstrated design pressure.
6. Verify the current state with fresh evidence and update authoritative documentation only for changed facts.

Normal mode proceeds autonomously:

```text
$engineering-flow:develop
Implement order batch export. Reuse existing permissions and query capabilities, add focused tests, and reconcile the authoritative documentation. Do not commit.
```

Use `confirm` when all coding must wait for your approval:

```text
$engineering-flow:develop confirm
Implement customer batch deletion. First confirm the goal, acceptance behavior, data-handling policy, and scope. Do not code until I explicitly approve them.
```

The model should return a requirement summary, assumptions, and blockers, then wait.

Maintainability work and extreme tests also use `develop`; they do not need separate skills:

```text
$engineering-flow:develop
Preserve public behavior while improving notification-module ownership and readability. Add abstraction only under real variation pressure, and cover applicable duplicate, concurrent, and external-failure boundaries.
```

A design pattern is not the goal, and neither is reducing line count. Introduce an abstraction only when the coupling and change cost it removes exceed the interfaces, files, and indirection it adds.

### 2. `diagnose`: investigate and fix existing failures

Use it for a bug, regression, incorrect result, intermittent failure, or measured performance degradation in existing behavior.

It first pins expected versus actual behavior, creates the smallest reliable reproduction signal, follows data and control flow to the module that owns the rule, and tests falsifiable root-cause hypotheses. Diagnosis is read-only unless the user also asks for a fix.

```text
$engineering-flow:diagnose
Fix calculateRenewalDate moving January 31 into March. Reproduce it first, locate the root cause, leave a test that detects the regression, and run focused verification. Do not commit.
```

When a correct test seam exists, it observes failure before the fix. Boundary tests and structural improvements stay tied to the demonstrated root cause instead of turning a local bug into a broad redesign.

### 3. `code-design`: create or refine a solution

Use it in either of these situations:

- You have a goal or problem, but modules, interfaces, and the implementation approach are unsettled.
- You already have a design draft that needs completeness, consistency, feasibility, ownership, or complexity review.

```text
$engineering-flow:code-design
We need multi-channel notifications, but the modules and interfaces are unsettled. Use this repository to propose the lowest necessary complexity, trade-offs, open questions, acceptance evidence, and implementation sequence. Do not code.
```

`code-design` returns a proposal by default. It does not implement production code or silently edit a design document. After the proposal is accepted, start a new `develop` request to implement it.

### 4. `review`: strict read-only review

Use it to review the current diff, a branch, a pull request, or uncommitted work. It defines the comparison point, recovers the intended requirements, and independently checks requirements, correctness, safety, design, readability, tests, documentation, and scope.

```text
$engineering-flow:review
Review the current uncommitted access-control changes against docs/access-policy.md. Report findings by severity with files and lines. Do not edit anything.
```

If there are no material findings, it says so and reports any remaining verification gap. Finding a problem does not authorize it to start fixing files.

### 5. `handoff`: continue in another session

Use it when the current context is becoming too long, a new session is needed, or another agent will continue the task.

```text
$engineering-flow:handoff
Create a continuation record with the objective, completed state, key files, decisions and reasons, latest verification, remaining work, risks, and Git status.
```

Without an output path, the handoff is returned in the response and no file is silently created.

## Which one should I choose?

| Your situation | Recommended usage |
|---|---|
| A clear, local, low-risk change | Describe the task directly without a workflow token |
| A feature, refactor, test-only change, or maintainability improvement | `develop` |
| Coding must wait for your approval of material decisions | `develop confirm` |
| Existing behavior is broken and needs reproduction and root-cause analysis | `diagnose` |
| The solution is unsettled or an existing design needs refinement | `code-design` |
| You want review only and no file edits | `review` |
| Work must continue in a new session | `handoff` |

The common choices can be summarized as:

```text
clear small task                         → describe it directly
complete implementation                  → develop
broken existing behavior                 → diagnose
unsettled approach / incomplete design   → code-design
```

Use `review` and `handoff` when you need formal review or a session transition. They are not mandatory stages of every development task.

## How do I invoke a workflow?

### Mode A: describe ordinary work directly

After installation and a new session, the compact Engineering Core activates automatically. A clear small task needs no workflow token:

```text
Add an optional middleName to formatDisplayName and ignore blank values. Preserve the existing export, add the smallest meaningful verification, and do not commit.
```

The Core asks the model to inspect project rules and relevant code, preserve unrelated work, ask only about material ambiguity, choose the correct owner, write maintainable code, and run scope-appropriate verification.

### Mode B: explicitly invoke a workflow for deeper work

Send the workflow token together with the task in the model conversation. Putting it on the first line is recommended:

| Environment | Invocation | Example |
|---|---|---|
| Codex CLI | `$engineering-flow:<workflow>` | `$engineering-flow:develop` |
| Claude Code | `/engineering-flow:<workflow>` | `/engineering-flow:develop` |

> A workflow token is not a Bash or PowerShell command. Run installation commands in the system terminal. Send requirements and workflow tokens in the Codex or Claude Code conversation.

Full workflows load only when the user names them. Ordinary prompts do not let the model guess and automatically select a full workflow.

## What was simplified?

Capabilities were consolidated, not removed. Users no longer need to remember or manually chain these steps:

| Previously separate concern | Current owner |
|---|---|
| Requirement clarification and fact alignment | Alignment inside `develop`, `diagnose`, or `code-design` |
| Completion verification and requirement reconciliation | Completion inside `develop` and `diagnose` |
| Extreme and boundary tests | Conditional, risk-based hardening inside `develop` and `diagnose` |
| Maintainability, architecture, and design-pattern analysis | Conditional hardening inside `develop` and `diagnose`; proposal-only work uses `code-design` |
| Reviewer-feedback verification | An always-on Core rule |

You do not need to invoke “clarify → develop → extreme tests → optimize → verify.” A single `develop` request normally owns the complete implementation task.

## Installation

### Codex CLI

Run these once in the system terminal:

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

Confirm that the plugin is enabled:

```bash
codex plugin list --json
```

The output should include values similar to:

```json
{
  "pluginId": "engineering-flow@engineering-flow",
  "installed": true,
  "enabled": true
}
```

Close the old session and start a new one in the target project:

```bash
cd /path/to/your-project
codex
```

The new session loads the automatic Core. When switching projects later, start Codex from the relevant project directory.

For local development, replace the GitHub source with the repository's absolute path:

```bash
codex plugin marketplace add /absolute/path/to/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

### Claude Code

Run these inside the Claude Code conversation:

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

Claude Code uses `/engineering-flow:<workflow>`. Current live evidence supports explicit `/engineering-flow:develop`. For data policy, permissions, or other material decisions, explicitly invoke the full workflow instead of relying on the ordinary Core alone.

## What happens after installation?

```text
new session
  └─ automatically loads the 243-word Engineering Core

ordinary request
  └─ uses only the Core and stays compact

explicit $engineering-flow:develop or /engineering-flow:develop
  └─ loads the complete develop workflow for that request only
```

- Project-local `AGENTS.md`, `CLAUDE.md`, authoritative docs, and the current user request always take precedence.
- All five full workflows remain explicitly user-invoked on both Codex and Claude Code.
- Unknown tokens, ordinary prompts, and unnamed workflows do not load a full skill.
- A workflow never grants permission to commit, push, publish, create issues, install dependencies, or change global configuration.

## Updating and uninstalling

Refresh the Codex marketplace snapshot:

```bash
codex plugin marketplace upgrade engineering-flow
```

After a released version changes, reinstall and start a new session:

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin add engineering-flow@engineering-flow
```

Uninstall:

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin marketplace remove engineering-flow
```

## Troubleshooting

| Symptom | Resolution |
|---|---|
| The terminal reports `$engineering-flow:develop: command not found` | The token was entered in the wrong place. Send it to the Codex conversation, not the system terminal. |
| Nothing appears to change after installation | Confirm that `installed` and `enabled` are both `true`, then close the old session and restart Codex. |
| There is no welcome message | This is normal. The Core is injected in the background and does not require a banner. |
| A workflow does not trigger | Use the complete, exact token, preferably on the first line, and confirm that the plugin is enabled. |
| Old behavior remains after updating | Refresh the marketplace, reinstall the plugin, and start a new session. |

## Design principles

- Optimize for minimum necessary complexity, not minimum line count.
- Prefer familiar, explicit, locally understandable, debuggable code.
- Reuse behavior only when it represents the same domain rule and should evolve together; do not abstract visual duplication by default.
- Regressions and high-risk business behavior observe failure first when a stable seam exists. Configuration, presentation, and mechanical changes do not require ceremonial unit tests.
- Boundary hardening follows real input, state, concurrency, permission, resource, migration, or compatibility risks. It does not invent product behavior.
- Design patterns solve demonstrated change pressure; they are not a code-quality score.
- Before completion, gather fresh, scope-appropriate evidence and update authoritative facts only when they actually changed.

The project does not impose a documentation layout, branching policy, commit convention, worktree, subagent, or design-pattern requirement.

## Validation status

- The five-workflow architecture passes 36/36 static and deterministic tests.
- The current Codex cohort covers 17 scenarios with three isolated samples per arm: baseline 45/51 (88.2%), candidate 51/51 (100%).
- Candidate explicit invocation passed 51/51 checks. False routes, missed routes, workflow collisions, contamination, and unauthorized commits were all zero.
- Demonstrated gains are concentrated in two stable differences: waiting on an undefined related-data deletion policy, and observing regression failure before making it green.
- Claude Code 2.1.197 passed official strict manifest validation, loaded the plugin, all five workflows, and both hooks. An explicit `/engineering-flow:develop` ambiguity sample passed with a clean worktree.
- A matching Claude Core-only prompt still selected `RESTRICT` and edited code, so ordinary-prompt behavioral parity with Codex is not claimed.

See the [A/B benchmark log](docs/benchmark-log.md) for complete evidence.

## Development and testing

Node.js 20 or newer is required:

```bash
npm test
```

To use another OpenAI-compatible provider, create an ignored `.env` in the repository root:

```dotenv
BENCH_MODEL_PROVIDER=benchmark_env
BENCH_BASE_URL=https://your-provider.example/v1
BENCH_API_KEY=replace-me
BENCH_MODEL=your-model
BENCH_REASONING_EFFORT=low
```

Shell environment variables take precedence over `.env`. Never commit a real API key.

```bash
# One isolated sample
node scripts/run-codex-benchmark.js readability-trap candidate

# Repeated A/B samples
BENCH_REPETITIONS=3 BENCH_CONCURRENCY=2 \
  npm run benchmark:ab -- readability-trap ambiguous-delete

# Fill current-fingerprint gaps and summarize
BENCH_TARGET_COMPLETED=3 BENCH_CONCURRENCY=2 npm run benchmark:fill
npm run benchmark:summary
```

The runner isolates global plugins and skills and fingerprints fixture/candidate contents so different versions are not mixed. Raw output is stored in the ignored `benchmark-results/` directory.

## Design and testing documents

- [Product design](docs/product-design.md)
- [Behavior specification](docs/behavior-spec.md)
- [Trigger model](docs/trigger-model.md)
- [Testing strategy](docs/testing-strategy.md)
- [A/B benchmark log](docs/benchmark-log.md)

## Known limitations

- Claude Code's explicit `develop` path passes a live sample, but the Core-only ambiguity sample does not; full behavioral parity with Codex is not established.
- Claude validation used session-only `--plugin-dir`; this work did not modify the user's global Claude marketplace installation.
- Full workflows add context, tool calls, and latency, so they remain explicitly invoked.
- The current version is `0.1.0`; workflow names and details may still change when new evidence supports a revision.

## Credits and license

This project references and reorganizes selected ideas from:

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution. The project is licensed under the [MIT License](LICENSE).
