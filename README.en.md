# Engineering Flow Skills

[简体中文](README.md) | [English](README.en.md)

> Help coding agents understand first, implement second, and finish with evidence.

Engineering Flow is a complete software-development workflow for **Codex CLI** and **Claude Code**. It covers solution design, requirement and solution alignment, implementation, diagnosis, review, verification, and cross-session handoff while keeping clear tasks direct.

## ✨ Highlights

- 🎯 **Align before coding** — Ask only when a decision materially changes the result.
- 🧭 **Find the right boundary** — Discover existing capabilities, correct ownership, and shared root causes.
- 🛠️ **Build for maintenance** — Prefer clear, explicit, locally understandable code over minimum line count.
- 🧪 **Finish with evidence** — Select tests, compilation, linting, or integration checks based on risk, then reconcile authoritative documentation.
- 🪶 **Stay lightweight** — Do not require plan files, worktrees, subagents, TDD, design patterns, or commit ceremony.

## 🧩 One workflow, choose the right entry point

| Entry point | Use it for | Codex invocation |
|---|---|---|
| 🛠️ **Develop** | Features, refactors, tests, and maintainability work | `$engineering-flow:develop` |
| 🔎 **Diagnose** | Bugs, regressions, incorrect output, intermittent faults, and slowdowns | `$engineering-flow:diagnose` |
| 🧭 **Code Design** | Create a solution from scratch or refine an existing design | `$engineering-flow:code-design` |
| 👀 **Review** | Strict read-only review of a diff, branch, or uncommitted work | `$engineering-flow:review` |
| 📦 **Handoff** | Continue in another session or with another agent | `$engineering-flow:handoff` |

Claude Code uses the same names with `/engineering-flow:` instead of `$engineering-flow:`.

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

## 🧠 Design Principles

Engineering Flow does not take ownership away from the project. The current request and project-local `AGENTS.md`, `CLAUDE.md`, and authoritative documentation always take precedence.

It provides stable engineering behavior rather than fixed ceremony:

- Keep simple work direct and expand the process only when complexity requires it.
- Add boundary coverage for real risks instead of mechanically enumerating edge cases.
- Improve architecture under demonstrated design pressure, not to apply patterns for their own sake.
- Never commit, push, publish, create issues, install dependencies, or modify global configuration without authorization.

## 📚 Documentation

- [User guide: complete usage, installation, updates, and troubleshooting](docs/user-guide.md)
- [Product design](docs/product-design.md)
- [Behavior specification](docs/behavior-spec.md)
- [Trigger model](docs/trigger-model.md)
- [Testing strategy](docs/testing-strategy.md)
- [A/B benchmark log](docs/benchmark-log.md)

## ✅ Evidence

- 36/36 static and deterministic tests pass.
- Current Codex validation cohort: 17 scenarios, candidate 51/51.
- Explicit workflow invocation: 51/51, with zero false routes, missed routes, collisions, contamination, or unauthorized commits.
- Claude Code passes strict manifest validation and an explicit `develop` live sample.

See the [benchmark log](docs/benchmark-log.md) for complete environments, results, and cross-platform limitations.

## 🤝 Credits

Engineering Flow references and reorganizes selected ideas from:

- [Superpowers](https://github.com/obra/superpowers)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [Ponytail](https://github.com/DietrichGebert/ponytail)

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for attribution. The project is licensed under the [MIT License](LICENSE).
