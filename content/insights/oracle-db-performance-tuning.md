---
title: "Oracle DB Performance Tuning: The 10 Things That Actually Move the Needle"
description: "Twenty years of Oracle DB work distilled into the tuning decisions that produce real, measurable improvements — and the ones that look good on paper but don't."
date: 2025-04-18
tags: ["Data Engineering", "Oracle", "Performance"]
format: article
---

Oracle DB performance tuning has a reputation for being arcane — and parts of it are. But in my experience, the improvements that actually move the needle on production workloads come from a small set of decisions that are well-established, repeatable, and don't require deep specialisation to implement.

Twenty years and a significant number of production Oracle databases later, here are the ten things I keep coming back to.

## What to measure

**DB time and wait mix at the same throughput.** If DB time falls from 300 to 240 seconds for the same 2,000 executions, average DB time per execution goes from 150 ms to 120 ms. Compare top waits, plans and bind patterns before interpreting the drop as an end-user latency improvement.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## 1. Identify the Top SQL Statements by Resource Consumption First

After identifying the slow workload and investigation window, rank SQL by its share of database time and by the resources implicated by the symptoms. Where licensing permits, an AWR report gives a historical view. Otherwise, use the approved telemetry for your deployment.

Prioritise the statements that explain the affected workload. Check execution count, elapsed time per execution, plan changes and workload mix before selecting a fix.

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

## 9. Retain Historical Telemetry for the Incident Window

Historical evidence helps diagnose intermittent issues and compare plans or wait activity across deployments. Check [Oracle’s licensing documentation](https://docs.oracle.com/en/database/oracle/oracle-database/19/dblic/Licensing-Information.html) for your edition, service and Diagnostics Pack entitlement before querying restricted views or generating AWR reports.

Choose a retention period long enough to cover comparable business cycles, within your licensing, storage and data retention rules.

## 10. Wait Event Analysis: What Is the Database Actually Waiting For?

```sql
SELECT event, total_waits, time_waited, average_wait
FROM v$system_event
WHERE wait_class != 'Idle'
ORDER BY time_waited DESC;
```

Every performance problem manifests as wait events. `db file sequential read` is I/O-bound single-block reads (index scans, single-row lookups). `db file scattered read` is multiblock reads (full table scans). `log file sync` is commit performance. `library cache lock` is shared pool contention.

The wait event profile tells you where to look. Everything else is detective work in that direction.

*Working on Oracle DB performance challenges or planning a migration? [Happy to discuss.](/contact/)*

## Reconcile the service symptom with database time

Start with a completed transaction on the service’s time axis. Choose the endpoint, the affected input class, the time window and the outcome you are trying to improve. The application may report an increase from 240 ms to 900 ms while database work appears steady. Look for time waiting for a pool connection, retries and network round trips before treating the database as the bottleneck. If the change is concentrated in one request class, query plans from an instance-wide busiest list may be unrelated to that class.

Oracle DB time aggregates CPU and non-idle wait time spent in database calls by foreground sessions. It can exceed elapsed wall time because multiple sessions make progress simultaneously. If DB time grows by 1,800 seconds during a five-minute interval, the workload averaged six active foreground sessions over that period. That example is an illustration of the division, not a capacity threshold. Compare CPU and wait contributions across equivalent traffic windows. Instance resets, failovers and missing samples need explicit handling before you subtract cumulative counters. [Oracle guidance on measuring database performance](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgdba/measuring-database-performance.html)

## Compare work in the same interval

Capture SQL workload counters twice for the same interval in which the application showed the symptom. Record instance and container context, SQL ID, child cursor and plan identity. Oracle exposes one row per child cursor in `V$SQL`. Fields such as executions, buffer gets and elapsed time are cumulative over the cached cursor’s life. A child that aged out or reloaded between samples cannot be reliably subtracted as if it were still the same counter. During long-running or parallel work, ratios from short intervals can also be tricky to interpret. [Oracle V$SQL reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/V-SQL.html)

Suppose a recurring lookup accounts for 3,000 completed executions and 9 million buffer gets in a comparable interval with no cursor turnover. It averages 3,000 buffer gets per execution. After a candidate change, another matched interval sees 3,300 executions and 3.3 million buffer gets, or 1,000 per execution. Those illustrative counts suggest lower logical work for that statement. Now look at the checkout’s response time, the query’s row counts and CPU, and the effect on writes. Buffer gets per execution can fall because the new cohort requested smaller accounts, so compare representative bind values before attributing the difference to the change.

## Inspect representative executed plans

Reproduce one fast and one slow case with equivalent session settings and binds in a test environment. For a selected cached cursor, `DBMS_XPLAN.DISPLAY_CURSOR` can display the actual plan and row-source runtime statistics when those statistics were collected. Review the SQL ID and child explicitly. Inspect operation starts, estimated rows, actual rows, reads and work area behaviour together. An operation with 10 estimated rows per start, 500 starts and 6,000 actual rows is a different problem from an operation with 10 estimated rows and 6,000 actual rows on a single start. Use an approved short diagnostic run rather than increasing statistics collection across a busy fleet. [Oracle DBMS_XPLAN reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/arpls/DBMS_XPLAN.html)

Consider an example where the same search sees a few hundred rows for most tenants and several million for the largest. Execute both bind classes and include the busiest concurrency profile. A plan that wins for small tenants may be worse for large ones because the access cost changes with selectivity. Review predicate placement, ordering requirements and the first point where intermediate row counts diverge. If a new index appears promising, measure its storage, redo and write cost and confirm the plan after a fresh parse. Keep an explicit way to withdraw a change if it improves the isolated query but hurts the full service.

## Build a diagnosis path that matches the environment

Start by asking the DBA who owns feature entitlements which tools are available for this database version and edition. Oracle documents management pack conditions for AWR and ASH. Control access and dashboards according to the approved environment. Where those tools are unavailable, work from service spans, operating system metrics and permitted current-session or cursor statistics. Useful evidence includes timestamped pool occupancy, execution counts, volumes and latency by request outcome. Capture critical snapshots before aged-out cursors or a restart make them unavailable. [Oracle Database 19c licensing information](https://docs.oracle.com/en/database/oracle/oracle-database/19/dblic/Licensing-Information.html)

Turn leading waits into hypotheses. A database-wide spike in `log file sync` gives reason to inspect commit frequency and the redo acknowledgement path, including measured latency. Increasing a logfile based on switch frequency alone will not test that hypothesis. In a read investigation, measure physical I/O latency and the cost of specific statements rather than tuning to a general buffer cache hit target. Aggregate ratios can remain stable when a critical workload takes a disproportionate share of slow accesses.

## Verify that the workload improves beyond the test query

Before rollout, write a small comparison sheet with baseline period, request count, throughput, service latency by percentile and input cohort, database time, write latency and any change in plans. Add a separate line for outlier inputs so the dominant case does not mask them. Include the same end-of-period finance job or bulk ingest if the production change will affect it. A tuned search may move work into maintenance or storage even while its latency improves.

During a limited rollout, record the exact change and timing. Pause if errors, write queuing or the agreed tail-latency signal deteriorate, and compare to a group running the original change. Keep observations from rollback as well. If the symptom persists after reversal, the result is evidence to investigate shared dependencies or changed traffic instead of forcing a causal story around a single plan.

Record the database version, feature set and observation interval with the final evidence. Store redacted SQL shape and bind classes so another engineer can recreate the investigation without publishing customer values. Add a date to revisit the plan after significant distribution or workload changes.
