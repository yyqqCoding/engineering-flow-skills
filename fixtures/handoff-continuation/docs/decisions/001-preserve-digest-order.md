# Decision 001: Filter Without Reordering

## Decision

Map `low`, `medium`, and `high` to numeric ranks only for the inclusion comparison. Do not sort by those ranks; preserve the input order of every included event.

## Reason

Support operators read the digest as an incident timeline. Severity sorting would make related symptoms appear out of sequence and would silently change the established chronological meaning of the API.

## Rejected alternative

Sorting high-severity events first was rejected because presentation priority does not outweigh the timeline contract. A separately named prioritized report can be designed later if that behavior is needed.
