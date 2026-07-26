# Customer Export Design

## Goal

Allow support staff to export up to 50,000 active customers as CSV.

## Execution

`POST /exports` returns the complete CSV response synchronously within two seconds.

The request creates an asynchronous export job. A worker uploads the CSV to object storage and the client polls `GET /exports/{id}` until completion.

## Permissions

Any authenticated user may create and download exports.

Only support administrators may access customer export data.

## Failure behavior

Failed jobs may be retried.

## Open details

Retention, duplicate requests, cancellation, partial failure, and audit requirements are not yet defined.
