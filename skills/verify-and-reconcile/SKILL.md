---
name: verify-and-reconcile
description: Audit complex completion evidence and reconcile authoritative documentation and durable project instructions.
disable-model-invocation: true
---

# Verify and Reconcile

Use for changes whose completion needs more than the Core's focused fresh-verification rule.

## 1. Inventory

- Inspect version-control status and the complete relevant diff.
- Separate task changes from unrelated pre-existing work.
- Re-read accepted requirements and authoritative docs.
- List the acceptance behaviors and material risks that require evidence.

## 2. Verify

Select the smallest fresh commands that cover the changed behavior: focused tests, compilation/type checking, changed-file linting, integration or interface checks, migration checks, and risk-specific security/data/concurrency/performance evidence. Do not rely on earlier output or unsupported claims.

For a regression test, confirm sensitivity when practical by removing/reverting the fix or mutating the relevant behavior and observing the test fail, then restore and rerun it.

## 3. Reconcile behavior

For each accepted behavior, record:

- Implemented and verified
- Implemented but not fully verified, with reason
- Incomplete or deviated

Do not convert an implementation deviation into a new requirement without explicit user confirmation.

## 4. Reconcile docs and durable instructions

- Update the existing authoritative document only for confirmed changed behavior or decisions; remove or mark stale alternatives without creating a second documentation system.
- Preserve the distinction between accepted behavior and implementation notes.
- Change `AGENTS.md`, `CLAUDE.md`, or equivalent only for a stable cross-task rule, recurring failure, authoritative command, or safety boundary. Task-specific facts and one-off lessons do not qualify.

If no durable rule exists, leave project instructions unchanged and say so.

## 5. Clean up and report

- Remove temporary logs, probes, test artifacts, generated files, and debug-only code.
- Confirm no unauthorized commit, push, publish, dependency install, or global configuration change occurred.
- Report outcome, exact commands and results, documentation changes, instruction-file decision, and remaining risks or unverified areas.

Completion claims must match the evidence.
