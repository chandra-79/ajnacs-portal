---
title: "Every system has one query that explains 40% of the database load. You already know which one it is."
description: "The query everyone knows about is usually not mysterious."
date: 2025-07-15
tags: ["Data Engineering", "Architecture"]
format: note
derived: true
---

The query everyone knows about is usually not mysterious. It is a full table scan that runs on every page load, a report query that aggregates three years of data without a partition key, or a join between tables that grew to millions of rows after the query was written when they had thousands.

The reasons it persists are organizational, not technical. It takes focused effort to investigate and fix, the fix usually requires either an index change, a query rewrite, or a data model change — all of which carry risk — and the pain is distributed (slightly slower for everyone, slightly more load on the database) rather than concentrated in a visible incident.

The database performance work that produces the most value: identify the top five queries by cumulative execution time (not worst single execution, but frequency × execution time). Fix those in order. The first one typically has an obvious fix that someone has already proposed. The second often surfaces something less obvious. The process of fixing the known-bad query also tends to surface the unknown-bad queries that appeared after the codebase stopped receiving careful attention.

Enable slow query logging. Review it monthly. The surprises are always there.
