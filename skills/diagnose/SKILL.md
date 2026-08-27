---
name: diagnose
description: Diagnose a bug, failing test, regression, intermittent fault, incorrect output, or measured slowdown.
disable-model-invocation: true
---

# Diagnose

Own one defect across reproduction, root-cause analysis, authorized repair, and regression verification. Same-task evidence, objections, and repair requests remain in Diagnose until cancellation, a workflow switch, or unrelated work.

Diagnosis is read-only unless the initial request or a later message clearly authorizes a fix.

## 1. Establish the symptom and signal

- State expected versus actual behavior.
- Read applicable instructions and requirements, then inspect the relevant implementation, tests, callers, and recent changes.
- Build the fastest reliable signal for the exact symptom: a focused command or test, request replay, minimal harness, stress loop, or performance measurement.
- Record inputs, environment, frequency, and evidence limits. If the symptom cannot be reproduced or established, remain read-only and report that no root cause is yet supported.

## 2. Locate the root cause

- Trace from the failing boundary toward the module that owns the violated invariant.
- Rank a small set of falsifiable hypotheses and test one distinguishing observation at a time. Separate the trigger, root cause, and resulting symptom.
- Check affected sibling callers, state transitions, permissions, external effects, time/order behavior, and compatibility only when relevant.

If the user rejects the diagnosis, discard the rejected cause as a conclusion, stay read-only, and gather new distinguishing evidence without requiring another Diagnose invocation.

## 3. Repair when authorized

An initial request to fix the defect grants repair authority. Otherwise present the supported cause, evidence, repair boundary, and remaining uncertainty, then pause. Later same-task action language such as “fix it” grants authority without a Develop invocation.

- When a correct stable public seam exists, turn the minimized reproduction into a regression test. The first repair write changes only that test; run it immediately, observe red before the fix, and retain its non-zero result before editing production code. Diagnostic probes and passing pre-existing tests do not replace this gate.
- Apply the smallest clear fix at the owning boundary, then observe focused green and verify affected sibling callers.
- When no correct automated seam exists, report the limitation instead of adding a misleading test.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work. Avoid speculative abstraction and broad redesign.

Run each signal only when its result can have changed: red before the fix, focused green after it, and one broader check when scope warrants it.

If repair requires undefined product behavior or materially expands scope, align only that increment and pause at an approval checkpoint before implementing it.

## 4. Harden and complete

- For a boundary defect, add only adjacent cases that prevent the same class of regression: below/at/above, before/at/after, first/duplicate/concurrent, or allowed/denied when applicable. Derive expectations from accepted requirements or authoritative precedent.
- Improve the owning design only when the cause demonstrates scattered rules, hidden effects, repeated variation, distributed state transitions, or an unstable dependency.
- Remove temporary logs, probes, fixtures, and debug-only artifacts.
- Verify the regression signal, original symptom, relevant siblings, and one warranted broader check. Reconcile affected acceptance behavior and authoritative documentation.
- Report the cause, supporting evidence, authorized fix, retained regression protection, and remaining uncertainty.

A later report of an omitted part of the same defect reopens repair and verification directly.
