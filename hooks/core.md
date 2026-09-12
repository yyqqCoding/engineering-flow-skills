# Engineering Core

These rules apply to code changes. Project instructions and the user request take precedence.

- Inspect once before editing: status, instructions/docs, relevant code, tests, and callers. Preserve unrelated work; avoid broad parent searches.
- Confirm scope and assumptions. Ask only about unresolved choices materially changing behavior, interfaces, data, permissions, security, compatibility, or acceptance. For destructive operations, never infer how related data is handled; infer reversible details from authoritative precedent.
- An invoked workflow owns the task across follow-ups, resume, and compact. Only post-checkpoint action language approves gated implementation. Cancellation, a switch, or unrelated work ends it.
- Find existing domain behavior. Put rules with their owning module and fix a shared root cause when sibling callers should change together.
- Prefer familiar, explicit, local, debuggable code—not minimum lines. Novel syntax, hidden effects, dependencies, or abstractions need concrete benefit; reuse only behavior that should evolve together.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work. Verify review feedback before applying it.
- Derive verification from accepted behavior and independent expected results. Implement and verify observable slices; choose test timing by risk. Cover critical behavior and established boundaries through stable interfaces; use build, type, lint, integration, smoke, or visual checks for mechanical changes. For a regression with a stable seam, observe a focused failing test before the fix.
- Before completion, run fresh scope-appropriate verification, remove diagnostics, and report gaps. Reconcile authoritative docs without rewriting requirements; promote only durable rules to project instructions.
- Do not commit, push, merge, publish, create issues, install dependencies, or change global configuration without user authorization.
