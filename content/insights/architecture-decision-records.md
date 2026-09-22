---
title: "Architecture decision records are only useful if people read them when making new decisions"
description: "Architecture decision records are only valuable if they're consulted when new decisions are being made in the same domain."
date: 2026-03-18
tags: ["Software Engineering", "Engineering Leadership"]
format: article
---

Architecture decision records are only valuable if they're consulted when new decisions are being made in the same domain. A well-written ADR that nobody reads when designing a new system is archival documentation, not institutional knowledge.

The failure mode: ADRs are written after decisions are implemented and socialised, capturing what was decided without the reasoning about what was considered and rejected. They're stored in a Confluence space that requires knowing to look for them. Nobody references them in design reviews because nobody remembers they exist.

The value of an ADR is almost entirely in the **alternatives section**: we considered A, B, and C; we rejected A because of X, B because of Y; we chose C with the trade-offs Z, which we accepted because of W. This is the knowledge that prevents decisions from being relitigated by a team that arrives later without the context.

"We chose Postgres" is trivially reconstructable. "We considered Cassandra for the write throughput, rejected it because the engineering team had no operational experience and the expected query patterns were relational, considered DynamoDB but rejected it due to data residency requirements, and chose Postgres with PgBouncer to handle the connection pool" — that second version prevents three future teams from having the same conversation.

The practices that make ADRs work: store them in the repository so they're discoverable where engineers work, link from the relevant system README, write them during the decision process not after, and refer to them explicitly in design reviews. The reference habit is the one that determines whether ADRs have value.
