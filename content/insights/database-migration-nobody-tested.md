---
title: "The database migration nobody tested is the one that runs in production at 11pm."
description: "The most common pattern in database migration incidents: the migration worked perfectly in every environment that was not production."
date: 2025-09-01
tags: ["Data Engineering", "Engineering Leadership"]
format: note
---

The most common pattern in database migration incidents: the migration worked perfectly in every environment that was not production. Development databases are small, have uniform data, and lack the index cardinality and row distribution that drives migration performance at scale. Staging databases are production architecture with test data that doesn't reflect production data shapes.

The specific failure mode that repeats: an ALTER TABLE statement that acquired a table lock in 0.3 seconds in staging held an exclusive lock for eleven minutes in production while it rewrote an 800GB table. During those eleven minutes, every write to that table queued. The queue depth exceeded connection pool limits. The application returned errors. The on-call engineer was paged at 11:47pm on a Friday.

The rollback procedure had been written but never tested. It turned out to have a syntax error.

Structural practices that prevent this: test migration performance on a production-scale data clone before release, not a scaled-down version. Measure lock acquisition and duration in the test environment. Validate rollback procedures by running them — not by reading them. For large table modifications, prefer online schema change tools (pt-online-schema-change, gh-ost) that avoid full table locks entirely.

The organizational practice that matters as much: create a channel for the engineer who knows a migration is risky to make that concern loud enough to delay a release. Most migration disasters had a person who had doubts and said nothing because the release was scheduled.
