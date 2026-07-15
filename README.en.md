# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

A compact, evidence-driven development workflow for Codex CLI and Claude Code.

This project combines selected, benchmarked ideas from Superpowers, Matt Pocock's engineering skills, and Ponytail without forcing every task through requirement interviews, saved plans, worktrees, subagents, TDD, formal review, and branch-finishing ceremony. The goal is not to make the model perform more steps. It is to make high-risk work more reliable while keeping simple work direct.

## 🚀 Understand the usage in 30 seconds

There are only two usage modes to remember.

### First, distinguish the two input locations

| Where do you type it? | What is it for? | Examples |
|---|---|---|
| 🖥️ System terminal (Bash, PowerShell, and so on) | Install the plugin, enter a project, and start Codex | `codex plugin add ...`, `cd ...`, `codex` |
| 💬 Codex conversation input | Describe a development task or invoke a workflow | `Implement a user filter`, `$engineering-flow:develop` |

The short version: **run installation commands in the terminal; enter requirements and `$engineering-flow:...` in the Codex conversation.**

### Mode A: for an ordinary task, describe the task directly

Open a terminal, enter your project, and start Codex:

```bash
cd /path/to/your-project
codex
```

Then type a normal request in the **Codex conversation input**:

```text
Add an optional middleName to formatDisplayName and ignore blank values.
Preserve the existing export, add focused tests, and do not commit.
```

After installing the plugin and opening a new session, do not write a skill token. The Engineering Core activates automatically and inspects repository state, `AGENTS.md`, authoritative docs, existing code, and tests.

### Mode B: when you want a complete workflow, put its token on the first line

Type this in the **Codex conversation input**:

```text
$engineering-flow:develop
Implement order batch export. Understand the existing design and requirements, implement it, add focused tests, and reconcile the authoritative document. Do not commit.
```

`$engineering-flow:develop` loads the complete development workflow for this request.

> ⚠️ `$engineering-flow:develop` is not a Bash command. Do not run it by itself in the terminal. Send it together with your task inside the Codex conversation.

### The most important rules

- ✅ Clear small task: describe it directly without a token.
- ✅ Complete feature: use `$engineering-flow:develop`.
- ✅ Coding must wait for your approval: use `$engineering-flow:develop confirm`.
- ✅ Existing bug or regression: use `$engineering-flow:diagnose`.
- ❌ Do not invoke `clarify → develop → verify` for every task.
- ❌ Do not turn a simple edit into ceremony merely to appear rigorous.

## 📦 Install and make the first request in three minutes

### Step 1: install once from the terminal

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

You do not need to clone the repository or run `npm install`. This installs the plugin for the current computer's Codex user environment, so you do not repeat it in every project.

### Step 2: confirm that the plugin is enabled

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

### Step 3: close the old session and start a new one in your project

```bash
cd /path/to/your-project
codex
```

A new session is required for SessionStart to load the automatic Core.

### Step 4: send the first request in the Codex conversation

A minimal test:

```text
Inspect the current repository state and project instructions, then tell me the smallest meaningful verification command. Analyze only; do not edit files.
```

Or test a full workflow:

```text
$engineering-flow:review
Review the current uncommitted changes read-only. Report findings by severity with files and lines. Do not edit anything.
```

🎉 You can now use the plugin normally. When you switch to another project, just run `codex` in that project and either describe the task directly or explicitly invoke a workflow.

### What happens automatically after installation?

- 🟢 Every new Codex session automatically loads the compact Engineering Core; no token is needed.
- 🟡 When a request starts with `$engineering-flow:...`, the matching full workflow is loaded for that request.
- ⚪ An ordinary request without a token uses only the compact Core; it does not guess and load a full workflow.
- 🔒 The project's own `AGENTS.md`, authoritative docs, and your current request always take precedence.

## 🛟 Troubleshooting

| Symptom | Cause and fix |
|---|---|
| The terminal reports `$engineering-flow:develop: command not found` | It was entered in the wrong place. Send `$engineering-flow:...` to the Codex conversation, not the system terminal. |
| Nothing appears to change after installation | Run `codex plugin list --json` and confirm that `installed` and `enabled` are both `true`, then close the old session and run `codex` again. |
| There is no welcome message at startup | This is normal. The Core is injected in the background and does not require a banner. Use the read-only `review` example above to verify explicit workflow routing. |
| A workflow does not trigger | Use the complete, exact token, such as `$engineering-flow:diagnose`; put it on the first line and confirm that the plugin is enabled. |
| You are using Claude Code | Enter ordinary requirements directly, but change the workflow prefix to `/engineering-flow:`. Installation also uses Claude Code's `/plugin ...` commands; do not copy the Codex `$` prefix. |
| Updating still leaves old behavior | Follow the [Updating](#-updating) steps to refresh and reinstall the plugin, then open a new session. |

## 🧭 Which workflow should I choose?

| Your situation | What to type | Will it code? |
|---|---|---|
| The requirement is clear and local | Describe the task directly without a token | Yes, directly |
| You want a complete feature lifecycle | `$engineering-flow:develop` plus the requirement | Yes; it asks only blocking questions |
| All coding must wait for your approval | `$engineering-flow:develop confirm` plus the requirement | Not immediately; it summarizes and waits |
| You only want an implementation-ready requirement brief | `$engineering-flow:clarify` plus the requirement | No |
| There is an existing bug, regression, incorrect output, or slowdown | `$engineering-flow:diagnose` plus the symptom | If you asked for a fix; it reproduces and locates the root cause first |
| Module boundaries, state, or abstraction are genuinely complex | `$engineering-flow:code-design` plus the design problem | Analysis or implementation, according to your request |
| You only want the current changes reviewed | `$engineering-flow:review` plus the scope | No; it must not modify files |
| Implementation is nearly complete and evidence/docs need reconciliation | `$engineering-flow:verify-and-reconcile` plus the acceptance scope | Only fixes in-scope issues it finds |
| Work must continue in another session | `$engineering-flow:handoff` plus the current task | No; it creates a continuation record |

## 💬 Three complete examples you can copy

### Example 1: a clear small request, no skill token

```text
Add a status filter to the user list. Reuse the existing query parameters and select component, preserve the API style, add the smallest meaningful verification, and do not commit.
```

Expected behavior: the model inspects the repository and implements the change directly. It asks only when a missing detail materially changes the API or business behavior.

### Example 2: requirements must be confirmed before coding

```text
$engineering-flow:develop confirm
Implement customer batch deletion.

Make sure every material requirement is understood. Ask me about uncertain details, and do not code until I explicitly confirm.
```

Expected behavior: the model returns the goal, acceptance behavior, scope, assumptions, and blockers, then stops. It continues only after you reply that the requirements are confirmed.

### Example 3: fix a regression

```text
$engineering-flow:diagnose
Fix calculateRenewalDate moving January 31 into March.
Reproduce the problem first, locate the correct owner, leave a test that detects the regression, and run focused verification. Do not commit.
```

Expected behavior: the model observes the symptom or a failing test before fixing the owning rule instead of patching only the named caller.

## 📊 Status

- The complete 15-scenario A/B corpus has been run in Codex CLI.
- The final candidate passed 47/47 engineering checks, routed 19/19 requested workflows, and produced zero false routes.
- Claude Code plugin metadata and hooks pass static compatibility tests.
- Claude Code is not installed in the current development environment, so real Claude behavioral validation remains outstanding.

The current version is ready for personal Codex CLI use. Cross-platform validation still requires a real Claude Code run.

## 🧠 Design principles

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

## ⚙️ How it works

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

## 🖥️ Supported environments

- Codex CLI
- Claude Code

Other agent hosts are intentionally out of scope.

## 📦 Detailed installation

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

## 🧰 Detailed workflow reference

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

## 🗺️ Recommended development flow

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

## 🤝 Working with project instructions

- The current user request and project-local `AGENTS.md` or `CLAUDE.md` take precedence over this plugin.
- Business rules, APIs, SQL, fields, and acceptance criteria remain in the project's authoritative documentation.
- The plugin does not impose a documentation layout, branching policy, commit convention, or design pattern.
- A workflow never grants permission to commit, push, publish, create issues, install dependencies, or change global configuration unless the user authorized it.

## 🔄 Updating

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

## 🗑️ Uninstalling

```bash
codex plugin remove engineering-flow@engineering-flow
codex plugin marketplace remove engineering-flow
```

## 🧪 Development and testing

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

## ⚠️ Known limitations

- Real Claude Code installation and behavior remain unverified in the current development environment.
- The benchmark uses a strong model. The candidate's main value is stabilizing important process boundaries, not making every task more correct.
- Full workflows add context, tool calls, and latency, so they remain explicitly invoked.
- The current version is `0.1.0`; workflow names and details may still change when new evidence justifies it.

## 🙏 Credits and license

This project references and reorganizes selected ideas from:

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution. The project is licensed under the [MIT License](LICENSE).
