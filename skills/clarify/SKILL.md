---
name: clarify
description: Resolve material requirement ambiguities and produce a concise implementation-ready brief without coding.
disable-model-invocation: true
---

# Clarify Requirements

Turn an idea, request, or existing design discussion into an implementation-ready behavioral agreement. Do not implement the change in this invocation.

## 1. Read before asking

- Read applicable project instructions and relevant design documents.
- Inspect existing behavior, interfaces, data structures, permissions, and tests when they can answer questions.
- Identify the authoritative document instead of creating a parallel source of truth.

## 2. Build an ambiguity map

Check only dimensions that can change the product result:

- Actors and permissions
- User-visible success behavior
- Empty, duplicate, partial, concurrent, and failure cases
- Data meaning, lifecycle, retention, and deletion
- Compatibility and migration
- Security and trust boundaries
- External-system behavior
- Acceptance criteria and out of scope

Separate:

- **Blocking decisions**: require the user.
- **Repository facts**: discover them locally.
- **Reversible implementation choices**: leave them to implementation.

## 3. Ask efficiently

- Ask independent blocking questions together when that saves unnecessary turns.
- Ask dependent questions in decision order.
- Recommend an answer when repository evidence supports one.
- Do not ask the user to design internal classes, methods, or patterns.
- Continue until no material branch remains unresolved, not until every imaginable detail is specified.

## 4. Produce the brief

Return:

- Goal
- Confirmed acceptance behavior
- Constraints and permissions
- Failure and edge behavior
- Out of scope
- Resolved decisions
- Remaining blockers, if any

If an authoritative design document exists and the user requested documentation maintenance, update only the confirmed facts and decisions. Otherwise present the brief without creating a new document silently.
