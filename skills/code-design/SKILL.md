---
name: code-design
description: Create a greenfield solution design or refine an existing design into an implementation-ready proposal without coding.
disable-model-invocation: true
---

# Code Design

Produce a solution proposal without implementing production code. Update a design document only when the user explicitly asks; otherwise return the proposal in the response.

## 1. Select the design mode

- **Greenfield/discovery**: the user has a goal or problem but no settled solution.
- **Refinement**: the user supplies an existing proposal or design document that needs correction, completion, or simplification.

If the task is to implement an already accepted design, use `develop`. If existing behavior is broken, use `diagnose`.

## 2. Establish the problem and local context

- Clarify the user problem, desired outcome, acceptance behavior, constraints, and out of scope.
- Read applicable project instructions, authoritative documents, existing capabilities, representative code, and tests when a repository exists.
- Ask only about unresolved decisions that materially change product behavior or the viable solution space.
- Distinguish accepted requirements, repository facts, reversible design choices, and open product decisions.

## 3. Explore the design pressure

Name the actual problem before choosing a technique:

- Hard-to-follow control flow
- Hidden mutation, I/O, errors, or state transitions
- Semantic duplication that should change together
- Similar-looking rules that should remain independent
- Repeated conditionals along one real variation axis
- An unstable external dependency
- Scattered ownership of one invariant
- Construction or lifecycle rules with real combinations
- A missing stable public seam

No observed pressure means no new abstraction.

For greenfield work, propose the smallest coherent architecture that satisfies known behavior and credible near-term variation. For refinement, identify missing behavior, contradictions, unclear ownership, infeasible assumptions, accidental complexity, and decisions that lack evidence.

## 4. Develop and compare options

- Produce alternatives only when they represent materially different trade-offs.
- Compare ownership, coupling, cohesion, state and failure behavior, compatibility, testability, operability, migration cost, and expected change pressure.
- Prefer existing repository language, frameworks, and boundaries unless a concrete problem justifies change.
- Recommend one option and state why it is the lowest necessary complexity.
- Reject speculative extension points and unnecessary dependencies explicitly when they are tempting.

## 5. Apply the maintainability standard

Prefer code that is:

- Familiar in the repository or idiomatic in the ecosystem
- Explicit about branches, effects, failures, and state
- Named with domain concepts rather than compressed expressions
- Locally understandable without tracing unrelated modules
- Easy to debug at meaningful steps
- Structured so one rule has one authoritative owner

Use the standard to shape module boundaries and contracts, not to prescribe internal classes prematurely. Do not ask the user to design methods, patterns, or framework plumbing.

### Apply the novelty tax

An uncommon construct, reflection, metaprogramming, dense expression, implicit runtime behavior, new dependency, abstraction, or design pattern must provide a concrete benefit in correctness, measured performance, framework alignment, or total maintenance cost.

When justified:

- Localize it behind a clear boundary.
- Name the intent.
- Keep effects and failure behavior observable.
- Specify behaviorally sensitive evidence.
- Explain why it exists, not how the syntax works.

### Reuse and abstract by semantics

Before sharing code, ask:

- Does it implement the same domain rule?
- Should every caller change together when the rule changes?
- Does the proposed owner possess the relevant data and invariant?
- Does parameterization make the result harder to understand?
- Is an existing abstraction already sufficient?

Allow duplication when rules only happen to look alike and will evolve independently.

### Use patterns only under real pressure

Examples of legitimate signals:

- Multiple real algorithms or policies may justify Strategy.
- Distributed transition logic may justify an explicit state machine.
- An unstable third-party interface may justify an Adapter.
- Real construction combinations and invariants may justify a factory or builder.
- Ordered independent processing stages may justify a pipeline.

The pattern is acceptable only when complexity removed exceeds the indirection introduced. A pattern name is not evidence of quality.

## 6. Produce the proposal

Include only relevant sections:

- Problem, goals, accepted behavior, constraints, and out of scope
- Existing context and reusable capabilities
- Recommended boundaries, responsibilities, contracts, data/state ownership, and dependency direction
- Failure, security, compatibility, migration, and operational behavior when material
- Decisions, trade-offs, alternatives considered, and rejected unnecessary abstractions
- Open questions and assumptions
- Acceptance evidence and an implementation sequence

Do not claim decisions are accepted when they remain assumptions. Do not implement the design in this invocation.
