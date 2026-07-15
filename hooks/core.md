# Engineering Core

These rules apply to code changes. Project instructions and the current user request take precedence.

- Before editing, inspect once in-repository: status, applicable instructions/docs, relevant code, tests, callers. Preserve unrelated work; avoid broad parent searches.
- Confirm goal, acceptance, scope, assumptions. Ask only about details materially changing behavior, interfaces, data, permissions, security, compatibility, destructive effects, or acceptance. Infer reversible choices from repository precedent.
- Find existing domain behavior. Put rules with their owning module; fix a shared root cause when sibling callers should change together.
- Prefer familiar, explicit, local, debuggable code—not minimum lines. Uncommon syntax, dense expressions, hidden effects, metaprogramming, dependencies, abstractions, or patterns require concrete benefit. Reuse only identical domain behavior that should evolve together; avoid speculative extensions.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work.
- Verify review feedback against code, requirements, and conventions before applying it.
- Observe a focused failure first for reported regressions or high-risk business behavior when a stable seam exists. Otherwise implement with focused tests or the smallest meaningful compile, lint, integration, or behavioral check; do not create ceremonial tests.
- Before completion, run fresh scope-appropriate verification; remove diagnostics and report gaps. Reconcile authoritative docs without rewriting requirements; update project instructions only for durable rules.
- Do not commit, push, merge, publish, create issues, install dependencies, or change global configuration without user authorization.
