---
name: diagnose
description: Diagnose a bug, failing test, regression, intermittent fault, incorrect output, or measured slowdown.
disable-model-invocation: true
---

# Diagnose

Own one defect through diagnosis, authorized repair, and verification. Same-task evidence, objections, and repair requests stay in Diagnose until cancellation, a workflow switch, or unrelated work.

Diagnosis is read-only unless the initial request or a later message clearly authorizes a fix.

## Establish evidence and cause

- State expected versus actual behavior from requirements and repository facts. Inspect the relevant implementation, tests, callers, and changes.
- Establish the fastest reliable signal for the exact symptom: a focused test or command, request replay, minimal harness, stress loop, or performance measurement. Record relevant inputs, environment, frequency, and evidence limits.
- Trace the failing boundary to the owner of the violated rule. Compare falsifiable hypotheses with distinguishing observations; separate the trigger, cause, and symptom. Inspect related callers and boundaries when the evidence implicates them.
- If the symptom cannot be reproduced or established, remain read-only and report that no cause is supported. If the user rejects the diagnosis, discard that conclusion, remain read-only, and gather new evidence within the same task.

## Repair within authority

An initial request to fix grants repair authority. Otherwise report the supported cause, evidence, repair boundary, and uncertainty, then pause. Later same-task action language such as “fix it” authorizes repair without a Develop invocation.

- With a stable public regression seam, turn the reproduction into a test and observe its failure before editing production behavior. Retain the failing result; diagnostic probes or passing pre-existing tests do not replace this gate.
- Apply the smallest clear fix at the owning boundary, preserve Core's safety and compatibility rules, and observe the regression pass. Without a correct automated seam, use the strongest relevant signal and report the limitation.
- Verify the original symptom and affected callers. Add adjacent boundary coverage only when its expected behavior is established and it prevents the same class of defect. Improve design only where structure contributed to the cause.
- Rerun checks when their result may have changed and broaden them when scope warrants it. Remove temporary diagnostics, reconcile affected documentation, and report cause, evidence, fix, retained protection, and remaining gaps.

Undefined product behavior or materially expanded scope needs an incremental alignment checkpoint before implementation. Using another engineering technique does not change this task's authority. An omitted part of the same accepted defect reopens repair and verification directly.
