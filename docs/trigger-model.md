# Trigger Model

## Principles

1. Automatic skill invocation is probabilistic and can substitute an unrelated remaining workflow even when descriptions contain negative boundaries.
2. All full workflows are currently user-invoked because they change the shape and cost of the session.
3. A minimal core is injected at session boundaries so common engineering, completion, and safety rules remain automatic.
4. A full skill may become model-invoked only after isolated positive, negative, and overlap benchmarks demonstrate acceptable precision, recall, and ceremony cost.
5. Skill dependencies are one-way. Leaf skills never invoke orchestration skills.

## Layers

### Always-on core

Injected on startup, resume, clear, and compact. It contains only repository discovery, blocking-ambiguity handling, correct-boundary/reuse guidance, maintainable-code preference, safety preservation, and verification/document reconciliation.

It must not contain full TDD, planning, worktree, review, subagent, commit, or release workflows.

### User-invoked orchestration

| Skill | Purpose |
|---|---|
| `develop` | Run the complete implementation lifecycle; optional confirmation mode |
| `clarify` | Deep requirement alignment without implementation |
| `review` | Read-only review of a diff, branch, or work in progress |
| `handoff` | Produce a compact durable continuation record |
| `code-design` | Evaluate non-local architecture, state, dependency, variation, or abstraction pressure |
| `diagnose` | Diagnose an existing bug, failure, regression, intermittent fault, or slowdown |
| `verify-and-reconcile` | Audit complex completion evidence, authoritative docs, and durable instructions |

Claude metadata: `disable-model-invocation: true`.

Codex metadata: `policy.allow_implicit_invocation: false`.

Codex plugin skills are referenced as `$engineering-flow:<skill>`. Claude Code plugin skills use `/engineering-flow:<skill>`.

The `UserPromptSubmit` hook parses only these explicit tokens and injects the complete requested `SKILL.md` content for that turn. Ordinary prompts receive no full workflow. This makes user invocation deterministic without reopening model-triggered workflow selection.

### Model-invoked skills

None in the current release. Codex behavior runs showed workflow substitution: after broader automatic skills were disabled, the model selected the remaining implicit skill for an unrelated local policy change. Negative description wording did not provide a deterministic boundary.

The invocation corpus remains in place so future host/model versions can re-evaluate whether a narrow skill is safe to reopen.

`tdd` may be introduced as a model-invoked reference only for explicit test-first requests or orchestration decisions. It must not claim every feature or bug fix automatically.

## Priority

When the user explicitly names overlapping workflows, use this order:

1. `clarify`
2. `develop`
3. `review`
4. `diagnose`
5. `code-design`
6. `verify-and-reconcile`

Examples:

- Supplied reviewer comments are verified by Core before routing a valid behavioral defect to diagnosis.
- A clear bug begins with diagnosis rather than generic development orchestration.
- A read-only review never transitions to implementation without a new user request.

## Dependency graph

```text
develop
  -> clarify (only when required)
  -> code-design (only when pressure exists)
  -> tdd reference (only when valuable)
  -> verify-and-reconcile

diagnose
  -> tdd reference (when a correct regression seam exists)
  -> verify-and-reconcile

review
  -> code-design reference

handoff
  -> no dependency
```

Cycles are forbidden.

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
