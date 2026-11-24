---
title: "Database Replication Patterns: Read Replicas, Multi-Primary, and When Each Applies"
description: "Database replication serves two distinct goals — high availability (survive a primary failure) and read scaling (distribute read traffic). The configuration that optimizes for one is often wrong for the other."
date: 2025-08-04
tags: ["Data Engineering", "Cloud Architecture"]
format: article
---

Database replication is often configured with a default setup — one primary, one replica — without clear thinking about whether the goal is availability, read scaling, geographic distribution, or disaster recovery. Different goals require different configurations, and the default is frequently suboptimal for the actual need.

## What to measure

**Replica lag and recovery point.** If a primary has committed through position 1,200 and a replica is durable through 1,185, 15 log positions remain outstanding in the example. Express actual business exposure in affected records or time and distinguish receive, flush and replay.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Read replicas for read scaling

The common use case: a read-heavy application where a single database instance is the query bottleneck. Read replicas receive a copy of every write from the primary and serve SELECT queries independently.

**What read replicas solve**: distributing read load across multiple instances. An application with 95% reads and 5% writes can serve most traffic from replicas while writes go to the primary. For read-heavy workloads (reporting, analytics, content delivery), read replicas can multiply read capacity significantly.

**What read replicas do not solve**: write throughput bottlenecks. All writes still go to a single primary. If your bottleneck is write volume, read replicas don't help.

**Replication lag**: read replicas are eventually consistent — they may lag behind the primary by milliseconds to seconds depending on write volume and replica load. Applications that read data immediately after writing it must either read from the primary for those operations or account for the possibility of stale reads. This is the most common operational surprise with read replicas.

**Promotion time** depends on deployment mode, backlog, and client reconnection. AWS documents typical failover of 60–120 seconds for [RDS Multi-AZ DB instances](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html), and under 35 seconds for [RDS Multi-AZ DB clusters](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts-failover.html). These figures describe provider failover, while application recovery includes connection pools, DNS, and write verification. Measure that end-to-end duration during a rehearsal.

## Synchronous vs. asynchronous replication

Asynchronous replication (the default for most databases): the primary acknowledges a write as soon as it is committed locally. The replica receives the changes shortly after. In a primary failure, the most recent writes (those not yet replicated) may be lost.

Synchronous replication: the primary waits for at least one replica to confirm it has received and written the transaction before acknowledging success to the client. Writes are more expensive (higher latency); in exchange, no data loss on failover to a synchronous replica.

**PostgreSQL synchronous replication**:
```sql
-- Require at least one synchronous standby before committing
ALTER SYSTEM SET synchronous_standby_names = 'FIRST 1 (replica1, replica2)';
SELECT pg_reload_conf();
```

Synchronous replication to a standby in the same availability zone adds approximately 1-2ms to write latency. Synchronous replication to a cross-region standby adds the cross-region round-trip latency (potentially 60-100ms), which is unacceptable for most transactional workloads.

## Multi-primary (or active-active) replication

Multi-primary replication allows writes to multiple nodes simultaneously, with changes replicated across all nodes. This solves two specific problems: geographic write distribution (each region writes to its local node) and write availability during a primary failure.

**The conflict problem**: if two nodes accept writes to the same row simultaneously, a conflict occurs. Conflict resolution strategies:
- **Last-write-wins**: the most recent timestamp wins. Simple; can lose writes silently.
- **Application-defined resolution**: the application provides logic to resolve conflicts. Correct but complex.
- **Avoid conflicts by design**: route writes for a given entity to a specific node (based on sharding key). No two nodes ever accept writes to the same entity. This is the most reliable approach but requires application-level routing logic.

Systems like Vitess (MySQL sharding), CockroachDB, and Cassandra are designed for multi-primary operation. Standard PostgreSQL multi-primary is implemented with tools like pglogical or BDR (Bi-Directional Replication) but requires careful conflict management.

## Managed database replication in cloud

Cloud-managed databases abstract much of the replication complexity:

**Amazon RDS Multi-AZ** comes in different configurations. A Multi-AZ DB instance deployment has a standby that serves failover. A Multi-AZ DB cluster exposes readable instances. Check your engine configuration and test application recovery, including reconnection and in-flight requests.

**Amazon Aurora** stores copies across Availability Zones. In a typical Aurora MySQL cluster with an eligible replica, AWS documents failover within about 30 seconds. Time restoration from the application’s first verified operation and check how clients rediscover the current writer.

**Azure Database for PostgreSQL Flexible Server** offers HA with a standby in the same or a different availability zone, depending on configuration. Use the selected configuration’s documented recovery characteristics and time a representative failover.

**GCP Cloud SQL**: similar primary-standby configuration with automatic failover within a region.

Managed replication can remove some operating work. Establish RPO and RTO for your workload and failure boundaries, including impaired dependency zones. Read [AWS’s Aurora MySQL recovery guidance](https://docs.aws.amazon.com/whitepapers/latest/amazon-aurora-mysql-db-admin-handbook/designing-for-fault-tolerance-and-quick-recovery.html) and treat component failover and application recovery as separate measurements.

## Choosing the right configuration

Questions to answer before configuring replication:

- Is the bottleneck reads, writes, or availability?
- What is the acceptable data loss on failover (RPO: Recovery Point Objective)?
- What is the acceptable downtime on failover (RTO: Recovery Time Objective)?
- Are reads from slightly stale data acceptable for some use cases?
- Does the application need cross-region reads or writes?

The answers map to a specific configuration. A workload requiring zero data loss and sub-minute failover needs synchronous replication with automated failover. A workload with heavy read traffic and tolerance for 1-2 second replication lag is a candidate for async read replicas.

*Designing database replication for a new system or reviewing an existing configuration against availability requirements? [Happy to compare approaches.](/contact/)*

## Follow a write through the replication pipeline

Write down the guarantee for each read path before drawing the topology. A catalogue can show a price from a few seconds ago if the checkout rechecks it. An account screen reached directly after a password change has a different requirement. It may need to observe that specific transaction even when the usual replica is behind. A reporting query may allow ten minutes of staleness but must reconcile totals against a named cutoff. These are three different routing decisions even when the same database fleet supports them.

For PostgreSQL physical replication, inspect how far a standby has acknowledged receipt, written WAL, flushed it and replayed it. `pg_stat_replication` reports write, flush and replay locations for the standbys connected to that server. Gaps between stages distinguish a slow network or receiver from slow application of already durable WAL. A byte gap measures WAL distance. Its conversion to seconds depends on recent WAL generation and the replica’s apply rate. The lag timing fields measure the delay of observed WAL activity and can become null on idle systems. They are a poor substitute for probing the freshness of actual data. [PostgreSQL replication statistics](https://www.postgresql.org/docs/18/monitoring-stats.html)

Suppose the writer produces 80 MiB/s of WAL during a bulk import and the replica can replay 60 MiB/s. Over a hypothetical 90-second burst, the gap grows by 1,800 MiB. If the writer then returns to 20 MiB/s and replay stays at 60 MiB/s, the replica clears the extra gap at 40 MiB/s, in about 45 seconds. Both rates will vary with the workload. A queue measured in bytes gives you a capacity hypothesis to test even when the last replay timestamp alone gives a misleading picture.

## Route a session that needs its own update

The simplest read-after-write policy routes the immediate confirmation to the writer. It is appropriate when the number of affected requests is small and the confirmation must be correct. Make the routing decision explicit in the application’s database access layer. Expiring a general session affinity flag after a fixed interval can relieve writer load, but it can still fail when replication is slower than that interval. Measure writer headroom with the same confirmation traffic you expect after a promotion.

A team that needs to retain more read traffic on replicas can track a replication position from the writer after commit and compare it with the candidate’s replay position. The token must come from the same database history as the replica and the read must take a fresh snapshot after the check. A pre-existing snapshot or a comparison across a timeline change can invalidate the contract. Use a small deadline. On expiry, route to the current writer if it can satisfy the guarantee or return a response that represents the state honestly. Test the path when the replica pauses, the connection pool changes its target and the writer changes during a request.

Observe the percentage of requests that use the fallback and the increase in writer connections. An apparently responsive confirmation page can still hide a degraded replica if every request silently lands on the writer. Track fallback explicitly and bound the total fallback concurrency. When the standby catches up, send traffic back gradually and keep checking freshness while connections churn.

## Match promotion to the acknowledgement policy

With PostgreSQL synchronous replication configured, the selected commit mode determines what the client’s success means. `synchronous_commit = on` waits for an acknowledgement that the selected synchronous standby or standbys flushed the commit record. `remote_write` waits until the standby operating system receives the write, which does not promise survival of a standby OS crash. `remote_apply` additionally waits for replay so a new standby snapshot can see the committed work. Check the transaction’s effective setting and the selection policy in `synchronous_standby_names`. Waiting for one synchronous copy does not justify promoting a separate asynchronous copy. [PostgreSQL WAL settings](https://www.postgresql.org/docs/18/runtime-config-wal.html) · [Replication configuration](https://www.postgresql.org/docs/18/runtime-config-replication.html)

Agree on what happens when the synchronous acknowledgement cannot arrive. A strict availability policy may leave writes waiting until quorum recovers. A controlled change to asynchronous acknowledgement can restore throughput, but changes the loss exposure and needs visible approval, timing and reconciliation. Use a test where the standby can still answer queries while it can no longer acknowledge WAL promptly. That separates a green instance check from the capability that the write contract actually needs.

## Reconcile acknowledged work after a promotion

Put numbered, idempotent operations through an isolated test environment. Keep a record outside the database under exercise of requests acknowledged, requests rejected and requests with unknown client outcomes. During promotion, fence the old writer and verify that previous connection pools can no longer issue accepted writes to it. At service restoration, compare acknowledged IDs with recovered records and retry unknown outcomes through the usual idempotency path. Count missing, repeated and conflicting records separately. A zero missing count in a light rehearsal supports that run only.

Start the recovery clock when customers first lose the promised service. Stop it once fresh requests can complete through the normal application path, including DNS, authentication and connection pools. Publish the time spent fencing, promoting, reconnecting and reconciling so that the next experiment can focus on the longest stage. Record the WAL position and replica state at promotion and the tested traffic rate. Keep a separate restore rehearsal. A replica can faithfully replay an accidental delete, and a successful promotion tells you little about recovery to an earlier point.

Keep charts from both sides of the switchover. The former writer's final observations may disappear just when they become essential. Capture which standby was eligible, why the control plane chose it and how quickly the application abandoned old connections. Repeat with the previously preferred standby unavailable.

Include write throughput during recovery.
