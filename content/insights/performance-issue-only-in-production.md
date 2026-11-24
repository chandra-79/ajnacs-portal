---
title: "Production-Only Slowdowns: Test the Assumptions Development Missed"
description: "Investigate data distribution, query counts, concurrency, and resource limits with a reproducible workload."
date: 2029-06-27
tags: ["Software Engineering", "Data Engineering", "Observability"]
format: note
derived: true
---

When a performance issue only appears in production, inspect the assumptions that differ from development, including scale, data distribution, concurrency, and resource limits.

The patterns that produce this:

**Volume-dependent query performance**: a database query that returns in 20ms against 50,000 records takes 45 seconds against 5 million. The query planner's execution plan changes with data statistics. The planner may change access paths as statistics and estimated costs change; inspect whether the new plan is appropriate rather than assuming a sequential scan is an error.

**N+1 queries invisible in testing**: unit tests call a function once. Production calls it 200 times per request. The one extra query per object that was imperceptible in tests becomes 200 database round trips under real traffic.

**Serialisation under concurrency**: an operation that completes in 50ms is fine in isolation. Under production concurrency, a lock or a serialised resource creates queuing. The p99 latency is 3 seconds and the median is still 60ms, so it doesn't show in averages.

The preventive discipline: performance test against production-scale data before first deployment, not just functionally correct test data. Include representative traffic patterns in performance scenarios — the distribution of request types and their temporal clustering — not just peak load. And monitor query execution plans in production, not just query response times.

An unverified scale assumption can be a design defect. Make the assumption explicit and test it under representative conditions.

## Separate the competing explanations

A production-only slowdown can come from data skew, concurrency, cache state, network routing, resource limits, or a changed dependency. Treat each as a hypothesis. A sequential scan can be the correct choice when much of a table is needed; an index scan is not automatically the healthy plan. Compare the actual work with the query's purpose before changing indexes.

In a fictional request, the application loads 200 accounts and then fetches one preference record for each account. That produces 201 queries: one list query plus 200 lookups. A batched implementation uses one list query and one preference query, for two queries total. The chart compares round-trip counts only. It does not claim a 100-fold latency improvement, because result size, database work, concurrency, and network delay also matter.

Reproduce the request with a synthetic dataset that includes large and small accounts. Record returned rows, query count, elapsed time, and the resource allocation. Run both implementations under the same conditions. If the batch query returns excessive data, fix that before calling the lower query count an improvement.

Add a regression test for the original failure mechanism. For this example, a bounded query-count assertion catches accidental reintroduction of the per-account lookup. Pair it with an integration test that checks results for an account with no preference record and one with an unusual value. A performance change that silently drops those accounts is a correctness regression.

Keep the measurement definition with the test. The useful evidence is what changed under a declared workload, not a dramatic ratio detached from the work being performed.

## Further reading and source boundaries

- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL: LIMIT and OFFSET](https://www.postgresql.org/docs/16/queries-limit.html)
