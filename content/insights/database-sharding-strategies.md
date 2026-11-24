---
title: "Database Sharding: The Strategies, the Resharding Problem, and When Not To"
description: "Evaluate hash, range and directory sharding through key distribution, cross-shard operations and a rehearsed resharding plan."
date: 2027-01-25
tags: ["Data Engineering", "Distributed Systems", "Architecture", "Programming", "Scalability"]
format: article
---

Sharding — partitioning one logical database across many independent nodes — is the scaling technique with the highest ratio of prestige to necessity in backend engineering: architecturally fascinating, occasionally essential, and reached for years before its time by teams whose actual bottleneck was a missing index, an unbounded query, or a read load that replicas would have absorbed. The discipline deserves respect from both directions: knowing how to shard when the write ceiling genuinely arrives, and knowing the full list of things to exhaust first — because sharding is the move that converts your database from a system into a *distributed* system, importing this series' entire problem catalog (cross-node consistency, rebalancing, hot spots, the death of the global join) permanently.

## Exhaust the alternatives first

The pre-sharding checklist, in the order the envelope math recommends: **vertical headroom** (modern single nodes are enormous — the biggest cloud instances carry workloads that "needed" sharding a hardware generation ago; the single-node renaissance applies to the write path too), **read offload** (replicas plus the caching stack absorb the read-heavy majority of "database overload" — sharding can distribute writes, reads and working sets, and misdiagnosing a read problem as one is the classic error), **workload surgery** (the plan-reading and indexing disciplines; the archival tier moving cold data out per the retention economics — the table that's 90% history the application never touches; the queue absorbing write bursts per the messaging patterns), and **functional decomposition** (the modular-monolith data discipline: moving a bounded context's tables to its own database is *vertical* partitioning — potentially simpler when the domain boundary matches the workload, aligned with team boundaries, and frequently the actual answer to "our database is too big"). Sharding earns its complexity when a *single entity type's* write volume or working set exceeds one node — the genuine horizontal ceiling — and not before.

## The key decides everything

Shard-key selection is the design moment; everything downstream is consequence. The requirements pull against each other: **distribution** (writes spread evenly — the key whose hash balances, per the consistent-hashing math, versus the whale-tenant and celebrity-entity skew that concentrates one shard — the hot-partition physics, now at database scale), **colocation** (the queries that must be fast should resolve *within* one shard — which is why "shard by tenant" dominates SaaS: the multi-tenancy access pattern keeps each customer's queries local — and why the key should match the *dominant query dimension*: user-keyed for user-centric access, entity-keyed where the entity is the unit of work), and **stability** (keys that change force row migration — shard on the immutable). The scheme choices follow: **hash sharding** (uniform distribution, range queries scattered — the default where point access dominates), **range sharding** (locality for range scans, hot-tail risk where the range is time — the newest data on the newest shard receiving all the writes: the anti-pattern unless deliberately managed), and **directory/lookup sharding** (a mapping service assigning entities to shards — maximum flexibility, the whale tenant movable to its own shard per the isolation ladder, at the price of the directory as a tier-zero dependency — the same shape as the home-region model from multi-region practice, because it *is* that model, one layer down).

The costs arrive with the first cross-shard requirement: queries spanning shards become scatter-gather (fan-out, partial-failure handling, the latency of the slowest shard — the tail-at-scale math), global transactions require a supported distributed transaction protocol or an application workflow with different semantics (the distributed-transaction chapter, now mandatory reading), global uniqueness needs new machinery (ID generation moves to the snowflake-style schemes; a unique-email constraint needs an atomic reservation or equivalent coordinated mechanism), and broad analytical queries often move to a separate derived store (the CDC rails to the warehouse — the shards serve the application; the lakehouse serves the questions, per the derived-store division).

## Resharding is the real test

The shard count chosen at migration will be wrong eventually, and **the resharding story is where designs prove themselves**: the naive modulo-N scheme requires moving *most* data when N changes (the consistent-hashing lesson at its origin), so serious designs decouple logical from physical — **many virtual shards mapped to fewer physical nodes** (thousands of slots, per the Redis-cluster pattern; splitting becomes remapping slots, not rehashing rows), or the directory scheme's per-entity mobility. The migration mechanics for live resharding are the expand/contract discipline at maximum stakes: dual-write windows, backfill with checkpointing, verified convergence (the reconciliation counts), read cutover per slot, and the rollback path rehearsed — plus the operational reality that every mature platform learned: resharding is not an event but a *capability*, exercised routinely at small scale (moving one hot tenant) so the machinery works when the big rebalance arrives (the DR-rehearsal logic, applied to data movement).

The modern short-circuit deserves its honest billing: the **distributed-SQL tier** (the Spanner-lineage and Citus/Vitess-class systems) productizes exactly this machinery — automatic sharding, resharding, and distributed queries behind a mostly-SQL interface — and the build-vs-buy framework applies with force: operating hand-rolled sharding middleware is a platform-team commitment that only the largest estates should still be making; the decision that remains yours regardless is the *shard key and colocation model*, because no product can choose your dominant access pattern for you — and a bad key on managed infrastructure is still a bad key, now with better dashboards.

The closing calibration mirrors the modular-monolith's: distribution is a cost paid for a named force. Exhaust the single-node envelope, offload the reads, decompose by domain — and when the genuine write ceiling arrives, shard on the immutable key that matches your dominant access pattern, keep logical-to-physical indirection for the resharding you'll eventually need, and buy the machinery unless you're sure you're the exception. The teams that sharded well are, almost uniformly, teams that established a concrete need and rehearsed the operating model.

## Establish the bottleneck and the invariant boundary

Sharding can distribute storage, reads and writes, but it does not automatically fix an inefficient query or one contended record. Measure the limiting resource: CPU, I/O, memory, lock contention, replication or connection pressure. A single hot account updated serially may remain a bottleneck after every unrelated account moves elsewhere. A global report may become slower if it now needs many remote queries.

Document the operations that must remain atomic and the queries that must be colocated. For an order service, order header, lines and payment state may have a shared transactional boundary. A tenant key can keep those records together if all relevant entities carry it consistently. Cross-tenant administration, global uniqueness and reporting still need explicit designs. Do not discover those requirements only after the first production split.

### A hypothetical imbalance calculation

Suppose four shards receive 4,000 requests per second in total. Three receive 500 each and one receives 2,500. The mean is 1,000, but the busiest shard handles 2.5 times the mean and five times each quiet shard. If a movable tenant responsible for 1,500 requests per second is transferred to a new fifth shard, the old hot shard falls to 1,000 while the new shard receives 1,500. The maximum falls from 2,500 to 1,500, a forty-percent reduction under these assumptions.

The chart compares the original mean, original maximum and new maximum. These synthetic rates assume the tenant can be moved independently and that capacity is otherwise identical. They do not prove a forty-percent latency improvement. The new node still exceeds the five-shard average of 800, and one very hot record within the tenant could remain problematic. Distribution quality must be assessed from actual load, not only row counts.

## Logical placement and physical ownership

A directory or virtual-shard map separates stable application identifiers from current placement. It also introduces a consistency problem: every router must know which location is authoritative during a move. Version the mapping and define how stale clients are redirected or rejected. If both old and new locations accept writes without coordination, a supposedly simple rebalance becomes a split-brain data migration.

Use a documented migration protocol with a copy phase, ongoing-change catch-up, reconciliation and an explicit ownership switch. The source may remain readable for rollback, but write authority must be clear. A brief coordinated cutover can be safer than an indefinite dual-writer period. The correct mechanism depends on the database product and availability objective; do not invent a generic dual-write procedure and assume atomicity across databases.

The mapping service itself needs availability, backup and change audit. Cache entries require an expiry or version protocol, and a map update should be recoverable. Test the loss of the directory and the restart of a router holding an old map. Routing correctness is part of data correctness, not merely a performance optimization.

## Global operations need an explicit cost model

A scatter-gather query must handle a slow shard, an unavailable shard and partial results. Decide whether the caller waits for all shards, fails the query or receives a visibly incomplete answer. A global total that silently omits one shard is especially dangerous because it can look plausible. Include a completion vector or another explicit completeness indicator where partial reporting is permitted.

Global pagination requires a stable ordering and merge protocol. Fetching fifty rows from each shard and merging can be correct for some top-N queries, but cursor design becomes more complex as data changes. Document how ties, inserts and shard moves affect the next page. Avoid returning a single opaque offset that cannot represent the distributed state consistently.

Unique identifiers and unique business attributes are different problems. A distributed ID generator can reduce collision risk or coordinate uniqueness under its design, but it does not enforce that two customers cannot claim the same email address. A directory lookup alone is also insufficient under concurrent requests; use a conditional reservation or transactional mechanism with a stated authority.

## Resharding is a recovery exercise as well as a capacity tool

A migration must survive a worker crash, delayed change stream, network partition and a failed destination. Store progress checkpoints and verify that replay is safe. Reconcile counts, checksums or domain totals at a defined source position, accounting for concurrent updates. A matching row count does not prove that values or deletions match.

Measure how much source and destination capacity the move consumes. Backfill traffic can degrade the service that the rebalance was intended to improve. Throttle against foreground latency, replication lag and disk headroom. Keep the rollback window realistic: after the destination accepts new writes, returning to the old shard requires those writes to be reconciled, not simply changing a pointer back.

### A shard-key decision worksheet

For three candidate keys, list distribution, largest-key load, query colocation, mutation frequency and regulatory or residency constraints. Replay a representative access log into a model to estimate per-shard load, then test the candidate system with skewed data. Include the busiest tenant and cross-shard queries. Random uniform test data alone is insufficient.

Rehearse moving one bounded entity group in a disposable environment. Interrupt each phase and verify routing, final data and rollback behavior. Record the observed migration rate and the minimum headroom needed. If the team cannot explain who owns writes at every phase, the migration is not ready for production.

## Evaluate managed distribution on its actual semantics

Distributed SQL and sharding products differ in transaction support, query planning, replication and operational limits. Compare the required operations against the selected product's documented behavior rather than treating all products as equivalent implementations of automatic sharding. A managed control plane reduces some work but does not choose a good data model or remove skew.

The decision record should name the measured limit that justified distribution, the chosen placement key, expected cross-shard operations and the recovery procedure. Retain a simpler alternative in the analysis so the complexity has a clear purpose. Sharding is successful when the workload gains useful capacity while its invariants and operating procedures remain understandable.

### Figure methodology

Synthetic initial loads are 500,500,500 and 2,500 requests/s. Moving an independent 1,500-request/s tenant to a fifth shard leaves 500,500,500,1,000,1,500. Maximum drops 40%; no latency or uniform-capacity claim is implied.

| Worked observation | requests per second |
| --- | ---: |
| Original mean | 1000 |
| Original busiest | 2500 |
| New busiest | 1500 |

## Primary references and further study

- [Citus distribution columns and colocation](https://docs.citusdata.com/en/stable/sharding/data_modeling.html)
- [Original Dynamo design paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
