# Trigger Model

## Principles

1. Automatic skill invocation is probabilistic and can substitute an unrelated remaining workflow even when descriptions contain negative boundaries.
2. All full workflows are currently user-invoked because they change the shape and cost of the session.
3. A minimal core is injected at session boundaries so common engineering, completion, and safety rules remain automatic.
4. A full skill may become model-invoked only after isolated positive, negative, and overlap benchmarks demonstrate acceptable precision, recall, and ceremony cost.
5. Workflow references are one-way guidance. They do not imply automatic skill injection.

## Layers

### Always-on core

Injected on startup, resume, clear, and compact. It contains only repository discovery, blocking-ambiguity handling, correct-boundary/reuse guidance, maintainable-code preference, safety preservation, and verification/document reconciliation.

It must not contain full TDD, planning, worktree, review, subagent, commit, or release workflows.

### User-invoked orchestration

| Skill | Purpose |
|---|---|
| `develop` | Implement features, refactors, and test-only changes; optional confirmation mode |
| `review` | Read-only review of a diff, branch, or work in progress |
| `handoff` | Produce a compact durable continuation record |
| `code-design` | Create a greenfield solution proposal or refine an existing design without coding |
| `diagnose` | Diagnose an existing bug, failure, regression, intermittent fault, or slowdown |

Claude metadata: `disable-model-invocation: true`.

Codex metadata: `policy.allow_implicit_invocation: false`.

Codex plugin skills are referenced as `$engineering-flow:<skill>`. Claude Code plugin skills use `/engineering-flow:<skill>`.

The `UserPromptSubmit` hook parses only these explicit tokens and injects the complete requested `SKILL.md` content for that turn. Ordinary prompts receive no full workflow. This makes user invocation deterministic without reopening model-triggered workflow selection.

### Model-invoked skills

None in the current release. Codex behavior runs showed workflow substitution: after broader automatic skills were disabled, the model selected the remaining implicit skill for an unrelated local policy change. Negative description wording did not provide a deterministic boundary.

The invocation corpus remains in place so future host/model versions can re-evaluate whether a narrow skill is safe to reopen.

`tdd` may be introduced as a model-invoked reference only for explicit test-first requests or orchestration decisions. It must not claim every feature or bug fix automatically.

## Priority

When the user explicitly names overlapping workflows, preserve the strictest authority boundary:

1. `review` remains read-only.
2. `code-design` produces a proposal without production-code implementation.
3. `diagnose` is used for broken existing behavior.
4. `develop` is used for authorized implementation.
5. `handoff` captures state rather than continuing work.

Examples:

- Supplied reviewer comments are verified by Core before routing a valid behavioral defect to diagnosis.
- A clear bug begins with diagnosis rather than generic development orchestration.
- A read-only review never transitions to implementation without a new user request.
- A design proposal never transitions to production-code implementation without a new user request.

## Reference graph

```text
develop
  -> diagnose process (when the request is broken existing behavior)
  -> design-pressure analysis (when non-local pressure exists)
  -> boundary hardening (only when applicable risk exists)
  -> maintainability hardening (only when demonstrated pressure exists)
  -> focused verification and reconciliation

diagnose
  -> regression evidence (when a correct seam exists)
  -> adjacent boundary hardening (when supported by the root cause)
  -> owning-boundary improvement (when structure caused the defect)
  -> focused verification and reconciliation

review
  -> code-design reference

handoff
  -> no dependency
```

Cycles are forbidden.

Registry references document allowable one-way guidance. The deterministic prompt hook injects only workflows explicitly named by the user; it never recursively injects referenced workflows.

## Description rules

Model-facing descriptions:

- Name observable task symptoms.
- Include genuinely distinct trigger branches, not synonyms for one branch.
- Include a negative boundary when confusion with a neighboring skill is likely.
- Do not summarize the full workflow.
- Avoid universal phrases such as "any coding task".

User-facing descriptions:

- State the outcome in one short sentence.
- Do not include model trigger keyword lists.

## Platform mapping

### Claude Code

- User-invoked: set `disable-model-invocation: true`.
- Core: SessionStart hook emits static additional context.
- Explicit routing: UserPromptSubmit injects only `/engineering-flow:<skill>` requests.

### Codex CLI

- User-invoked: set `policy.allow_implicit_invocation: false`.
- Core: plugin SessionStart hook emits static additional context.
- Explicit routing: UserPromptSubmit injects only `$engineering-flow:<skill>` requests.

The build must test that both metadata representations agree.
