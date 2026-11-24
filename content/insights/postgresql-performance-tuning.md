---
title: "PostgreSQL Performance Tuning: The Settings and Patterns That Actually Matter"
description: "PostgreSQL's default configuration is conservative, designed for small deployments. For production workloads, the settings that control memory, parallelism, WAL behavior, and connection handling need explicit tuning. Here's where to start."
date: 2025-12-26
tags: ["Data Engineering", "Programming", "Cloud Architecture"]
format: article
---

PostgreSQL ships with defaults that are deliberately conservative — tuned for a server with 256MB of RAM to avoid out-of-memory failures on resource-constrained machines. Production deployments on modern hardware leave most of that performance on the table.

This isn't a comprehensive tuning guide (PostgreSQL's performance characteristics depend heavily on workload, hardware, and access patterns). It's the settings that matter most for most production workloads, with the reasoning behind each.

## What to measure

**Buffers per successful query at equivalent load.** Compare the same bind parameters with `EXPLAIN (ANALYZE, BUFFERS)` in an appropriate environment. If shared block reads fall from 2,000 to 400, that is an 80% reduction for the recorded execution. Track warm versus cold cache and index maintenance cost separately.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [PostgreSQL documentation on EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html).

## Memory settings: the biggest wins

**`shared_buffers`**: the amount of memory PostgreSQL uses for caching data pages. Default is 128MB. On a dedicated database server, set to 25% of total RAM. On a 32GB server: `shared_buffers = 8GB`.

This is the single most impactful setting. Queries that hit the shared buffer cache (in-memory) are orders of magnitude faster than queries that require disk I/O.

**`effective_cache_size`**: not a memory allocation — an estimate that tells the query planner how much memory is available for caching (shared buffers + OS page cache). Set to 50-75% of total RAM. On a 32GB server: `effective_cache_size = 24GB`. This influences whether the planner chooses index scans vs sequential scans.

**`work_mem`**: the memory available per sort and hash operation, per query. Default is 4MB. For analytical workloads with complex queries, increase this. For OLTP workloads with many concurrent connections, be careful — a query with 10 sort operations and 100 concurrent connections could use `10 × 100 × work_mem` of memory.

For OLTP: `work_mem = 16MB`. For analytical queries (manually or via session-level `SET work_mem`): 64-256MB.

**`maintenance_work_mem`**: memory for maintenance operations (VACUUM, CREATE INDEX, ALTER TABLE). Default is 64MB. Set to 256MB-1GB — these operations run infrequently and benefit from more memory.

## WAL and checkpoint tuning

**`wal_buffers`**: WAL write buffer. Default is usually auto-tuned to 1/32 of shared_buffers (max 16MB). `wal_buffers = 16MB` is fine for most workloads.

**`checkpoint_completion_target`**: spreads checkpoint writes over a fraction of the checkpoint interval. Default is 0.9 (90%). Keep this at 0.9 — it prevents I/O spikes from checkpoint activity.

**`max_wal_size`**: controls how large the WAL can grow between checkpoints. Default is 1GB. For write-heavy workloads, increasing this reduces checkpoint frequency: `max_wal_size = 4GB`.

**`synchronous_commit`** controls how a commit waits for local or configured replication durability. With `off`, PostgreSQL can report success before the WAL is flushed. The documented risk window can be up to three times `wal_writer_delay`, or up to 600 ms at 200 ms. Change this setting only for transactions whose owners explicitly accept losing acknowledged writes. See [PostgreSQL asynchronous commit](https://www.postgresql.org/docs/current/wal-async-commit.html).

## Connection management: don't skip PgBouncer

PostgreSQL's connection model is one-process-per-connection. Each connection creates a backend process that consumes ~5-10MB of memory. A PostgreSQL instance with 500 direct connections has committed 2.5-5GB of memory to connection overhead before a single query runs.

`max_connections = 100` (the default) is surprisingly low for many applications. Increasing it directly has diminishing returns — the memory overhead grows, and PostgreSQL's connection management doesn't scale linearly.

The right solution: **PgBouncer** (or pgpool-II) as a connection pooler in front of PostgreSQL. PgBouncer maintains a small pool of PostgreSQL connections and multiplexes many client connections onto them. Your application connects to PgBouncer; PgBouncer manages the actual PostgreSQL connections.

With PgBouncer:
- PostgreSQL `max_connections = 100` (or whatever your server can comfortably handle)
- PgBouncer `pool_size = 20` per database (connections to PostgreSQL)
- Applications can have 1000+ connections to PgBouncer without overwhelming PostgreSQL

PgBouncer transaction pooling returns the server connection after each transaction. Transaction-scoped `SET LOCAL` stays within that transaction. Session-scoped advisory locks and SQL `PREPARE` require different handling. Protocol-level named prepared statements can work when supported by the pooler version and `max_prepared_statements` is nonzero. Test the exact driver, prepared statement behavior, and session settings before switching. See the [PgBouncer feature matrix](https://www.pgbouncer.org/features).

## Indexing: the most common performance problems

**Missing indexes on foreign keys**: PostgreSQL doesn't automatically create indexes on foreign key columns (unlike some other databases). The referenced key has an appropriate uniqueness constraint or index. The referencing columns may need a supporting index, especially for parent updates or deletes that search child rows. Join plans also depend on selectivity, statistics, and cost. The query below is a first pass for candidate columns. Review composite index key order, predicates, and actual plans before making a change.

```sql
SELECT conrelid::regclass AS table, conname AS fk_name, 
       a.attname AS column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
AND NOT EXISTS (
    SELECT 1 FROM pg_index i 
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
);
```

**Partial indexes**: for queries that always include a WHERE clause on a status field (e.g., `WHERE status = 'pending'`), a partial index is smaller and faster than a full index:

```sql
CREATE INDEX idx_orders_pending ON orders(created_at) WHERE status = 'pending';
```

**Index bloat**: indexes grow as rows are updated and deleted. `pg_stat_user_indexes` shows index usage. Physical inspection with tools such as `pgstattuple` can help investigate bloat. `REINDEX CONCURRENTLY` generally permits normal writes, but it still acquires locks and requires time, storage, and additional work. Check [the command’s restrictions](https://www.postgresql.org/docs/current/sql-reindex.html) on the deployed version.

**Index usage**: queries that appear to use an index but run slowly often have a type mismatch between the parameter and the indexed column (implicit cast prevents index use) or use a function on the indexed column (`WHERE LOWER(email) = ...` doesn't use an index on `email` — use a functional index: `CREATE INDEX ON users(LOWER(email))`).

## Query analysis with EXPLAIN ANALYZE

`EXPLAIN ANALYZE` is the primary tool for understanding why a query is slow:

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT * FROM orders WHERE customer_id = 123 AND status = 'pending';
```

Key things to look for:
- `Seq Scan` on a large table: missing index or planner chose sequential scan despite an index (check row estimates)
- `Rows Removed by Filter`: rows scanned but not returned — index isn't selective enough
- `Buffers hit vs read`: `hit` means the page was already in PostgreSQL shared buffers, while `read` means it had to be read into them. A read may be served by the operating system page cache. Use I/O timing and host statistics to distinguish a cache miss from physical storage delay.
- `actual rows` vs `rows` (estimated): large discrepancies mean stale statistics — run `ANALYZE tablename`

`pg_stat_statements` extension (enable in `shared_preload_libraries`) records query execution statistics across all connections. The query with the highest `total_exec_time` divided by `calls` is your first optimization target.

*Working through a PostgreSQL performance problem or setting up a production database configuration? [Happy to look at specifics.](/contact/)*

## Establish a reproducible baseline before changing a knob

Write down database version, dataset shape, concurrency, hardware limits, and the exact workload that produces the complaint. Capture two periods under comparable load. Count successful operations per interval, application p95 and p99, time spent waiting for a connection, and database execution or wait activity. A query that improves in isolation can still make the whole workload worse if a new index raises write latency or a larger memory setting squeezes unrelated sessions. Preserve the original configuration and statistics snapshot so a colleague can reproduce the decision rather than inferring it from one chart.

Rank statements by more than one question. Total execution time helps identify what consumes cumulative database work. Mean time can highlight an expensive individual statement. A rare ten-second query can matter for a privileged workflow, while a frequent query averaging 5 ms can be the largest load driver. In an illustrative 10-minute window, a statement executed 60,000 times at a mean of 5 ms contributes 300 execution seconds. Another executed 40 times at 2 seconds contributes 80 seconds. Cumulative seconds are accumulated across executions and can overlap in wall time. Use application traces and wait information to decide whether changing one will improve customer latency, sustained capacity, or both.

## Read actual plans as execution evidence

Use plain `EXPLAIN` to inspect PostgreSQL's estimates without executing the statement. `EXPLAIN ANALYZE` runs the command. Run it for writes and potentially expensive operations only in a safe environment with side effects and concurrency accounted for. A rollback can undo many transactional database effects, but it cannot generally be assumed to reverse external effects triggered by functions or resources outside the transaction. Capture bind values with sensitive fields removed, select the intended role and search path, and test multiple plausible values for a skewed predicate.

Elapsed time in nested plan nodes should not be added blindly. Work at a parent typically includes work in children. When a node reports multiple loops, check how actual row and time information is averaged per loop in the rendered plan before comparing totals. Compare estimated and actual row counts near the first large divergence. A poor estimate can come from stale statistics, skew, correlated columns, or a parameterized plan that serves very different input populations. Running `ANALYZE` can refresh estimates. It does not automatically fix a selectivity assumption about two correlated columns. Verify statistics support and the plan after changing either schema or selectivity assumptions.

Use `BUFFERS` to distinguish shared-buffer hits from reads and other activity. A shared read need not be a physical device read, since the operating system may already hold the page in its cache. Check actual I/O evidence and time spent waiting before attributing latency to disk. Compare runs warmed in the same way. If an index changes from many random scattered accesses to the next hundred qualifying entries in order, the improvement may be visible in pages touched and elapsed time even when both runs avoid physical disk. Preserve counts for returned rows and repeated loops so a reduction is not accidentally caused by selecting a smaller result.

## Estimate connection and memory costs as a workload

A memory budget depends on the number of operations executing together, not only sessions configured. Suppose 24 concurrent transactions each run two memory-consuming nodes at 16 MiB in an illustrative upper-bound calculation. This is 768 MiB for those operations before other query memory, parallel workers, maintenance, caches, and process overhead. Hash operations can have a different limit governed by their settings. The same settings can be benign for indexed point lookups and risky when a report joins large relations. Use a dedicated role, session scope, or a controlled workload queue for a larger analytical allocation. Measure spill and peak memory rather than copying a global setting from a machine with a different query mix.

A pool should bound active database work and expose waiting at the application. If 80 database backends already sustain the tested safe work rate, permitting 400 simultaneous query executions does not create additional database I/O or lock throughput. Test the queue under a peak mixture of slow and fast operations. Compare active concurrency, queue time, failures, and tail latency. Transaction pooling releases session assignment between transactions, so application code that expects arbitrary session state to persist can break. PostgreSQL transaction-local state is a different scope from session settings. PgBouncer's current feature matrix also distinguishes SQL-level prepared statements from protocol-level prepared statements, with protocol support depending on configuration. Verify the actual driver and pooler mode rather than assuming every preparation mechanism behaves identically.

## Verify that a local improvement survives a release

Choose an index candidate based on one representative query and workload. Confirm that it supports the predicates, sort order, and access pattern. If the candidate adds write work, run sustained writes along with reads and quantify the added storage and maintenance. Check query plans for both selective and less selective parameters. A foreign-key index can help some joins or checks on operations against the referenced row, but the planner can still reasonably choose a sequential scan when most rows qualify. Concurrent index operations reduce some blocking relative to ordinary index operations. They still take locks, may wait, and consume resources. Use documented behavior for the version in use and a bounded rollout.

Collect a new workload window after the change and compare successful requests, query work per success, wait time, and operating pressure at equivalent offered load. If p99 improves while connection rejects rise, inspect the missing work before calling it a win. Verify the original known query, at least one non-target query that competes for resources, and a burst or recovery run. Save the plan, the definition of “success,” the sampled population, and a safe path back. Re-test when data grows or skew changes, because the decision depends on the measured distribution and capacity.

[PostgreSQL on using EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html), [PostgreSQL routine vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html), and [PgBouncer's feature matrix](https://www.pgbouncer.org/features)

Keep maintenance and idle periods in the comparison set. A change tested only in a busy window can hide longer maintenance runtimes. Include an explain plan and workload summary from each condition in the evidence package used to approve the rollout.
