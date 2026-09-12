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
Implement order batch export. Reuse existing permission and query capabilities, protect critical behavior with necessary evidence, and reconcile the authoritative documentation. Do not commit.
```

Invocation formats:

| Environment | Format |
|---|---|
| Codex CLI | `$engineering-flow:<workflow>` |
| Claude Code | `/engineering-flow:<workflow>` |

Enter these tokens in the Codex or Claude Code conversation, not in Bash or PowerShell.

## Choose a workflow

Choose by the outcome you need. Each workflow owns its task through completion; the five entries are available independently. Develop includes necessary design, debugging, self-review, and delivery.

| Scenario | Workflow | Edits code? |
|---|---|---|
| Feature, refactor, tests, or maintainability work | `develop` | After approval |
| Bug, regression, incorrect output, intermittent fault, or slowdown | `diagnose` | When a fix is requested |
| Create a solution from scratch or refine an existing design | `code-design` | No |
| Review a diff, branch, or uncommitted work | `review` | Read-only during review; specific repairs require a request |
| Preserve task state and authority for another session or agent | `handoff` | No |

## Detailed scenarios

### `develop`

`develop` is the complete implementation entry point. It:

1. Inspects project instructions, authoritative docs, Git state, relevant code, tests, and callers.
2. Aligns the goal, concrete acceptance examples, scope, facts, and material solution decisions.
3. Batches independent material questions, asks dependent questions in order, and stops when implementation is safe.
4. Returns the final checkpoint and pauses for explicit implementation approval.
5. Implements and verifies one coherent, observable behavior at a time, choosing test timing by risk.
6. Handles the design, diagnosis, fixes, and self-review needed for that implementation within the same task.
7. Checks the accepted examples against fresh evidence and updates authoritative documentation only for changed facts.

There is one Develop mode:

```text
$engineering-flow:develop
Implement device alarm contacts. Inspect the existing design and ownership boundaries, protect critical behavior with necessary evidence, and reconcile the authoritative documentation.
```

Even for a clear request, the model first returns the final goal, acceptance behavior, scope, assumptions, and material solution boundary, then stops. A short checkpoint stays in the conversation. A substantial checkpoint follows the project's existing authoritative-document convention or, when none applies, uses `docs/requirements/<feature-slug>.md`. If the initial request already supplies a complete contract, the model creates and verifies the `Draft` in that turn; hypothetical optional inputs outside the contract cannot block it.

```text
Proceed with the plan above.
```

This and equivalent action language approve implementation only after the checkpoint has been shown. The initial request, answers to clarification questions, and a reading acknowledgement alone do not. Requirement records move through `Draft -> Accepted -> Implemented`, with `Superseded` available when replaced.

Answers, approval, corrections, and omitted original acceptance items remain in the same Develop task without repeating the token. An omitted original item reopens implementation directly. New or changed scope gets an incremental checkpoint and another approval. An unrelated task does not inherit the old workflow.

A result explicitly described as `undefined`, unknown, or not established does not silently become out of scope. For delete and write operations in particular, unknown-resource behavior cannot be inferred from the success result, absent precedent, or a neighboring read API; it belongs in the independent question batch. After that batch is answered, the next response is the checkpoint unless an answer creates a dependent question or authoritative evidence exposes a contradiction.

Acceptance examples connect the requirement to verification. For example, if the agreed behavior is to export orders newest first, an example should name two orders with different creation times and show the newer one first. Merely checking that a file was produced would miss a misunderstanding of the order.

Before implementation, the agent derives expected results from the accepted behavior and repository contracts. During implementation, it verifies each meaningful behavior as it becomes available. Critical assertions can be fixed early; reproducible regressions with a stable test seam still require an observed failure before the fix. Mechanical or presentation changes may use build, type, smoke, or visual checks. A test-only task validates the sensitivity of its coverage without inventing a production change.

Each slice continues under the existing implementation approval. Additional tests for an established risk are normal verification; a change to expected product behavior or approved scope returns to alignment. Before completion, the agent checks overall acceptance and relevant interactions, including any item still lacking evidence.

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

The example above already authorizes a repair: Diagnose proceeds through reproduction, root-cause analysis, the fix, regression verification, and completion. A diagnosis-only request stays read-only until a later message such as "fix it" authorizes repair. If the diagnosis is rejected, the same task returns to read-only investigation. No separate Develop invocation is required. When a stable test seam exists, it observes failure before applying the fix. Undefined product behavior or material additional scope still needs alignment.

### `code-design`

`code-design` handles unsettled goals and existing design drafts that need refinement.

```text
$engineering-flow:code-design
We need multi-channel notifications, but the modules and interfaces are unsettled. Use this repository to propose the lowest necessary complexity, trade-offs, open questions, and implementation sequence. Do not code.
```

It returns a proposal by default. It does not implement production code or silently edit design documents. If you choose Develop for implementation, it reuses the settled goals, boundaries, decisions, and examples. Only missing items, changes, or contradictory repository evidence need further alignment before Develop presents its implementation checkpoint. Accepting a design proposal alone does not approve implementation.

### `review`

`review` performs a strict read-only review of a diff, branch, pull request, or uncommitted work.

```text
$engineering-flow:review
Review the current access-control changes against docs/access-policy.md. Report findings by severity with files and lines. Do not edit anything.
```

It checks requirements, correctness, safety, design, readability, tests, documentation, and scope. Finding a defect does not grant permission to fix it. A follow-up such as "fix findings 1 and 3" authorizes verification of those findings, the necessary repairs, and fresh validation within the same task, subject to any existing task approval gate. There is no need to invoke Develop again; findings outside the request remain unchanged.

### `handoff`

`handoff` captures the minimum state needed by a new session or another agent, including the active workflow, phase, accepted behavior, existing authority, and pending approvals.

```text
$engineering-flow:handoff
Create a continuation record with the objective, active workflow and phase, existing authority, completed state, key files, decisions, latest verification, remaining work, risks, and Git status.
```

Without an output path, it returns the handoff in the response and does not silently create a file. The record transfers task state; it grants no new authority. A receiving session checks that state against the current repository and continues the authorized phase, keeping any pending approval pending.

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

### Codex CLI

Refresh the marketplace, reinstall the plugin, and then start a new session:

```bash
codex plugin marketplace upgrade engineering-flow
codex plugin remove engineering-flow@engineering-flow
codex plugin add engineering-flow@engineering-flow
```

Codex does not currently provide a separate `plugin update` command. Reinstalling reads the new
version from the refreshed marketplace.

### Claude Code

Refresh the marketplace and update the plugin inside Claude Code, then start a new session:

```text
/plugin marketplace update engineering-flow
/plugin update engineering-flow@engineering-flow
```

### Uninstall from Codex

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

The following results are historical records from v1.0.3 and earlier cohorts, with their original fixtures, scorers, and plugin fingerprints. They do not validate the current workflow or testing-policy changes, which require a separate evidence record.

- Static and deterministic tests: 84/84 passed.
- The corpus recorded at that time contained 37 scenarios mapping all 46 behavior IDs. This is semantic coverage, not a claim that 37 model trials completed.
- The published broad Codex cohort covered 17 scenarios and 51/51 candidate passes, including exact explicit invocation with zero false routes, missed routes, collisions, contamination, or unauthorized commits.
- The earlier task-level paired A/B passed 0/12 on the current-release control and 12/12 on the candidate under matching model, reasoning, and final scenario fingerprints.
- The final-fingerprint v1.0.3 paired cohort selects 36 completed reports across the six Test Contract scenarios. The candidate passed 18/18 behavior runs; the 1.0.2 control passed 17/18, with its single failure retained as control evidence. Earlier 1.0.2 and intermediate candidate results belong to older fingerprints and remain historical rather than being combined with the release cohort.
- Claude Code 2.1.223 passed strict manifest validation; under the historical testing policy, the final isolated `/engineering-flow:develop` trajectory wrote production before focused boundary tests.
- The historical Claude Core-only ambiguity samples did not match Codex. Explicitly invoke the full workflow for material data, permission, or policy decisions.
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

# Generate reviewed cohort selections without overwriting the manifest
npm run benchmark:evidence-generate -- --template config/evidence-manifest.json

# Reproduce the frozen release and durable-repair summaries
npm run benchmark:release-verify
npm run benchmark:release-summary
npm run benchmark:durable-repair-summary
```

Scenarios may define follow-up turns. The runner persists the first `codex exec` session, captures its thread ID, and uses `codex exec resume` for later turns while recording each message, event stream, workspace diff, requirement-document state, and public-test result.

For workflow-regression A/B, compare the candidate with a checkout of the current released plugin rather than only with no plugin:

```bash
BENCH_BASELINE_PLUGIN_ROOT=/absolute/path/to/current-release \
  npm run benchmark:ab -- develop-lifecycle diagnose-continuation
```

Saved Codex login is sufficient; an API key is optional. Real model runs consume the selected provider's quota or the signed-in Codex/ChatGPT usage allowance. Deterministic `npm test` checks do not consume model quota.

The runner isolates global plugins and skills and fingerprints fixture, control, and candidate contents so different versions are not mixed. Raw results are stored in the ignored `benchmark-results/` directory.
