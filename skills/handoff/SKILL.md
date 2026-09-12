---
name: handoff
description: Create a compact continuation record for another session or agent.
disable-model-invocation: true
argument-hint: "[output-path]"
---

# Handoff

Export the minimum true state needed to continue the source task. A handoff records existing authority; it does not grant implementation permission or erase a pending checkpoint.

Check version-control status and the relevant diff, authoritative documents, and the latest verification output. Separate current facts from unverified assumptions.

Capture these facts compactly, grouping them as useful:

- **Task and state:** objective, accepted behavior, source workflow and phase, and what is approved or still awaiting approval. Preserve unknown authority as unknown.
- **Work and evidence:** current implementation, key files and authoritative documents, commands run and their latest results.
- **Decisions:** settled decisions and their reasons; references support these facts rather than replace them.
- **Continuation:** remaining work in dependency order, risks, blockers, unresolved decisions, unverified areas, and version-control state including unrelated changes to preserve.

Before returning, check that these facts are explicit. State `None` for empty blockers, unresolved decisions, or unrelated changes. Link existing documents, commits, diffs, and test output without copying their full contents. The next action must respect the recorded phase and approval boundary.

Write to the requested path when provided. Otherwise return the record in the response without silently creating a repository file.
