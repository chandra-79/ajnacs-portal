---
title: "Microservices Scale With Teams, Monoliths Scale With Databases"
description: "The choice between monolith and microservices is primarily an organizational decision, not a technical one. Matching the architecture to the team structure is more important than matching it to the technical requirements."
date: 2025-09-19
tags: ["Architecture", "Engineering Leadership"]
format: article
---

Conway's Law states that organizations design systems that mirror their communication structures. In software architecture, this is not just an observation — it is a design principle.

Microservices work when each service is owned by a team that can develop, deploy, and operate it independently. Monoliths work when a single team can hold the whole system in their head and coordinate deployments without significant overhead.

## What this means in practice

A startup with 4 engineers and a monolith is using the right architecture. The entire team can review the codebase, change anything quickly, and deploy the full system several times a day. The coordination overhead of microservices — separate repositories, separate CI pipelines, separate deployment cadences, service mesh configuration — is pure cost with no benefit.

A company with 50 engineers across 8 teams and a monolith is using the wrong architecture. Eight teams making changes to a shared codebase spend significant time on merge conflicts, build coordination, and release management. The cost of coordination dominates.

The transition point is when the coordination cost of a shared codebase exceeds the coordination cost of service boundaries.

## Scaling databases vs. scaling teams

Monoliths typically share a single database. At read-heavy scale, a single database can be scaled vertically (bigger instance) and horizontally (read replicas). This works for most applications at most scales. The ceiling is real but high.

Microservices decouple databases — each service owns its data. This enables horizontal scaling at the service level and allows different storage technologies for different services. The cost is that cross-service data queries are now distributed transactions or eventual consistency problems.

The monolith's database bottleneck is real but appears later and has more solutions than the distributed transaction problem that microservices create prematurely.

## The sequence that works

Start with a monolith. Build with clean internal module boundaries. When specific components have genuinely different scaling requirements or when team ownership friction becomes the dominant bottleneck, extract services. Each extraction is motivated by a specific, real need.

This is not the exciting answer. The exciting answer is "design for scale from day one." The practical answer is "design for the team and scale you actually have, and evolve deliberately."

Most systems never hit the scale at which a well-optimized monolith cannot cope. The ones that do had the runway to invest in the extraction properly.
