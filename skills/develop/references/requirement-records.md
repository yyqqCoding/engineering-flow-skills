# Fallback requirement records

Read this reference only when a substantial Develop task has no applicable project documentation convention and uses `docs/requirements/<feature-slug>.md`, or when such a record must be resumed or completed.

## Draft and checkpoint

Write the record as timeless constraints, never as work deferred until approval. Include:

- `Status: Draft`
- Goal
- Acceptance behavior
- Out of scope
- Assumptions
- Solution boundary
- `## Test Contract` for non-mechanical behavior: acceptance-linked verification intent, distinguishing examples where useful, and the public boundaries/evidence that protect it. Consider applicable functional behavior, interactions, and established boundaries; separate category headings are optional.
- `## Completion evidence`
- `Implementation files: Pending`
- `Test files: Pending`
- `Verification: Pending`
- `Deviations: None known`
- `Ready validator: <command>`

Resolve `../scripts/validate-requirement-record.js` from the Develop skill directory. Persist its exact code-spanned finalization command in `Ready validator`, including `--record <repository-relative-record-path> --mode ready --finalize`, so a fresh context can complete the record without the earlier transcript.

Run the validator with `--mode draft` before presenting the checkpoint. Draft and ordinary ready validation are read-only and report all failed conditions together.

## Accepted and fresh-context recovery

After post-checkpoint action approval, set the record to `Accepted`. A fresh context that finds an Accepted record resumes implementation; it does not restart alignment or request approval again.

Keep the persisted finalization command installation-specific while the record is Accepted. Treat Goal, Acceptance behavior, Out of scope, Assumptions, and Solution boundary as authoritative constraints.

## Completion and finalization

Treat `Implemented` as the final record write:

1. Inspect the actual diff and fresh verification output while the record remains `Accepted`.
2. Replace every completion-evidence `Pending` value with exact implementation paths, exact test paths or `None` when no test file changed, the complete canonical verification command and passing result, and confirmed deviations. Never invent a test path to satisfy finalization.
3. Reconcile acceptance behavior and solution boundaries with those facts. Remove stale prospective wording such as `will`, `planned`, `to be added`, or `after approval`.
4. Execute the exact persisted `Ready validator` command. Pass every pre-existing unrelated changed path with a repeated `--ignore <path>` so validation covers only this task.

The `--finalize` operation validates the complete Accepted record before atomically writing `Status: Implemented`; it writes nothing on failure and rejects repeated finalization. On success it replaces the machine-specific command with stable evidence:

`Ready validator: \`validate-requirement-record.js --mode ready\` — passed`

Use the repository's canonical verification command for the changed package or fixture. Record it exactly as executed, including every argument. For the default Node fixture convention this is `npm test`; for other stacks use the established repository command.
