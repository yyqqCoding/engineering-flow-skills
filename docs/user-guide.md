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
| Feature, refactor, tests, or maintainability work | `develop` | Yes |
| Material decisions require approval before coding | `develop confirm` | After approval |
| Bug, regression, incorrect output, intermittent fault, or slowdown | `diagnose` | When a fix is requested |
| Create a solution from scratch or refine an existing design | `code-design` | No |
| Review a diff, branch, or uncommitted work | `review` | No, strictly read-only |
| Continue in a new session or with another agent | `handoff` | No |

## Detailed scenarios

### `develop`

`develop` is the complete implementation entry point. It:

1. Inspects project instructions, authoritative docs, Git state, relevant code, tests, and callers.
2. Aligns the goal, acceptance behavior, scope, facts, and material solution decisions.
3. Asks only blocking questions and infers reversible internal details from repository precedent.
4. Implements the smallest complete change and gathers focused feedback.
5. Adds boundary coverage for applicable risk and improves structure under demonstrated design pressure.
6. Verifies with fresh evidence and updates authoritative documentation only for changed facts.

Normal mode proceeds autonomously:

```text
$engineering-flow:develop
Implement device alarm contacts. Inspect the existing design and ownership boundaries, add focused tests, and reconcile the authoritative documentation.
```

Use confirmation mode when coding must wait:

```text
$engineering-flow:develop confirm
Implement customer batch deletion. First confirm the goal, acceptance behavior, related-data policy, and scope. Do not code until I explicitly approve them.
```

The model should return a requirement summary, assumptions, and blockers, then wait.

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

Diagnosis is read-only unless the user also requests a fix. When a correct test seam exists, it observes failure before applying the fix.

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
  └─ loads the complete workflow for that request only
```

- The current user request and project-local `AGENTS.md`, `CLAUDE.md`, and authoritative docs always take precedence.
- Unnamed full workflows do not load automatically.
- Unknown tokens do not trigger a workflow.
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

- Static and deterministic tests: 36/36 passed.
- Current Codex cohort: 17 scenarios, candidate 51/51; explicit invocation 51/51, with zero false routes, missed routes, collisions, contamination, or unauthorized commits.
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

The runner isolates global plugins and skills and fingerprints fixture/candidate contents so different versions are not mixed. Raw results are stored in the ignored `benchmark-results/` directory.
