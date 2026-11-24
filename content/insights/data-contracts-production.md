---
title: "Data Contracts: Preventing the Silent Breaking Changes That Wreck Data Pipelines"
description: "Define producer-consumer contracts for schema and meaning, run validation fixtures, and plan compatible changes and ownership."
date: 2027-11-26
tags: ["Data Engineering", "Engineering Leadership"]
format: article
---

The most frustrating class of data pipeline failures is the silent one. A source system adds a column, renames a field, changes a data type, or starts emitting nulls in a previously non-nullable field. The pipeline continues running. No error is raised. But the downstream dashboard is now wrong, and nobody notices for a week.

Data contracts make the agreement between the data producer (the system emitting the data) and the data consumer (the pipeline, report, or ML model relying on it) explicit. Implemented checks can make covered violations visible at the chosen boundary; untested semantic changes can still escape.

## What a data contract specifies

A data contract is a formal specification of:

- **Schema**: field names, data types, and whether fields are required or optional
- **Semantics**: what each field means (a `status` field with values `active|inactive|pending` is different from one with `A|I|P`, even if both are strings)
- **Quality expectations**: null rates below a threshold, value ranges, referential integrity to other entities
- **Freshness requirements**: data should arrive within N minutes/hours of the event
- **SLA**: what downstream consumers can expect in terms of availability and delivery time

The contract is a document that both the producer and consumer agree to and can be checked against.

## Implementing contracts in practice

**Schema in a registry**: define schemas in a schema registry (Confluent Schema Registry used with Kafka, AWS Glue Schema Registry, or a custom system). A registry checks the configured schema compatibility rules; producers and consumers must use and enforce the intended registration and serialization path.

For batch/file-based data, tools like Great Expectations or Soda allow defining validation rules as code:

The executable fixture below demonstrates contract checks without relying on an unpinned validation-library API.

Run these validations at the point of ingestion. Fail loudly when expectations are violated rather than passing bad data downstream.

**Contract versioning**: contracts change. A field is added; a type changes; a new status value is introduced. Version contracts explicitly and require producers to announce breaking changes with appropriate lead time.

Semantic versioning for data contracts:
- **Patch**: documentation fixes, no structural changes
- **Minor**: backward-compatible additions (an addition proven compatible with the supported consumers)
- **Major**: breaking changes (renamed field, changed type, removed field, changed semantics)

Major version changes require advance notice to consumers and a migration period where both old and new formats are supported.

## Who owns the contract

The organizational pattern that works: the producer owns the contract. The system emitting data is responsible for its stability and for communicating changes. Consumers subscribe to a producer's contract and can receive notifications of upcoming changes.

This flips the default dynamic. Without data contracts, producers change data freely and consumers discover the change when their pipeline breaks. With contracts, producers make a commitment and face a social and technical enforcement process when they want to break it.

The hardest part is establishing this pattern with teams whose incentive structure doesn't naturally include "don't break your consumers." This is an organizational problem, not a technical one. Data contracts provide the mechanism; management emphasis on data as a product provides the incentive.

## The early warning system

Beyond enforcement at ingestion, contracts enable proactive monitoring:

**Drift detection**: compare the actual schema and quality metrics of arriving data against the contract. Alert when a value that previously never exceeded 5% null rate reaches 15% — the drift may be intentional (a source system change) or unintentional (a bug). Either way, you want to know before it breaks something downstream.

**Contract compliance reporting**: across all data products, what percentage are in compliance with their contracts right now? This is a useful operational metric that makes data platform health visible.

*Introducing data contracts in a platform with many existing pipelines? The organizational change is usually harder than the technical implementation. [Happy to compare approaches.](/contact/)*

## Make the contract executable without tying it to one library

Validation libraries change their APIs. A contract should preserve the business rule independently of a particular tool's configuration syntax. Record the required field, accepted type, unit, allowed states and failure action before encoding those rules in a framework. Pin and test the framework version in the implementation repository.

For a fictional shipment event, define order_id as a nonempty string, amount_minor as a nonnegative integer in the stated currency, and status as one of the agreed business states. The use of integer minor units is a design choice for this exercise; real currencies and monetary calculations need an explicit precision policy. A valid shape does not prove that the amount is commercially correct, so reconcile it with an authoritative transaction record where that matters.

A minimal local fixture can express the rule directly:

```python
ALLOWED = {"pending", "confirmed", "shipped", "cancelled"}

def errors(row):
    found = []
    if not isinstance(row.get("order_id"), str) or not row["order_id"].strip():
        found.append("order_id must be a nonempty string")
    value = row.get("amount_minor")
    if type(value) is not int or value < 0:
        found.append("amount_minor must be a nonnegative integer")
    status = row.get("status")
    if not isinstance(status, str) or status not in ALLOWED:
        found.append("unrecognized status")
    return found

assert not errors({"order_id": "o-1", "amount_minor": 1250, "status": "confirmed"})
assert errors({"order_id": "o-2", "amount_minor": True, "status": "confirmed"})
assert errors({"order_id": "", "amount_minor": 100, "status": "review"})
```

The strict integer check intentionally rejects a boolean, which Python otherwise treats as an integer subtype. The fixture demonstrates three local shape rules, not a complete financial or event contract. Add tests for currency, event identity, timestamps and correction semantics according to the actual service.

## Work through the rejected population

Suppose a synthetic batch contains 2,000 events. Thirty fail the required-identifier rule, twenty fail the amount rule and ten use an unrecognized status. For this example the sets are disjoint, so sixty events are quarantined and 1,940 pass those checks. Pass rate is 97%. If a record can fail more than one rule in a real implementation, do not add per-rule counts to derive the number of rejected records; calculate the distinct rejected population separately.

Preserve a reason code, the contract version and an appropriate reference to the original event. Avoid storing unnecessary sensitive values in an error queue. Give the quarantine an owner, age metric and repair process. A validation failure that is visible only to an abandoned queue is still an operational failure.

## Treat compatibility as a consumer relationship

A schema registry checks the compatibility rules configured for its supported format and registration path. It does not automatically prove that every consumer's business logic will handle a change. A producer can also bypass a registry if the deployment does not enforce use of the registered serialization path. Test and document that enforcement boundary.

Adding a new enum value is not universally backward compatible. An old consumer may reject it, map it to a default or silently drop it. A new optional field may be safe for an extensible parser and unsafe for a strict one. Define compatibility against representative consumers and stored history rather than assigning a minor version by intuition.

For a proposed status change, run the previous consumer against fixtures containing old and new values. Check the business output, not only parsing success. Then run the new consumer against stored events in the old shape. Record the supported version pairs, rollout order, compatibility window and rollback behavior. The contract review should include someone who understands the downstream decision the field supports.

## Monitor meaning after validation passes

A dataset can satisfy every type rule and still be wrong. A join can duplicate orders; a currency conversion can use the wrong date; an event timestamp can be interpreted in the wrong timezone. Add reconciliations at transformation and publication boundaries. Compare business totals, distinct identities and freshness against a defined expectation.

Choose thresholds based on consequences and the population. A null-rate threshold appropriate for an optional enrichment field may be unacceptable for an identity key. A small dataset can move sharply because of one record. Show counts alongside percentages and distinguish missing input from an intentionally absent value.

## Use an incident to improve the contract

When a consumer reports a wrong result, trace representative records to the first stage where meaning changed. Record whether the contract omitted a rule, the implementation violated it or the consumer assumed something stronger. Repair the appropriate boundary and add the smallest fixture that reproduces the failure.

Communicate how existing data is corrected. A producer fix affects future events but may leave historical reports wrong. A replay can repair those reports only if the transformation and sink handle duplicate processing correctly. Close the incident after the consumer can identify the corrected version and reconcile the affected population. This is how contracts become operating agreements rather than documents that only describe the happy path.

### Figure methodology

Synthetic 2,000-event batch with disjoint failure sets.60 events are quarantined and 1,940 pass:97% pass rate for these checks. Real per-rule failures may overlap; count distinct rejected identities before summing.

| Worked observation | events |
| --- | ---: |
| Identifier failure | 30 |
| Amount failure | 20 |
| Unknown status | 10 |

## Primary references and further study

- [Schema evolution and configured compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
- [Transactional outbox and event identity](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)
