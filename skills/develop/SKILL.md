---
name: develop
description: Run the complete development workflow for an implementation task.
disable-model-invocation: true
argument-hint: "[confirm]"
---

# Develop

Implement a requested change from requirement alignment through fresh verification and documentation reconciliation. This is an orchestrator, not a reason to manufacture ceremony.

## Mode

- **Normal**: ask only blocking questions; proceed when repository evidence safely resolves the rest.
- **Confirm**: when the argument is `confirm` or the user requires approval before coding, present the requirement checkpoint and wait for explicit approval.

## 1. Discover

Before proposing code:

- Read applicable project instructions and the authoritative requirement/design documents they identify.
- Inspect version-control state and preserve unrelated changes.
- Read the relevant implementation, tests, callers, and adjacent patterns.
- Determine whether the request is implementation, diagnosis, review, or documentation work. Route a bug through `diagnose`; do not duplicate its process here.

Done when you can name the source of truth, affected behavior, likely ownership boundary, and relevant feedback commands.

## 2. Align

Produce a concise checkpoint:

- Goal
- Acceptance behavior
- Out of scope
- Assumptions derived from repository evidence
- Blocking ambiguities

Ask only questions whose answers materially change behavior, interfaces, data semantics, permissions, security, compatibility, destructive effects, or acceptance criteria. Do not ask the user to choose reversible implementation details discoverable from the repository.

In confirm mode, wait after the checkpoint. In normal mode, wait only when blockers remain.

## 3. Choose the change boundary

- Search for existing domain behavior, not only matching names.
- Inspect relevant callers before changing shared behavior.
- Reuse code only when it has the same semantic responsibility and should change together.
- Place the rule with the module that owns the data and invariant.
- Use `code-design` only for non-local interface, state, dependency, module-boundary, or multi-location variation pressure. The Core covers ordinary local readability and reuse decisions.

State the implementation strategy briefly. Do not save a plan file unless the work spans sessions or the user/project requires one.

## 4. Choose feedback

For each behavior slice, select the highest stable public seam that can prove the behavior.

- Use red-green-refactor for regressions and important business behavior when a correct seam exists.
- Prefer one vertical slice at a time.
- For mechanical, presentational, configuration, or framework-wiring changes, use the smallest meaningful compile, lint, integration, or behavioral check instead of ceremonial unit tests.
- Never expose internals or add interfaces solely to satisfy a mocking framework.

## 5. Implement

- Make the smallest clear change at the correct boundary.
- Follow local idioms unless a local pattern creates a concrete correctness or maintainability problem; improve only the necessary area.
- Keep control flow, effects, failures, and state transitions explicit.
- Avoid speculative abstractions, dependencies, configuration, and unrelated cleanup.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated user work.
- Run the selected narrow feedback after each meaningful slice.

Stop and return to alignment if implementation reveals a material requirement change. Do not silently update the requirement to match the code.

## 6. Review

Re-read the accepted behavior and inspect the diff from a fixed point. Check:

- Missing, incorrect, or extra behavior
- Error and boundary behavior
- Security, permissions, data, compatibility, and destructive effects
- Ownership, reuse, readability, and abstraction cost
- Test sensitivity and maintenance cost
- Unrelated changes and temporary artifacts

Use a separate `review` invocation only when the user asks for a formal read-only review. An implementation self-check remains part of this workflow.

## 7. Complete

Use `verify-and-reconcile`. Do not commit, push, publish, create external issues, install dependencies, or change global configuration unless authorized.

Completion requires verified acceptance behavior, an accurate documentation state, and an explicit report of anything not verified.
