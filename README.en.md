# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

> Help coding agents understand first, implement second, and finish with evidence.

![Codex CLI](https://img.shields.io/badge/Codex_CLI-supported-black)
![Claude Code](https://img.shields.io/badge/Claude_Code-supported-D97757)
![License](https://img.shields.io/badge/license-MIT-blue)

Engineering Flow is a software-development workflow plugin for **Codex CLI** and **Claude Code**. It covers solution design, requirement alignment, implementation, diagnosis, review, and cross-session handoff — while keeping clear tasks direct.

## Why Engineering Flow

### 📐 Every rule earned its place in a benchmark

Most workflow plugins stack rules on intuition. Engineering Flow settles disputes with data: every trigger policy and load-bearing sentence passed isolated A/B benchmarks — 17 deterministic behavior scenarios, hidden scorers, contamination detection, and unauthorized-commit monitoring. Features that could not beat a strong baseline were deleted rather than kept for show: automatic skill triggering was rejected exactly this way, after the data repeatedly showed it loading workflows on unrelated tasks. The full decision trail is traceable in the [benchmark log](docs/benchmark-log.md).

### 🎯 Deterministic triggering — workflows never invite themselves

Full workflows load only when you name them explicitly, routed by a hook, with exactly one copy of context injected per invocation. There is no probabilistic "the model thought you needed it" — you will not be dragged into a five-step process for a one-line config change, or have a requested review silently substituted with a different workflow.

### 🏛️ A software engineering core

Engineering Flow translates classic software engineering principles into judgment rules an agent can execute — each with an explicit trigger signal and cost constraint, not a list of principle names:

| Principle | How it appears in the workflow |
|---|---|
| High cohesion, low coupling | Every option comparison must weigh ownership, coupling, cohesion, and state/failure behavior |
| Single responsibility | One rule has one authoritative owner; rules live in the module that owns the relevant data and invariant |
| Open-closed | Extension points are introduced only under real pressure, such as repeated branching along one variation axis — speculative extension points are rejected explicitly |
| Dependency inversion | Only an unstable external dependency earns an Adapter; proposals must state dependency direction |
| Design patterns | Strategy, state machine, Adapter, factory/builder, and pipeline each have explicit trigger conditions — complexity removed must exceed indirection introduced |
| Semantic reuse | Distinguish rules that must evolve together from rules that merely look alike; allow honest duplication, reject false deduplication |

On top sits a **novelty tax**: any uncommon syntax, metaprogramming, new dependency, abstraction, or design pattern must pay for itself with a concrete benefit in correctness, measured performance, or total maintenance cost. A pattern name is not evidence of quality.

The same standard drives both `code-design` proposals and `develop` implementation and conditional hardening, so design and coding apply one set of engineering judgment.

### 🪶 A resident footprint of ~230 words

The only always-on piece is a ~230-word Engineering Core — the baseline for repository discovery, requirement alignment, maintainability, safety preservation, and verified completion. When no workflow is invoked, nothing else is injected; your context and tokens stay with the actual task.

### 🔒 Safety and authorization boundaries

- Never commits, pushes, publishes, creates issues, installs dependencies, or modifies global configuration without authorization.
- Destructive data decisions (such as how related data is handled) are always asked, never silently inferred.
- `review` is strictly read-only; `code-design` produces proposals without production code; diagnosis is separated from fixing, and fixes require explicit authorization.

### 🤝 Never takes over your project

The current request and project-local `AGENTS.md`, `CLAUDE.md`, and authoritative documentation always take precedence. The process scales with the task: simple work stays direct, boundary testing follows real risk, and architecture changes follow demonstrated design pressure — no mandatory plan files, worktrees, subagents, TDD, or commit ceremony.

## 🧩 One workflow, five entry points

| Entry point | Use it for | Codex invocation |
|---|---|---|
| 🛠️ **Develop** | Features, refactors, tests, and maintainability work | `$engineering-flow:develop` |
| 🔎 **Diagnose** | Bugs, regressions, incorrect output, intermittent faults, and slowdowns | `$engineering-flow:diagnose` |
| 🧭 **Code Design** | Create a solution from scratch or refine an existing design | `$engineering-flow:code-design` |
| 👀 **Review** | Strict read-only review of a diff, branch, or uncommitted work | `$engineering-flow:review` |
| 📦 **Handoff** | Continue in another session or with another agent | `$engineering-flow:handoff` |

Claude Code uses the same names with `/engineering-flow:` instead of `$engineering-flow:`.

## ⚙️ How it works

```text
Session start (startup / resume / clear / compact)
  └─► Inject the ~230-word Engineering Core — the always-on engineering and safety baseline

Explicitly name a workflow
  └─► Inject that workflow's complete SKILL.md for the turn, exactly once

Every other prompt
  └─► Zero injection; the native experience is preserved
```

Both platforms share the same skills and hooks, and static tests keep the invocation metadata in agreement.

## 🚀 Quick Start

### Codex CLI

```bash
codex plugin marketplace add yyqqCoding/engineering-flow-skills
codex plugin add engineering-flow@engineering-flow
```

Start a new session in your project after installation:

```bash
cd /path/to/your-project
codex
```

### Claude Code

Run inside Claude Code:

```text
/plugin marketplace add yyqqCoding/engineering-flow-skills
/plugin install engineering-flow@engineering-flow
```

## 💬 Start Building

For a clear small task, describe it directly:

```text
Add a status filter to the user list. Reuse the existing query parameters and component, add the smallest meaningful verification, and do not commit.
```

For a complete development lifecycle, explicitly choose an entry point:

```text
$engineering-flow:develop
Implement order batch export. First understand the existing design and ownership boundaries, then complete the implementation, focused tests, and necessary documentation updates. Do not commit.
```

When coding must wait for approval:

```text
$engineering-flow:develop confirm
Implement customer batch deletion. First confirm the requirements, related-data policy, and acceptance behavior. Do not code until I approve them.
```

See the [user guide](docs/user-guide.md) for complete scenarios and examples.

## 📚 Documentation

- [User guide: complete usage, installation, updates, and troubleshooting](docs/user-guide.md)
- [Product design](docs/product-design.md)
- [Behavior specification](docs/behavior-spec.md)
- [Trigger model](docs/trigger-model.md)
- [Testing strategy](docs/testing-strategy.md)
- [A/B benchmark log](docs/benchmark-log.md)

## 🤝 Credits

Engineering Flow references and reorganizes selected ideas from:

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution. The project is licensed under the [MIT License](LICENSE).
