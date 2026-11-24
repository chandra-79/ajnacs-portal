---
title: "PostgreSQL at Scale: Lessons from High-Traffic Production"
description: "Investigate PostgreSQL connection, query, vacuum and checkpoint behavior using workload evidence and a controlled capacity exercise."
date: 2027-08-04
tags: ["Data Engineering", "Performance"]
format: article
---

## The VACUUM Problem

Understand VACUUM before anything else. PostgreSQL's MVCC model writes new row versions for updates and deletes rather than updating in place — dead tuples accumulate in heap files and must be reclaimed by VACUUM. Without sufficient vacuuming:

- Tables bloat, increasing I/O for sequential scans
- Index bloat accumulates alongside table bloat
- Transaction ID wraparound approaches at very high transaction rates (this is a genuine data availability risk)

Autovacuum works well for most workloads but has defaults that are conservative for high-write tables. For tables receiving thousands of writes per second, tune autovacuum aggressiveness per-table:

```sql
ALTER TABLE high_write_table SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005,
    autovacuum_vacuum_cost_delay = 2
);
```

Monitor table and index bloat regularly. `pgstattuple` reports tuple and free-space statistics; interpreting bloat requires context and the operation itself has a cost. Unexplained performance degradation on tables that were previously fast is often bloat.

## Connection Management

PostgreSQL creates a new OS process for every connection. The useful connection limit depends on query workload, memory and server resources; fixed connection-count thresholds are not portable.

The solution is not to increase `max_connections` indefinitely — it's to put a connection pooler in front of PostgreSQL. PgBouncer in transaction-mode pooling is the standard answer: it maintains a small pool of actual database connections and multiplexes many application connections onto them.

Transaction pooling can reuse a server connection after each transaction. Session pooling retains a server connection for the client session and can be appropriate where session semantics are required.

## Indexing: The Parts That Catch People Out

**Partial indexes** are underused and highly effective. An index for a queue table where 99% of rows have `status = 'processed'` is dramatically smaller and faster than a full index on `status`:

```sql
CREATE INDEX idx_orders_pending
ON orders (created_at)
WHERE status = 'pending';
```

**Index-only scans require VACUUM.** PostgreSQL's visibility map must mark pages as all-visible before index-only scans can avoid heap access. On poorly-vacuumed tables, what should be an index-only scan degrades to an index scan with heap lookups.

**Covering indexes** allow non-key columns to be stored in the index leaf for index-only scan eligibility:

```sql
CREATE INDEX idx_orders_covering
ON orders (customer_id)
INCLUDE (status, total_amount);
```

For queries returning only a few columns for many rows, covering indexes can reduce heap access when visibility and plan conditions permit.

## Write Amplification Under High Ingestion

Each index is a write amplification multiplier. A table with 10 indexes on a high-write workload adds maintenance whose magnitude depends on index types, row changes and HOT eligibility.

For high-ingestion workloads (event streams, telemetry, audit logs), evaluate every index critically. Consider:
- Partitioning by time range and indexing only active partitions
- Delaying index creation until the data is no longer being written
- Using BRIN indexes for large, naturally-ordered tables (dramatically smaller than B-tree, with moderate query cost)

## pg_stat_statements Is Non-Negotiable

`pg_stat_statements` is the Oracle AWR equivalent for PostgreSQL: per-query statistics on execution count, total and mean time, shared block hits and reads. Enable it in every production PostgreSQL instance.

```sql
-- Enable in postgresql.conf
-- shared_preload_libraries = 'pg_stat_statements'
-- pg_stat_statements.track = all
-- After the required server restart, enable the extension in the target database:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT query, calls,
       mean_exec_time,
       total_exec_time,
       shared_blks_hit,
       shared_blks_read
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

Everything in PostgreSQL performance tuning starts here.

## WAL Configuration for Write-Heavy Workloads

- `checkpoint_completion_target = 0.9` — smooth checkpoint I/O spread over 90% of the checkpoint interval
- `max_wal_size` should be large enough to avoid frequent checkpoints

Frequent checkpoints manifest as I/O spikes and elevated write latency. Monitor timed versus requested checkpoints using the deployed release's checkpoint statistics view — if `checkpoints_req` is significant, increase `max_wal_size`.

The same logic applies here as Oracle redo log sizing: if your database is pausing because it's checkpointing too frequently, investigate WAL volume, checkpoint settings and storage capacity together.

*Running PostgreSQL at scale or planning a migration? [Happy to discuss what you're working through.](/contact/)*

## Define scale as a workload and a service objective

A database serving a million tiny cached lookups has a different bottleneck from one processing a much smaller number of large joins or contended account updates. Record arrival rate, transaction duration, read/write mix, payload size, data skew and required durability. Add latency objectives and recovery requirements. Without those inputs, a transactions-per-second claim is not a capacity plan.

Start with a representative workload interval. Rank queries by total execution time, then inspect expensive individual requests and queries that are growing fastest. Aggregated statistics can hide a tenant-specific problem: one normalized statement may be fast for small tenants and slow for a large tenant. Preserve the parameter distribution and examine plans safely with representative values. Do not publish captured SQL text without checking it for sensitive data.

### A connection budget example

Suppose a hypothetical application completes 400 database transactions per second, with a mean active database service time of 20 milliseconds. Little's Law gives an average of 400 × 0.020 = 8 active transactions under stable conditions. If mean service time rises to 50 milliseconds at the same completed rate, the average becomes 20; at 100 milliseconds, it becomes 40. The figure shows these arithmetic cases. It is not a recommendation to configure precisely 8, 20 or 40 connections: variability, bursts, administrative access and the limits of the server also matter.

Set a total connection budget across every service instance, worker and migration job. A pool of 20 in each of 100 application instances can still request 2,000 server connections unless a shared pooler constrains them. Measure pool wait separately from query execution. Increasing concurrency can reduce waiting in one queue while increasing lock waits and I/O competition inside the database. A controlled load test should find the point at which additional concurrency stops increasing useful throughput.

Transaction pooling also changes application assumptions. Review session-level state, temporary objects, advisory-lock use and prepared-statement behavior for the exact pooler version and configuration. Session pooling has valid use cases when a client requires session affinity. The choice is about supported semantics and connection reuse, not a blanket rule that one mode is always wrong.

## Maintenance capacity is part of production capacity

A write benchmark that omits vacuum, checkpoints, backups and replication does not demonstrate sustainable operation. Run long enough for maintenance cycles to occur. Record WAL generation, replication lag, disk growth, foreground latency and recovery headroom. If the server looks healthy only while background work is deferred, the apparent capacity is borrowed from a future incident.

The vacuum settings above are illustrative starting values, not a prescription. Inspect actual deployed defaults and table-level settings, then tune against churn and eligible cleanup. A low scale factor cannot overcome a snapshot that pins old versions. Diagnose the oldest relevant transactions and replication slots before increasing resources. A table with a low dead-tuple estimate can still need freezing or statistics updates; one counter is not a complete maintenance assessment.

For checkpoints, use the monitoring views and column names documented for the deployed release. Newer PostgreSQL releases expose checkpoint statistics in `pg_stat_checkpointer`; older examples use fields formerly present in `pg_stat_bgwriter`. Verify the view rather than copying an old dashboard. `max_wal_size` is a checkpoint-related soft limit, not a hard guarantee that retained WAL can never exceed it. Replication retention and archival failure can consume additional disk.

## Prove an index change with both reads and writes

A partial index helps only when the query predicate can use it. Test parameterized application queries as they are actually sent, including their planning behavior. A covering index can make an index-only scan possible, but visibility checks may still require heap fetches. Record heap fetches in the plan rather than assuming INCLUDE columns eliminate them.

Measure the candidate index's disk footprint, build duration, WAL impact and effect on write latency. Creating an index concurrently reduces some blocking but introduces its own constraints and failure cleanup. Rehearse interruption and inspect validity afterward. An unused index can still be needed by an infrequent reconciliation or incident query; review a representative observation period before removal.

### Handoff and load-test acceptance

A useful acceptance sheet names the tested arrival profile, the peak sustained completion rate, the latency distribution and every error category. It includes a hot-tenant case, a maintenance interval and a deliberate dependency slowdown. Verify that overload is bounded: callers should receive controlled rejection or timeouts rather than creating an unbounded connection storm.

Finally restore a backup to an independent instance and measure recovery. Read-replica health does not establish backup validity, and query throughput does not establish recovery time. Publish the workload fixture, configuration changes and remaining bottleneck with the result. This makes “at scale” a reproducible operational claim instead of a collection of borrowed tuning values.

### Figure methodology

Synthetic stable workload completes 400 transactions/second. Little’s Law L=λW gives 8, 20 and 40 average active transactions for mean service times 0.020, 0.050 and 0.100 seconds. Excludes pool wait and is not a pool-size recommendation.

| Worked observation | active transactions |
| --- | ---: |
| 20 ms service time | 8 |
| 50 ms service time | 20 |
| 100 ms service time | 40 |

## Primary references and further study

- [PostgreSQL query statistics](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [PostgreSQL routine vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- [PostgreSQL monitoring views](https://www.postgresql.org/docs/current/monitoring-stats.html)
- [PgBouncer configuration](https://www.pgbouncer.org/config.html)
