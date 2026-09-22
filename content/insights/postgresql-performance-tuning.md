---
title: "PostgreSQL Performance Tuning: The Settings and Patterns That Actually Matter"
description: "PostgreSQL's default configuration is conservative, designed for small deployments. For production workloads, the settings that control memory, parallelism, WAL behavior, and connection handling need explicit tuning. Here's where to start."
date: 2025-05-30
tags: ["Data Engineering", "Programming", "Cloud Architecture"]
format: article
---

PostgreSQL ships with defaults that are deliberately conservative — tuned for a server with 256MB of RAM to avoid out-of-memory failures on resource-constrained machines. Production deployments on modern hardware leave most of that performance on the table.

This isn't a comprehensive tuning guide (PostgreSQL's performance characteristics depend heavily on workload, hardware, and access patterns). It's the settings that matter most for most production workloads, with the reasoning behind each.

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

**`synchronous_commit`**: whether transactions wait for WAL to be durably written to disk before returning. Default `on` provides maximum durability. `synchronous_commit = off` improves write throughput significantly by making commits asynchronous — with the trade-off that up to `wal_writer_delay` (200ms by default) of committed transactions can be lost in a crash. Acceptable for some workloads (logging, analytics); never acceptable for financial or critical data.

## Connection management: don't skip PgBouncer

PostgreSQL's connection model is one-process-per-connection. Each connection creates a backend process that consumes ~5-10MB of memory. A PostgreSQL instance with 500 direct connections has committed 2.5-5GB of memory to connection overhead before a single query runs.

`max_connections = 100` (the default) is surprisingly low for many applications. Increasing it directly has diminishing returns — the memory overhead grows, and PostgreSQL's connection management doesn't scale linearly.

The right solution: **PgBouncer** (or pgpool-II) as a connection pooler in front of PostgreSQL. PgBouncer maintains a small pool of PostgreSQL connections and multiplexes many client connections onto them. Your application connects to PgBouncer; PgBouncer manages the actual PostgreSQL connections.

With PgBouncer:
- PostgreSQL `max_connections = 100` (or whatever your server can comfortably handle)
- PgBouncer `pool_size = 20` per database (connections to PostgreSQL)
- Applications can have 1000+ connections to PgBouncer without overwhelming PostgreSQL

Transaction-mode pooling (the most common PgBouncer mode) releases the PostgreSQL connection back to the pool after each transaction — efficient, but incompatible with session-level features (prepared statements with protocol-level binding, advisory locks, `SET LOCAL`).

## Indexing: the most common performance problems

**Missing indexes on foreign keys**: PostgreSQL doesn't automatically create indexes on foreign key columns (unlike some other databases). A query that JOINs on a foreign key column without an index causes a sequential scan of the referenced table. Check for this:

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

**Index bloat**: indexes grow as rows are updated and deleted. `pg_stat_user_indexes` and tools like `pgstattuple` identify bloated indexes. `REINDEX CONCURRENTLY` rebuilds without locking.

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
- `Buffers hit vs read`: `hit` is from shared_buffers (fast), `read` is from disk (slow). High read count means the working set exceeds cache.
- `actual rows` vs `rows` (estimated): large discrepancies mean stale statistics — run `ANALYZE tablename`

`pg_stat_statements` extension (enable in `shared_preload_libraries`) records query execution statistics across all connections. The query with the highest `total_exec_time` divided by `calls` is your first optimization target.

*Working through a PostgreSQL performance problem or setting up a production database configuration? [Happy to look at specifics.](/contact)*
