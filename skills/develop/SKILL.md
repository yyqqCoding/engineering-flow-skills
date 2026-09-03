---
name: develop
description: Align and approve an implementation task with a Test Contract, then complete production code before fulfilling the contract.
disable-model-invocation: true
---

# Develop

Own one implementation task across alignment, approval, implementation, correction, and verification. Same-task follow-ups remain in Develop until cancellation, an explicit workflow switch, or unrelated work.

## State gates

- Ask only when the answer materially changes accepted behavior, interfaces, data/state, permissions, security, compatibility, migration, destructive effects, or acceptance, and neither the request nor authoritative same-domain evidence resolves it. Repository mechanics are not user choices.
- Inventory and batch all independent material questions. An explicitly undefined unknown-resource result for a write or delete is a product decision; never infer it from a success result, absent precedent, or a neighboring read API. After answers, ask only genuinely dependent questions or resolve a newly discovered authoritative contradiction.
- A complete contract closes its stated inputs and operations. Derive covered values from it and leave unmentioned optional or malformed inputs out of scope instead of expanding the interview.
  - Present Goal, Acceptance behavior, Out of scope, Assumptions, and Solution boundary, explicitly state that approval is pending, then pause. A checkpoint heading or an empty diff alone does not signal that approval is pending. Only action language sent after this checkpoint grants approval. The initial request, answers to clarification questions, and reading acknowledgements do not grant approval.
- A follow-up that materially changes accepted behavior receives an incremental checkpoint. If it also approves the prior checkpoint, the whole turn remains alignment-only; implement the combined scope only after later action language approves the revision.
- A reported omission from accepted behavior resumes implementation directly. Return an `Implemented` requirement record to `Accepted` until the omission is verified; do not require another checkpoint.
- For broken existing behavior, use the Diagnose lifecycle, including its regression-first exception.

## 1. Discover and align once

- Read applicable instructions and authoritative requirements/designs.
- Inspect version-control state, relevant implementation, tests, callers, and nearby patterns. Preserve unrelated work and reuse this evidence instead of repeating discovery for narration.
- Locate the owning boundary and existing same-domain behavior. Ask the user only about unresolved product decisions, not fields, associations, helper choice, test layout, or other reversible implementation details.
- Apply design-pressure and trade-off reasoning only for material interfaces, state, dependencies, module boundaries, or competing approaches.

When no material question remains, proceed directly to the checkpoint.

## 2. Record the checkpoint and pause

- Keep a concise checkpoint in the response. A local task that fits there does not get a fallback record. For substantial work needing repository-backed recovery or coordination, use the project's authoritative convention or create `docs/requirements/<feature-slug>.md` with status `Draft`.
- When the initial substantial request already supplies a complete contract, create and verify the Draft in that first turn; hypothetical inputs outside the contract cannot delay it.
- Before creating, resuming, or completing the fallback record, read [Fallback requirement records](references/requirement-records.md) and follow its deterministic validator procedure.
- Do not change production code, tests, or configuration before approval. Writing the requirement record is allowed.
- Derive a Test Contract when the change involves functional behavior rather than only mechanical, presentational, documentation, configuration, or framework-wiring changes. The contract declares verification intent from requirements, not from implementation structure:
  - **Functional correctness:** single-function behavior derived directly from Goal and Acceptance behavior (e.g., "results ordered by creation time descending", not "results are sorted").
  - **Feature interaction:** correctness where behaviors intersect within the checkpoint scope (e.g., "sorting × pagination: first item on page 2 has earlier time than last item on page 1"). Include only interactions identifiable from the checkpoint; do not enumerate all possible callers.
  - **Boundary conditions:** edge cases whose expected behavior is established by requirements or repository precedent (e.g., "empty list returns [], not null"). Do not invent undefined product behavior.
  A mechanical-only change omits the Test Contract without requiring an explicit declaration.
- Absence of a test request is not a prohibition. Do not add `no test edits` to the checkpoint unless the user explicitly forbids them, and do not extend restrictions on dependencies, documentation, commits, or other artifacts to tests.
- End the checkpoint turn with an explicit request for approval. The original Develop invocation is not implementation approval.

On later approval, mark a durable record `Accepted` and continue directly without another Develop invocation or a repeated checkpoint.

## 3. Complete the production implementation

- Make the smallest clear change at the module that owns the relevant data and invariant. Inspect sibling callers before changing shared behavior.
- Reuse only identical domain behavior that should evolve together. Keep control flow, effects, failures, and state transitions explicit; avoid speculative abstractions, dependencies, configuration, and unrelated cleanup.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work.
- Existing tests may be read or run for context and regression detection, but do not add or edit test files until the approved production behavior is implemented. This phase boundary adds no user checkpoint and requires no commit.
- Use a meaningful build, type, lint, integration, smoke, visual, or behavioral signal during implementation when useful, without creating test-first slices for new behavior.

If implementation exposes a material requirement change, align only that increment, update the checkpoint, and pause. An explicit user-requested change is already the increment to checkpoint; do not ask whether it was intended.

## 4. Fulfill Test Contract and select supplementary evidence

After production implementation is complete, write tests and verification evidence:

- Fulfill every item declared in the Test Contract by translating it into automated coverage against a stable public seam. Each contract item must have a corresponding test that would fail if the declared behavior breaks.
- For supplementary evidence beyond the contract, add automated coverage only when implementation reveals a risk not captured in the contract—such as an unexpected boundary interaction, a domain invariant, or a newly discovered external-failure mode—and the coverage can detect that behavior breaking through a stable public seam.
- Treat permissions/trust, money or data integrity, destructive effects, lifecycle/state transitions, duplicate/concurrent/idempotent behavior, migration, compatibility, and external failures as strong reasons for supplementary coverage even when not in the contract.
- Add only applicable adjacent boundary cases whose behavior is established by requirements or repository precedent. Do not enumerate every theoretical category or invent product behavior.
- Do not add unit tests for mechanical, presentation, documentation, configuration, or framework-wiring changes when build, type, lint, integration, smoke, or visual evidence is more meaningful.
- An ad-hoc probe may supplement but cannot replace fulfilled contract coverage or supplementary automated coverage. Lack of an explicit test request is not a reason to skip fulfillment; if the user explicitly forbids test changes, use the best non-test evidence and report the retained coverage gap.
- When the accepted request explicitly requires automated coverage, leave it in the project's established test convention. An ad-hoc probe alone does not satisfy that requirement.
- Report any supplementary test added beyond the contract as a deviation note for traceability.

If selected evidence exposes an implementation defect, correct production code and rerun the affected checks. Improve the touched design only when the change demonstrates scattered ownership, hidden effects, semantic duplication, repeated branching on one real variation axis, distributed state transitions, an unstable dependency, or a boundary that blocks testing or debugging.

## 5. Complete and continue correctly

- Re-read accepted behavior and inspect the diff for correctness, safety, ownership, readability, necessary test sensitivity, scope, and temporary artifacts.
- Run fresh focused verification and at most one broader check when scope warrants it. Do not rerun an unchanged command against unchanged state.
- Reconcile each accepted behavior as verified, partially verified, incomplete, or deviated. Update authoritative documentation only for changed facts and confirmed decisions; promote only durable cross-task rules to project instructions.
- Remove temporary diagnostics and report remaining gaps.
- For a fallback record, reconcile exact implementation paths, test paths or `None`, the complete canonical verification command and result, and deviations while it remains `Accepted`; then use the reference's validator finalization so `Implemented` is the final record write.

Do not commit, push, publish, create external issues, install dependencies, or change global configuration unless authorized.
