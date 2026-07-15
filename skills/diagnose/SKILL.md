---
name: diagnose
description: Diagnose a reported bug, failing test, regression, intermittent fault, incorrect output, or measured slowdown.
disable-model-invocation: true
---

# Diagnose

Find the supported root cause of broken or degraded existing behavior. Diagnosis is read-only unless the user also asked for a fix.

## 1. Pin the symptom and signal

- State the expected and actual behavior.
- Read project instructions, relevant docs, implementation, recent changes, and existing tests.
- Distinguish the reported symptom from nearby failures.
- Build the fastest practical signal that can detect that exact symptom: a focused test, command/request, captured replay, minimal harness, repeated stress loop, or performance measurement.
- Tighten the signal for speed, determinism, and unattended execution.

If no automated reproduction is practical, record what was attempted and what evidence is missing. Continue only with calibrated confidence; do not invent certainty.

## 2. Reproduce, minimize, and locate ownership

- Observe the failure.
- Remove inputs, steps, dependencies, and callers one at a time while preserving it.
- Follow data and control flow across boundaries.
- Search relevant callers and sibling entry points.
- Locate the module that owns the violated invariant.
- Check whether the named entry point is only one symptom of a shared rule.

## 3. Test hypotheses

Create a small ranked set of falsifiable hypotheses. For each, name the observation that would distinguish it. Change one variable or add one targeted probe at a time. Prefer debuggers and boundary instrumentation over broad logging.

## 4. Fix only when requested

When the user asked for a fix:

- Turn the minimized reproduction into a regression test when a correct public seam exists.
- Observe it fail before the fix.
- Apply the smallest clear change at the owning boundary.
- Observe the regression test and original reproduction pass.
- Check sibling callers affected by the shared rule.

When no correct regression seam exists, document that architectural limitation rather than adding a misleading test.

## 5. Clean up and complete

- Remove temporary logs, probes, fixtures, and debug-only code.
- Run fresh focused verification and report the root cause, evidence, fix if authorized, and remaining uncertainty.
- Use `verify-and-reconcile` only when the change also affects multiple acceptance criteria, authoritative documentation, migrations, permissions/data risk, or durable project instructions.
