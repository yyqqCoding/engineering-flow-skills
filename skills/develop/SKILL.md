---
name: develop
description: Clarify and approve an implementation task before making the smallest clear change with focused evidence.
disable-model-invocation: true
---

# Develop

Own the requested implementation as one task across clarification, approval, implementation, correction, and verification. Follow-up answers and same-task requests remain in Develop without another invocation.

## Phase-transition gates

- A question is allowed only when its answer materially changes accepted behavior and the decision is either explicitly unresolved or contradicted by authoritative same-domain evidence. The stated contract, authoritative documents, and precedent for the same operation close everything else.
- Repository-discovered implementation facts such as field names, associations, helper choice, and storage shape are for investigation, not user selection. Ask only if the repository exposes a real product contradiction that cannot be implemented safely.
- Inventory every explicitly undefined, intentional, unknown, or not-established behavior before asking. An undefined unknown/missing-resource outcome is a qualifying product decision; a stated success result does not resolve it. `Undefined` never means out of scope unless the user or an authoritative same-domain contract explicitly excludes it. Batch all independent qualifying decisions together and cross-check that each material item was answered.
- For delete/write operations, an explicitly undefined unknown/missing-resource result is a hard-stop question in the same batch. Never infer `false`, throw, no-op, or another result from the success return value, absent precedent, or a neighboring read API.
- After the user answers that batch, ask only a genuinely dependent decision created by an answer or a newly discovered authoritative contradiction. Do not reopen answered behavior or introduce another independent implementation, edge-case, or hypothetical question; proceed to the checkpoint.
- A complete contract closes its named input domain and operations. Derive covered values, formatting, and error behavior from it; keep unmentioned optional or malformed inputs out of scope instead of expanding the interview.
- If a substantial request supplies a complete contract and requires a durable record, create and verify the `Draft` record in the first turn, present the checkpoint, and pause. Conceivable options or inputs outside the contract cannot delay the Draft.
- A fallback record under `docs/requirements/` carries its own completion gate for fresh-context recovery. Write Goal, Acceptance behavior, Out of scope, Assumptions, and Solution boundary as timeless constraints, never as work deferred until approval. Create `## Completion evidence` with `Implementation files: Pending`, `Test files: Pending`, `Verification: Pending`, `Deviations: None known`, and `Ready validator: <command>`; an established project convention may use equivalent fields.
- Resolve the ready-validator script from this skill's resource directory and persist its exact code-spanned finalization command in `Ready validator`, including `--record <path> --mode ready --finalize`. This Accepted-record command is deliberately self-contained so a fresh context can execute validation and the final state transition without the earlier workflow transcript.
- For the fallback convention, run the bundled [requirement-record validator](scripts/validate-requirement-record.js) with `--mode draft` before presenting the checkpoint. Resolve the script relative to this skill's resource directory. It is read-only and reports every failed condition together.
- Classify same-task follow-ups before responding. A reported omission from the original accepted behavior resumes implementation and verification directly; it is not new scope and must not receive another checkpoint or approval request. Return an `Implemented` record to `Accepted` while completing it.
- When a follow-up explicitly adds or changes accepted behavior, treat it as the intended scope increment and present its incremental checkpoint instead of asking whether the user meant the change. If the same message also approves the prior checkpoint, pause the whole turn and wait for later approval of the revised checkpoint before implementing either scope.
- When one turn both approves an existing checkpoint and adds material scope, classify it first as a `scope-alignment` turn: record the increment, present the revised checkpoint, and wait for later implementation approval. Do not begin either the prior or added implementation in that turn; after the next clear action language, enter implementation directly.
- Once the revised checkpoint receives later action language, resume the implementation phase immediately: inspect the accepted revised scope, make the required production and focused test changes, run verification, and complete the task. Do not stop after restating the checkpoint or emit an empty completion turn.
- Before implementation, present Goal, Acceptance behavior, Out of scope, Assumptions, and Solution boundary, then pause for post-checkpoint action approval.

## 1. Discover once

- Read applicable project instructions and authoritative requirement/design documents.
- Inspect version-control state and preserve unrelated work.
- Read the relevant implementation, tests, callers, and nearby patterns.
- For broken existing behavior, apply the Diagnose lifecycle.

Reuse this evidence. Do not repeat unchanged discovery or commands for narration.

## 2. Clarify to a safe implementation threshold

Establish:

- Goal, acceptance behavior, out of scope, and repository-supported assumptions
- Material behavior, interface, data/state, permission, security, compatibility, migration, and destructive-effect decisions
- Owning boundary and implementation approach when they affect the result

For each possible question, require all three conditions:

1. The answer changes accepted behavior rather than an internal implementation choice.
2. The request leaves it unresolved or authoritative same-domain evidence contradicts the request.
3. The stated contract, authoritative documentation, or precedent for the same operation does not already resolve it.

Do not ask if any condition fails. In particular, a complete predicate and semantic operation resolve unusual covered values; a neighboring read API does not establish missing-resource behavior for a write operation; and repository association details do not reopen an answered order policy.

Ask all independent qualifying questions in one compact batch. If no structured question tool is available, ask the batch in plain text and pause. After the answers, ask only questions whose need depends on those answers or on a newly discovered authoritative contradiction. Otherwise clarification is closed and the next response is the checkpoint.

## 3. Present the checkpoint and pause

When no material question remains:

- Present the final goal, acceptance behavior, out of scope, assumptions, and material solution boundary.
- Keep a concise checkpoint in the response.
- For a substantial record, use the project's applicable authoritative document. If none exists, create `docs/requirements/<feature-slug>.md` with status `Draft`.
- When the initial substantial request already supplies a complete contract, create and verify this Draft in the first turn; record unspecified optional behavior as out of scope rather than asking speculative questions first.
- A durable record contains the same checkpoint fields, not only status and acceptance criteria.
- Do not change production code, tests, or configuration before approval. Writing the requirement record is allowed.
- End the turn after the checkpoint. The original Develop invocation is not approval to code.

Only action language sent after this checkpoint, such as "implement this", "start implementation", or "proceed with the plan above", grants approval. The initial request, answers to clarification questions, and reading acknowledgements do not grant approval. On approval, mark a durable requirement record `Accepted` and continue directly; do not ask the user to invoke Develop again.

## 4. Choose boundary and feedback

- Reuse existing behavior only when it has the same domain responsibility and should evolve together.
- Place rules with the module that owns the relevant data and invariant; inspect sibling callers before changing shared behavior.
- Apply design-pressure and trade-off reasoning for non-local interfaces, state, dependencies, module boundaries, or competing approaches.
- Choose the highest stable public seam that can prove each behavior slice.
- Use red-green-refactor for regressions and valuable business behavior when a correct seam exists. Use compile, lint, integration, or another meaningful check for mechanical, presentation, configuration, or framework-wiring work.
- When new stable behavior closes a coverage gap, leave focused automated coverage unless it would be ceremonial or cannot detect the behavior.

## 5. Implement after approval

- Make the smallest clear change at the owning boundary.
- Keep control flow, effects, failures, and state transitions explicit.
- Avoid speculative abstractions, dependencies, configuration, and unrelated cleanup.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work.
- Run focused feedback after a behavior-changing slice when its result could have changed. Do not rerun the same command against the same state.

If implementation reveals a material requirement change, align only that increment, update the checkpoint, and pause for approval again. An explicit user-requested increment is already the behavior to align; do not ask whether changing the earlier contract is intentional.

## 6. Harden conditionally

Add targeted coverage only for applicable input, numeric/time, collection, state/lifecycle, duplicate/concurrent, permission/trust, resource/external-failure, migration, or compatibility risk. Derive expected behavior from accepted requirements and repository precedent; ask about material undefined behavior instead of inventing it.

Improve the touched design only when the change exposes scattered ownership, hidden effects, semantic duplication, repeated branching along one real variation axis, distributed state transitions, an unstable dependency, or a boundary that blocks testing or debugging. Use a design pattern only when demonstrated pressure justifies its indirection. Do not optimize line count or launch a broad redesign.

## 7. Complete and continue correctly

- Re-read accepted behavior and inspect the relevant diff for correctness, safety, ownership, readability, test sensitivity, scope, and temporary artifacts.
- Run focused verification and at most one scope-appropriate broader check when warranted.
- Reconcile every accepted behavior as verified, partially verified, incomplete, or deviated.
- Update authoritative documentation only for changed facts and confirmed decisions; update project instructions only for durable cross-task rules.
- Treat `Implemented` as the final record write. First inspect the actual diff and fresh verification output, then reopen the whole requirement record while it remains `Accepted`. Replace every completion-evidence `Pending` value with exact implementation paths, test paths, command results, and confirmed deviations; reconcile stated boundaries and acceptance behavior with those facts.
- Use the project's canonical verification command for the changed fixture or package. For the default Node fixture convention, that command is `npm test`; when the project declares another canonical command, use that command instead. In `Verification`, record the complete command exactly as executed, including every argument, together with its passing result. A different passing command is not equivalent evidence.
- For non-Node projects, follow the repository's existing test convention and leave focused tests in that convention whenever the accepted request asks for focused coverage. Passing a hidden or ad-hoc probe without changing the project's test files does not satisfy the coverage requirement.
- Remove stale prospective or deferred wording made false by the completed work, including `will`, `after approval`, `planned`, `to be added`, `to be created`, and equivalent language. Changing only the status is insufficient.
- For a fallback record, execute the exact persisted `Ready validator` finalization command from the target repository after reconciling the evidence fields. Pass each pre-existing unrelated changed path with a repeated `--ignore <path>` so the validator checks only this task. The `--finalize` operation validates the complete `Accepted` record first, then atomically writes `Status: Implemented` and stable evidence; it does not write on validation failure. Ordinary Draft/ready validation remains read-only, and a repeated finalization against an `Implemented` record is rejected without rewriting it.
- The successful finalization write replaces the installation-specific command with stable evidence ``Ready validator: `validate-requirement-record.js --mode ready` — passed``; do not retain a temporary or machine-specific path or perform a separate manual status write.
- Remove temporary diagnostics and report remaining gaps.

After an omitted original acceptance item is implemented and verified, restore its requirement record to `Implemented`. Explicit cancellation, a workflow switch, or an unrelated new task ends Develop inheritance.

Do not commit, push, publish, create external issues, install dependencies, or change global configuration unless authorized.
