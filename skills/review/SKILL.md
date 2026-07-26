---
name: review
description: Review a diff, branch, pull request, or work-in-progress change without applying fixes.
disable-model-invocation: true
argument-hint: "[fixed-point]"
---

# Review

Perform an evidence-backed, read-only review. Do not edit files, commit, or push.

## 1. Define the comparison

- Use the supplied fixed point when present.
- For a branch comparison, resolve the merge base and inspect commits plus the three-dot diff.
- For current uncommitted work, inspect staged, unstaged, and relevant untracked files against `HEAD`.
- Fail clearly on a bad reference or empty scope instead of reviewing the wrong change.

## 2. Recover intent

Read, in priority order:

- The user's current review request
- Project instructions
- The originating requirement, issue, design, or acceptance criteria
- Relevant tests and documentation

If no specification exists, state that the review can assess correctness risks and maintainability but not complete requirement fidelity.

## 3. Review independent axes

- **Requirements:** missing, partial, incorrect, or unrequested behavior
- **Correctness:** edge cases, failure handling, concurrency, state, and call-site impact
- **Safety:** permissions, trust boundaries, data integrity, destructive effects, compatibility, and accessibility
- **Design:** ownership, semantic reuse, false deduplication, abstraction cost, and unnecessary dependencies
- **Readability:** explicit flow/effects, meaningful names, local reasoning, debuggability, and unjustified novelty
- **Tests:** whether tests exercise stable public behavior and can detect the defect
- **Documentation:** stale or contradictory facts and requirements rewritten to fit implementation
- **Scope:** unrelated edits, temporary diagnostics, generated artifacts, and unauthorized operations

Apply the `code-design` pressure, ownership, and abstraction-cost standards when needed. Do not flag preferences already enforced by tooling or purely subjective alternatives with no maintenance impact.

## 4. Report findings

Order by impact. Each finding includes:

- Severity
- File and precise location
- Evidence from the diff and relevant requirement or invariant
- User-visible or maintenance impact
- Smallest credible correction direction

Do not hide important findings inside a summary. If no material findings exist, say so and note any verification gap.
