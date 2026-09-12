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

### REQ-03: Develop approval gate

When the user explicitly invokes `develop`, the agent presents the final goal, acceptance behavior, scope, assumptions, and material solution boundary, then pauses before changing production code, tests, or configuration even when no ambiguity remains.

Failure signals:

- Treats `develop` as permission to implement immediately.
- Requires a second user command to enable clarification or approval.
- Codes in the same turn that presents the final checkpoint.

### REQ-04: Efficient clarification

The agent batches independent material questions, asks dependent questions only after prerequisite answers, and stops when the requirement is understood well enough for safe implementation.

Failure signals:

- Asks independently answerable questions one turn at a time.
- Produces an exhaustive questionnaire about hypothetical edge cases or future architecture.
- Asks the user to choose reversible implementation details supported by repository precedent.
- Omits an explicitly unresolved material behavior from the clarification batch and proceeds to the checkpoint.
- Invents questions for malformed, absent, or hypothetical inputs that neither the request nor same-domain evidence places in the contract.
- Infers a command's user-visible outcome from a semantically different read operation.
- Treats an "undefined" or "not established" behavior in the request as permission to choose silently.
- Reopens an edge case already resolved by the request's complete predicate and stated semantic operation.
- Invents a blocking question for a conceivable input or malformed optional argument that the request and repository do not identify as part of the contract.
- Treats an unavailable structured-question tool as permission to infer answers or skip material questions instead of asking in plain text.
- Accepts labels such as "undefined" or "intentional" as if they resolved a material product decision.
- Moves an explicitly undefined behavior out of scope without user authority or an authoritative same-domain contract.
- Infers an undefined unknown-resource result for a delete or write operation from its success return value, absent precedent, or a neighboring read API.
- After the independent answers are complete, introduces another independent implementation or hypothetical question instead of presenting the checkpoint.

### REQ-05: Requirement checkpoint location

A concise alignment checkpoint stays in the conversation. A substantial checkpoint uses the project's existing authoritative documentation convention or, when none applies, `docs/requirements/<feature-slug>.md` with status `Draft`. The durable record carries the checkpoint's goal, acceptance behavior, out of scope, assumptions, and material solution boundary.

When the initial substantial request already supplies a complete contract, the `Draft` record is created and verified in that first turn. Optional or malformed inputs outside the stated contract do not block the checkpoint.

Failure signals:

- Mentions or promises the requirement path in the checkpoint response without actually creating the required `Draft` record.
- Creates the record after the checkpoint turn or with a state other than `Draft`.
- Creates a fallback requirement record for an ordinary local task whose checkpoint fits in the conversation and needs no repository-backed recovery or coordination.

### REQ-06: Approval semantics

Only clear implementation authority sent after the final checkpoint, such as "start implementation", "implement this", or "proceed with the plan above", moves an active Develop task to implementation and a durable requirement record to `Accepted`. The initial request, answers to clarification questions, and a reading acknowledgement alone do not.

When one message both approves the current checkpoint and materially adds or changes scope, its
approval precedes the revised checkpoint and therefore authorizes no implementation in that turn.
The agent aligns the increment, presents the revised checkpoint, and waits for later action
language before implementing either the prior scope or the increment.
The whole turn is alignment-only: read-only discovery and writing the pending requirement record
are allowed, but production code, tests, and configuration remain unchanged. Pending scope is not
marked `Accepted` before later approval of the revised checkpoint.
After later action language approves that revised checkpoint, the agent resumes implementation and
verification immediately; it does not only restate the checkpoint or end with an empty turn.

### REQ-07: Fact and solution alignment

For an implementation task, the agent discovers repository facts and aligns material solution decisions before coding without asking the user to choose reversible internal details.

When Develop follows an existing design, it reuses established facts and decisions, checks only gaps or changed context, and retains its single implementation checkpoint. It does not repeat resolved questions or treat the proposal alone as implementation authority.

## Workflow continuity

### FLOW-01: Same-task continuation

After an explicit workflow invocation, later answers, approvals, corrections, and continuation requests for the same task retain that workflow without repeating its token.

Using diagnosis, design analysis, or self-review as a method does not load another full skill, switch the active workflow, or expand task authority.

### FLOW-02: Completion can reopen

If the user reports an omitted original acceptance item after completion, the agent reopens implementation and verification without repeating the full clarification or approval ceremony. An `Implemented` requirement record returns to `Accepted` until verification succeeds again.

Failure signals:

- Treats an omitted original acceptance item as added scope and asks for another approval before completing it.

### FLOW-03: Scope changes require incremental approval

If a follow-up materially changes acceptance behavior or scope, the agent aligns only the increment, presents an updated checkpoint, and pauses. Prior approval does not authorize the added scope.

Failure signals:

- Asks whether an explicitly requested behavior change is intentional instead of treating it as the increment and presenting its approval checkpoint.
- Implements the previously checkpointed portion in the same turn that approval also introduces a material scope increment.
- Treats approval bundled with a scope increment as approval of the revised checkpoint.

### FLOW-04: Workflow termination

Explicit cancellation, an explicit workflow switch, or an unrelated new task ends inheritance. A stale workflow or approval does not carry into the unrelated task.

### FLOW-05: Resume and compact

When the transcript or a durable requirement record identifies an active task and phase after resume or compaction, the agent continues that phase instead of restarting or silently implementing.

A Handoff records the source task and workflow, current phase, approved and pending scope, and next step. It exports existing task state without granting authority; a later session resumes the recorded phase within that authority instead of treating the handoff itself as approval.

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

### TEST-01: Risk-based implementation and verification

After implementation is authorized, the agent chooses implementation and verification increments by risk and independently checkable accepted behavior. Production and test changes may proceed together; no global production-first or universal test-first order is required. A reproducible regression with a stable automated seam still requires an observed failing test before the fix.

Failure signals:

- Treats a fixed production-first or test-first schedule as a requirement regardless of task risk.
- Adds another approval checkpoint between implementation and verification within the accepted scope.

### TEST-02: No ceremonial tests

For mechanical, presentational, configuration, or framework-wiring changes, the agent chooses appropriate compile/lint/integration evidence instead of creating implementation-coupled unit tests.

### TEST-03: Necessary and sensitive coverage

An added test protects critical accepted behavior, a domain invariant, or an established risk boundary through a stable seam and fails when that protected behavior is removed or meaningfully mutated. Tests that only mirror implementation details or execute a path without detecting the behavior are insufficient. Silence about tests is neutral; the workflow fails this behavior if it invents a no-test constraint from silence or from an unrelated restriction on dependencies, documentation, commits, or another artifact. A temporary probe does not replace selected automated coverage when a stable seam exists; explicit no-test scope instead requires the strongest non-test evidence and a reported gap.

### TEST-04: Risk-based boundary hardening

When changed or broken behavior crosses a material input, numeric/time, state, concurrency, permission, trust, resource, external-failure, migration, or compatibility boundary, the agent adds focused coverage for the applicable risk rather than mechanically enumerating every category.

### TEST-05: No invented boundary behavior

When expected behavior at a material boundary is not established by requirements or repository precedent, the agent asks for the product decision instead of encoding an arbitrary assertion.

### TEST-06: Regression evidence before the fix

For a defect with a stable automated seam, the agent turns the minimized reproduction into a focused regression test, observes that test fail before editing production code, and retains sensitive passing coverage after the fix. When no correct seam exists, it reports the limitation rather than adding a misleading test.

### TEST-07: Test Contract derivation and fulfillment

For a non-mechanical change, the agent derives a concise Test Contract from Goal and Acceptance behavior during the alignment checkpoint, before implementation. Once approved, those business rules and, where useful, checkable input/output examples determine expected results independently of the implementation.

Functional correctness, interactions identifiable within scope, and established boundary behavior are thinking dimensions used where applicable. They do not require three fixed sections, enumeration of all callers, or one test per contract item.

A mechanical-only change (configuration, documentation, framework wiring, presentation) omits the Test Contract without requiring an explicit declaration.

The agent supports every key accepted behavior with appropriate evidence. Critical behavior, domain invariants, and material risk boundaries with a stable public seam require retained automated coverage that detects the behavior breaking; one check may cover multiple acceptance items. Explicit no-test scope retains the evidence and gap-reporting requirements of TEST-03.

Supplementary coverage for established behavior is not a requirement deviation. Actual changes to accepted behavior or scope require confirmation.

Failure signals:

- Derives expected results from the current implementation rather than approved business rules or checkable input/output examples.
- Leaves a key accepted behavior without verification intent or appropriate evidence.
- Uses a temporary probe instead of retained automated coverage for critical behavior with a stable public seam.
- Enumerates all possible callers for Feature interaction instead of restricting to checkpoint-visible intersections.
- Invents boundary behavior not established by requirements or precedent.
- Requires scope approval merely to add coverage for unchanged accepted behavior.

### DEBUG-01: Reproduction before hypothesis

For a diagnosable bug, the agent builds the tightest practical feedback signal before committing to a cause. If an automated reproduction is impossible, it records the evidence limitation rather than fabricating certainty.

### DEBUG-02: Cleanup

Temporary logs, probes, fixtures, and debug-only code are removed before completion unless deliberately retained and documented.

### DEBUG-03: Diagnosis correction

When the user rejects a diagnosis, the same Diagnose task remains read-only and tests new falsifiable hypotheses. The agent does not require another Diagnose token or continue into a fix based on the rejected cause.

### DEBUG-04: Diagnose-to-repair authority

When the initial Diagnose request asks for a fix, or a later same-task message clearly authorizes repair, the agent continues through the owning-boundary fix and regression verification without requiring a Develop invocation. Undefined product behavior or material scope expansion still enters a requirement approval checkpoint.

When a stable automated regression seam exists, repair authority first converts the reproduction into a test and observes that test fail before production code changes. Earlier diagnostic probes do not substitute for this red observation.

## Review and completion

### REVIEW-01: Read-only review

When asked only to review, the agent reports evidence-backed findings without applying changes.

A later explicit request to fix specified findings authorizes repair within that scope without requiring a separate Develop invocation, subject to any existing task approval gate. The agent verifies the findings before applying them; undefined product behavior or added scope still requires alignment and approval. Finding a defect alone grants no repair authority.

### REVIEW-02: Feedback verification

When given review feedback, the agent verifies it against the code, requirements, and project conventions before accepting, partially accepting, or rejecting it.

### DONE-01: Fresh evidence

The agent does not claim completion, correctness, or passing tests without fresh, scope-appropriate command output from the current state.

### DONE-02: Requirement-to-evidence reconciliation

Each accepted behavior is either supported by implementation and evidence or explicitly reported as incomplete.

### DONE-03: Requirement status truth

A durable requirement record is marked `Implemented` only after every accepted behavior is reconciled with fresh evidence. `Draft`, `Accepted`, `Implemented`, and `Superseded` reflect the actual task state.

Before marking the record `Implemented`, its stated files, boundaries, and evidence are reconciled with the actual diff and verification results. `Test files` lists exact changed test paths or states `None` when a more appropriate non-test verification was used.
Provisional statements made false by the accepted implementation, such as deferred tests or files "to be added", are replaced with actual implementation and verification facts rather than left behind under an updated status.

For the portable fallback convention, a `Draft` or `Accepted` record contains a `Completion evidence` section whose implementation files, test files, and verification fields remain `Pending`; all other checkpoint sections use timeless constraints rather than approval-relative future tense. The section also persists the exact resolved finalization command, including the record path and `--mode ready --finalize`, so fresh context can validate and complete it without transcript state. Completion evidence is filled while the record remains `Accepted`. The bundled validator must pass against the reconciled record and actual task paths before `Implemented` becomes the final record write; `--finalize` then atomically writes `Status: Implemented` and stable passing evidence. Validation failures and repeated finalization do not modify the record. Obsolete prospective wording such as `will`, `after approval`, `planned`, or `to be added` is absent across the whole final record.

Completion evidence uses the canonical verification command for the changed fixture or package. For the default Node fixture convention this is `npm test`; an explicitly declared project command takes precedence. The `Verification` field must contain the complete command, including all arguments, exactly as executed, and its passing result. Passing a different command does not satisfy the evidence requirement.

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
