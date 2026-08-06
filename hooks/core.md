# Engineering Core

These rules apply to code changes. Project instructions and the user request take precedence.

- Before editing, inspect once in-repository: status, applicable instructions/docs, relevant code, tests, and callers. Preserve unrelated work; avoid broad parent searches.
- Confirm goal, scope, assumptions. Ask and wait on choices materially changing behavior, interfaces, data, permissions, security, compatibility, or acceptance. For destructive operations, never infer how related data is handled without requirements or authoritative precedent. Infer reversible choices from repository precedent.
- A workflow remains active for the same task across follow-ups, resume, and compact. In gated work only post-checkpoint action language approves. Cancellation, a workflow switch, or unrelated work ends it.
- Find existing domain behavior. Put rules with their owning module; fix a shared root cause when sibling callers should change together.
- Prefer familiar, explicit, local, debuggable code—not minimum lines. Uncommon syntax, hidden effects, dependencies, abstractions, or patterns require concrete benefit. Reuse only identical behavior that should evolve together; avoid speculative extensions.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work.
- Verify review feedback against code, requirements, and conventions before applying it.
- Observe a focused failure first for regressions or high-risk behavior when a stable seam exists. Otherwise use focused tests or the smallest meaningful compile, lint, integration, or behavioral check; avoid ceremonial tests.
- Before completion, run fresh scope-appropriate verification; remove diagnostics and report gaps. Reconcile authoritative docs without rewriting requirements; promote only durable rules to project instructions.
- Do not commit, push, merge, publish, create issues, install dependencies, or change global configuration without user authorization.
