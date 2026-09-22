---
title: "Every System Has One Query That Explains 40% of the Database Load"
description: "Database performance optimization follows the 80/20 rule more extremely than almost any other engineering domain. Finding and fixing the one worst query produces more improvement than everything else combined."
date: 2028-01-05
tags: ["Data Engineering", "Architecture"]
format: article
---

Database performance tuning has a peculiar property: the work is not evenly distributed. In most production systems, a small number of queries are responsible for a disproportionate share of the database load — CPU, I/O, memory, and wall-clock time.

Fix the one worst query and performance improves dramatically. Fix the next ten worst queries and you are chasing diminishing returns.

## Why query load is so concentrated

Applications tend to have a few high-frequency code paths. The API endpoint that serves the main dashboard is called orders of magnitude more often than the endpoint that exports a report. The query that loads a user's session on every request runs thousands of times per hour. The query that generates a billing statement runs once a month.

High frequency plus inefficiency equals most of the database load. A slightly inefficient query that runs 10,000 times per hour consumes more resources than an extremely inefficient query that runs once a day.

The additional factor: application code often has N+1 query patterns at the high-frequency code paths — exactly where the multiplication factor is highest.

## Finding the query

Most database engines expose this data:

```sql
-- PostgreSQL: queries ordered by total time consumed
SELECT query, calls, total_exec_time, mean_exec_time,
       rows, 100.0 * total_exec_time / sum(total_exec_time) OVER () AS pct
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

The `total_exec_time` column aggregates all execution time for each query across all calls. The top query is usually responsible for 20–50% of all query execution time, without the team being aware of it.

MySQL/MariaDB: `performance_schema.events_statements_summary_by_digest`  
MongoDB: `db.currentOp()`, `system.profile`, `explain()`  
SQL Server: `sys.dm_exec_query_stats`

## What to do with the finding

**For high-execution-time, low-call queries:** these are expensive queries being called infrequently. Usually a missing index or an inefficient join. Adding an appropriate index typically reduces execution time by 10–100x.

**For moderate-execution-time, high-call queries:** these are the dangerous ones — small queries called in a loop. The fix is almost always moving the loop to the database (a single query with a WHERE clause or a JOIN) instead of calling the database in a loop.

**For queries with high sequential scan costs:** the query is reading more data than it needs to answer the question. The fix is either an index, or a query rewrite that filters more aggressively earlier.

The best time to look at these numbers is before there is a performance problem. The second best time is right now.
