# Customer Export Design

## Accepted behavior

Exports include active and disabled customers so operations can audit every account.

## Final implementation facts

`exportCustomers` currently returns one row for every supplied customer.
