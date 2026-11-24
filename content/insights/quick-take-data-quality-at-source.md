---
title: "Fix Data Quality at the Proven Failure Boundary"
description: "Trace the first incorrect transformation, compare upstream repair with downstream safeguards, and measure affected records with a declared denominator."
date: 2028-10-13
tags: ["Data Engineering", "Engineering Leadership"]
format: article
---

The data engineering team has a cleaning layer in the pipeline. It strips malformed values, coerces types, fills in missing fields with defaults, and normalises inconsistent spellings. The layer is large, carefully maintained, and constantly growing.

This is not data quality. This is data repair. The distinction matters because repair solves the symptom and leaves the cause in place.

## Why downstream fixes compound

Every downstream system that consumes the data has to either trust the cleaning layer completely or implement its own defensive logic. When the cleaning layer misses a new pattern — when it misses an untested case — the bad data propagates to every consumer simultaneously.

The cleaning layer grows because the source system continues to produce bad data. Each new pattern requires a new cleaning rule. Each cleaning rule is a maintenance burden. Each consumer that relies on the cleaning layer is betting that the cleaning layer is complete and correct.

The total cost of downstream cleaning — engineering time to build and maintain the cleaning layer, consumer-side defensive logic, debugging time when the cleaning layer fails to catch a new pattern, downstream impact when bad data reaches consumers — should be compared with the cost and feasibility of fixing the source, including cases where the producer is external or immutable.

## Why source fixes are harder but correct

The source system usually belongs to a different team. Fixing it requires coordination, agreement on what correct data looks like, testing of the fix in the source system's context, and often changes to the source system's UI or business logic.

This is why the downstream cleaning layer exists in the first place. It was faster to clean the data than to negotiate a fix with the upstream team. That trade-off was correct in the short term. Maintained indefinitely, it becomes progressively more expensive.

## The conversation that needs to happen

The data engineering team and the source system team need a shared definition of what correct data looks like. This is usually expressed as a data contract: field types, nullability constraints, value ranges, enumeration values.

Once the contract exists, the source system team can validate against it before writing data. Data that fails validation fails loudly at the source, rather than silently becoming a cleaning rule downstream.

This conversation is harder than writing another cleaning rule. It is also one way to reduce avoidable downstream repair over time rather than increasing it.

Every cleaning rule needs an explicit purpose, owner and test; some are valid transformations and others are temporary repairs.

## Keep origin and detection separate

A defect discovered in a dashboard may originate in a producer, a join, an aggregation or an interpretation rule. Detecting it downstream does not prove that the source is wrong. Conversely, a source defect may need immediate downstream containment while a producer fix is developed. Prevention and containment can both be justified if their responsibilities and lifetimes are explicit.

Consider a fictional pipeline receiving 5,000 shipment events. Fifty have a missing destination code. A transform duplicates 30 otherwise valid records because a reference table contains repeated keys. The source defect affects 1% of incoming events. The transformation defect creates 30 extra rows. They are not two percentages of the same population. A combined quality score would hide the distinction unless it carefully specified its denominator and weighting.

## Trace a small, representative sample

Select an affected business identifier and follow its original event, validation result, transformation inputs and published output. Preserve values only to the extent needed for the investigation, with appropriate access and redaction. Reproduce the transformation in an isolated fixture so the explanation does not depend on a dashboard that may refresh while the team investigates.

For the missing destination, decide whether the source contract requires the field for every event type. A return shipment might have a different legitimate meaning from an outbound shipment. For the duplicate, check the intended join cardinality and the uniqueness rule on the reference data. Fixing a missing-value rule does not correct an incorrect one-to-many join.

Create separate corrective actions with separate owners. One action changes producer validation or the event contract. Another changes the reference-data constraint or transform. Keep temporary downstream handling visible and give it an expiry condition. Otherwise an emergency mapping can quietly become a business rule nobody approved.

## Verify that repair preserves totals

Use a fixture with valid events, missing values, duplicates, corrections and late arrivals. Write the expected raw, accepted, quarantined and published counts before running it. Reconcile quantities or financial totals where meaningful; row-count equality alone can miss a duplicated value paired with a dropped row.

After the change, replay the same fixture and a bounded historical interval. Confirm that repeated replay does not duplicate published effects. Tell consumers whether previously published data will be corrected and how they can identify the revision. A source fix that improves tomorrow's data may leave yesterday's report wrong; the correction process belongs in the incident resolution.

The practical lesson is to repair the earliest incorrect transformation of meaning that the investigation demonstrates. It is not to assume that every upstream system is guilty or that every downstream cleaning operation is waste. Reliable pipelines make those boundaries testable.

### Figure methodology

Synthetic 5,000-event input. Missing destination affects 50/5,000 = 1% of input events; the 30 join-generated rows use a different population. Values illustrate two fault locations and must not be treated as one defect rate.

| Worked observation | records |
| --- | ---: |
| Missing destination | 50 |
| Extra joined rows | 30 |

## Primary references and further study

- [Schema evolution and compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
- [Query plans and join row counts](https://www.postgresql.org/docs/current/using-explain.html)
