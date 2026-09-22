---
title: "PostgreSQL vs NoSQL: How to Make the Database Decision Without Regretting It"
description: "The PostgreSQL vs NoSQL decision is made too often on the wrong criteria — data model novelty rather than operational requirements, scale trajectory, and query patterns. Here's the framework that produces decisions that hold up."
date: 2025-05-29
tags: ["Data Engineering", "Architecture"]
format: article
---

The database choice early in a project compounds in both directions. A good choice that fits the access patterns, scales with the workload, and matches the team's operational experience produces years of reliable service. A poor choice requires a migration at the worst possible time — when the system is under load and the engineering team is focused on other priorities.

The decision framework that holds up is not "which database is more modern" or "which has better benchmarks" — it is "which database fits these specific access patterns, this scale trajectory, and this operational model?"

## Start with access patterns

The single most important input is how the data will be accessed: what queries will be run, at what frequency, and with what consistency requirements.

**Relational (PostgreSQL)** is the right default when:
- Data has well-understood relationships that benefit from joins
- Queries are varied and not fully predictable at design time (ad-hoc queries, reporting)
- Transactional integrity across multiple entities is required
- The data model is likely to evolve (schema migrations are manageable; NoSQL schema evolution is often harder in practice, not easier)
- The team has strong SQL skills and limited NoSQL operational experience

**Document (MongoDB, DynamoDB)** is a better fit when:
- Data is naturally hierarchical and is almost always read together (a user profile with embedded preferences, a product catalog with nested attributes)
- Access patterns are known and simple at design time (lookup by key, scan with specific filters)
- Schema flexibility is genuinely needed (different entities in the same collection have substantially different structures)
- Write throughput requirements exceed what PostgreSQL can provide with a single primary

**Key-value (Redis, DynamoDB)** is optimal for:
- Simple get/set by a known key — session state, cache entries, leaderboards
- Data with a natural expiry (TTL-based cleanup without scheduled jobs)
- Extremely high throughput (millions of requests per second) with simple access patterns

**Wide-column (Cassandra, Bigtable)** for:
- Time-series data with extremely high write throughput
- Data that is naturally partitioned by a high-cardinality key and queried by that key
- Multi-region active-active writes (Cassandra's eventual consistency model enables this)

## The PostgreSQL ceiling is higher than most teams expect

A common reason teams choose NoSQL early: concern that PostgreSQL won't scale. PostgreSQL's practical scale ceiling — with appropriate hardware, connection pooling (PgBouncer), read replicas, and well-indexed queries — is substantially higher than most applications require.

Rough thresholds where PostgreSQL handles without exotic configuration:
- Single primary: 10,000-50,000 transactions per second for simple workloads
- With read replicas: several times that for read-heavy applications
- Storage: multiple terabytes without significant performance degradation with appropriate partitioning

Applications that need to scale beyond this exist; they are not the common case. Starting with PostgreSQL and migrating when the limits are actually reached is less risky than starting with a NoSQL database and discovering that the relational guarantees you eventually need require a migration back.

## The operational experience factor

Operational experience matters more than it gets credit for. PostgreSQL is a mature, deeply documented, widely understood database. Runbooks for common failure scenarios exist. Expertise is widely available. The failure modes are known.

NoSQL databases are individually less well-understood. Cassandra's data model, tuning, and operational behavior are significantly different from PostgreSQL's. DynamoDB's capacity model, hot partition behavior, and Global Secondary Index constraints surprise teams that have not operated it before.

Choosing a database that is unfamiliar to the team adds operational risk that is often not accounted for in the initial decision. This risk is manageable if the team invests in learning; it is costly if it is not.

## The schema flexibility argument

The claim that document databases allow you to avoid upfront schema design is frequently inverted in practice. Without a schema, validation moves from the database to the application. Data quality diverges as different application versions write different structures. Queries that need to handle multiple possible shapes become complex and slow.

In practice, document databases benefit from schema validation (MongoDB's JSON Schema validation, DynamoDB's single-table design discipline). The flexibility is real and useful in specific cases; it is not a substitute for data modeling.

PostgreSQL's JSONB column type offers a middle path: store structured data with a defined schema for most columns, use JSONB for genuinely variable attributes, and query both with standard SQL.

*Working through a database architecture decision or evaluating a migration from one database type to another? [Happy to think through the access pattern analysis.](/contact)*
