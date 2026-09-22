---
title: "Your data pipeline has schema assumptions that nobody documented and everyone has forgotten"
description: "Every data pipeline was built with implicit assumptions about the data it processes. The format of date fields."
date: 2026-03-13
tags: ["Data Engineering", "Infrastructure"]
format: article
derived: true
---

Every data pipeline was built with implicit assumptions about the data it processes. The format of date fields. The cardinality of enumerated values. The maximum size of a payload. The nullability of fields that are always populated today. Whether a field contains the numeric value 1 or the string "1".

Some of these assumptions are explicit — validated at ingestion, enforced by schema. Most are invisible — present in the parsing logic, the transformation code, the batch window configuration, and the JOIN conditions. Nobody documented them because at the time of writing, they weren't assumptions. They were just facts about how the data looked.

Six months later, an upstream change violates a fact and the pipeline fails in production. The failure often looks cryptic because the original assumption wasn't explicit — you're not seeing "schema validation failed," you're seeing a null pointer exception or a type cast error three transformations downstream.

The engineering practice that prevents this: treat schema as a formal contract at every integration boundary. Schema registries (Confluent Schema Registry, AWS Glue Data Catalog, Apache Avro with evolution rules) make schema explicit and evolution traceable. Validation at ingestion — before the transformation layer — means schema drift produces a clean failure at the boundary rather than a mysterious failure in the middle.

Schema changes should be visible engineering events: reviewed, communicated to downstream consumers, and deployed with evolution rules that specify whether the change is backwards-compatible. Not something that shows up in the error logs on a Monday morning.
