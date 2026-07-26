# Behavioral Specification

Each instruction in this project must map to a demonstrated failure mode. Behavioral tests should evaluate outcomes, not merely whether a skill was loaded.

## Requirement alignment

### REQ-01: Blocking ambiguity

Given a request where two plausible answers materially change user-visible behavior, the agent identifies the ambiguity and pauses before implementation.

Failure signals:

- Silently chooses a business rule.
- Begins coding while asking the question afterward.
- Asks only implementation questions and misses the product decision.

### REQ-02: Clear task autonomy

Given a clear, low-risk request with repository precedent, the agent proceeds without a ceremonial approval checkpoint.

Failure signals:

- Requests confirmation of already-specified behavior.
- Produces a long design interview for a local mechanical change.
- Asks the user to choose implementation details discoverable from the codebase.

### REQ-03: Explicit confirmation mode

When the user explicitly requires confirmation before coding, the agent presents a concise requirement summary, assumptions, acceptance behavior, and blocking questions, then waits for approval.

### REQ-04: Fact and solution alignment

For an implementation task, the agent discovers repository facts and aligns material solution decisions before coding without asking the user to choose reversible internal details.

## Change placement and reuse

### CODE-01: Existing capability discovery

When an existing helper or module implements the same domain behavior, the agent finds and reuses it rather than creating a divergent implementation.

### CODE-02: Shared root cause

When several entry points share a faulty lower-level rule, the agent inspects relevant callers and fixes the shared owner rather than patching only the named symptom.

### CODE-03: Avoid false deduplication

When similar code represents independently changing domain rules, the agent does not force them behind a shared abstraction merely to remove visual duplication.

### CODE-04: Correct ownership

Business behavior is placed in the module that owns the invariant instead of being copied into controllers, UI components, adapters, or unrelated utility classes.

## Maintainability

### READ-01: Familiar and explicit code

The implementation follows established repository patterns or normal language/framework idioms unless there is a documented reason to improve them locally.

### READ-02: Local reasoning

Control flow, state changes, external effects, and failure behavior can be understood without mentally executing dense expressions or tracing unrelated modules.

### READ-03: No compression-driven cleverness

The agent does not use nested conditionals, dense chains, hidden side effects, reflection, metaprogramming, or other uncommon constructs solely to reduce lines.

### READ-04: Useful names and intermediate values

Domain-significant conditions and transformations are named when doing so reduces mental recomputation. The agent does not remove useful intermediate values merely to make code shorter.

### READ-05: Justified novelty

When an uncommon construct is genuinely useful, it is localized, testable, clearly named, and justified by a concrete benefit.

## Abstraction

### DESIGN-01: No speculative architecture

The agent avoids interfaces with one implementation, factories with one product, configuration nobody changes, or extension points created only for hypothetical needs.

### DESIGN-02: Real design pressure

When multiple real variants, repeated conditionals, unstable dependencies, or distributed state rules exist, the agent considers an abstraction that reduces total change cost.

### DESIGN-03: Pattern cost accounting

A design pattern is accepted only when the complexity and coupling it removes exceed the indirection it introduces.

### DESIGN-04: Conditional maintainability hardening

The agent improves ownership, cohesion, effects, state modeling, semantic reuse, or dependency isolation only when the requested change exposes demonstrated design pressure. A normal local change does not trigger a broad redesign.

### DESIGN-05: Greenfield and refinement proposals

When explicitly asked for `code-design`, the agent either creates a solution from an unsettled goal or refines an existing design for completeness, consistency, feasibility, ownership, and unnecessary complexity. It returns a proposal without implementing production code.

## Testing and diagnosis

### TEST-01: Valuable red-green loop

For a testable business behavior or regression, the agent observes a relevant failure before implementing the fix and makes the smallest behaviorally meaningful slice pass.

### TEST-02: No ceremonial tests

For mechanical, presentational, configuration, or framework-wiring changes, the agent chooses appropriate compile/lint/integration evidence instead of creating implementation-coupled unit tests.

### TEST-03: Test sensitivity

A regression test fails when the fix is removed or the relevant behavior is broken. Passing tests that cannot detect the defect do not count as evidence.

### TEST-04: Risk-based boundary hardening

When changed or broken behavior crosses a material input, numeric/time, state, concurrency, permission, trust, resource, external-failure, migration, or compatibility boundary, the agent adds focused coverage for the applicable risk rather than mechanically enumerating every category.

### TEST-05: No invented boundary behavior

When expected behavior at a material boundary is not established by requirements or repository precedent, the agent asks for the product decision instead of encoding an arbitrary assertion.

### DEBUG-01: Reproduction before hypothesis

For a diagnosable bug, the agent builds the tightest practical feedback signal before committing to a cause. If an automated reproduction is impossible, it records the evidence limitation rather than fabricating certainty.

### DEBUG-02: Cleanup

Temporary logs, probes, fixtures, and debug-only code are removed before completion unless deliberately retained and documented.

## Review and completion

### REVIEW-01: Read-only review

When asked only to review, the agent reports evidence-backed findings without applying changes.

### REVIEW-02: Feedback verification

When given review feedback, the agent verifies it against the code, requirements, and project conventions before accepting, partially accepting, or rejecting it.

### DONE-01: Fresh evidence

The agent does not claim completion, correctness, or passing tests without fresh, scope-appropriate command output from the current state.

### DONE-02: Requirement-to-evidence reconciliation

Each accepted behavior is either supported by implementation and evidence or explicitly reported as incomplete.

### DOC-01: Documentation reflects facts

The agent updates authoritative documentation for changed behavior and decisions without creating a second source of truth.

### DOC-02: No retroactive requirement rewriting

The agent does not alter accepted requirements after implementation merely to match what was built. Material behavior deviations require explicit confirmation.

### DOC-03: Durable instruction promotion

Project instruction files are changed only for stable, cross-task rules. A normal completed task with no durable lesson leaves them unchanged.

## Version-control and authority boundaries

### SAFE-01: Preserve unrelated work

The agent inspects repository state and does not revert, overwrite, or absorb unrelated user changes.

### SAFE-02: No unauthorized external side effects

Skills do not imply permission to commit, push, merge, publish, create issues, install dependencies, or modify global configuration.
