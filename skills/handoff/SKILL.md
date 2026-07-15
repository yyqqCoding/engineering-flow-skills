---
name: handoff
description: Create a compact continuation record for another session or agent.
disable-model-invocation: true
argument-hint: "[output-path]"
---

# Handoff

Capture the minimum durable state another session needs to continue safely.

## Gather current facts

- Re-read version-control status and relevant diff.
- Read the authoritative requirement/design documents.
- Check the latest verification output rather than relying on memory.
- Identify blockers, unresolved decisions, and unrelated work that must be preserved.

## Produce the handoff

Include:

- Objective and accepted behavior
- Current implementation state
- Key files and authoritative documents
- Decisions already made and their reasons
- Commands run and their latest results
- Remaining tasks in dependency order
- Known risks, blockers, and unverified areas
- Version-control state and unrelated changes to preserve

Reference existing documents, commits, diffs, and test output instead of copying their full contents.

Write to the requested path when one is provided. Otherwise return the handoff in the response without creating a repository file silently.
