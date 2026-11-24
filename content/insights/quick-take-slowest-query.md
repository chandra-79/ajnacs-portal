---
title: "Rank Database Work Before Optimizing the Slowest Query"
description: "Rank statements by measured workload cost, inspect plans, and compare query frequency with per-call duration before optimizing."
date: 2028-01-05
tags: ["Data Engineering", "Architecture"]
format: article
---

Database performance tuning has a peculiar property: the work is not evenly distributed. In most production systems, a small number of queries are responsible for a disproportionate share of the database load — CPU, I/O, memory, and wall-clock time.

Rank query families over a representative interval, then test the largest actionable source of resource consumption. A single repair can help substantially when that query is the bottleneck; it can also expose another limit. The benefit and the point of diminishing returns must be measured.

## Why query load is so concentrated

Applications tend to have a few high-frequency code paths. The API endpoint that serves the main dashboard is called orders of magnitude more often than the endpoint that exports a report. The query that loads a user's session on every request runs thousands of times per hour. The query that generates a billing statement runs once a month.

High frequency plus inefficiency equals most of the database load. A modest per-call cost can dominate when multiplied by 10,000 calls per hour, but compare the measured totals for the same interval rather than deciding from frequency alone.

The additional factor: application code often has N+1 query patterns at the high-frequency code paths — exactly where the multiplication factor is highest.

## Finding the query

Most database engines expose this data:

```sql
-- PostgreSQL: queries ordered by total time consumed
SELECT query, calls, total_exec_time, mean_exec_time,
       rows, 100.0 * total_exec_time / NULLIF(sum(total_exec_time) OVER (), 0) AS pct
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

The `total_exec_time` column accumulates execution time for each tracked statement entry. Rank entries over a defined observation interval and calculate their actual shares; there is no universal percentage assigned to the top query. Counter resets, evictions, database and user grouping, and concurrent execution affect interpretation. Accumulated execution time is not the same as wall-clock database utilization.

MySQL/MariaDB: `performance_schema.events_statements_summary_by_digest`  
MongoDB: `db.currentOp()`, `system.profile`, `explain()`  
SQL Server: `sys.dm_exec_query_stats`

## What to do with the finding

**For high-execution-time, low-call queries:** these are expensive queries being called infrequently. Usually a missing index or an inefficient join. An appropriate index may reduce scanned rows, sorting or heap access. Measure the actual runtime and resource change, including write maintenance; there is no general tenfold or hundredfold improvement that can be promised.

**For moderate-execution-time, high-call queries:** these are the dangerous ones — small queries called in a loop. One candidate is moving suitable repeated work into a set-based database operation (a single query with a WHERE clause or a JOIN) instead of calling the database in a loop.

**For queries with high sequential scan costs:** the query is reading more data than it needs to answer the question. The fix is either an index, or a query rewrite that filters more aggressively earlier.

The best time to look at these numbers is before there is a performance problem. The second best time is right now.

## Compare two different rankings

A slow-query log highlights slow individual executions. Statement statistics highlight accumulated work. Neither ranking guarantees a particular concentration of database load. A service with many inexpensive repeated queries can spend more total time on them than on a handful of visibly slow reports. A blocked statement can also have high latency without consuming comparable CPU work.

In a synthetic ten-minute interval, a lookup executes 30,000 times at four milliseconds on average, totaling 120 seconds of accumulated execution time. A report executes 20 times at four seconds, totaling 80 seconds. A synchronization query executes 200 times at 100 milliseconds, totaling 20 seconds. The lookup contributes 120/220, approximately 54.5%, of the execution time among these three statement groups. It does not follow that it contributes 54.5% of total server CPU or that all other statements are negligible.

## Investigate the lookup without prejudging the fix

First ask why the lookup runs 30,000 times. The application may repeat it for each item in a list, request data it already holds or retry after a timeout. A cache may help if freshness and authorization semantics allow reuse, but a cache that leaks data across tenants is an unacceptable optimization. Consolidating requests or returning the required fields in an existing query may avoid another cache entirely.

Then inspect the database plan with representative parameters. Compare estimated and actual row counts in a safe test. A parameter associated with a small tenant may use a different amount of work from one associated with a large tenant. Check rows removed by filters, heap access, sorting and the loops of repeated plan nodes. Do not add execution times from every parent and child node as if they were independent; parent measurements can include child work.

Measure an intervention against a stable workload. Suppose batching reduces lookup calls from 30,000 to 6,000 while mean execution remains four milliseconds. Accumulated execution time becomes 24 seconds, an 80% reduction for that statement population. The application may still spend time building or transmitting the batched result. Check end-to-end latency, result equality and concurrent write behavior before reporting a service improvement.

## Preserve the measurement boundary

Record the statistics reset time and interval. Cumulative counters from different durations cannot be compared directly. Prefer deltas for the same statement identity and scope, and explain when a restart or reset invalidates a delta. Keep result volume visible: a query that returns less data after an accidental filter change can look faster while being wrong.

Use a worksheet with statement identity, calls, execution time, rows, relevant I/O signals, affected endpoint and proposed explanation. Rank candidates, investigate one, then recalculate the ranking after the change. Removing the top contributor can reveal a different bottleneck. The useful practice is an evidence loop; the number 40% is not a database law.

### Figure methodology

Synthetic ten-minute population. Calls × mean execution time yields 120, 80 and 20 seconds. The lookup is 54.5% of these groups only. Accumulated execution overlaps under concurrency and is not a CPU measurement.

| Worked observation | seconds |
| --- | ---: |
| Repeated lookup | 120 |
| Occasional report | 80 |
| Synchronization | 20 |

## Primary references and further study

- [PostgreSQL statement statistics](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
