---
title: "Find the First Broken Meaning in a Data Pipeline"
description: "Locate the first stage that changes data meaning, assign the repair, and combine producer checks with downstream validation."
date: 2029-02-23
tags: ["Data Engineering", "Engineering Leadership"]
format: article
derived: true
---

Data quality problems are solved where data is produced, not where it is consumed. This is a statement that most data engineering teams would agree with in principle and contradict in practice, because the team that feels the data quality problem most acutely is the consumer team, and the team with the authority and context to fix it is the producer team, and those are usually different people.

The result is a stable equilibrium of downstream cleaning. Transformation pipelines accumulate steps that normalise nulls, reformat date strings, deduplicate records that should not exist, fill expected fields with sensible defaults when the upstream system omitted them, and correct specific known-bad values that appear with enough regularity to be worth automating. Each cleaning step encodes knowledge about a specific upstream deficiency. Each step adds fragility — when the upstream deficiency changes in character, the downstream correction no longer applies correctly, or worse, applies incorrectly without detection.

Data contracts are the structural remedy. A contract between a data producer and its consumers defines what valid data looks like — the schema, the acceptable value ranges, the nullability of each field, the business rules that must hold for a record to be considered good. The contract is enforced at the producer level, in the service or pipeline that creates the record, before it enters the downstream flow.

Implementing this requires a conversation between producer and consumer teams that often has not occurred. The consumer team uses the data in ways the producer team did not anticipate when the integration was built. The producer team changed the data format for legitimate reasons without understanding the downstream impact. The contract makes those conversations explicit and creates a mechanism for managing them as the system evolves, rather than discovering them at step 11.

## Locate the first broken meaning

Data defects are not always upstream. An accurate source event can be corrupted by a join, currency conversion, duplicate replay, timezone interpretation or stale downstream lookup. Trace a small set of incorrect records through each transformation and identify the first stage where their meaning diverges from the contract.

In a synthetic batch of 10,000 orders, 120 records lack a required currency code at ingestion. A later join creates 80 additional duplicate output rows. Repairing the producer addresses the 120 invalid source records but does not repair the join. Conversely, deduplicating output does not identify the missing currency. Count the two defects separately: source completeness is 9,880/10,000 = 98.8%; the duplicate output count is 80. They have different denominators and should not be collapsed into one vague quality percentage.

## Design both prevention and containment

At the producer boundary, define whether currency is required, what code set is accepted and which version introduced the requirement. At the transformation boundary, assert the expected join cardinality and verify that the supposedly unique lookup key is actually unique. At the published dataset, reconcile business totals and provide a visible freshness marker. Each check should say who responds and what happens to rejected records.

Use a quarantine path when rejecting a row is safer than silently coercing it. Preserve the original value and an actionable reason without exposing unnecessary personal data. Give quarantined data an owner and a retention policy. A queue nobody reviews simply moves the defect out of the dashboard while leaving business work unfinished.

For a workshop, create five valid orders, one missing currency and two lookup rows with the same product key. Predict the output before running the transform. Compare raw, accepted, quarantined and published counts. Then correct the producer fixture and the join separately to show that each control catches a different failure. This exercise turns a debate about upstream ownership into two reproducible bugs with two named fixes.

### Figure methodology

Illustrative 10,000-order batch. Missing-source-field records and extra join-generated rows are separate defect populations; do not add them as a percentage of one denominator. Source completeness is 98.8%.

| Worked observation | records |
| --- | ---: |
| Missing currency | 120 |
| Extra joined rows | 80 |

## Primary references and further study

- [Schema compatibility rules](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
- [PostgreSQL query execution and row counts](https://www.postgresql.org/docs/current/using-explain.html)
