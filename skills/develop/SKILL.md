---
name: develop
description: Align and approve an implementation task, then deliver accepted behavior with verification evidence.
disable-model-invocation: true
---

# Develop

Own one implementation task through alignment, approval, implementation, correction, and verification. Same-task follow-ups stay in Develop until cancellation, an explicit workflow switch, or unrelated work.

## 1. Align and pause

- Reuse authoritative requirements, existing designs, and repository evidence. Inspect missing facts and changes instead of restarting discovery or rewriting settled decisions.
- Ask only about unresolved choices that materially change behavior, interfaces, data, permissions, security, compatibility, destructive effects, or acceptance. Infer reversible implementation details from authoritative same-domain evidence.
- Batch all independent material questions. Treat an explicitly undefined write/delete result as an unanswered product decision and include it in that batch; “undefined” alone does not put it out of scope. Never infer an unknown-resource result from a success result, absent precedent, or a neighboring read API. After answers, ask only genuinely dependent questions or resolve a newly discovered authoritative contradiction.
- A complete contract resolves its stated inputs and operations. Do not reopen covered values or expand the interview to unmentioned optional or malformed inputs.
- Present Goal, Acceptance behavior, Out of scope, Assumptions, and Solution boundary. Explicitly state that approval is pending and request it, then pause. Only action language sent after this checkpoint grants approval. The initial request, answers to clarification questions, and reading acknowledgements do not grant approval.
- Keep a self-contained local checkpoint in the response. Do not create a fallback file or run its validator just because the contract is complete or the project lacks a documentation convention. Substantial work needing durable recovery or coordination uses the project's authoritative convention, or `docs/requirements/<feature-slug>.md` with status `Draft`. A complete initial substantial request gets its verified Draft in that first turn. Before creating, resuming, or completing a fallback record, read [Fallback requirement records](references/requirement-records.md).
- For non-mechanical behavior, include a Test Contract alongside acceptance: the behavior to protect, concrete examples where they distinguish plausible interpretations, and the intended verification boundary. Ground expected results in accepted rules, worked examples, or authoritative evidence. Consider applicable functional behavior, feature interactions, and established boundaries without requiring three separate sections or inventing undefined behavior.
- Before approval, production code, tests, and configuration stay unchanged. Read-only discovery and the pending requirement record are allowed. An existing design supplies checkpoint content; it does not bypass this approval gate.

On later approval, mark a durable record `Accepted` and proceed immediately.

## 2. Implement and verify

- Make the smallest clear change at the owner of the domain rule, following Core. Use design, diagnosis, and self-review techniques within this task without loading another full workflow or changing its authority.
- Work in independently verifiable behavior slices. A local change can be implemented and then tested immediately; important stable rules benefit from early executable examples, and uncertain integrations need early feedback. Choose the order by risk instead of postponing all test authoring until the entire feature is complete. For a reproducible regression with a stable seam, observe the focused test fail before changing production behavior.
- Fulfill the Test Contract through stable public interfaces. Retain automated coverage for critical accepted behavior and established risk boundaries; a temporary probe cannot replace it. One meaningful test may support several acceptance items. Mechanical, presentation, configuration, documentation, and wiring changes can use more appropriate build, type, lint, integration, smoke, or visual evidence.
- Silence about tests is neutral. Do not infer a test prohibition from restrictions on dependencies, documentation, commits, or other artifacts. If tests are explicitly prohibited, use the strongest allowed evidence and report the coverage gap.
- Add supplementary coverage for risks revealed by implementation, including applicable permission, data-integrity, state, concurrency, migration, compatibility, and external-failure boundaries. Derive expectations from established behavior. Additional tests alone are not requirement deviations.
- Correct defects exposed by verification and rerun affected checks. Broaden verification when scope or new evidence warrants it; do not repeat unchanged checks without a reason.

## 3. Reconcile and complete

- Re-read accepted behavior and inspect the diff for omissions, incorrect behavior, scope, and temporary artifacts. Reconcile each acceptance item with evidence or an explicit gap; report material deviations without rewriting requirements to excuse them.
- Reconcile authoritative documentation with actual facts and confirmed decisions. Remove diagnostics and promote only durable cross-task rules to project instructions.
- For a fallback record, record exact implementation paths, test paths or `None`, the complete canonical verification command and result, and deviations while status remains `Accepted`. Use the reference's validator finalization to make `Implemented` the final record write.

A reported omission from accepted behavior reopens implementation directly; an `Implemented` record returns to `Accepted` until verified. A material scope change gets an incremental checkpoint. If the same message also approves the prior checkpoint, the whole turn remains alignment-only: implement neither portion until later action language approves the revision.

Do not commit, push, merge, publish, create external issues, install dependencies, or change global configuration unless authorized.
