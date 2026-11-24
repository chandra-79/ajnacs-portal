---
title: "Data ownership is the hardest part of data governance and nobody talks about it honestly."
description: "Translate data ownership into access, quality, change and incident decisions, with a worksheet for dependencies and handover."
date: 2029-03-05
tags: ["Data Engineering", "Engineering Leadership"]
format: article
derived: true
---

Every data governance programme eventually arrives at the ownership question. The cataloguing, the lineage tooling, the quality monitoring — these are solvable. Ownership is the problem that outlasts the tools.

The specific difficulty: data ownership implies accountability for quality, definitions, and access decisions. Accountability requires authority. Authority in data requires the ability to enforce standards on upstream producers and enforce definitions across consumers. In most organisations, data flows across team boundaries in ways that do not align with any team's authority.

The team that produces a transaction record may not be the team that understands what the transaction record means in a business context. The team that consumes the data may have the deepest understanding of its quality problems but no authority to fix them at the source. The team that owns the platform that stores the data has authority over storage and access but not over the business definitions that make the data useful.

Domain-oriented ownership, as described in data mesh patterns, is the most coherent answer to this structural problem. Ownership follows domain expertise — the team that understands the business domain produces and owns the data that describes it. A sales domain team owns sales metrics definitions, not because they run the sales systems, but because they understand what the sales metrics should mean. That knowledge gives the ownership claim substance.

This works when organisational boundaries align with business domains. It fails when they don't — when domain teams are siloed by technology rather than business function, or when the same business data is co-owned by multiple teams with different incentives. Resolving that misalignment is an organisational design problem, not a data governance tool problem.

## Assign decisions, not just names

One person can be listed as a dataset owner while being unable to change its producer, agree a retention policy or notify consumers. Ownership needs a bounded set of decisions and an escalation route. The technical custodian who runs a pipeline may differ from the business owner who defines what a field means.

Consider an illustrative inventory of 30 important datasets. Twelve have a named owner, a tested consumer notification route and an agreed correction process. Ten have a name but lack one of those operating capabilities. Eight have no accountable owner. Reporting 22/30 as owned would measure only name coverage. Reporting 12/30 = 40% as operationally covered describes a stricter test. Both counts should be named accurately rather than silently switching definitions.

## Test ownership with a change exercise

Choose one dataset and propose a new allowed status. Ask who can approve its meaning, who updates the producer, who finds affected consumers and who coordinates rollout. Then propose a correction to last month's data. The second exercise often exposes responsibilities that the first misses: published reports, downstream extracts and business reconciliations may require a separate correction path.

Document the decisions in a short service record: purpose, grain, producer, business definition owner, technical custodian, consumer contact route, freshness objective and incident escalation. Name a delegate so leave or staff turnover does not make the dataset ungoverned. Validate the record by using it during an actual low-risk change, rather than treating a completed catalog field as the end of the work.

Prioritize datasets by consequence and dependency. A small table controlling entitlements may deserve more attention than a huge exploratory dataset. Use the first successful exercises to improve the process before expanding coverage. A practical ownership system should make it easier to answer a concrete question about a change, correction or incident; a larger catalog alone does not demonstrate that improvement.

### Figure methodology

Synthetic inventory of 30 datasets. Operational coverage requires a named owner, a tested notification route and a correction process: 12/30 = 40%. Name-only coverage is a different and weaker measure.

| Worked observation | datasets |
| --- | ---: |
| Operationally covered | 12 |
| Name only | 10 |
| No accountable owner | 8 |

## Primary references and further study

- [Schema evolution and compatibility](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)
- [FinOps framework accountability model](https://www.finops.org/framework/)
