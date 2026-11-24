---
title: "Find the Queries That Actually Account for Database Work"
description: "Use measured statement totals and execution plans to prioritize database work, with a synthetic example that separates frequency from latency."
date: 2029-03-26
tags: ["Data Engineering", "Architecture"]
format: note
derived: true
---

The query everyone knows about is usually not mysterious. It is a full table scan that runs on every page load, a report query that aggregates three years of data without a partition key, or a join between tables that grew to millions of rows after the query was written when they had thousands.

The reasons it persists are organizational, not technical. It takes focused effort to investigate and fix, the fix usually requires either an index change, a query rewrite, or a data model change — all of which carry risk — and the pain is distributed (slightly slower for everyone, slightly more load on the database) rather than concentrated in a visible incident.

The database performance work that produces the most value: identify the top five queries by cumulative execution time (not worst single execution, but frequency × execution time). Fix those in order. The first one typically has an obvious fix that someone has already proposed. The second often surfaces something less obvious. The process of fixing the known-bad query also tends to surface the unknown-bad queries that appeared after the codebase stopped receiving careful attention.

Enable slow query logging. Review it monthly. Use the review to verify which statements account for the observed workload.

## Rank total work before choosing a fix

There is no universal rule that one query accounts for 40% of database load. Work can be concentrated in a few statements, spread across many requests, or dominated by locks, writes, maintenance, and connection handling. Use statement statistics to establish the actual distribution before deciding that an index is the answer.

In a fictional one-hour sample, statement A executes 20,000 times with a mean execution time of 12 milliseconds. Its accumulated execution time is 240 seconds. Statement B executes 100 times at 1,500 milliseconds, accumulating 150 seconds. Statement C executes 2,000 times at 30 milliseconds, accumulating 60 seconds. A is the largest of these three contributors even though B has the slowest individual executions. The sum is 450 seconds of accumulated statement execution time, not 450 seconds of CPU time or elapsed wall time; concurrent work can overlap.

## Turn the ranking into an investigation

Capture the interval, reset time, calls, mean and total execution time, rows and available I/O indicators. Separate applications and tenants where the available labels permit it. A statement normalized to one identifier can hide radically different parameter distributions, so inspect representative slow and common parameters before applying a fix.

For A, determine whether the application asks the same question repeatedly. Reducing redundant calls might matter more than shaving a few milliseconds from each call. For B, inspect the plan and row estimates, then test indexing, join order, selectivity and working-memory behavior against a realistic fixture. For C, establish whether 30 milliseconds already meets the service objective. A ranked list is a triage input, not an instruction to optimize every item.

Use EXPLAIN without ANALYZE first when inspecting an unfamiliar statement. EXPLAIN ANALYZE executes it, including write effects for modifying statements. Run invasive investigations on a controlled copy with representative statistics. Keep before-and-after result checks, write overhead, index size and tail latency alongside the headline speed. Stop when the service objective is met and the maintenance cost is justified.

### Figure methodology

Synthetic one-hour sample. Accumulated execution seconds equal calls multiplied by mean milliseconds divided by 1,000. Values overlap under concurrency and are not CPU utilization.

| Worked observation | seconds |
| --- | ---: |
| Statement A total | 240 |
| Statement B total | 150 |
| Statement C total | 60 |

## Primary references and further study

- [PostgreSQL statement statistics](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [PostgreSQL EXPLAIN semantics](https://www.postgresql.org/docs/current/using-explain.html)
