---
title: "Production-Only Performance Problems: Investigate Data and Workload Assumptions"
description: "Reproduce skew, query shape, and concurrency before choosing an index or code change."
date: 2028-10-27
tags: ["Software Engineering", "Data Engineering", "Observability"]
format: article
---

The feature works in development. It works in staging. It goes to production and slows to a crawl for specific users, specific queries, or at specific times of day.

The temptation is to attribute this to "production environment differences" or "environment-specific configuration." One explanation worth testing is an unverified assumption about data volume or distribution.

## What data volume assumptions look like

**A query that filters in application code instead of the database.** SELECT * FROM orders returns 1,000 rows in development and 2.3 million rows in production. The application loads all rows, iterates through them, and returns the 12 that match the filter. In development: 80ms. In production: out of memory.

**A N+1 query that scales with data set size.** The code fetches a list of 50 users, then for each user fetches their last order in a separate query. In development with 50 users: 51 queries, fine. In production with 50,000 users: 50,001 queries, catastrophic.

**A function that is linear when it should be logarithmic.** A search function that scans every element in a list works perfectly for 1,000 items. For 10 million items, the same function produces timeouts. The algorithm was correct. The scale assumption was wrong.

**A JOIN without an appropriate index.** A join may become expensive as cardinality, selectivity, or row-count estimates change. Inspect the actual execution plan and access paths; table growth does not itself remove an index, and a nested loop can be appropriate with a selective indexed inner lookup.

## Finding the assumption before production finds it

The most reliable approach is to test with production-scale data before deploying to production. This can use carefully generated representative data, or an authorised and appropriately protected production-derived dataset. This is a data governance challenge (masking PII), an infrastructure cost (storage and compute for a production-size environment), and an operational process (keeping the snapshot recent enough to be representative).

The investment pays back the first time it catches a data volume performance bug before production does.

The second-best approach: code review focused specifically on data assumptions. How many rows does this query return? Is this filtered in the database or in the application? Is this loop on a collection that could be large? These questions are cheap to ask during review and expensive to answer during an incident.

The performance problem that only appears in production is sending a message about something the code assumed. Listen to it.

## Reproduce the distribution, not just the row count

Data volume is one plausible cause of a production-only slowdown. Network paths, concurrency, cache state, permissions, query parameters, background work, and resource limits can also change performance. Start with evidence from a slow operation rather than assuming that every incident is a missing index. A plan that is fast for one tenant can be poor for another even when both requests use the same query text.

Create a synthetic dataset with skew. Suppose 100 small tenants each have 100 orders, while one large tenant has 100,000. Total rows are 110,000, but the largest tenant holds about 90.9% of them. A uniformly generated test dataset with the same total count will not reproduce that access pattern. Record the tenant distribution, time ranges, null frequency, and relevant correlation between columns.

The chart compares 100 rows for a small tenant with 100,000 for the large tenant. It deliberately does not predict elapsed time. A thousand-fold increase in matching rows does not imply a thousand-fold increase in latency: access paths, caching, result limits, and work done per row all matter.

## A controlled investigation

Capture the query shape and the parameters needed to reproduce the slow case, while avoiding sensitive customer payloads. In a disposable database, run the same query against representative small and large tenants. Inspect estimates before execution; use an execution plan with runtime measurements only where it is safe to run the statement. PostgreSQL's `EXPLAIN ANALYZE` executes the query, so a mutating statement needs special care and an appropriate isolated test.

Compare estimated and actual row counts, repeated inner operations, buffers read, sort spill, and returned rows. An index is useful when it supports the actual predicate and ordering, but its write and storage costs belong in the evaluation too. Neither nested loops nor hash joins are inherently bad; suitability depends on the workload and available access paths.

Change one factor, rerun the same workload, and retain the baseline plan. Test a cold and warm cache, and add representative concurrency before recommending a production change. A single faster execution after data was cached is not strong evidence of an improved query.

For the regression check, assert a meaningful property such as a bounded result size, a query-count budget, or acceptable latency under a controlled dataset and resource allocation. Avoid asserting an exact plan string that may change after a justified database upgrade. The test should catch the original scaling assumption while allowing the optimiser to improve. Store the generator seed and schema alongside the test so a future engineer can reproduce the same skew without needing access to customer records.

## Further reading and source boundaries

- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL: LIMIT and OFFSET](https://www.postgresql.org/docs/16/queries-limit.html)
