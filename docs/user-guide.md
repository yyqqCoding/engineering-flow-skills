# Engineering Flow User Guide

[简体中文](user-guide.zh-CN.md) | [English](user-guide.md)

This guide covers complete usage, installation, maintenance, troubleshooting, and local validation. See the project [README](../README.en.md) for the product overview.

## Contents

- [Basic usage](#basic-usage)
- [Choose a workflow](#choose-a-workflow)
- [Detailed scenarios](#detailed-scenarios)
- [Installation](#installation)
- [Runtime model](#runtime-model)
- [Updating and uninstalling](#updating-and-uninstalling)
- [Troubleshooting](#troubleshooting)
- [Validation and limitations](#validation-and-limitations)
- [Development and benchmarks](#development-and-benchmarks)

## Basic usage

### Describe clear work directly

After installing the plugin and opening a new session, describe ordinary work as usual:

```text
Add an optional middleName to formatDisplayName and ignore blank values. Preserve the existing export, add the smallest meaningful verification, and do not commit.
```

The basic engineering rules activate automatically. The model should inspect project instructions and relevant code, preserve unrelated work, ask only about decisions that materially change the result, and run scope-appropriate verification before completion.

### Name a workflow for deeper work

Send the workflow name together with the task, preferably on the first line:

```text
$engineering-flow:develop
Implement order batch export. Reuse existing permission and query capabilities, add focused tests, and reconcile the authoritative documentation. Do not commit.
```

Invocation formats:

| Environment | Format |
|---|---|
| Codex CLI | `$engineering-flow:<workflow>` |
| Claude Code | `/engineering-flow:<workflow>` |

Enter these tokens in the Codex or Claude Code conversation, not in Bash or PowerShell.

## Choose a workflow

| Scenario | Workflow | Edits code? |
|---|---|---|
| Feature, refactor, tests, or maintainability work | `develop` | After approval |
| Bug, regression, incorrect output, intermittent fault, or slowdown | `diagnose` | When a fix is requested |
| Create a solution from scratch or refine an existing design | `code-design` | No |
| Review a diff, branch, or uncommitted work | `review` | No, strictly read-only |
| Continue in a new session or with another agent | `handoff` | No |

## Detailed scenarios

### `develop`

`develop` is the complete implementation entry point. It:

1. Inspects project instructions, authoritative docs, Git state, relevant code, tests, and callers.
2. Aligns the goal, acceptance behavior, scope, facts, and material solution decisions.
3. Batches independent material questions, asks dependent questions in order, and stops when implementation is safe.
4. Returns the final checkpoint and pauses for explicit implementation approval.
5. Implements the smallest complete change and gathers focused feedback after approval.
6. Adds boundary coverage for applicable risk and improves structure under demonstrated design pressure.
7. Verifies with fresh evidence and updates authoritative documentation only for changed facts.

There is one Develop mode:

```text
$engineering-flow:develop
Implement device alarm contacts. Inspect the existing design and ownership boundaries, add focused tests, and reconcile the authoritative documentation.
```

Even for a clear request, the model first returns the final goal, acceptance behavior, scope, assumptions, and material solution boundary, then stops. A short checkpoint stays in the conversation. A substantial checkpoint follows the project's existing authoritative-document convention or, when none applies, uses `docs/requirements/<feature-slug>.md`. If the initial request already supplies a complete contract, the model creates and verifies the `Draft` in that turn; hypothetical optional inputs outside the contract cannot block it.

```text
Proceed with the plan above.
```

This and equivalent action language approve implementation only after the checkpoint has been shown. The initial request, answers to clarification questions, and a reading acknowledgement alone do not. Requirement records move through `Draft -> Accepted -> Implemented`, with `Superseded` available when replaced.

Answers, approval, corrections, and omitted original acceptance items remain in the same Develop task without repeating the token. An omitted original item reopens implementation directly. New or changed scope gets an incremental checkpoint and another approval. An unrelated task does not inherit the old workflow.

A result explicitly described as `undefined`, unknown, or not established does not silently become out of scope. For delete and write operations in particular, unknown-resource behavior cannot be inferred from the success result, absent precedent, or a neighboring read API; it belongs in the independent question batch. After that batch is answered, the next response is the checkpoint unless an answer creates a dependent question or authoritative evidence exposes a contradiction.

Maintainability work and extreme tests also belong to `develop`:

```text
$engineering-flow:develop
Preserve public behavior while improving notification-module ownership and readability. Add abstraction only under real variation pressure, and cover applicable duplicate, concurrent, and external-failure cases.
```

Design patterns and reduced line count are not goals. Add abstraction only when it lowers total coupling and maintenance cost.

### `diagnose`

`diagnose` handles broken existing behavior. It pins expected versus actual behavior, builds the smallest reliable reproduction, follows data and control flow to the owning module, and tests falsifiable root-cause hypotheses.

```text
$engineering-flow:diagnose
Fix calculateRenewalDate moving January 31 into March. Reproduce it first, locate the root cause, and leave a test that detects the regression.
```

Diagnosis is read-only until the initial request or a later same-task message authorizes a fix. If the diagnosis is rejected, an ordinary follow-up keeps Diagnose active and read-only. Once the user says "fix it" or equivalent, Diagnose continues through the owning-boundary repair and regression verification without a separate Develop invocation. When a correct test seam exists, it observes failure before applying the fix.

### `code-design`

`code-design` handles unsettled goals and existing design drafts that need refinement.

```text
$engineering-flow:code-design
We need multi-channel notifications, but the modules and interfaces are unsettled. Use this repository to propose the lowest necessary complexity, trade-offs, open questions, and implementation sequence. Do not code.
```

It returns a proposal by default. It does not implement production code or silently edit design documents. Use `develop` after the design is accepted.

### `review`

`review` performs a strict read-only review of a diff, branch, pull request, or uncommitted work.

```text
$engineering-flow:review
Review the current access-control changes against docs/access-policy.md. Report findings by severity with files and lines. Do not edit anything.
```

It checks requirements, correctness, safety, design, readability, tests, documentation, and scope. Finding a defect does not grant permission to fix it.

### `handoff`

`handoff` captures the minimum state needed by a new session or another agent.

```text
$engineering-flow:handoff
Create a continuation record with the objective, completed state, key files, decisions, latest verification, remaining work, risks, and Git status.
```

Without an output path, it returns the handoff in the response and does not silently create a file.

## Installation

### Codex CLI

Run in the system terminal:

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

For local development, use the repository's absolute path:

```bash
codex plugin marketplace add /absolute/path/to/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

### Claude Code

Run inside the Claude Code conversation:

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

Claude Code uses `/engineering-flow:<workflow>`.

## Runtime model

```text
new session
  └─ automatically loads the compact Engineering Core

ordinary request
  └─ uses only the Core

explicitly named workflow
  └─ loads the complete workflow and owns that task

same-task follow-up
  └─ continues its active phase without repeating the token
```

- The current user request and project-local `AGENTS.md`, `CLAUDE.md`, and authoritative docs always take precedence.
- Unnamed full workflows do not load automatically.
- Unknown tokens do not trigger a workflow.
- Explicit cancellation, a workflow switch, or an unrelated new task ends workflow inheritance.
- Workflows never grant permission to commit, push, publish, create issues, install dependencies, or modify global configuration.

See the [trigger model](trigger-model.md) for the design details.

## Updating and uninstalling

Refresh the Codex marketplace:

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
| The terminal reports `$engineering-flow:develop: command not found` | Send the token to the Codex conversation, not the system terminal. |
| Nothing appears to change after installation | Confirm that the plugin is installed and enabled, then close the old session and restart. |
| There is no welcome message | This is normal. The Core loads in the background and does not require a banner. |
| A workflow does not trigger | Use the complete exact token, preferably on the first line. |
| Old behavior remains after updating | Refresh the marketplace, reinstall the plugin, and start a new session. |

## Validation and limitations

- Static and deterministic tests: 49/49 passed.
- Current general Codex cohort: 17 scenarios, candidate 51/51; explicit invocation 51/51, with zero false routes, missed routes, collisions, contamination, or unauthorized commits.
- Latest task-level paired A/B: under matching model, reasoning, and final scenario fingerprints, the current-release control passed 0/12 and the candidate passed 12/12; all 24 counted runs passed invocation, public-test, contamination, and unauthorized-commit guards.
- Claude Code 2.1.197 passed strict manifest validation and an explicit `/engineering-flow:develop` live sample.
- Claude Core-only ambiguity behavior does not yet match Codex. Explicitly invoke the full workflow for material data, permission, or policy decisions.
- Full workflows add context, tool calls, and latency, so they do not load for every request.

See the [benchmark log](benchmark-log.md) and [testing strategy](testing-strategy.md) for complete evidence.

## Development and benchmarks

Node.js 20 or newer is required:

```bash
npm test
```

To use an OpenAI-compatible provider, create an ignored `.env` in the repository root:

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

# Fill the current cohort and summarize
BENCH_TARGET_COMPLETED=3 BENCH_CONCURRENCY=2 npm run benchmark:fill
npm run benchmark:summary
```

Scenarios may define follow-up turns. The runner persists the first `codex exec` session, captures its thread ID, and uses `codex exec resume` for later turns while recording each message, event stream, workspace diff, requirement-document state, and public-test result.

For workflow-regression A/B, compare the candidate with a checkout of the current released plugin rather than only with no plugin:

```bash
BENCH_BASELINE_PLUGIN_ROOT=/absolute/path/to/current-release \
  npm run benchmark:ab -- develop-lifecycle diagnose-continuation
```

Saved Codex login is sufficient; an API key is optional. Real model runs consume the selected provider's quota or the signed-in Codex/ChatGPT usage allowance. Deterministic `npm test` checks do not consume model quota.

The runner isolates global plugins and skills and fingerprints fixture, control, and candidate contents so different versions are not mixed. Raw results are stored in the ignored `benchmark-results/` directory.
