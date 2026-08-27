---
name: develop
description: Align and approve an implementation task, then complete production code before selecting necessary verification.
disable-model-invocation: true
---

# Develop

Own one implementation task across alignment, approval, implementation, correction, and verification. Same-task follow-ups remain in Develop until cancellation, an explicit workflow switch, or unrelated work.

## State gates

- Ask only when the answer materially changes accepted behavior, interfaces, data/state, permissions, security, compatibility, migration, destructive effects, or acceptance, and neither the request nor authoritative same-domain evidence resolves it. Repository mechanics are not user choices.
- Inventory and batch all independent material questions. An explicitly undefined unknown-resource result for a write or delete is a product decision; never infer it from a success result, absent precedent, or a neighboring read API. After answers, ask only genuinely dependent questions or resolve a newly discovered authoritative contradiction.
- A complete contract closes its stated inputs and operations. Derive covered values from it and leave unmentioned optional or malformed inputs out of scope instead of expanding the interview.
- Present Goal, Acceptance behavior, Out of scope, Assumptions, and Solution boundary, then pause. Only action language sent after this checkpoint grants approval. The initial request, answers to clarification questions, and reading acknowledgements do not grant approval.
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
- Absence of a test request is not a prohibition. Do not add `no test edits` to the checkpoint unless the user explicitly forbids them, and do not extend restrictions on dependencies, documentation, commits, or other artifacts to tests.
- End the checkpoint turn. The original Develop invocation is not implementation approval.

On later approval, mark a durable record `Accepted` and continue directly without another Develop invocation or a repeated checkpoint.

## 3. Complete the production implementation

- Make the smallest clear change at the module that owns the relevant data and invariant. Inspect sibling callers before changing shared behavior.
- Reuse only identical domain behavior that should evolve together. Keep control flow, effects, failures, and state transitions explicit; avoid speculative abstractions, dependencies, configuration, and unrelated cleanup.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work.
- Existing tests may be read or run for context and regression detection, but do not add or edit test files until the approved production behavior is implemented. This phase boundary adds no user checkpoint and requires no commit.
- Use a meaningful build, type, lint, integration, smoke, visual, or behavioral signal during implementation when useful, without creating test-first slices for new behavior.

If implementation exposes a material requirement change, align only that increment, update the checkpoint, and pause. An explicit user-requested change is already the increment to checkpoint; do not ask whether it was intended.

## 4. Select necessary tests and verification

After production implementation is complete, choose evidence independently:

- Add automated coverage only when it protects critical accepted behavior, a domain invariant, or an established risk boundary and can detect that behavior breaking through a stable public seam.
- Treat permissions/trust, money or data integrity, destructive effects, lifecycle/state transitions, duplicate/concurrent/idempotent behavior, migration, compatibility, and external failures as strong reasons for targeted tests.
- Add only applicable adjacent boundary cases whose behavior is established by requirements or repository precedent. Do not enumerate every theoretical category or invent product behavior.
- Do not add unit tests for mechanical, presentation, documentation, configuration, or framework-wiring changes when build, type, lint, integration, smoke, or visual evidence is more meaningful.
- An ad-hoc probe may supplement but cannot replace automated coverage selected by the criteria above. Lack of an explicit test request is not a reason to skip it; if the user explicitly forbids test changes, use the best non-test evidence and report the retained coverage gap.
- When the accepted request explicitly requires automated coverage, leave it in the project's established test convention. An ad-hoc probe alone does not satisfy that requirement.

If selected evidence exposes an implementation defect, correct production code and rerun the affected checks. Improve the touched design only when the change demonstrates scattered ownership, hidden effects, semantic duplication, repeated branching on one real variation axis, distributed state transitions, an unstable dependency, or a boundary that blocks testing or debugging.

## 5. Complete and continue correctly

- Re-read accepted behavior and inspect the diff for correctness, safety, ownership, readability, necessary test sensitivity, scope, and temporary artifacts.
- Run fresh focused verification and at most one broader check when scope warrants it. Do not rerun an unchanged command against unchanged state.
- Reconcile each accepted behavior as verified, partially verified, incomplete, or deviated. Update authoritative documentation only for changed facts and confirmed decisions; promote only durable cross-task rules to project instructions.
- Remove temporary diagnostics and report remaining gaps.
- For a fallback record, reconcile exact implementation paths, test paths or `None`, the complete canonical verification command and result, and deviations while it remains `Accepted`; then use the reference's validator finalization so `Implemented` is the final record write.

Do not commit, push, publish, create external issues, install dependencies, or change global configuration unless authorized.
