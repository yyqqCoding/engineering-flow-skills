---
name: code-design
description: Evaluate non-local module boundaries, interfaces, state models, dependencies, variation points, and justified abstractions.
disable-model-invocation: true
---

# Code Design

Choose the lowest necessary complexity that keeps behavior clear, local, testable, and easy to change. Do not optimize for line count or the appearance of sophistication.

## 1. Establish the local language

- Read project conventions and representative nearby code.
- Identify normal language/framework idioms and existing module boundaries.
- Separate local conventions from accidental legacy problems.
- Improve only the area required by the task; do not launch an unrelated style rewrite.

## 2. Map the design pressure

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

## 3. Prefer maintainable expression

Prefer code that is:

- Familiar in the repository or idiomatic in the ecosystem
- Explicit about branches, effects, failures, and state
- Named with domain concepts rather than compressed expressions
- Locally understandable without tracing unrelated modules
- Easy to debug at meaningful steps
- Structured so one rule has one authoritative owner

Use conditional expressions only for simple, side-effect-free value choices. Avoid nested conditionals, dense Boolean expressions, chains that mix transformation and effects, exceptions as normal flow, and advanced language machinery used only to save lines.

Useful intermediate variables and small intent-revealing methods are clarity, not bloat.

## 4. Apply the novelty tax

An uncommon construct, reflection, metaprogramming, dense expression, implicit runtime behavior, new dependency, abstraction, or design pattern must provide a concrete benefit in correctness, measured performance, framework alignment, or total maintenance cost.

When justified:

- Localize it behind a clear boundary.
- Name the intent.
- Keep effects and failure behavior observable.
- Add behaviorally sensitive tests.
- Explain why it exists, not how the syntax works.

## 5. Reuse and abstract by semantics

Before sharing code, ask:

- Does it implement the same domain rule?
- Should every caller change together when the rule changes?
- Does the proposed owner possess the relevant data and invariant?
- Does parameterization make the result harder to understand?
- Is an existing abstraction already sufficient?

Allow duplication when rules only happen to look alike and will evolve independently.

## 6. Use patterns only under real pressure

Examples of legitimate signals:

- Multiple real algorithms or policies may justify Strategy.
- Distributed transition logic may justify an explicit state machine.
- An unstable third-party interface may justify an Adapter.
- Real construction combinations and invariants may justify a factory or builder.
- Ordered independent processing stages may justify a pipeline.

The pattern is acceptable only when complexity removed exceeds the indirection introduced. A pattern name is not evidence of quality.

## Output

For design/review requests, report the pressure, recommended boundary, trade-offs, and rejected unnecessary abstractions. For implementation requests, apply the design within task scope and verify behavior.
