---
title: "Kafka in Production: Partitioning, Consumer Groups, and the Mistakes Everyone Makes"
description: "Design Kafka keys, retention and consumer recovery, correct schema-compatibility direction, and test the scope of processing guarantees."
date: 2027-04-07
tags: ["Data Engineering", "Cloud Architecture", "Architecture"]
format: article
---

Kafka's appeal is straightforward: high-throughput, durable, distributed message streaming. The production reality is that the choices you make during initial setup — partition count, retention policy, consumer group design — are expensive to change later and have significant operational consequences.

## Partitions: the most consequential early decision

Partitions are the unit of parallelism in Kafka. More partitions means more concurrent consumers; it also means more file handles, more memory pressure on brokers, and slower recovery after a leader election.

The rules of thumb that hold up:

**Partition count determines maximum consumer parallelism.** A topic with 12 partitions can have at most 12 active consumers in a consumer group. If you have 20 consumers, 8 will be idle. Plan partition count around your desired consumer concurrency, not your current one.

**Keys determine partition assignment.** With stable serialization, partitioner and partition count, records with the same key map to the same partition (and therefore on the same consumer, in order). If your ordering guarantee is "all events for a given customer must be processed in order," the key must be the customer ID. If you use an event ID as the key, ordering per customer is not guaranteed.

## Consumer group design

**One consumer group per use case.** If you have two systems that both need to process all events (billing and analytics, for example), they should be separate consumer groups. Each group maintains its own offset position and processes the topic independently. Sharing a consumer group between systems creates tight operational coupling — one slow consumer slows the other.

**Consumer lag is the key health metric.** Consumer lag (the difference between the latest offset and the consumer group's current offset) tells you how far behind a consumer group is. Zero offset lag does not by itself prove low end-to-end latency or completed external effects. Sustained growing lag means the consumer cannot keep up — scale out consumers, reduce processing time, or partition more.

Monitor lag per partition, not just total. A total lag of 10,000 spread evenly across 10 partitions is a different situation from 10,000 in one partition and 0 in the others. The latter suggests a slow consumer on a specific partition, possibly due to a hot key.

## Exactly-once semantics: worth the cost?

Kafka offers three delivery semantics:

- **At-most-once within the stated delivery boundary**: a record is not retried after an uncertain attempt, so it may be lost. Producer-created duplicates and external side effects remain separate concerns. Use this only where loss is acceptable.
- **At-least-once**: records may be redelivered under the configured durability and recovery assumptions, and suitable for most use cases with idempotent consumers.
- **Exactly-once**: atomic processing effects within a defined supported transaction boundary; external effects need cooperation.

For most applications, idempotent consumers with at-least-once delivery is the right approach. Design your consumer to detect and discard duplicate messages (use the event ID as an idempotency key in your database) rather than relying on Kafka's EOS.

## Schema evolution and the registry

The most overlooked production concern: schema compatibility. A producer changes an event schema; consumers expecting the old schema start failing. Without schema management, this happens silently.

A schema registry (Confluent Schema Registry, or the AWS Glue Schema Registry on managed Kafka) enforces compatibility rules at publish time. Schemas are versioned; producers must publish schemas that are backward-compatible (new readers can read old data), forward-compatible (old readers can read new data), or fully compatible (both).

The most common safe evolution patterns:
- Adding fields: compatibility depends on the format, reader/writer direction and defaults
- Adding new required fields: not backward compatible without a default value
- Removing fields: evaluate reader requirements and format-specific rules

Enforce schema registration in your CI pipeline, not just at runtime. Catching schema incompatibility before a deployment is much cheaper than debugging consumer failures after.

## The operations that catch teams off-guard

**Log compaction vs. retention**: Kafka can retain messages by time (delete records older than 7 days) or by key (keep only the latest record per key — log compaction). Compacted topics are useful for maintaining the latest state of an entity. Retention-based topics are for event streams. Mixing these up produces unexpected data loss.

**Rebalancing impact**: when a consumer joins or leaves a group, Kafka reassigns partitions — a rebalance. Rebalance impact depends on the group protocol and assignment changes; some protocols pause more work than others. The cooperative rebalance protocol (available since Kafka 2.4) assigns only the partitions that need to move, significantly reducing pause duration.

**Measure the bottleneck**: Kafka can be limited by storage, networking, CPU, replication or client behavior. Undersized disks cause broker slowdowns that manifest as producer timeouts and consumer lag increases. Monitor broker disk utilization; reserve measured headroom for retention, replica recovery and operational changes.

*Running Kafka at scale or designing an event streaming architecture? The early decisions around partitioning and schema management compound over time. [Happy to compare approaches.](/contact/)*

## Name the processing boundary before choosing guarantees

Kafka durability, consumer progress and an application's external effects are separate concerns. Producer acknowledgments, replication settings and failure assumptions determine what an acknowledged append means. Offset commits determine where a consumer resumes. A database update or HTTP request performed by the consumer needs its own correctness protocol. No delivery label removes the need to inspect all three boundaries.

For a conventional consumer group, a partition is assigned to one consumer at a time, which bounds partition-level parallelism. Newer share-group consumption has different semantics and should not be confused with that model. Even within a conventional group, an application can dispatch work concurrently and accidentally reorder completion. If per-key ordering matters, preserve it through the application and sink, not merely in the broker log.

### A hypothetical lag budget

Suppose one partition receives 1,200 records per second while its consumer applies 1,000. Backlog grows by 200 per second, reaching 12,000 after one minute and 60,000 after five minutes. If processing is improved to 1,500 per second while arrivals remain 1,200, the net drain is 300 per second. Clearing the 60,000-record backlog then takes 200 seconds, approximately 3.3 minutes.

The chart shows the constructed backlog at zero, one and five minutes of overload. These are not Kafka benchmark values. Record size, processing variance and downstream capacity are omitted. Adding consumers cannot split one conventionally assigned partition across them, so a single hot partition may require a different key distribution or more efficient work rather than another idle instance.

Measure lag age as well as offset distance. Ten thousand tiny records can represent a different recovery time from ten thousand expensive records. Offset lag of zero does not establish that an external database projection is current if the application commits before completing that work. Publish an end-to-end measure from source event or commit to the user-visible effect.

## Partition changes affect ordering assumptions

With a fixed partition count and stable partitioner, a key generally maps consistently. Increasing the partition count can change the mapping for future records while old records remain in their original partitions. A consumer can then observe the same key across partitions during transition. Plan the change if the application depends on a continuous per-key order; a new topic and controlled cutover may be easier to reason about.

Record the key serialization and partitioner version. Two producers using incompatible representations of the same business identifier can distribute related events differently. Test producer-language combinations and null-key behavior. A partition key is part of the event contract, not an implementation detail to change casually.

Capacity planning should include partition count, replicas, record size, retention and recovery. There is no universal safe threshold of ten thousand partitions or sixty-percent disk utilization. Measure controller and broker behavior for the deployed release, and reserve headroom for replica movement, retention lag and failures. A broker restart only affects the leaders and replicas it hosts, not an abstract election count equal to every partition in the topic.

## Schema compatibility has a direction

Backward compatibility means a new reader schema can read data written with an older writer schema. Forward compatibility means an older reader can read data written with a newer writer schema. Full compatibility combines the directions. Exact rules depend on serialization format and configuration, including defaults and whether compatibility is checked only against the latest version or transitively against history.

A registry validates registered schemas under its rules; it does not automatically ensure every producer payload or consumer implementation follows the contract. Use compatible serializers and CI checks, and test actual old/new reader-writer pairs. A field addition can be safe for one format and configuration and unsafe for another. Keep semantic changes, such as a currency or timestamp interpretation, in the review even when the structural schema still passes.

## Retention and compaction are recovery policies

Time/size deletion and compaction can be configured in combinations with distinct effects. Compaction is asynchronous and does not instantly reduce a log to one record per key. Tombstones and their retention affect whether a consumer that has been offline can learn that a key was deleted. Define the supported outage and rebuild procedure rather than assuming a compacted topic is an eternal complete history.

An event stream needed for audit or replay may require a separate retention strategy from a latest-state topic. Record which topic is authoritative for each purpose. Test a consumer recovering after the maximum supported downtime and verify deletions as well as inserts. A successful restart from an available offset is not enough if required history has already expired.

### Failure rehearsal and operational handoff

Build a disposable producer-consumer fixture with stable event identifiers. Interrupt processing after an external write but before offset commit, then verify that replay does not duplicate the business effect. Interrupt before the external write and confirm that progress is not skipped. Test a rebalance while work is in flight and ensure partition revocation cannot leave uncontrolled workers committing stale progress.

For Kafka-to-Kafka processing, evaluate transactions and read-committed consumption where atomic state/output behavior is required. For external sinks, use a supported connector protocol or an application transaction that records effect and deduplication/progress coherently. Measure overhead under the real workload; do not apply a generic percentage penalty.

The handoff should name durability settings, key contract, schema policy, lag objectives, retention, replay procedure and ownership. Include alerts for failed production, replica health, disk pressure and sink failure. A useful operational dashboard explains whether the system is accepting durable records, keeping up and completing the intended effects.

### Figure methodology

Synthetic arrival 1,200 records/s minus processing 1,000/s gives 200/s backlog growth. At 60 s backlog=12,000; at 300 s=60,000. Recovery at 1,500/s leaves 300/s net drain and takes 200 s. Constant rates and no data loss assumed.

| Worked observation | records |
| --- | ---: |
| Start | 0 |
| After 1 minute | 12000 |
| After 5 minutes | 60000 |

## Primary references and further study

- [Kafka delivery, transaction and compaction design](https://kafka.apache.org/44/design/design/)
- [Kafka consumer API and offset handling](https://kafka.apache.org/44/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)
- [Schema Registry compatibility directions](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
