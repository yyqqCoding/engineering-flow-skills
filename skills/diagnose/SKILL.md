---
name: diagnose
description: Diagnose a reported bug, failing test, regression, intermittent fault, incorrect output, or measured slowdown.
disable-model-invocation: true
---

# Diagnose

Find the supported root cause of broken existing behavior. Diagnosis is read-only unless the user also asked for a fix.

## 1. Pin the symptom and signal

- State expected versus actual behavior.
- Read applicable instructions/docs and the relevant implementation, tests, callers, and recent changes.
- Build the fastest practical signal for the exact symptom: focused test, command/request, replay, minimal harness, stress loop, or performance measurement.
- Tighten it for speed, determinism, and unattended execution.

Inspect once and reuse the evidence. Do not repeat unchanged searches, reproductions, or commands for narration or final-report formatting. If automated reproduction is impractical, report what was attempted and calibrate confidence.

## 2. Minimize and locate ownership

- Observe the failure before committing to a cause.
- Remove inputs, steps, dependencies, and callers while preserving it.
- Follow data and control flow across boundaries; inspect sibling entry points.
- Locate the module that owns the violated invariant.
- Test a small ranked set of falsifiable hypotheses, one distinguishing observation at a time.

## 3. Fix only when requested

- Turn the minimized reproduction into a regression test when a correct public seam exists and observe red before the fix.
- Apply the smallest clear change at the owning boundary.
- Observe focused green and verify affected sibling callers.
- When no correct regression seam exists, report the limitation instead of adding a misleading test.

Run each signal only when its result can have changed: red before the fix, focused green after it, and one broader check when scope warrants it.

## 4. Harden around the root cause

- For a boundary defect, add only adjacent cases that prevent the same class of regression: below/at/above, before/at/after, first/duplicate/concurrent, or allowed/denied as applicable.
- Derive expectations from requirements; do not invent product behavior.
- Improve the owning design only when the root cause demonstrates scattered rules, hidden effects, repeated variation, distributed state transitions, or an unstable dependency.
- Do not turn a focused fix into a broad redesign or apply a pattern without pressure.

## 5. Complete

- Remove temporary diagnostics.
- Verify the regression signal, original symptom, relevant siblings, and one warranted broader check without rerunning unchanged evidence.
- Reconcile affected acceptance behavior and authoritative documentation; update project instructions only for durable rules.
- Report root cause, evidence, authorized fix, hardening performed, and remaining uncertainty.
