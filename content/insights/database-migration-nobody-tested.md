---
title: "Rehearse Database Migrations Against Realistic Concurrency"
description: "Rehearse schema changes with representative scale and concurrency, observe lock behavior, and verify the recovery procedure."
date: 2029-07-18
tags: ["Data Engineering", "Engineering Leadership"]
format: note
derived: true
---

A hypothetical migration failure can begin this way: the migration worked perfectly in every environment that was not production. Development databases are small, have uniform data, and lack the index cardinality and row distribution that drives migration performance at scale. Staging databases are production architecture with test data that doesn't reflect production data shapes.

The specific failure mode that repeats: an ALTER TABLE statement that acquired a table lock in 0.3 seconds in staging held an exclusive lock for eleven minutes in production while it rewrote an 800GB table. During those eleven minutes, every write to that table queued. The queue depth exceeded connection pool limits. The application returned errors. The on-call engineer was paged at 11:47pm on a Friday.

In this scenario, the rollback procedure has been written but not rehearsed, and a syntax error prevents it from running.

Structural practices that prevent this: test migration performance on a production-scale data clone before release, not a scaled-down version. Measure lock acquisition and duration in the test environment. Validate rollback procedures by running them — not by reading them. For large table modifications, prefer online schema change tools (pt-online-schema-change, gh-ost) that avoid full table locks entirely.

The organizational practice that matters as much: create a channel for the engineer who knows a migration is risky to make that concern loud enough to delay a release. Most migration disasters had a person who had doubts and said nothing because the release was scheduled.

## Rehearse the compatibility window

A migration can be logically correct and operationally disruptive. Adding a column, creating an index or validating a constraint can interact with lock queues, replication and transactions already in flight. Testing a schema on an empty developer database establishes syntax; it does not establish safe rollout behavior.

Consider an illustrative backfill of 12 million rows. A rehearsal processes 500 rows per batch. At 250 batches per minute it completes 125,000 rows per minute, so the arithmetic lower bound is 96 minutes. Reducing the throttle to 125 batches per minute doubles that estimate to 192 minutes. These are modeled durations at sustained rates, not promised deployment windows. The rehearsal must also record pauses, retries, concurrent writes and replica catch-up.

## Separate reversible deployment from irreversible cleanup

First introduce a representation that old and new application versions can both tolerate. Deploy readers that understand both states before requiring the new state. Backfill through a resumable key range with explicit progress and repeat-safe writes. Compare counts and representative values while the old representation remains available. Only later remove the compatibility path after confirming that old application instances, jobs and external consumers no longer depend on it.

Test a deliberately interrupted batch. Restart from the stored checkpoint and confirm that completed rows do not acquire a second side effect. Then run old and new application versions concurrently against the test database. Include an operation that updates a row while the backfill reaches it. Decide which value should win and prove the implementation follows that rule.

Set lock and statement timeouts deliberately for the migration procedure and inspect the wait behavior in the target engine. A timeout is a stop signal; blindly retrying in a tight loop can prolong contention. Keep the application rollback and the data repair plan distinct. Reverting application code does not automatically undo a partially completed data transformation.

### Figure methodology

Synthetic 12-million-row backfill with 500 rows per batch. Duration = rows/(batch size × batches per minute). Excludes pauses, validation, retries and replica catch-up; use measured rehearsal distributions for scheduling.

| Worked observation | minutes |
| --- | ---: |
| 250 batches/minute | 96 |
| 125 batches/minute | 192 |

## Primary references and further study

- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL backup and recovery](https://www.postgresql.org/docs/current/backup.html)
