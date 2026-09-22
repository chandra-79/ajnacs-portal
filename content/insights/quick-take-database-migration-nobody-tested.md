---
title: "The Database Migration Nobody Tests: Why They Fail at the Worst Time"
description: "Database migrations fail in production because they were tested on a small development dataset, not on production data volumes. The gap between the two is where most migration incidents live."
date: 2028-09-04
tags: ["Data Engineering", "Engineering Leadership"]
format: article
---

The database migration was tested in development. It ran in 45 seconds. It was tested in staging. It ran in 2 minutes. The window was booked for 30 minutes. Production deployment begins.

Three hours later, the migration is still running. The application is unavailable. The rollback, which was also not tested against production-scale data, fails.

This scenario is not unusual. It is one of the most common categories of self-inflicted production incidents.

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

**Time the forward migration and prepare the rollback.** If the forward migration takes 45 minutes on production-size data, the window needs to be at least 2 hours, and the rollback needs to have been timed independently.

The 30-minute window booked for a migration that takes 3 hours is not bad luck. It is a testing gap.
