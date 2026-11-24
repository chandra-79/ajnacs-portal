---
title: "Architecture decision records are only useful if people read them when making new decisions"
description: "Architecture decision records are only valuable if they're consulted when new decisions are being made in the same domain."
date: 2029-03-09
tags: ["Software Engineering", "Engineering Leadership"]
format: article
derived: true
---

Architecture decision records are only valuable if they're consulted when new decisions are being made in the same domain. A well-written ADR that nobody reads when designing a new system is archival documentation, not institutional knowledge.

The failure mode: ADRs are written after decisions are implemented and socialised, capturing what was decided without the reasoning about what was considered and rejected. They're stored in a Confluence space that requires knowing to look for them. Nobody references them in design reviews because nobody remembers they exist.

An ADR needs the context, decision, status, and consequences; the **alternatives section** is especially useful when it records: we considered A, B, and C; we rejected A because of X, B because of Y; we chose C with the trade-offs Z, which we accepted because of W. This is the knowledge that prevents decisions from being relitigated by a team that arrives later without the context.

"We chose Postgres" is trivially reconstructable. "We considered Cassandra for the write throughput, rejected it because the engineering team had no operational experience and the expected query patterns were relational, considered a particular managed database deployment but rejected its proposed region and replication arrangement against the documented residency requirement, and chose Postgres with PgBouncer to handle the connection pool" — that second version prevents three future teams from having the same conversation.

The practices that make ADRs work: store them in the repository so they're discoverable where engineers work, link from the relevant system README, write them during the decision process not after, and refer to them explicitly in design reviews. The reference habit is the one that determines whether ADRs have value.

## Keep facts and assumptions visibly different

A decision record should not imply that a database product is unsuitable for a requirement without explaining the actual deployment options considered. Data residency, for example, depends on region, replication, backups, logs, support access, and organisational policy. Name the concrete constraint and tested configuration instead of using a product name as shorthand for non-compliance.

For a fictional search service, record four assumptions: daily data size, required freshness, query types, and support ownership. Three are backed by a measurement or an assigned owner; freshness remains a stakeholder estimate. The chart shows that evidence gap. It is not a maturity score. The unresolved assumption may matter more than all three confirmed ones if it determines the architecture.

Add a short evidence link for each assumption and a condition for reconsideration. A query benchmark should identify its dataset and workload. A support agreement should identify the accountable team. An unknown should remain marked unknown until the team obtains evidence or makes a conscious risk decision.

During the next design review, start from the current record and ask what changed. If a new requirement invalidates the decision, supersede it and link the replacement. Do not rewrite the old record to make history appear more prescient. Keeping the earlier rationale lets later engineers distinguish a reasonable decision under old constraints from a mistake that was never examined.

## Further reading and source boundaries

- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
