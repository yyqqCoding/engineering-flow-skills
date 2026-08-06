---
name: diagnose
description: Diagnose a reported bug, failing test, regression, intermittent fault, incorrect output, or measured slowdown.
disable-model-invocation: true
---

# Diagnose

Own the broken behavior as one task across reproduction, root-cause correction, authorized repair, and regression verification. Follow-up evidence and same-task requests remain in Diagnose without another invocation. Diagnosis is read-only until the initial request or a later message clearly authorizes a fix.

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

If the user rejects the diagnosis, remain read-only, discard the rejected cause as a conclusion, and test new distinguishing evidence. Do not require another Diagnose invocation.

## 3. Repair when authorized

An initial request to fix the defect grants repair authority. Otherwise present the supported root cause, evidence, repair boundary, and remaining uncertainty, then pause. A later same-task instruction such as "fix it" or "you can repair it now" grants authority without a Develop invocation.

- Turn the minimized reproduction into a regression test when a correct public seam exists. After repair authority, the first write must change only the regression test; run that focused test immediately, observe red before the fix, and retain its non-zero failing result. Do not write production code until this red result has been observed. Earlier diagnostic probes, a passing pre-existing suite, or a failed preferred editing tool do not replace or bypass this gate.
- Apply the smallest clear change at the owning boundary.
- Observe focused green and verify affected sibling callers.
- When no correct regression seam exists, report the limitation instead of adding a misleading test.
- Reuse only identical domain behavior that should evolve together; avoid speculative abstractions and keep effects, state, and failures explicit.
- Preserve validation, permissions, security, data integrity, compatibility, accessibility, and unrelated work.

Run each signal only when its result can have changed: red before the fix, focused green after it, and one broader check when scope warrants it.

If repair requires undefined product behavior or materially expands scope, align that increment, present an approval checkpoint, and pause before implementing it. Reversible repair details supported by the repository do not require user selection.

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
- If the user later identifies an omitted part of the same defect, reopen repair and verification without repeating the full diagnosis or approval. Explicit cancellation, a workflow switch, or an unrelated new task ends Diagnose inheritance.
