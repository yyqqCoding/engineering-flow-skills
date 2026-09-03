---
name: code-design
description: Create or refine an implementation-ready solution proposal without writing production code.
disable-model-invocation: true
---

# Code Design

Produce a solution proposal without implementing production code. Update a design document only when the user explicitly asks; otherwise return the proposal in the response.

## Choose the mode

- **Greenfield:** turn an unsettled goal or problem into the smallest coherent solution.
- **Refinement:** correct, complete, or simplify an existing proposal.

Use Develop for implementation of an accepted design and Diagnose for broken existing behavior.

## Establish context

- Clarify the desired outcome, accepted behavior, constraints, and out of scope.
- In a repository, read applicable instructions, authoritative documents, existing capabilities, representative code, and tests.
- Separate accepted requirements, repository facts, reversible design choices, assumptions, and unresolved product decisions. Ask only when an unresolved answer materially changes behavior or the viable solution space.

## Design from demonstrated pressure

Name the problem before selecting a technique. Relevant pressure includes scattered ownership of one invariant, hidden effects or transitions, semantic duplication that must evolve together, repeated branching on one real variation axis, an unstable dependency, complex lifecycle rules, or a missing stable public seam. Similar-looking independent rules and hypothetical variation do not justify abstraction.

For refinement, identify missing behavior, contradictions, unclear ownership, infeasible assumptions, accidental complexity, and unsupported decisions. For greenfield work, account only for known behavior and credible near-term variation.

Compare alternatives only when their trade-offs are materially different. Evaluate ownership, coupling, state and failure behavior, compatibility, security, testability, operability, migration cost, and expected change pressure. Prefer existing repository boundaries and dependencies unless a concrete problem justifies change.

Recommend the option with the lowest necessary complexity. Keep effects, failures, state, and dependency direction explicit. An uncommon construct, dependency, abstraction, or pattern must remove more complexity than it introduces and provide a concrete correctness, performance, framework, or maintenance benefit.

## Produce the proposal

Include only relevant sections:

- Problem, goals, accepted behavior, constraints, and out of scope
- Existing capabilities and authoritative context
- Recommended boundaries, responsibilities, contracts, data/state ownership, and dependency direction
- Material failure, security, compatibility, migration, and operational behavior
- Decisions, trade-offs, rejected alternatives, assumptions, and open questions
- Test Contract (omit for mechanical-only changes; when present, include applicable categories)
  - Functional correctness — single-function behavior from accepted behavior
  - Feature interaction — intersection of behaviors within the proposed scope
  - Boundary conditions — edge cases established by requirements or precedent
- Acceptance evidence and an implementation sequence

Do not claim assumptions are accepted. Do not prescribe internal classes or patterns before pressure justifies them, and do not implement the proposal in this invocation.
