---
title: "The Database Migration Nobody Tests: Why They Fail at the Worst Time"
description: "Test migration volume, locking and partial failure with a documented fixture, and distinguish rollback from forward recovery."
date: 2028-09-04
tags: ["Data Engineering", "Engineering Leadership"]
format: article
---

The database migration was tested in development. It ran in 45 seconds. It was tested in staging. It ran in 2 minutes. The window was booked for 30 minutes. Production deployment begins.

Three hours later, the migration is still running. The application is unavailable. The rollback, which was also not tested against production-scale data, fails.

This hypothetical scenario illustrates a test-coverage gap; it does not establish the frequency of migration incidents.

## Why development testing fails to predict production behavior

Database migrations touch data. The behavior of a migration at production scale is not predictable from its behavior at development scale unless you explicitly model the relationship.

An `ALTER TABLE` that adds a column to a 50,000-row table takes milliseconds. The same operation on a 500-million-row table acquires a table lock and blocks all reads and writes for the duration. The duration, on a cloud database instance, can be hours.

An index creation that is instantaneous in development takes 2 hours on a production table with appropriate disk I/O constraints and concurrent write load.

A `DELETE` that removes 1,000 rows runs without incident. A `DELETE` that removes 300 million rows fills the transaction log, causes InnoDB buffer pool thrashing, and can take the database instance to its knees.

## The failure modes

**Lock contention.** Schema changes that acquire table locks on large tables block application reads and writes for the lock duration. In MySQL (MyISAM), this is essentially any DDL operation. In PostgreSQL and modern MySQL (InnoDB with `algorithm=inplace`), many operations are online — but not all.

**Transaction log overflow.** Large data modifications in a single transaction generate large transaction log entries. The transaction log has finite size. Exceeding it causes the migration to fail after hours of runtime with nothing committed.

**Replication lag.** On databases with read replicas, large schema changes cause significant replication lag, making read replicas temporarily stale or unavailable.

**Rollback unavailability.** If the rollback was not tested at production scale, it carries the same risk as the forward migration.

## What to do instead

**Test migrations against a production-size dataset.** A recent production snapshot, restored to a migration test environment, with representative table sizes and index sizes, is the only reliable predictor of production migration behavior.

**Use online schema change tools.** pt-online-schema-change (Percona Toolkit), gh-ost, or PostgreSQL's built-in online DDL support avoid full table locks by building the new table structure in the background and swapping atomically at the end.

**Batch large data modifications.** Any migration that modifies more than 10,000 rows should be batched — process rows in chunks with delays between batches to allow other operations to proceed.

**Time the forward migration and prepare the rollback.** If the forward migration takes 45 minutes on production-size data, the window needs to cover measured execution, validation, uncertainty and recovery time, and the rollback needs to have been timed independently.

The 30-minute window booked for a migration that takes 3 hours is not bad luck. It is a testing gap.

## Test the wait, not just the statement duration

A migration can spend most of its elapsed time waiting for a conflicting transaction. A fast statement in an empty database can still create a disruptive lock queue in production. Measure lock acquisition, execution and validation separately in a realistic rehearsal.

Consider a fictional rehearsal with 90 seconds waiting for a lock, 30 seconds executing the schema operation and 120 seconds validating application behavior. Total elapsed time is 240 seconds. Reporting only the 30-second execution hides most of the maintenance window. The figure makes these components visible without implying that their values predict another database's behavior.

## Create a deliberate blocker in an isolated test

Use a nonproduction database with representative schema, data volume and statistics. Start a transaction that holds the relevant lock, then run the migration under the proposed timeout settings. Observe whether it waits, fails or blocks later application work. Record the lock relationship and the timeout result. Do not discover this behavior by experimenting on a busy production database.

Repeat without the blocker and with the expected concurrent application traffic. Include the previous and proposed application versions during the compatibility window. A new constraint can be valid for current data while rejecting writes from an old worker that remains deployed. A rollback plan needs to account for those older writers, not only the web application release.

## Rehearse restart and recovery

For a backfill, interrupt after a known range and restart it. Confirm that repeated batches are safe, progress is durable and concurrent application updates follow an explicit precedence rule. Use stable keys rather than offset pagination when updates can change the ordering or membership of the scanned population.

For a destructive cleanup, identify the last point at which application rollback remains sufficient. Once an old column is removed or values are transformed irreversibly, recovery may require a backup or a forward repair. Time the relevant restore procedure in isolation and verify business data, not just database startup. State which writes could be lost or need reconciliation under that recovery path.

## Define a stop decision before the change

Set thresholds for lock waiting, replication lag, error rate and workload impact appropriate to the service. Name the person who can stop the migration and the action that follows. A stopped migration should leave an understood state with a documented next step. Repeatedly retrying a timed-out operation without investigating its blocker can extend the disruption.

A useful rehearsal report records the schema and application versions, fixture scale, concurrency, statement options, timings, observed failures and repair results. It should also state where the fixture differs from production. The goal is to expose assumptions while changes are still cheap, not to certify that a database operation can never fail.

### Figure methodology

Synthetic rehearsal components total 240 seconds. Lock waiting, execution and validation are separate observations. This is not a recommended maintenance-window multiplier; real scheduling needs representative repetitions and recovery timing.

| Worked observation | seconds |
| --- | ---: |
| Lock wait | 90 |
| Schema execution | 30 |
| Validation | 120 |

## Primary references and further study

- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL backup and recovery](https://www.postgresql.org/docs/current/backup.html)
