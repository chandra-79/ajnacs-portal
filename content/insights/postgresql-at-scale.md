---
title: "PostgreSQL at Scale: Lessons from High-Traffic Production"
description: "PostgreSQL is a remarkable database. It develops specific failure modes at scale that catch teams by surprise. Here's what to know before you hit them."
date: 2026-03-02
tags: ["Data Engineering", "Performance"]
format: article
---

I've worked with PostgreSQL for most of the last decade, across workloads ranging from small transactional systems to platforms handling tens of millions of events per day. The database earns its reputation — reliable, feature-rich, with an ecosystem that covers almost everything you'd want.

It also has failure modes at scale that catch teams by surprise. Here's what I've learned to watch for.

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

Monitor table and index bloat regularly. `pgstattuple` gives you exact bloat figures. Unexplained performance degradation on tables that were previously fast is often bloat.

## Connection Management

PostgreSQL creates a new OS process for every connection. At 500+ connections, process overhead becomes measurable. At 2000+ connections, it becomes a significant performance problem regardless of actual query load.

The solution is not to increase `max_connections` indefinitely — it's to put a connection pooler in front of PostgreSQL. PgBouncer in transaction-mode pooling is the standard answer: it maintains a small pool of actual database connections and multiplexes many application connections onto them.

Common configuration error: running PgBouncer in session mode. Session mode doesn't solve the connection problem — it serialises connections rather than multiplexing them. Transaction mode is what you want for connection scalability.

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

For queries returning only a few columns for many rows, covering indexes eliminate heap access entirely.

## Write Amplification Under High Ingestion

Each index is a write amplification multiplier. A table with 10 indexes on a high-write workload incurs roughly 10x the write overhead of a table with no indexes.

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

Frequent checkpoints manifest as I/O spikes and elevated write latency. Monitor with `pg_stat_bgwriter.checkpoints_timed` vs `checkpoints_req` — if `checkpoints_req` is significant, increase `max_wal_size`.

The same logic applies here as Oracle redo log sizing: if your database is pausing because it's checkpointing too frequently, the fix is giving it more headroom, not tuning the query that triggered it.

---

*Running PostgreSQL at scale or planning a migration? [Happy to discuss what you're working through.](/contact)*
