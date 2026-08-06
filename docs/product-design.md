# Product Design

## Problem

Strong coding models already know common engineering techniques, but they apply them inconsistently. General workflow packages often respond by forcing every task through planning, TDD, worktrees, subagents, review, and branch-finishing ceremonies. That improves some difficult tasks while making ordinary work slower and more fragile.

This project aims to correct a smaller set of high-value failure modes without taking control away from the user or replacing project-specific instructions.

## Goals

1. Align on behavior before code when ambiguity would materially change the result.
2. Proceed autonomously when requirements are clear or details are safely inferable from the repository, except when an explicitly invoked workflow defines a user checkpoint.
3. Locate existing behavior and the correct ownership boundary before adding code.
4. Prefer familiar, idiomatic, explicit, locally understandable code over compressed or clever code.
5. Apply test-first development when it creates valuable behavioral evidence.
6. Diagnose root causes through a reproducible feedback loop.
7. Verify with fresh, scope-appropriate evidence before claiming completion.
8. Reconcile authoritative documentation with implemented behavior without rewriting accepted requirements to excuse an incorrect implementation.
9. Promote only durable, cross-task lessons into project instruction files.
10. Work in Codex CLI and Claude Code with synchronized invocation semantics.

## Non-goals

- Owning issue tracking, branching, pull requests, or release management.
- Requiring worktrees, subagents, saved plans, or commits for every task.
- Replacing an established project documentation layout.
- Enforcing a universal language style guide.
- Optimizing for minimum lines of code.
- Requiring unit tests for changes where they provide no useful feedback.
- Supporting agent hosts other than Codex CLI and Claude Code.

## Operating model

```text
project instructions and authoritative docs
                    |
             minimal core rules
                    |
       +------------+-------------+
       |                          |
explicit workflows          automatic context
develop / diagnose /      minimal Core only
code-design / review /
handoff
       |                          |
       +------------+-------------+
                    |
       verify behavior and reconcile docs
```

The project repository remains the source of domain truth. Skills discover and consume its conventions; they do not replace established `CONTEXT.md`, ADR, issue-tracker, or documentation layouts. When substantial Develop alignment needs a durable record and the project has no applicable convention, the portable fallback is `docs/requirements/<feature-slug>.md`.

## Task-level workflow lifecycle

An explicitly invoked workflow owns the active task, not only the message that named it. Answers, approvals, corrections, reports of omitted acceptance behavior, and continuation requests remain in that workflow while they concern the same task. This continuity survives normal follow-up turns and session resume or compaction when the transcript remains available.

The active workflow ends when the user explicitly cancels it, switches workflows, or starts an unrelated task. An agent's completion claim does not prevent a same-task correction from reopening the appropriate phase. A new unrelated task must not inherit a stale workflow or approval.

`develop` uses these task phases:

```text
discover and clarify -> awaiting approval -> implement and verify -> complete
          ^                    |                    |              |
          |                    |                    |              +-- omitted accepted behavior reopens implementation
          +-- changed scope ---+--------------------+-- material scope change returns to alignment
```

`diagnose` owns the complete defect lifecycle:

```text
reproduce -> locate root cause -> await fix authority when needed -> fix -> regression verification -> complete
```

A rejected diagnosis remains in read-only diagnosis. A later same-task authorization such as "fix it" enters repair without requiring a separate `develop` invocation. Repair applies the same boundary, code, testing, documentation, and completion standards as development. Undefined product behavior or materially expanded scope still requires requirement alignment and approval before implementation.

## Development lifecycle

### 1. Discover

- Read applicable user and project instructions.
- Inspect current version-control state without disturbing unrelated work.
- Locate authoritative requirement/design documents.
- Read relevant implementation and tests.

### 2. Align requirements

Summarize only what must be checked:

- Goal
- Acceptance behavior
- Out of scope
- Assumptions
- Blocking ambiguities

Ask questions only when different answers materially change user-visible behavior, interfaces, data semantics, permissions, security, compatibility, destructive effects, or acceptance criteria. Infer reversible implementation details from the repository.

For an explicitly invoked `develop` task, collect independent material questions into one compact batch. Ask dependent questions only after the prerequisite answer is known. Stop when the task is understood well enough for safe implementation; do not exhaustively enumerate hypothetical edge cases, architectures, or future variants.

Structured question tools are optional presentation mechanisms. When one is unavailable, material questions are asked together in plain text; their absence does not authorize inference.

Words such as "undefined", "intentional", and "not specified" describe an unresolved behavior when different answers change the result; they do not silently choose a product rule or move it out of scope. In particular, an explicitly undefined unknown-resource result for a delete or write operation is not established by the successful return value, the absence of precedent, or a neighboring read API.

After the user answers the independent clarification batch, ask another question only when an answer created a genuinely dependent decision or newly discovered authoritative evidence contradicts the request. Repository mechanics and independently conceivable edge cases do not reopen clarification; otherwise proceed directly to the checkpoint.

After clarification, present one final alignment checkpoint and pause without changing production code, tests, or configuration. A short checkpoint stays in the conversation. A substantial checkpoint uses an existing authoritative project document when available, or `docs/requirements/<feature-slug>.md` when no applicable documentation convention exists. When the initial substantial request already provides a complete contract, create and verify that `Draft` record in the first turn; hypothetical optional inputs outside the contract cannot delay it. The durable record contains the same goal, acceptance behavior, out of scope, assumptions, and solution boundary as the checkpoint, not only a status and acceptance list. Only clear action language sent after this checkpoint, such as "implement this", "start", or "proceed with the plan above", approves implementation. The initial request, clarification answers, and reading acknowledgements do not.

For implementation work, align the solution boundary as well as the behavior: identify the likely owner, interfaces, data/state effects, compatibility constraints, and any decision that would materially change the result. Reversible internal details remain the agent's responsibility. Ordinary clear requests that did not invoke `develop` still proceed without a ceremonial approval checkpoint.

An explicit complete predicate plus the semantic operation to apply resolves every value covered by that predicate. Unusual covered values do not become new product questions unless repository evidence reveals a contradiction.

### 3. Choose the change boundary

- Search by domain concept, type, behavior, and call sites, not only by the wording of the request.
- Prefer an existing capability or pattern when it represents the same domain behavior.
- Fix a shared root cause when all affected callers should obey the same rule.
- Keep entry points thin and place behavior with the module that owns the relevant data and invariant.
- Do not deduplicate code that merely looks similar but represents independently changing rules.

### 4. Implement with feedback

- For regressions, first build the narrowest reliable reproduction available. When a stable automated seam exists, materialize it as a regression test and observe that test fail before editing production code; earlier diagnostic probes do not replace this red observation.
- For valuable behavior seams, use a red-green-refactor loop one vertical slice at a time.
- For mechanical, presentation-only, configuration, or framework-wiring changes, use the smallest meaningful compile/lint/integration check instead of ceremonial unit tests.
- Refactor while green when it improves clarity, locality, or removes proven semantic duplication.

Apply two conditional hardening passes only when evidence justifies them:

- **Boundary hardening:** add targeted cases for applicable input, numeric/time, state/lifecycle, concurrency/idempotency, permission/trust, resource/external-failure, migration, or compatibility risks. Do not invent undefined product behavior.
- **Maintainability hardening:** improve ownership, cohesion, explicit effects, semantic reuse, state modeling, or dependency isolation when the change exposes real design pressure. Design patterns are optional techniques, never the objective.

### 5. Review independently

Re-read the accepted requirements and review the diff from a fixed point. Check independent axes:

- Requirement fidelity
- Correctness and failure behavior
- Permissions, security, data integrity, compatibility, and destructive effects
- Readability and local reasoning
- Ownership, reuse, and abstraction quality
- Over-engineering and unnecessary dependencies
- Test sensitivity and maintainability
- Documentation consistency

### 6. Verify and reconcile

- Run fresh, scope-appropriate validation.
- Confirm the original symptom or acceptance behavior, not only a nearby test.
- Remove temporary diagnostics and generated artifacts.
- Update authoritative documentation only for changed facts and decisions.
- Do not modify accepted requirements after implementation without explicit confirmation.
- Update project instructions only when a durable rule applies across future tasks.

Focused verification and reconciliation are completion responsibilities of `develop` and `diagnose`, not a separate mandatory workflow.

## User-visible workflows

- **develop:** align features, refactors, and test-only changes, pause for explicit approval, then implement and verify within the same task.
- **diagnose:** reproduce broken existing behavior, find the supported root cause, and continue into a repair when the original request or a later same-task message authorizes it.
- **code-design:** create a greenfield solution proposal or refine an existing design without implementing production code.
- **review:** perform an evidence-backed read-only review from a fixed point.
- **handoff:** capture the minimum durable state needed by another session.

## Maintainable-code standard

The objective is minimum necessary complexity, not minimum syntax or line count.

Prefer code that is:

- **Familiar:** established in the repository or idiomatic in the language/framework.
- **Explicit:** control flow, state changes, failures, and external effects are visible.
- **Local:** a maintainer can understand and change behavior without tracing unrelated modules.
- **Named:** intermediate concepts carry domain meaning instead of being compressed into expressions.
- **Debuggable:** meaningful steps can be inspected, logged, and assigned breakpoints.
- **Change-resilient:** one rule has one authoritative owner; related behavior changes together.
- **Boring:** it avoids novelty that exists only to reduce lines or display language cleverness.

### Novelty tax

An uncommon construct, advanced language feature, metaprogramming technique, dense expression, implicit control flow, or non-obvious optimization must earn its maintenance cost through a concrete benefit such as correctness, measured performance, a framework-standard pattern, or substantial reduction of real coupling. When necessary, isolate it, name it clearly, test it, and explain the reason rather than the mechanics.

Examples requiring scrutiny include, but are not limited to:

- Nested conditional expressions or dense Boolean logic
- Side effects hidden in streams, lambdas, getters, constructors, or conversions
- Long fluent chains mixing selection, transformation, I/O, and mutation
- Reflection, dynamic proxies, metaprogramming, or implicit runtime registration
- Exceptions used as expected control flow
- Dense regular expressions where a parser would be clearer
- Bit tricks, clever recursion, operator overloading, or implicit coercion
- Framework magic introduced when direct code would be clearer

These are not absolute bans. The decision depends on repository convention, language idiom, correctness, and maintenance cost.

## Abstraction and design patterns

Do not introduce abstractions for hypothetical variation. Consider an abstraction when there is demonstrated pressure:

- Multiple real implementations or algorithms
- Repeated conditionals along one variation axis
- An unstable external dependency that needs isolation
- Complex state transitions spread across callers
- Construction rules with real combinations and invariants
- Semantic duplication that should always change together

A design pattern is vocabulary for solving observed pressure, not a quality score. It is justified only when the complexity removed exceeds the interfaces, classes, files, and indirection introduced.

## Documentation lifecycle

Long-lived design documents should distinguish:

- Problem and goals
- Accepted behavior and acceptance criteria
- Out of scope
- Open questions
- Decisions and trade-offs
- Final implementation facts
- Confirmed deviations from the initial design

Temporary execution plans normally stay in the session. Save them only when work spans sessions or needs durable coordination.

Develop requirement records use an explicit status:

- **Draft:** clarification or the approval checkpoint is still open.
- **Accepted:** the user approved implementation, including clear phrases such as "proceed with the plan above".
- **Implemented:** every accepted behavior is reconciled with fresh implementation and verification evidence.
- **Superseded:** a newer authoritative record replaces this one.

If an `Implemented` record is found to have omitted an original acceptance item, return it to `Accepted` until the omission is implemented and verified. A material scope change returns to alignment and approval; it is not silently absorbed under the old acceptance.

Before a record becomes `Implemented`, stale prospective statements are reconciled too: deferred tests, planned files, assumptions, and other provisional language must be updated to the actual diff and fresh evidence. A status-only edit is not sufficient.

At completion, compare accepted behavior, documentation, code, and test evidence. Before a requirement record becomes `Implemented`, reconcile its stated files, boundaries, and evidence with the actual diff and verification results. Updating documentation must not be used to legitimize an implementation that failed to meet the accepted requirement.

## Project-instruction promotion

Update `AGENTS.md`, `CLAUDE.md`, or equivalent only when a rule is stable and reusable, for example:

- A recurring failure has been observed.
- An undocumented convention applies to many future changes.
- A missing rule creates meaningful safety, data, or collaboration risk.
- The project has an authoritative command or boundary future agents must follow.

Task-specific business rules, temporary commands, implementation notes, and one-off lessons belong elsewhere.
