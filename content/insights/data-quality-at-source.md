---
title: "Data quality problems are always upstream problems. Fixing them downstream is waste."
description: "Data quality problems are solved where data is produced, not where it is consumed."
date: 2025-09-15
tags: ["Data Engineering", "Engineering Leadership"]
format: article
derived: true
---

Data quality problems are solved where data is produced, not where it is consumed. This is a statement that most data engineering teams would agree with in principle and contradict in practice, because the team that feels the data quality problem most acutely is the consumer team, and the team with the authority and context to fix it is the producer team, and those are usually different people.

The result is a stable equilibrium of downstream cleaning. Transformation pipelines accumulate steps that normalise nulls, reformat date strings, deduplicate records that should not exist, fill expected fields with sensible defaults when the upstream system omitted them, and correct specific known-bad values that appear with enough regularity to be worth automating. Each cleaning step encodes knowledge about a specific upstream deficiency. Each step adds fragility — when the upstream deficiency changes in character, the downstream correction no longer applies correctly, or worse, applies incorrectly without detection.

Data contracts are the structural remedy. A contract between a data producer and its consumers defines what valid data looks like — the schema, the acceptable value ranges, the nullability of each field, the business rules that must hold for a record to be considered good. The contract is enforced at the producer level, in the service or pipeline that creates the record, before it enters the downstream flow.

Implementing this requires a conversation between producer and consumer teams that often has not occurred. The consumer team uses the data in ways the producer team did not anticipate when the integration was built. The producer team changed the data format for legitimate reasons without understanding the downstream impact. The contract makes those conversations explicit and creates a mechanism for managing them as the system evolves, rather than discovering them at step 11.
