---
name: develop
description: Implement features, refactors, and test-only changes through requirement alignment, conditional hardening, and fresh verification.
disable-model-invocation: true
argument-hint: "[confirm]"
---

# Develop

Implement the requested change after understanding the facts and material solution decisions. Keep clear local work direct.

## Mode

- **Normal:** build the alignment internally. Ask and wait only when a material blocker remains; do not present an approval checkpoint or create a todo list for a small clear task.
- **Confirm:** when the argument is `confirm` or the user requires approval before coding, present the checkpoint and wait for explicit approval.

## 1. Discover once

- Read applicable project instructions and authoritative requirement/design documents.
- Inspect version-control state and preserve unrelated work.
- Read the relevant implementation, tests, callers, and nearby patterns.
- For broken existing behavior, apply the `diagnose` process rather than a generic feature flow.

Reuse what this inspection established. Do not repeat repository discovery or unchanged commands merely to narrate progress or prepare the final report.

## 2. Align facts and solution

Establish:

- Goal, acceptance behavior, and out of scope
- Repository-supported assumptions
- Material behavior, interface, data/state, permission, security, compatibility, migration, and destructive-effect decisions
- Owning boundary and implementation approach when they affect the result

Ask only about unresolved decisions that materially change the result. Infer reversible internal details from repository evidence.

In confirm mode, present this checkpoint and wait. In normal mode, proceed silently when no blocker remains and state only the brief implementation strategy useful to the user.

## 3. Choose boundary and feedback

- Reuse existing behavior only when it has the same domain responsibility and should evolve together.
- Place rules with the module that owns the relevant data and invariant; inspect sibling callers before changing shared behavior.
- Apply `code-design` pressure-and-trade-off reasoning for non-local interfaces, state, dependencies, module boundaries, or competing approaches.
- Choose the highest stable public seam that can prove each behavior slice.
- Use red-green-refactor for regressions and valuable business behavior when a correct seam exists. Use compile, lint, integration, or another meaningful check for mechanical/configuration work.

## 4. Implement

- Make the smallest clear change at the owning boundary.
- Keep control flow, effects, failures, and state transitions explicit.
- Avoid speculative abstractions, dependencies, configuration, and unrelated cleanup.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work.
- Run focused feedback after a behavior-changing slice when its result could have changed. Do not rerun the same command against the same state.

Return to alignment if implementation reveals a material requirement change.

## 5. Harden conditionally

### Boundary and extreme cases

Add targeted coverage only when the behavior involves applicable input, numeric/time, collection, state/lifecycle, duplicate/concurrent, permission/trust, resource/external-failure, migration, or compatibility risk.

- Derive expected behavior from accepted requirements and repository precedent.
- Ask for a material undefined boundary instead of inventing an assertion.
- For a test-only request, leave production behavior unchanged unless a fix is also authorized.

### Maintainability and architecture

Improve the touched design only when the change exposes scattered ownership, hidden effects, semantic duplication, repeated branching along one real variation axis, distributed state transitions, an unstable dependency, or a boundary that blocks testing/debugging.

Prefer clear ownership, cohesion, explicit effects, useful names, and local reasoning. Use a design pattern only when the demonstrated pressure justifies more indirection. Do not optimize line count or launch a broad redesign.

## 6. Complete

- Re-read accepted behavior and inspect the relevant diff for correctness, boundary/safety behavior, ownership, readability, test sensitivity, scope, and temporary artifacts.
- Run the focused verification and at most one scope-appropriate broader check when warranted. Reuse passing output if the verified state has not changed.
- Reconcile each accepted behavior as verified, partially verified, incomplete, or deviated.
- Update authoritative documentation only for changed facts and confirmed decisions; update project instructions only for durable cross-task rules.
- Remove temporary diagnostics and report remaining gaps.
- Use `review` separately only for a formal read-only review.
- Do not commit, push, publish, create external issues, install dependencies, or change global configuration unless authorized.
