---
title: "Oracle DB Performance Tuning: The 10 Things That Actually Move the Needle"
description: "Twenty years of Oracle DB work distilled into the tuning decisions that produce real, measurable improvements — and the ones that look good on paper but don't."
date: 2025-04-18
tags: ["Data Engineering", "Oracle", "Performance"]
format: article
---

Oracle DB performance tuning has a reputation for being arcane — and parts of it are. But in my experience, the improvements that actually move the needle on production workloads come from a small set of decisions that are well-established, repeatable, and don't require deep specialisation to implement.

Twenty years and a significant number of production Oracle databases later, here are the ten things I keep coming back to.

## 1. Identify the Top SQL Statements by Resource Consumption First

Before any other tuning activity, run an AWR (Automatic Workload Repository) report and identify the top SQL statements by CPU, elapsed time, physical reads, and logical reads. Ninety percent of performance problems in production Oracle databases come from fewer than twenty SQL statements.

Fix the top 10 before touching any configuration parameter. Nothing else has as high a return per unit of effort.

```sql
SELECT * FROM (
    SELECT sql_text, executions,
           elapsed_time/1000000 elapsed_secs,
           cpu_time/1000000 cpu_secs,
           buffer_gets
    FROM v$sql
    ORDER BY elapsed_time DESC
) WHERE ROWNUM <= 20;
```

## 2. Use DBMS_XPLAN.DISPLAY_CURSOR, Not EXPLAIN PLAN

`EXPLAIN PLAN` shows you what the optimiser intends to do. `DBMS_XPLAN.DISPLAY_CURSOR` shows you what it actually did — including cardinality estimates and actual row counts. The gap between estimated and actual cardinality is where most performance problems originate.

Always use DISPLAY_CURSOR for performance analysis. The estimated plan can diverge significantly from the execution plan under real workload conditions.

## 3. Index Design Is Query-Specific, Not Table-Specific

The most common indexing mistake: indexing columns in isolation rather than query patterns.

Composite indexes should match query predicates in the order they're most selective. A query filtering on `(status, created_date)` where `status` has 5 distinct values and `created_date` has millions performs better with a composite index `(status, created_date)` than with separate indexes on each column.

The second most common mistake: too many indexes on high-write tables. Every index is a write overhead. On tables with high insert/update rates, index maintenance cost can exceed query benefit.

## 4. Statistics Matter More Than Most People Realise

The CBO (Cost-Based Optimiser) makes execution plan decisions based on object statistics. Stale statistics produce bad execution plans. This is behind a larger fraction of performance regressions than any configuration issue.

For most workloads, automated statistics collection is sufficient. For tables with non-uniform data distributions or frequent bulk loads, manual statistics collection with appropriate sample sizes and histograms is worth the investment.

Check statistics age with `DBA_TAB_STATISTICS.LAST_ANALYZED`. Statistics older than 24 hours for high-change tables are often the root cause when performance degrades after batch processing.

## 5. Bind Variables for Everything That Runs More Than Once

Hard-parsing SQL on every execution consumes significant CPU and creates shared pool contention at scale. This is one of the most common performance killers in Java applications using string concatenation to build SQL.

Every query that runs more than once should use bind variables — not just for security, but for performance. The shared pool cursor cache reuses execution plans for identical SQL text. Bind variables make SQL identical across different parameter values.

In Java/Spring applications: parameterised queries and PreparedStatement exclusively. Never concatenate parameters into SQL strings.

## 6. SGA Sizing: Memory Is Not the First Answer

SGA sizing is frequently where Oracle performance tuning conversations start. It's rarely where the actual problem is.

The buffer cache should be sized to hold the hot working set of your most frequently accessed data. For OLTP workloads, a buffer cache hit ratio below 95% is a signal to investigate — but investigate whether the reads are necessary before throwing memory at them.

Shared pool undersizing is more common than buffer cache undersizing in my experience. Shared pool pressure manifests as high library cache latch contention and ORA-04031 errors.

## 7. Redo Log Sizing for Write-Heavy Workloads

Undersized redo log groups cause frequent log switches, which force checkpoints and increase I/O on write-heavy workloads. The target is log switches no more frequently than every 20–30 minutes under normal load.

Check log switch frequency and increase redo log group sizes if you're switching more than twice per hour.

## 8. Partitioning for Large Tables with Range-Based Queries

Partition pruning can eliminate entire segments from query evaluation. For tables with tens of millions of rows and queries that always filter on a date or range column, range or interval partitioning produces dramatic performance improvements — often more than index optimization alone.

The key: partition key must align with the most common query predicate. Partitioning on `created_date` with queries filtering on `customer_id` produces no pruning benefit.

## 9. AWR Snapshots Are Non-Negotiable in Production

If you're running Oracle in production without AWR configured, you're flying blind. AWR provides the historical performance data required to diagnose intermittent issues, identify regression points after change events, and trend performance over time.

The default AWR retention of 8 days is often insufficient. Extend to 30+ days for production environments where performance investigations often span business cycles.

## 10. Wait Event Analysis: What Is the Database Actually Waiting For?

```sql
SELECT event, total_waits, time_waited, average_wait
FROM v$system_event
WHERE wait_class != 'Idle'
ORDER BY time_waited DESC;
```

Every performance problem manifests as wait events. `db file sequential read` is I/O-bound single-block reads (index scans, single-row lookups). `db file scattered read` is multiblock reads (full table scans). `log file sync` is commit performance. `library cache lock` is shared pool contention.

The wait event profile tells you where to look. Everything else is detective work in that direction.

---

*Working on Oracle DB performance challenges or planning a migration? [Happy to discuss.](/contact)*
