---
title: "Building Reliable Data Pipelines: Patterns That Hold Up"
description: "Design pipelines for replay, partial failure and schema evolution, then verify checkpoints and output correctness with a failure exercise."
date: 2027-06-07
tags: ["Data Engineering", "Cloud Architecture"]
format: article
---

Data pipelines fail in patterns. Not random patterns — specific, recurring ones that show up across different organizations, stacks, and cloud providers. The root causes are usually architectural decisions made early that were reasonable at the time, and which compound into brittleness as the system grows.

The following patterns make those failure modes easier to detect and recover from.

## Pattern 1: Treat Data Pipelines Like Production Services

A common design risk is pipelines treated as ETL scripts rather than production services.

What production service treatment means in practice:
- Code in version control with code review
- Deployment through a tested CI/CD pipeline, not manual execution
- Monitoring and alerting on pipeline execution — not just on downstream data quality, but on the pipeline itself
- On-call runbook for failures
- Documented data contracts between pipeline stages

Pipelines that live in notebooks or cron jobs with no deployment process are a single point of failure that lives entirely in one engineer's head. That engineer leaving or being unavailable is a production incident.

## Pattern 2: Idempotent Transforms as a Default

Pipelines fail. When they do, you need to be able to re-run the failed step without corrupting output data.

Idempotent processing: replaying the same logical operation does not create additional unintended effects. For most ETL logic this is achievable with:
- Writing to a temporary target and atomically swapping it on success
- Using upsert (`INSERT ... ON CONFLICT DO UPDATE`) rather than plain insert
- Partitioning output by time range and full-replacing the partition on each run

The pattern to avoid: incremental appends that can produce duplicates on re-run. These create data quality issues that are difficult to detect and expensive to remediate.

## Pattern 3: Schema Evolution Planning

Upstream data sources change schemas. This is a certainty, not a possibility. Pipelines that assume schema stability break unpredictably when a source adds a field, renames a column, or changes a type.

Defensive patterns:
- **Schema registry** for event-driven sources (Apache Avro with Confluent Schema Registry, or AWS Glue Schema Registry for Kinesis)
- **Explicit schema validation** at pipeline ingress — reject records that don't match the expected schema rather than silently corrupting downstream data
- **Additive-only schema change policy** for intermediate pipeline stages: add columns, never remove or rename without a migration

The cultural requirement: treat schema changes as deployments with backward-compatibility requirements. Data schemas are APIs. Breaking changes require migration.

## Pattern 4: Deliberate Handling of Failed Records

A message-driven stage can encounter malformed input, unavailable reference data or a persistent processing failure. Choose whether the contract permits quarantine and continued processing, or requires the affected key or partition to pause. Dead-letter queues are one implementation; a durable error table or retained source log can support another. Skipping a record may violate ordering or completeness even if it keeps throughput high.

Where quarantine is allowed, configure it before launch. After a retry budget chosen for the error class and freshness objective, durably retain failed messages with their identity and failure metadata before acknowledging their source delivery. This gives you:
- A clear signal that a class of records is failing
- The ability to investigate without data loss
- A path to replay after the root cause is fixed

DLQ monitoring — alert when depth exceeds zero for more than a configurable period — is part of the same infrastructure. A DLQ that nobody watches is a silent data loss mechanism.

## Pattern 5: Backfill and Replay as First-Class Capabilities

Every data pipeline will eventually need to be backfilled: re-processing historical data because a transform changed, a bug was fixed, or a new consumer needs data not captured before.

Pipelines designed for replay treat it as an explicit capability. The ability to process any arbitrary date range is part of the pipeline's contract. They parameterise by time window, handle idempotency at the partition level, and have tested backfill procedures.

The pipelines that don't handle this well require one-off scripts written under pressure, by engineers who didn't build the original pipeline, against data structured differently than the current schema. This is expensive and error-prone.

Design for backfill before you ship.

## Pattern 6: Data Quality as a Pipeline Step

Data quality validation — completeness, conformance, consistency checks — should run as a pipeline stage, not as an after-the-fact monitoring exercise.

Great Expectations, dbt tests, or custom validation logic embedded in the pipeline: validate before the data moves downstream. If validation fails, route to DLQ or halt the pipeline and alert — don't propagate bad data silently.

The contracts with downstream consumers are only as trustworthy as your validation coverage. Building that validation into the pipeline, rather than bolting it on as a monitoring afterthought, is what makes downstream consumers able to rely on the data.

*Building or scaling data pipelines in Azure or AWS? [Worth a conversation.](/contact/)*

## Define the output contract before the scheduler

A pipeline run being green does not prove that its output is complete, current or usable. Define the expected source interval, business population, destination and freshness target. State what “complete” means when upstream data arrives late. A daily order dataset might be provisional until a specified cutoff, then remain correctable through an explicit revision process. Consumers need to know which state they are reading.

Distinguish deterministic transformation from idempotent effects. The same input producing the same value is determinism; rerunning the operation without adding unintended effects is idempotency. A deterministic function that appends its result twice still creates duplicates. Use stable source identifiers, a defined output key and a publication protocol that handles retries safely. An upsert is only correct if its key and conflict-update semantics match the business model.

### A hypothetical delivery reconciliation

Suppose one source interval contains 10,000 distinct event identifiers. Delivery produces 10,200 messages because 200 are retried copies. A consumer recognizes the duplicate identifiers and finds 150 distinct events invalid under the current contract. It accepts 9,850 distinct events and quarantines 150. The reconciliation is 10,200 deliveries −200 duplicates =10,000 distinct events =9,850 accepted +150 quarantined.

The figure shows those counts as different operational categories. They are synthetic, and the categories should not be summed indiscriminately: delivery attempts and distinct source events have different denominators. A dashboard that reports 10,200 processed messages as 10,200 business events overstates activity. Keep attempt-level throughput separate from unique accepted output and unresolved exceptions.

A quarantine needs the original identifier, reason, schema version and enough context to repair or replay safely. Protect sensitive payloads with appropriate access and retention. A dead-letter queue is not a completed recovery workflow until an owner can investigate, fix and reconcile its contents. Monitor age as well as count; a small permanent backlog can be more consequential than a brief large retry burst.

## Publish atomically at the reader's boundary

Writing a temporary target and swapping it is useful only when the selected storage system provides the required atomic visibility. Object-store directory renames, multi-file publication and table metadata updates have different semantics. Use a supported table or manifest commit protocol, and make readers select a completed version. Do not expose a partially written partition because a scheduler marked the transform task successful too early.

Record source positions and output version together where the protocol permits. A crash after writing output but before recording progress should produce a safe retry, not duplicate records. A crash after recording progress but before output becomes durable must not silently skip data. Test both boundaries with failure injection. The exact solution depends on the source, sink and transaction scope; “exactly once” should always name those boundaries.

## Backfills need a separate capacity and correctness plan

A backfill can compete with live ingestion for source queries, network capacity and destination locks. Assign a rate limit and monitor live freshness while replaying history. Use an isolated output version when a transformation change alters meaning, then compare against the previous version before publication. Avoid overwriting trusted historical data with an unreviewed algorithm merely because the job completed.

Pin the transformation code, dependency versions, schema interpretation and reference-data version used for the replay. A historical order enriched with today's customer region can answer a different question from one enriched with the region at purchase time. Decide which temporal interpretation is intended. Reproducibility requires more than retaining the raw event bytes.

### A failure exercise for one partition

Create a small fixture containing a valid record, an invalid record, a duplicate, a late event and a deletion. Run the partition normally and record expected output. Then interrupt execution after a partial write and rerun. The final result should match the intended unique population, with quarantined and deleted records handled explicitly. Repeat after changing a schema field and verify the compatibility policy.

Reconcile row counts and domain totals, such as quantities or monetary amounts, because equal row counts can conceal wrong values. Check that the consumer can distinguish a deliberately empty partition from a missing one. Publish the fixture and expected results with the runbook so another engineer can reproduce the recovery behavior.

## Operate the data product as a dependency

Alert on failed publication, increasing freshness lag, contract violations and reconciliation mismatches. Include the affected dataset, time interval, downstream consumers and last known good version in the alert context. A runbook should say whether to pause readers, serve older data with a freshness notice, or continue with an explicitly incomplete result. That decision belongs to the product's reliability contract, not an improvised scheduler retry setting.

Review the operational burden after incidents: manual replay steps, ambiguous ownership and recurring data repairs are candidates for improvement. Preserve lineage and revision history so downstream teams can identify what changed. Reliable pipelines make failure visible, recovery reproducible and the meaning of their outputs stable enough to build on.

### Figure methodology

Synthetic interval has 10,000 unique source events plus 200 duplicate deliveries. Deduplication leaves 10,000;150 fail validation and 9,850 are accepted. Delivery attempts and unique outcomes are different denominators, so chart bars are not additive.

| Worked observation | records |
| --- | ---: |
| Delivery attempts | 10200 |
| Unique source events | 10000 |
| Accepted events | 9850 |
| Quarantined events | 150 |

## Primary references and further study

- [Kafka delivery semantics and processing](https://kafka.apache.org/44/design/design/)
- [Schema evolution and compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
- [Transactional outbox boundaries](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
