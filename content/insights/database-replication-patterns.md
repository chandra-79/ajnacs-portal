---
title: "Database Replication Patterns: Read Replicas, Multi-Primary, and When Each Applies"
description: "Database replication serves two distinct goals — high availability (survive a primary failure) and read scaling (distribute read traffic). The configuration that optimizes for one is often wrong for the other."
date: 2025-08-04
tags: ["Data Engineering", "Cloud Architecture"]
format: article
---

Database replication is often configured with a default setup — one primary, one replica — without clear thinking about whether the goal is availability, read scaling, geographic distribution, or disaster recovery. Different goals require different configurations, and the default is frequently suboptimal for the actual need.

## Read replicas for read scaling

The common use case: a read-heavy application where a single database instance is the query bottleneck. Read replicas receive a copy of every write from the primary and serve SELECT queries independently.

**What read replicas solve**: distributing read load across multiple instances. An application with 95% reads and 5% writes can serve most traffic from replicas while writes go to the primary. For read-heavy workloads (reporting, analytics, content delivery), read replicas can multiply read capacity significantly.

**What read replicas do not solve**: write throughput bottlenecks. All writes still go to a single primary. If your bottleneck is write volume, read replicas don't help.

**Replication lag**: read replicas are eventually consistent — they may lag behind the primary by milliseconds to seconds depending on write volume and replica load. Applications that read data immediately after writing it must either read from the primary for those operations or account for the possibility of stale reads. This is the most common operational surprise with read replicas.

**Promotion time**: if the primary fails, promoting a replica to primary takes time — typically 30-60 seconds for cloud managed databases (AWS RDS, Azure Database for PostgreSQL) with automated failover. During this window, writes fail. This is the availability cost of a primary-replica architecture.

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

**AWS RDS Multi-AZ**: synchronous replication to a standby in a different availability zone. Automatic failover in 30-60 seconds. Zero data loss on failover. Higher cost (you pay for the standby even though it serves no read traffic).

**AWS Aurora**: six-way replication across three availability zones, with up to 15 read replicas. Failover in under 30 seconds (typically 10-15 seconds). The storage layer is multi-AZ by default; what fails over is the writer endpoint, not storage.

**Azure Database for PostgreSQL — Flexible Server** with high availability: standby server in the same or a different availability zone. 120-second failover SLA with zone-redundant HA.

**GCP Cloud SQL**: similar primary-standby configuration with automatic failover within a region.

For most production workloads, cloud-managed replication is the right choice: it removes the operational complexity of managing replication manually and provides well-defined RPO/RTO guarantees.

## Choosing the right configuration

Questions to answer before configuring replication:

- Is the bottleneck reads, writes, or availability?
- What is the acceptable data loss on failover (RPO: Recovery Point Objective)?
- What is the acceptable downtime on failover (RTO: Recovery Time Objective)?
- Are reads from slightly stale data acceptable for some use cases?
- Does the application need cross-region reads or writes?

The answers map to a specific configuration. A workload requiring zero data loss and sub-minute failover needs synchronous replication with automated failover. A workload with heavy read traffic and tolerance for 1-2 second replication lag is a candidate for async read replicas.

*Designing database replication for a new system or reviewing an existing configuration against availability requirements? [Happy to compare approaches.](/contact)*
