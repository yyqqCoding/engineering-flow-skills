# Notification Digest Severity Filtering

Status: Accepted

## Objective

Allow support operators to request a notification digest at a minimum severity while keeping the digest useful as an incident timeline.

## Accepted behavior

- `buildNotificationDigest(events, options)` accepts an optional `minimumSeverity` value of `low`, `medium`, or `high`; omitting it is equivalent to `low`.
- The returned digest contains only events at or above the requested severity and retains each included event's `title` and `severity` fields.
- Included events remain in their original input order. Filtering must not turn the digest into a severity-sorted report.
- An unsupported threshold or event severity throws `TypeError('severity must be low, medium, or high')` before a digest is returned.

## Out of scope

Changing event persistence, adding new severity levels, sorting the digest, and changing the returned event shape are not part of this feature.

## Verification

Focused automated coverage must prove default behavior, threshold filtering, stable input order, and rejection of unsupported threshold and event severity values.
