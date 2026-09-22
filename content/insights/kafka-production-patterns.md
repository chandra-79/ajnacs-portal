---
title: "Kafka in Production: Partitioning, Consumer Groups, and the Mistakes Everyone Makes"
description: "Apache Kafka looks simple until you run it at scale. The production challenges — partition strategy, consumer lag, exactly-once semantics, schema evolution — are learnable but rarely covered in introductory material."
date: 2027-04-07
tags: ["Data Engineering", "Cloud Architecture", "Architecture"]
format: article
---

Kafka's appeal is straightforward: high-throughput, durable, distributed message streaming. The production reality is that the choices you make during initial setup — partition count, retention policy, consumer group design — are expensive to change later and have significant operational consequences.

## Partitions: the most consequential early decision

Partitions are the unit of parallelism in Kafka. More partitions means more concurrent consumers; it also means more file handles, more memory pressure on brokers, and slower recovery after a leader election.

The rules of thumb that hold up:

**Partition count determines maximum consumer parallelism.** A topic with 12 partitions can have at most 12 active consumers in a consumer group. If you have 20 consumers, 8 will be idle. Plan partition count around your desired consumer concurrency, not your current one.

**Keys determine partition assignment.** Records with the same key always land in the same partition (and therefore on the same consumer, in order). If your ordering guarantee is "all events for a given customer must be processed in order," the key must be the customer ID. If you use an event ID as the key, ordering per customer is not guaranteed.

**Avoid over-partitioning.** The common advice is "add more partitions for safety." The consequence: a topic with 1,000 partitions causes a 1,000-way leader election if the broker restarts. At 10,000 partitions cluster-wide, Kafka's metadata overhead becomes noticeable. Start with fewer partitions than you think you need; Kafka allows increasing partition count (but not decreasing it).

## Consumer group design

**One consumer group per use case.** If you have two systems that both need to process all events (billing and analytics, for example), they should be separate consumer groups. Each group maintains its own offset position and processes the topic independently. Sharing a consumer group between systems creates tight operational coupling — one slow consumer slows the other.

**Consumer lag is the key health metric.** Consumer lag (the difference between the latest offset and the consumer group's current offset) tells you how far behind a consumer group is. A lag of zero means real-time processing. Sustained growing lag means the consumer cannot keep up — scale out consumers, reduce processing time, or partition more.

Monitor lag per partition, not just total. A total lag of 10,000 spread evenly across 10 partitions is a different situation from 10,000 in one partition and 0 in the others. The latter suggests a slow consumer on a specific partition, possibly due to a hot key.

## Exactly-once semantics: worth the cost?

Kafka offers three delivery semantics:

- **At-most-once**: messages may be lost, never duplicated. Suitable for non-critical telemetry.
- **At-least-once**: messages are never lost but may be duplicated. The default, and suitable for most use cases with idempotent consumers.
- **Exactly-once**: no loss, no duplication. Available via transactions but with significant performance and complexity overhead.

Exactly-once (EOS) requires producer transactions and transactional consumers. The performance cost is real — throughput drops 20-40% in benchmark conditions. More importantly, EOS within Kafka does not extend to external systems. If your consumer writes to a database that is not part of the Kafka transaction, EOS guarantees break at that boundary.

For most applications, idempotent consumers with at-least-once delivery is the right approach. Design your consumer to detect and discard duplicate messages (use the event ID as an idempotency key in your database) rather than relying on Kafka's EOS.

## Schema evolution and the registry

The most overlooked production concern: schema compatibility. A producer changes an event schema; consumers expecting the old schema start failing. Without schema management, this happens silently.

A schema registry (Confluent Schema Registry, or the AWS Glue Schema Registry on managed Kafka) enforces compatibility rules at publish time. Schemas are versioned; producers must publish schemas that are backward-compatible (old consumers can read new events), forward-compatible (new consumers can read old events), or fully compatible (both).

The most common safe evolution patterns:
- Adding new optional fields: backward compatible
- Adding new required fields: not backward compatible without a default value
- Removing fields: not forward compatible

Enforce schema registration in your CI pipeline, not just at runtime. Catching schema incompatibility before a deployment is much cheaper than debugging consumer failures after.

## The operations that catch teams off-guard

**Log compaction vs. retention**: Kafka can retain messages by time (delete records older than 7 days) or by key (keep only the latest record per key — log compaction). Compacted topics are useful for maintaining the latest state of an entity. Retention-based topics are for event streams. Mixing these up produces unexpected data loss.

**Rebalancing impact**: when a consumer joins or leaves a group, Kafka reassigns partitions — a rebalance. During rebalance, no consumers process messages. With many partitions and slow rebalance protocols, this can pause processing for 30+ seconds. The cooperative rebalance protocol (available since Kafka 2.4) assigns only the partitions that need to move, significantly reducing pause duration.

**Disk is the bottleneck**: Kafka is I/O-bound. Undersized disks cause broker slowdowns that manifest as producer timeouts and consumer lag increases. Monitor broker disk utilization; target staying below 60% to maintain headroom for retention and log segment files.

*Running Kafka at scale or designing an event streaming architecture? The early decisions around partitioning and schema management compound over time. [Happy to compare approaches.](/contact)*
