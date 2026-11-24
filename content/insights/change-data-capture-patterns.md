---
title: "Change Data Capture: The Pattern That Quietly Rewired Enterprise Data Flow"
description: "Design CDC with explicit capture scope, ordering, replay and retention. Calculate backlog recovery and test duplicate and delete handling."
date: 2028-01-14
tags: ["Data Engineering", "Distributed Systems", "Integration"]
format: article
---

Every enterprise data architecture eventually faces the same shape of problem: the operational database holds the truth, and a growing crowd of other systems — the search index, the cache, the warehouse, the fraud model, the notification service — need to *know when the truth changes*. The historical answers all had famous flaws: dual-writes from the application (the atomicity lie: one write succeeds, the other doesn't, the systems drift — the exact dual-write problem the outbox pattern exists for), polling queries ("changes since last check" — lag, load, and missed hard deletes), and nightly batch ETL (a day of staleness as a permanent feature). Change Data Capture is the answer that won: **decode supported changes from the database replication log and publish a documented stream.**

## Why log-based CDC is the right trick

A supported transaction-log decoding mechanism can expose captured persistent table changes; configuration, source capabilities and connector semantics define the scope and ordering. Examples include Postgres logical decoding, MySQL binlog-based capture, Oracle redo-mining and SQL Server CDC. Their implementation and feature limits differ. Evaluate them for: **completeness** (supported captured inserts, updates and deletes, subject to configuration and replica identity), **low latency** (changes stream in near-real-time, not at batch cadence), **reduced application instrumentation** (log-based capture can observe supported writes without modifying each writer, although permissions, source settings, replica identity or connector requirements may still require changes), and **measurable source overhead** (decoding, snapshots and retained logs consume resources even when polling queries are avoided).

The canonical architecture is Debezium-shaped whether or not it's literally Debezium: a connector per source database reads the log and publishes change events (before/after images, operation type, transaction metadata) to Kafka-class topics — one topic per table, keyed by primary key — where any number of consumers independently build what they need: the Elasticsearch indexer maintaining the search projection, the cache invalidator, the warehouse loader (streaming into the lakehouse in minutes instead of nightly), the analytics enricher, the microservice keeping its local read model current. The source system remains blissfully unaware; consumers scale and evolve independently — which is exactly the log-semantics promise from messaging practice, with the database itself as the producer.

## The fine print: what CDC consumers must understand

CDC's power comes with semantics that bite the unprepared:

**Initial state plus changes.** A consumer that needs existing rows usually combines a snapshot with the change stream. The snapshot represents state at a defined boundary; it does not reconstruct all historical changes before capture began. Some consumers deliberately start from a log position without a snapshot. For a full bootstrap, test the connector's snapshot-to-stream handoff, duplicate treatment and supported concurrent changes. Incremental snapshots are product capabilities with their own consistency and ordering rules, not a universal promise that arbitrary tables can be rebuilt without coordination.

**At-least-once, ordered per key.** The usual weather: duplicates on connector restarts (consumers idempotent, as ever — upsert-by-key helps, but consumers also need safe ordering or version checks), ordering depends on the source, connector and partitioning contract, and should not be assumed across tables — which matters because…

**Transactions arrive dismembered.** A source transaction touching three tables becomes events on three topics with no atomic delivery; consumers see intermediate states (the order-header event before its line-items). For most projections (search, cache, analytics) this eventual convergence is fine; for consumers needing transactional coherence, the metadata exists (transaction markers) to reassemble — at real complexity cost. Design consumers to converge per-key rather than demanding cross-table atomicity, and the problem mostly dissolves.

**Schema changes ride the stream.** ALTER TABLE at the source becomes schema evolution downstream — the schema-registry-and-compatibility-rules discipline from messaging governance, mandatory here because the "producer" is a DBA's migration script. The expand/contract habits pay off doubly: additive-first changes reduce risk but still need connector and consumer compatibility tests.

**And deletes deserve explicit design:** distinguish the source delete event from a Kafka compaction tombstone and specify how each consumer removes state — the projection that never processes deletes grows a graveyard of ghost records, discovered during the compliance audit.

## CDC vs the outbox: complementary, not competing

A recurring architecture confusion worth settling: CDC captures *what changed in the tables*; the **outbox pattern** captures *what the application meant* — domain events with intention ("OrderPlaced", with its curated payload) written transactionally alongside the state change, then relayed (often *by* CDC, tailing the outbox table — the patterns compose). The placement rule: **table-level CDC for data integration** (projections, replication, analytics — consumers that want the data), **outbox for domain integration** (consumers that want the business event, decoupled from your schema — because raw CDC events *are* your schema, and publishing them to other teams couples every consumer to your table design; the anti-corruption transform or the outbox restores the boundary). Estates that skip this distinction end up with forty consumers parsing an internal table's before/after images, and a database schema that can never change again — the coupling CDC was supposed to prevent, reintroduced at the data layer.

## Running it: the operational vitals

CDC pipelines are production infrastructure with a distinctive failure physics: **replication-slot/log-retention pressure** (a stalled connector can retain source logs until configured limits or retention policies intervene — the Postgres replication slot that quietly fills the disk is the classic CDC incident; alert on slot lag and log retention *at the source*, because the failure lands there, not downstream), **end-to-end lag** as the product SLO (change-committed to projection-updated, per consumer — dashboard it, alert on it, publish it so downstream teams design against honest numbers), **connector recovery with an explicit delivery boundary** (offsets, snapshots, duplicate handling and failover tested; recovery may replay records even when source history is retained), and **the rebuild path as a rehearsed operation** — the whole architecture's superpower is that projections are *derived* and therefore rebuildable (re-snapshot, replay, cut over); estates that have never rebuilt a projection own untested backups, same genre.

The strategic summary: CDC converts the database's private diary into the estate's public circulatory system — low-latency when provisioned appropriately, with explicitly configured capture scope — and it has quietly become the default answer to "how do systems find out what happened" wherever event-driven rewrites are impractical, which is most places. Treat the stream as an API (schema governance, coupling discipline, outbox where intention matters), treat the pipeline as tier-one infrastructure (lag SLOs, slot alarms, rehearsed rebuilds), and the pattern pays compounding dividends: every new consumer of change — and there's always a new consumer of change — becomes a subscription instead of a project.

## Specify the capture boundary precisely

Log-based CDC is a mechanism for observing supported database changes, not a universal record of every meaningful business event. Configuration determines which tables, columns and operations are captured. Replica identity, permissions, connector capabilities and schema behavior affect the available before/after information. Review the source database and connector together before promising completeness.

A row update may mean a customer placed an order, an operator repaired a field or a backfill corrected historical data. Consumers cannot always infer business intent from the physical change. Use an explicit domain event when intent is part of the contract, often by writing an outbox record in the same source transaction. Raw table CDC remains useful for projections whose contract is the table state rather than a business action.

Initial snapshots can impose material source load and may hold locks or snapshots under documented modes. Streaming also consumes decoding, networking and storage resources. Measure the production impact and retention requirements instead of calling CDC negligible by definition. A useful pilot includes a full initial load, ordinary streaming and a rebuild after a prolonged interruption.

### A hypothetical catch-up budget

Suppose a source emits 2,000 changes per second and a consumer can apply 3,000 per second. During a ten-minute consumer outage, the backlog grows by 2,000 ×600 =1,200,000 changes. After restart, the net drain rate is 3,000 −2,000 =1,000 per second, so catching up takes 1,200 seconds, or twenty minutes. The chart shows backlog at restart, after ten minutes of recovery and after twenty: 1.2 million, 600,000 and zero.

These rates are synthetic and assume constant arrival and apply capacity, no further failures and retained source history. If apply throughput only equals incoming throughput, the backlog never shrinks. If the connector loses required log history, a new snapshot or other recovery path may be necessary. Capacity headroom and retention are therefore part of the freshness objective.

## Snapshot handoff and replay need explicit tests

A snapshot establishes initial state while new writes may continue. The connector's protocol must reconcile snapshot reads with the streaming position so records are neither missed nor incorrectly reverted. Use the documented snapshot mode and understand its consistency and locking behavior. A custom export followed by “start reading now” is not automatically an equivalent protocol.

Test inserts, updates and deletes occurring during the snapshot. Keep source identifiers and change positions with the fixture. After completion, compare the projection with a consistent source view or a controlled quiescent point. Row counts alone are insufficient: an update applied in the wrong order can leave the correct number of rows with incorrect values.

On restart, duplicate delivery is possible. An upsert by primary key avoids duplicate rows but does not by itself protect against an older event overwriting a newer one. Use the ordering guarantees of the transport and connector, or compare an appropriate source version before applying an update. If parallel processing changes per-key ordering, restore that constraint explicitly. Record how deletions participate in version checks so a replay cannot resurrect a deleted entity.

## Separate delete events from transport tombstones

A source delete event and a Kafka tombstone are related but different concepts. Connector configuration can emit a delete envelope and a subsequent null-valued message used for log-compaction semantics. Consumers must know which representation they receive and what it means. A sink that ignores both will retain removed records; one that mistakes an unrelated null for deletion can remove valid state.

Retention policy affects rebuilds. A compacted topic may retain the latest state for a key, but tombstone retention and consumer downtime determine whether a rebuilding consumer can observe an old deletion. Document the supported maximum outage and rebuild method. Do not assume that replaying whatever remains in a topic always reconstructs the full source correctly.

## Cross-table consistency is a product decision

Changes from a transaction can reach different projections or topics at different times. A search view may tolerate a temporary incomplete order, whereas a financial reconciliation may require a consistent transaction boundary. Transaction metadata can support coordination, but consumers must implement the required buffering, completeness and timeout rules. A marker in the stream is not automatic atomic publication at every sink.

Where feasible, publish a derived dataset version only after its required input boundary is complete. Otherwise expose freshness and provisional state to readers. Avoid letting a transient missing relationship become a permanent rejected record without a repair path. A short retry for an expected out-of-order dependency differs from endlessly retrying an invalid schema.

### Failure rehearsal worksheet

Create a source table and projection with a small known fixture. Exercise an insert, two rapid updates, a delete, a transaction touching two tables and a primary-key change if the application permits one. Interrupt the connector after some events have been delivered, restart it and verify final state. Repeat with a consumer that intentionally processes one event late.

Monitor retained WAL or equivalent source logs, connector position, transport lag and sink publication lag separately. A healthy connector does not prove a healthy sink. Alert on source disk headroom and retention risk because the operational database can fail while the consumer merely appears stale. Define who can pause capture, add capacity or rebuild, and what each action means for data loss or freshness.

## Schema evolution must include actual consumers

An additive source change can still break a consumer that rejects unknown fields, positional decoders or an incompatible generated schema. Test the connector's emitted representation and downstream compatibility, not just the ALTER statement. Renames, type changes and key changes need a staged migration. Preserve old and new interpretations long enough for consumers to move, and inventory consumers before contraction.

A published CDC contract should include ownership, capture scope, ordering assumptions, duplicate behavior, deletion representation, schema compatibility and rebuild procedure. The reliable outcome is not merely a live stream. It is a projection whose correctness and recovery can be demonstrated after the failures the system is expected to survive.

### Figure methodology

Synthetic source rate 2,000 changes/s, outage 600 s→1,200,000 backlog. Apply rate 3,000/s leaves net drain 1,000/s. Backlog after 600 recovery seconds is 600,000; after 1,200 seconds it is 0. Assumes constant rates and retained history.

| Worked observation | changes |
| --- | ---: |
| Restart | 1200000 |
| After 10 minutes | 600000 |
| After 20 minutes | 0 |

## Primary references and further study

- [PostgreSQL logical decoding and replay](https://www.postgresql.org/docs/current/logicaldecoding-explanation.html)
- [Debezium PostgreSQL connector](https://debezium.io/documentation/reference/stable/connectors/postgresql.html)
- [Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
