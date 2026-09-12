---
name: review
description: Review a diff, branch, pull request, or work-in-progress change without applying fixes.
disable-model-invocation: true
argument-hint: "[fixed-point]"
---

# Review

Perform an evidence-backed, read-only review. Do not edit files, commit, or push during review.

## Fix the scope and recover intent

- Use the supplied comparison point. For a branch, resolve its merge base and inspect commits plus the three-dot diff. For uncommitted work, inspect staged, unstaged, and relevant untracked files against `HEAD`.
- Fail clearly on a bad reference or empty scope instead of reviewing another change.
- Read the user's request, project instructions, originating requirements/design, and relevant tests and documentation. Without a specification, state the limit on assessing requirement fidelity.

## Check and report

- Compare accepted behavior with the diff for missing, partial, incorrect, or unrequested behavior. Trace credible failure conditions through affected callers, state, permissions, trust, data integrity, compatibility, and accessibility.
- Apply repository engineering standards to ownership, semantic reuse, explicit effects, abstraction cost, and dependencies. Check whether tests detect the protected behavior and whether documentation still describes the accepted requirement. Include unrelated edits and temporary artifacts in the scope check.
- Report substantive findings by impact, with severity, precise location, triggering conditions or evidence, and the consequence. Give a correction direction when supported. Skip tooling-enforced style and subjective alternatives without a concrete impact.
- If no material findings exist, say so and identify verification gaps. Internal review dimensions do not require separate output sections.

A later explicit request to fix selected findings grants authority for that scope. Verify the findings against the original requirements, then carry the authorized repair through verification without requiring another workflow token. With a stable public seam, observe the focused regression test fail before editing production behavior. Preserve any existing task approval gate; align unresolved product decisions or added scope before implementing them. Findings alone never authorize repair.
