---
name: code-design
description: Create or refine an implementation-ready solution proposal without writing production code.
disable-model-invocation: true
---

# Code Design

Produce a solution proposal without implementing production code. Update a design document only when requested; otherwise return the proposal in the response.

## Establish the decision

- Use the user's goal, authoritative documents, existing capabilities, representative code, and tests. Distinguish accepted behavior, repository facts, assumptions, and unresolved product decisions; ask only about material choices that this evidence cannot resolve.
- For an existing proposal, preserve settled decisions and focus on missing behavior, contradictions, feasibility, ownership, and unnecessary complexity. Report changed decisions and their reasons instead of repeating the full background unless a complete rewrite is requested.
- Recommend the smallest coherent solution. Put rules with their owner and prefer existing boundaries. An abstraction or dependency needs demonstrated pressure and a concrete benefit; visual duplication and hypothetical variation are insufficient. Compare alternatives only when their trade-offs materially differ.

## Explain the proposal

Include what the decision needs:

- Goal, accepted behavior, constraints, and remaining scope questions.
- Recommended responsibilities, interfaces, data/state ownership, and important failure, security, compatibility, migration, or operational behavior.
- Decisions and reasons, material alternatives, assumptions, and unresolved choices.
- Verification intent tied to acceptance: concrete distinguishing examples and appropriate evidence for applicable interactions and boundaries. Expected results come from requirements or authoritative precedent, not a proposed implementation.
- An implementation sequence when dependencies or risk make it useful.

Do not present assumptions as accepted requirements. When the user selects Develop afterward, carry this proposal and its evidence forward; only missing or changed facts need alignment, and Develop retains its implementation approval checkpoint.
