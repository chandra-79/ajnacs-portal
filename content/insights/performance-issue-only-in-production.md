---
title: "The performance issue that only appears in production is usually a data volume assumption, not a code bug"
description: "When a performance issue only appears in production, the most likely explanation isn't a bug that was accidentally introduced — it's an assumption about scale that holds in development…"
date: 2029-06-27
tags: ["Software Engineering", "Data Engineering", "Observability"]
format: note
derived: true
---

When a performance issue only appears in production, the most likely explanation isn't a bug that was accidentally introduced — it's an assumption about scale that holds in development and breaks in production.

The patterns that produce this:

**Volume-dependent query performance**: a database query that returns in 20ms against 50,000 records takes 45 seconds against 5 million. The query planner's execution plan changes with data statistics. An index that's used efficiently at small scale gets abandoned at large scale in favour of a sequential scan that the planner incorrectly estimates as cheaper.

**N+1 queries invisible in testing**: unit tests call a function once. Production calls it 200 times per request. The one extra query per object that was imperceptible in tests becomes 200 database round trips under real traffic.

**Serialisation under concurrency**: an operation that completes in 50ms is fine in isolation. Under production concurrency, a lock or a serialised resource creates queuing. The p99 latency is 3 seconds and the median is still 60ms, so it doesn't show in averages.

The preventive discipline: performance test against production-scale data before first deployment, not just functionally correct test data. Include representative traffic patterns in performance scenarios — the distribution of request types and their temporal clustering — not just peak load. And monitor query execution plans in production, not just query response times.

Scale assumptions aren't code bugs. They're unverified hypotheses about behavior under conditions you didn't test.
