---
title: "Database Migration Strategies: Moving Production Data Without Downtime"
description: "Zero-downtime database migrations are possible but require discipline — dual-write patterns, schema compatibility phases, and a rollback plan that you've actually tested. Here's what works at production scale."
date: 2025-07-01
tags: ["Data Engineering", "Cloud Architecture", "Engineering Leadership"]
format: article
---

The migration that causes an outage is usually not the one that failed — it's the one that succeeded but not in the way anyone expected. A column renamed. A constraint applied. A backfill that took six hours instead of forty minutes.

Zero-downtime database migrations are achievable, but they require treating schema changes and data movement as distinct operations with distinct risk profiles.

## What to measure

**Reconciliation rate at a known replication lag.** If 999,950 of 1,000,000 source records match a target snapshot at the same logical cut, the mismatch count is 50. Investigate by key and reason before switching writes. Track replication lag and rehearse what happens to new writes during rollback.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## The core principle: schema changes must be backward compatible

The fundamental constraint: at any point during a deployment, both the old version of the application and the new version must be able to read and write the database correctly. This rules out a large category of apparently simple changes:

- Renaming a column breaks the old version immediately
- Adding a NOT NULL column without a default breaks any insert from the old version
- Dropping a column that the old version still reads causes errors
- Changing a column type without a compatibility guarantee breaks queries

The solution is to decompose "rename a column" into a sequence of backward-compatible steps:

1. Add the new column (nullable, old version ignores it)
2. Deploy code that writes to both old and new columns
3. Backfill the new column from the old column
4. Deploy code that reads from the new column, writes to both
5. Verify the new column is complete and correct
6. Deploy code that only uses the new column
7. Drop the old column (now unreferenced)

This takes multiple deployments because two representations coexist while readers and writers migrate. The approach reduces avoidable incompatibility. Rehearse lock acquisition, resource headroom, and recovery before promising uninterrupted operation.

## The expand/contract pattern

The formalization of this approach is called expand/contract (also called parallel change):

**Expand phase**: add new structure alongside old structure. New columns, new tables, new relationships. Old code continues to work. New code can optionally use the new structure.

**Migrate phase**: backfill data, run dual-writes, verify correctness. The database contains both old and new representations simultaneously.

**Contract phase**: remove old structure once all code has migrated to the new representation and old structure is confirmed unused.

The contract phase is where most teams skip steps. Dropping a column that "nobody is using anymore" without confirming via query analysis or feature flags is how you get 3am incidents.

## Backfill strategy for large tables

Backfilling a column on a 50-million-row table with a single UPDATE statement will:
- Lock rows for the duration
- Generate a large amount of WAL/redo log
- Potentially cause replication lag
- Potentially trigger autovacuum contention on PostgreSQL

Use a runner that commits one bounded keyset batch at a time. A plain loop without a commit holds one transaction, even if it sleeps between updates. Start with a recorded high-water key. The example assumes an immutable positive integer key and a derived value that cannot be NULL. Bind the cursor, high-water key, and batch size from the client rather than interpolating text.

```sql
WITH batch AS (
    SELECT id FROM orders
    WHERE id > $1 AND id <= $2
    ORDER BY id LIMIT $3
), applied AS (
    UPDATE orders AS o
    SET new_column = derive_value(o.old_column)
    FROM batch
    WHERE o.id = batch.id AND o.new_column IS NULL
    RETURNING o.id
)
SELECT (SELECT MAX(id) FROM batch) AS through_id,
       (SELECT COUNT(*) FROM applied) AS updated;
```

Commit before advancing a durable checkpoint, and stop when the batch has no keys. A replay after a missed checkpoint is safe only if the update guard and writer contract still hold. Sleep between committed transactions. Test with production-like concurrent writes and monitor lock time, replica lag, and batch duration. Reconcile the backfill with rows touched after the high-water key and handle nullable target values with an explicit progress marker.

Track progress with a dedicated monitoring query:

```sql
SELECT
  COUNT(*) FILTER (WHERE new_column IS NOT NULL) AS migrated,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE new_column IS NOT NULL) / COUNT(*), 1) AS pct
FROM orders;
```

## Online schema change tools

MySQL tools can copy to a shadow table while the primary table remains live. [Percona’s pt-online-schema-change](https://docs.percona.com/percona-toolkit/pt-online-schema-change.html) uses triggers to capture concurrent changes. [GitHub’s gh-ost](https://github.com/github/gh-ost) streams changes from the binary log. Both copy existing data in bounded batches before cutover. A final table swap must acquire locks. Test lock acquisition, foreign keys, triggers, replication topology, throttling, and restart behavior before choosing either tool.

For PostgreSQL, `pglogical` replication or manual expand/contract is the standard approach. The `pg_repack` extension handles CLUSTER and VACUUM FULL equivalents online, but schema changes still require the manual pattern.

## Cross-database migrations

Moving data between database engines (Oracle to PostgreSQL, SQL Server to Aurora) adds complexity:

**Data type mapping**: Oracle's VARCHAR2, DATE, and NUMBER types don't map cleanly. NUMBER(10) might be INTEGER, BIGINT, or DECIMAL depending on context. DATE in Oracle includes time; in PostgreSQL it doesn't.

**Procedural code**: PL/SQL doesn't port directly to PL/pgSQL. Function signatures, exception handling, cursor patterns, and built-in functions all differ. This code requires manual rewrite and testing, not automated conversion.

**Sequence behavior**: Oracle sequences and PostgreSQL sequences behave differently around caching and session-level allocation. Applications that depend on sequence monotonicity need explicit attention.

The migration phases for cross-database moves:

1. **Schema conversion**: automated tools (AWS Schema Conversion Tool, ora2pg) handle the mechanical parts. Manual review handles the edge cases, which are numerous.
2. **Initial load**: bulk transfer of historical data, typically via CSV export/import or a dedicated ETL tool.
3. **CDC (Change Data Capture)**: ongoing replication of changes during cutover preparation. AWS DMS, Debezium, or Striim are common options.
4. **Cutover**: stop writes to source, verify CDC has caught up, redirect application connections to target, verify, open writes to target.

The cutover window is the exposure period from stopping source writes to verifying healthy writes on the target. Treat the duration as a workload-specific estimate. Include lag drain, lock acquisition, connection recycling, application verification, and timed abort points in a rehearsal at representative scale.

## Testing the rollback

The rollback plan that hasn't been tested is not a rollback plan. Before any significant migration, verify:

- The rollback procedure takes less than the defined RTO
- The rollback leaves data in a consistent state (dual-write helps here — the old table is still current)
- Someone has executed the rollback in a staging environment recently enough that it reflects the current schema state

The most common rollback failure mode: the rollback assumes the old schema still exists, but the contract phase already removed it.

*Working through a database migration with a tight cutover constraint? The sequencing of expand/contract phases is where most of the risk sits. [Happy to think through the specific trade-offs.](/contact/)*

## Define a migration unit that can be reconciled

Start with a bounded table, key range, or tenant cohort and document who can write to it during each step. For example, an order migration could leave payment state, customer records, and fulfillment in their established systems while moving only the order representation. Use immutable order identifiers to compare outcomes. State which fields permit a deliberate transformation, which fields must be equal, and which non-row outcomes must also agree. A notification or inventory reservation is an effect that row equality alone cannot prove. Include updates, deletions, changes arriving out of order, and records with no matching source object in the reconciliation design.

Define a consistent cut before comparing databases. A live scan of the source against a later scan of a target can report legitimate transactions as errors, or miss transactions that were skipped by both scans. Use a documented snapshot and a replay checkpoint supported by the mechanism in use. Compare counts and grouped aggregates first. Match values for keys that differ, using canonical type, units, timestamp precision, and handling of null. Retain a small immutable report rather than a bulk copy of customer data. Use checks that detect extra target rows as well as missing rows. A global checksum may help narrow a mismatch but cannot explain a transformed decimal or an out-of-order delete.

## Commit each batch and establish a stop rule

A loop inside one transaction still holds the transaction open even when it updates small ID ranges and sleeps between them. In PostgreSQL, the example loop above has no commit between ranges. It therefore does not provide committed batching. Run one transaction per batch from an orchestrator or design a routine with transaction control supported by the deployment context. Persist a progress checkpoint after successful commit, or in the same database transaction where appropriate. An interruption may cause the runner to repeat work, so the update should be safe on replay. Use keyset progress instead of assuming identifiers are densely packed.

A null condition is safe as a replay guard only when null unambiguously means incomplete and a concurrent writer cannot make the derived value stale. Some transformations intentionally produce null. Those need a separate marker or derivation version. For rows concurrently changed or deleted, pick an explicit policy, such as a version-aware update or ongoing synchronization by the authoritative writer. Test repeated runs in staging with inserts, updates, and deletions between batches. Verify that rows whose material fields changed during the copy are updated exactly as the business requires. Test an interrupted transaction, an interruption after commit but before checkpoint persistence, and a replay of a batch that already committed.

Use observed pressure to raise or lower batch size. In an illustrative trial, 10,000 rows complete every four seconds, implying 2,500 rows a second and 100 minutes to process 15 million rows if the rate holds. Suppose foreground traffic leaves 40 MB per second of spare replay capacity and the batch job emits 55 MB per second of transferable changes. The resulting backlog grows about 15 MB per second at constant rates. The nominal finish time then fails to include catch-up. Reduce the copy rate, pause the job during peaks, or provision verified spare capacity. Add a stop rule for query latency, blocked transactions, replica lag, and retention volume. Verify what the stop actually cancels and check for background work that continues after the runner exits.

## Treat the write switch as a sequence of durable milestones

Make the decision conditions visible to operators. Stop or drain the old writers, persist their final durable position, wait until the target can prove it applied the required changes, run approved reconciliation, and transfer write authority. Verify a new transaction with a traceable test key through the real consumer path before opening the whole cohort. Confirm behavior of lingering connection pools, asynchronous jobs, and scheduled exporters. A connection string change does not revoke old permissions or terminate every existing session. Give one person control of the transition and make each stage report its actual result instead of returning unchecked success when a request to change state is accepted.

Native PostgreSQL logical replication has version-specific restrictions. For PostgreSQL 18, schema changes and sequence state need separate handling. Record which schema definition and publication filters were used, and verify the affected sequence values before new inserts use them. In a cross-engine migration, test the exact comparison and sorting rules the application relies on, especially decimals, padded text, datetime precision, and collation. A successful sample import does not demonstrate equivalence for dates during a timezone transition or a historical identifier format. Keep examples of known differences and decide which transformations are acceptable before the cutover window opens.

## Separate reversing traffic from reversing storage effects

Before the target accepts new writes, returning consumers to the existing authoritative source can be straightforward. After the first target-only commit, rollback may require preserving or replaying new results. A design does not get that property from a route flag. Decide how those new records, downstream effects, and idempotency keys would be returned to the old system or otherwise retained. A repair process that handles new rows but omits deletes or notifications can produce inconsistent outcomes even if all keys exist in both systems. Exercise a controlled revert after creating a small authorized set of representative operations and prove what customers would observe.

Record the last point where traffic can be routed back without reconciliation. Also record a separate point after which a restore or forward repair is the approved response. If the plan depends on a reverse replication stream, prove it can preserve order, catch up, and operate under failure with both writers fenced as needed. Run the entire rehearsal with a cold connection pool and an on-call responder who was not involved in implementation. Save durations, test scope, outstanding risks, and exact conditions that would abort. Treat illustrative switch windows as capacity planning inputs. Actual time includes the traffic pause, latest replay, correctness checks, operational authorization, and restoration of the representative user path.

[PostgreSQL transaction management in PL/pgSQL](https://www.postgresql.org/docs/18/plpgsql-transactions.html) and [PostgreSQL 18 logical replication restrictions](https://www.postgresql.org/docs/18/logical-replication-restrictions.html)

For follow-up, order the verification queries by cost. A lightweight count can run every minute during replay. A full comparison that competes with replication can wait until the expected source and target cut is stable. Write the schedule into the runbook and set realistic time limits on the verification steps themselves.
