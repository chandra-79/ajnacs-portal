---
title: "Data ownership is the hardest part of data governance and nobody talks about it honestly."
description: "Every data governance programme eventually arrives at the ownership question. The cataloguing, the lineage tooling, the quality monitoring — these are solvable."
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
