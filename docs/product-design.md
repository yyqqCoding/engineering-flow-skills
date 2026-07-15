# Product Design

## Problem

Strong coding models already know common engineering techniques, but they apply them inconsistently. General workflow packages often respond by forcing every task through planning, TDD, worktrees, subagents, review, and branch-finishing ceremonies. That improves some difficult tasks while making ordinary work slower and more fragile.

This project aims to correct a smaller set of high-value failure modes without taking control away from the user or replacing project-specific instructions.

## Goals

1. Align on behavior before code when ambiguity would materially change the result.
2. Proceed autonomously when requirements are clear or details are safely inferable from the repository.
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
- Installing a new project documentation layout.
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
develop / clarify /       minimal Core only
diagnose / code-design /
review / verify-and-
reconcile / handoff
       |                          |
       +------------+-------------+
                    |
       verify behavior and reconcile docs
```

The project repository remains the source of domain truth. Skills discover and consume its conventions; they do not impose `CONTEXT.md`, ADR, issue-tracker, or directory layouts.

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

An explicit confirmation mode may require user approval before coding. The normal mode asks only blocking questions and otherwise proceeds.

### 3. Choose the change boundary

- Search by domain concept, type, behavior, and call sites, not only by the wording of the request.
- Prefer an existing capability or pattern when it represents the same domain behavior.
- Fix a shared root cause when all affected callers should obey the same rule.
- Keep entry points thin and place behavior with the module that owns the relevant data and invariant.
- Do not deduplicate code that merely looks similar but represents independently changing rules.

### 4. Implement with feedback

- For regressions, first build the narrowest reliable reproduction available.
- For valuable behavior seams, use a red-green-refactor loop one vertical slice at a time.
- For mechanical, presentation-only, configuration, or framework-wiring changes, use the smallest meaningful compile/lint/integration check instead of ceremonial unit tests.
- Refactor while green when it improves clarity, locality, or removes proven semantic duplication.

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

At completion, compare accepted behavior, documentation, code, and test evidence. Updating documentation must not be used to legitimize an implementation that failed to meet the accepted requirement.

## Project-instruction promotion

Update `AGENTS.md`, `CLAUDE.md`, or equivalent only when a rule is stable and reusable, for example:

- A recurring failure has been observed.
- An undocumented convention applies to many future changes.
- A missing rule creates meaningful safety, data, or collaboration risk.
- The project has an authoritative command or boundary future agents must follow.

Task-specific business rules, temporary commands, implementation notes, and one-off lessons belong elsewhere.
