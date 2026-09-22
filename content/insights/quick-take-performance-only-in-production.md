---
title: "The Performance Problem That Only Appears in Production Is Usually About Data Volume"
description: "Code that is fast on development data and slow on production data is revealing something about its design — usually an assumption about data size that was never tested at real scale."
date: 2028-10-27
tags: ["Software Engineering", "Data Engineering", "Observability"]
format: article
---

The feature works in development. It works in staging. It goes to production and slows to a crawl for specific users, specific queries, or at specific times of day.

The temptation is to attribute this to "production environment differences" or "environment-specific configuration." In most cases, the real explanation is simpler and more controllable: the code has a data volume assumption that was never tested.

## What data volume assumptions look like

**A query that filters in application code instead of the database.** SELECT * FROM orders returns 1,000 rows in development and 2.3 million rows in production. The application loads all rows, iterates through them, and returns the 12 that match the filter. In development: 80ms. In production: out of memory.

**A N+1 query that scales with data set size.** The code fetches a list of 50 users, then for each user fetches their last order in a separate query. In development with 50 users: 51 queries, fine. In production with 50,000 users: 50,001 queries, catastrophic.

**A function that is linear when it should be logarithmic.** A search function that scans every element in a list works perfectly for 1,000 items. For 10 million items, the same function produces timeouts. The algorithm was correct. The scale assumption was wrong.

**A JOIN without an appropriate index.** Two tables joining on a column that has an index when tables have 10,000 rows each and no index when they have 10 million rows each. The query planner chooses a hash join in the small case (fast) and a nested loop in the large case (catastrophic). The behavior change happens at a data volume threshold that development never reached.

## Finding the assumption before production finds it

The most reliable approach is to test with production-scale data before deploying to production. This requires a recent snapshot of production data in a non-production environment. This is a data governance challenge (masking PII), an infrastructure cost (storage and compute for a production-size environment), and an operational process (keeping the snapshot recent enough to be representative).

The investment pays back the first time it catches a data volume performance bug before production does.

The second-best approach: code review focused specifically on data assumptions. How many rows does this query return? Is this filtered in the database or in the application? Is this loop on a collection that could be large? These questions are cheap to ask during review and expensive to answer during an incident.

The performance problem that only appears in production is sending a message about something the code assumed. Listen to it.
