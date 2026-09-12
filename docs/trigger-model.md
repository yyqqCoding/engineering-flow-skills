# Trigger Model

## Principles

1. Automatic skill invocation is probabilistic and can substitute an unrelated remaining workflow even when descriptions contain negative boundaries.
2. All full workflows are currently user-invoked because they change the shape and cost of the session.
3. A minimal core is injected at session boundaries so common engineering, completion, and safety rules remain automatic.
4. A full skill may become model-invoked only after isolated positive, negative, and overlap benchmarks demonstrate acceptable precision, recall, and ceremony cost.
5. Workflow references identify methods, not automatic skill loading or transfers of task authority.

## Layers

### Always-on core

Injected on startup, resume, clear, and compact. It contains only repository discovery, blocking-ambiguity handling, correct-boundary/reuse guidance, maintainable-code preference, safety preservation, and verification/document reconciliation.

It must not contain full TDD, planning, worktree, review, subagent, commit, or release workflows.

### User-invoked orchestration

| Skill | Purpose |
|---|---|
| `develop` | Clarify and approve features, refactors, and test-only changes before implementation |
| `review` | Read-only review of a diff, branch, or work in progress |
| `handoff` | Produce a compact durable continuation record |
| `code-design` | Create a greenfield solution proposal or refine an existing design without coding |
| `diagnose` | Diagnose an existing bug, failure, regression, intermittent fault, or slowdown |

Claude metadata: `disable-model-invocation: true`.

Codex metadata: `policy.allow_implicit_invocation: false`.

Codex plugin skills are referenced as `$engineering-flow:<skill>`. Claude Code plugin skills use `/engineering-flow:<skill>`.

The `UserPromptSubmit` hook parses only these explicit tokens and injects the complete requested `SKILL.md` content when the workflow starts or is explicitly resumed. Ordinary prompts receive no new full-workflow injection. The workflow remains active at the task level through conversation history and the compact Core continuity rule, so same-task answers, approvals, corrections, and repair authority do not require another token.

A prompt-leading `/engineering-flow:<skill>` command is expanded natively by the host, so the hook skips that skill to avoid injecting a second copy of the same workflow. All other explicit tokens, including `$engineering-flow:<skill>` anywhere and `/engineering-flow:<skill>` after other text, are injected by the hook.

### Model-invoked skills

None in the current release. Codex behavior runs showed workflow substitution: after broader automatic skills were disabled, the model selected the remaining implicit skill for an unrelated local policy change. Negative description wording did not provide a deterministic boundary.

The invocation corpus remains in place so future host/model versions can re-evaluate whether a narrow skill is safe to reopen.

`tdd` may be introduced as a model-invoked reference only for explicit test-first requests or orchestration decisions. It must not claim every feature or bug fix automatically.

## Priority

When the user explicitly names overlapping workflows, use the requested outcome and preserve the strictest applicable authority boundary. Workflow names do not form a mandatory pipeline:

1. `review` remains read-only until a later explicit repair request.
2. `code-design` produces a proposal without production-code implementation.
3. `diagnose` is used for broken existing behavior.
4. `develop` retains its implementation approval checkpoint, including when diagnostic methods are useful.
5. `handoff` captures state rather than continuing work.

Examples:

- Supplied reviewer comments are verified against code and requirements before any authorized repair.
- In Diagnose, an initial or later same-task request to fix the defect authorizes repair and verification without switching to Develop. Undefined product behavior or added scope receives an incremental checkpoint inside the task.
- Review stays read-only until a later explicit request authorizes specified fixes, subject to any existing task approval gate; that repair does not require a Develop invocation or authorize unrelated changes.
- An existing design feeds Develop's single implementation checkpoint. Reuse established facts and decisions, resolve only gaps or changes, and retain the approval gate; the proposal alone grants no implementation authority.

## Task continuity and termination

Workflow selection is explicit; workflow continuation is contextual. Once selected, a workflow remains active only while follow-up messages concern that task:

- Develop answers continue clarification, action language approves its checkpoint, and omissions reopen implementation.
- A material Develop scope change returns only the increment to alignment and approval.
- A rejected diagnosis remains read-only Diagnose; later repair authority continues into the fix.
- Borrowing diagnosis, design analysis, or self-review methods neither loads another full skill nor changes the active workflow or its authority.
- Handoff exports the source task and workflow, phase, approved and pending scope, and next step. It records existing authority without granting approval or continuing implementation.
- An explicit cancellation or workflow switch ends the active workflow.
- An unrelated new task starts from Core and does not inherit stale workflow authority.

The first implementation relies on the transcript, Core, and durable requirement status rather than persistent hook state. This avoids stale state leaking into unrelated work. Stateful `PLUGIN_DATA` storage is reserved for a demonstrated resume/compaction failure that cannot be corrected by these smaller surfaces.

## Reference graph

```text
develop
  -> diagnostic methods (when the request is broken existing behavior)
  -> design-pressure analysis (when non-local pressure exists)
  -> boundary hardening (only when applicable risk exists)
  -> maintainability hardening (only when demonstrated pressure exists)
  -> focused verification and reconciliation

diagnose
  -> regression evidence (when a correct seam exists)
  -> authorized owning-boundary repair (without a develop dependency)
  -> adjacent boundary hardening (when supported by the root cause)
  -> owning-boundary improvement (when structure caused the defect)
  -> focused verification and reconciliation

review
  -> design-pressure, ownership, and abstraction-cost checks

handoff
  -> no dependency
```

Cycles are forbidden.

Registry references document allowable one-way guidance. Use these methods within the current workflow without loading another complete skill or transferring its permissions. The deterministic prompt hook injects only explicitly named workflows and never follows references recursively. Diagnose owns its repair and any incremental alignment without a Develop dependency.

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
- Explicit routing: a prompt-leading `/engineering-flow:<skill>` command loads the skill natively; UserPromptSubmit injects only non-leading explicit tokens. Live transcripts confirm exactly one workflow copy per invocation on both paths.

### Codex CLI

- User-invoked: set `policy.allow_implicit_invocation: false`.
- Core: plugin SessionStart hook emits static additional context.
- Explicit routing: UserPromptSubmit injects only `$engineering-flow:<skill>` requests.

The build must test that both metadata representations agree.
