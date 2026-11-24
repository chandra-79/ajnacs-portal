---
title: "Your data pipeline has schema assumptions that nobody documented and everyone has forgotten"
description: "Document schema and semantic assumptions, test producer changes against consumer fixtures, and plan compatibility and recovery."
date: 2029-02-28
tags: ["Data Engineering", "Infrastructure"]
format: article
derived: true
---

Every data pipeline was built with implicit assumptions about the data it processes. The format of date fields. The cardinality of enumerated values. The maximum size of a payload. The nullability of fields that are always populated today. Whether a field contains the numeric value 1 or the string "1".

Some of these assumptions are explicit — validated at ingestion, enforced by schema. Most are invisible — present in the parsing logic, the transformation code, the batch window configuration, and the JOIN conditions. Nobody documented them because at the time of writing, they weren't assumptions. They were just facts about how the data looked.

Six months later, an upstream change violates a fact and the pipeline fails in production. The failure often looks cryptic because the original assumption wasn't explicit — you're not seeing "schema validation failed," you're seeing a null pointer exception or a type cast error three transformations downstream.

The engineering practice that prevents this: treat schema as a formal contract at every integration boundary. Schema registries (Confluent Schema Registry, AWS Glue Data Catalog, Apache Avro with evolution rules) make schema explicit and evolution traceable. Validation at ingestion — before the transformation layer — means schema drift produces a clean failure at the boundary rather than a mysterious failure in the middle.

Schema changes should be visible engineering events: reviewed, communicated to downstream consumers, and deployed with evolution rules that specify whether the change is backwards-compatible. Not something that shows up in the error logs on a Monday morning.

## Turn an assumption into a failing fixture

Schema is more than a list of column types. A nullable string can still have an undocumented set of permitted values. A timestamp can still lack a timezone convention. A key can remain a string while its uniqueness boundary changes from global to per tenant. Those changes may pass a type checker and still alter a business result.

Consider a synthetic orders dataset with 1,000 rows. The producer introduces a new status, REVIEW, on 80 rows. A downstream transform accepts only PAID and CANCELLED and silently drops everything else. The output contains 920 rows, an 8% completeness loss. If the transform instead quarantines the 80 unfamiliar rows and raises a visible contract failure, it still cannot publish a complete answer, but it can explain the missing work. Recovery requires an agreed meaning for REVIEW, not an arbitrary mapping to an existing status.

## Build the contract around one decision

Choose a consumer question such as daily paid order totals. Write the event grain, stable key, accepted statuses, currency representation, timezone, late-arrival policy and correction semantics. Specify which changes are backward compatible for that consumer. Adding a field can be harmless for one parser and break another that rejects unknown fields; compatibility is a relationship between producer and consumer behavior.

Create a fixture containing the new status, a missing key, a duplicated event, a corrected event and a timestamp around a daylight-saving transition. Predict the accepted, rejected and quarantined populations. Run the transform and compare those counts with the prediction. Preserve the fixture in review so a future implementation cannot silently restore the old assumption.

Give the producer a route to propose a change and give consumers an observable adoption window. Version the meaning and the validation together. If a consumer cannot migrate immediately, keep the old representation available for a bounded period or publish an adapter with its own owner. A schema registry can assist compatibility checks; it cannot decide what a new business state means.

### Figure methodology

Synthetic 1,000-row batch: 80 rows use a newly introduced status, leaving 920 accepted by an old allowlist. The 8% loss measures excluded rows, not invalid business events. A visible quarantine preserves the unresolved population.

| Worked observation | rows |
| --- | ---: |
| Accepted known statuses | 920 |
| Unrecognized REVIEW | 80 |

## Primary references and further study

- [Schema evolution and compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
- [Transactional outbox semantics](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
