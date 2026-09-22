---
title: "Microservices vs Monolith: Making the Decision That's Actually Right for Your Team"
description: "The microservices-vs-monolith debate has been settled in conference talks for years. On the ground, the right answer still depends on context that most frameworks ignore."
date: 2025-05-22
tags: ["Cloud Architecture", "Distributed Systems", "Software Engineering", "Programming"]
format: article
---

The microservices debate has been declared over several times. First microservices won (2015–2018). Then the monolith resurgence (the "modular monolith" discourse of 2019–2022). Then the nuanced middle ground that everyone says they've always believed.

The practical reality: the architecture decision is still context-dependent, and the factors that actually matter are rarely covered by the framework papers or the hot take threads.

Here's what I look at when this decision comes up.

## Start With the Team, Not the System

The most reliable predictor of microservices success isn't the technical characteristics of the system — it's the organizational characteristics of the team.

Microservices distribute deployment, operational ownership, and on-call responsibility across teams. This works well when:
- Teams are independently deploying multiple times per week
- Ownership of a service is clear and stable
- Each team has the operational capability to run what they deploy
- Communication overhead between teams is lower than the benefit of independence

It works poorly when:
- You have a small team (under 10 engineers) where coordination overhead costs more than independence gains
- Ownership is unclear or shared across teams
- The operational burden of running many services is concentrated in one platform team
- Cross-service changes are frequent and require coordinated deployments

The second condition — cross-service changes requiring coordinated deployments — is the clearest signal of a distributed monolith. If you're deploying service A, B, and C together because a change to A requires simultaneous changes to B and C, you have the operational cost of microservices without the benefit.

## The Modular Monolith Is Often the Right Middle Ground

A well-structured monolith with clear module boundaries is not a compromise position. For many organizations and workloads, it's the correct architecture:

- Single deployment unit reduces operational complexity dramatically
- Module boundaries enforce separation of concerns without network boundaries
- Refactoring across modules is a code change, not a service migration
- Local function calls vs. network calls means no distributed systems failure modes

The failure mode of monoliths is architectural decay: module boundaries erode, coupling accumulates, and the system becomes genuinely hard to change. This is a discipline problem, not an architectural inevitability. A monolith with enforced module boundaries (via build system rules, package-level visibility constraints, or architectural fitness functions) can maintain separation without the operational overhead of services.

When to extract a service from a monolith: when a component has genuinely different scaling requirements, different deployment cadences, different team ownership, or different runtime requirements than the rest of the system. Not because the module is large, not because it would be "cleaner" as a service.

## The Distributed Systems Tax

Every service boundary introduces distributed systems complexity that didn't exist before:
- Network calls that can fail, timeout, or return partial results
- Consistency challenges across service boundaries
- Distributed tracing requirement to diagnose multi-service failures
- Service discovery, load balancing, and health checking
- Independent deployability requirements (backward-compatible API changes)

This complexity is a real cost. It's worth paying when the independence benefit exceeds it. It's not worth paying for clean architecture reasons alone.

The teams I've seen suffer most from microservices are those that decomposed early, before they had traffic to justify the operational complexity, and before they understood their domain well enough to draw service boundaries that didn't cut across natural seams.

## When Microservices Are Clearly Right

- **Fundamentally different scaling requirements**: a document rendering service that needs to scale to 100x during batch periods, independent of the rest of the system
- **Different technology requirements**: a compute-intensive ML inference service needs GPU compute, while the rest of the system runs on standard compute — separate deployment makes sense
- **Different deployment cadences and team ownership**: a payment processing service with its own security review, compliance requirements, and on-call team
- **Autonomous team velocity as a primary requirement**: at genuinely large scale (hundreds of engineers), the coordination overhead of a shared codebase becomes a real constraint on shipping speed

The common thread is specificity. "Microservices because modern architecture" is not a reason. "Microservices because this specific component has these specific characteristics that make independence valuable" is.

## The Migration Direction

One practical note: starting with a modular monolith and extracting services when the need becomes clear is significantly easier than building microservices that you later need to consolidate.

Extraction is surgical — you identify the service boundary, extract the code, add the network boundary, migrate consumers. Consolidation is messy — you're unwinding distributed systems assumptions, reconciling data models, and merging deployment pipelines.

If you're making this decision for a new system: default to a well-structured monolith. Extract services when you can articulate a specific reason that justifies the operational cost. The system will be easier to build, easier to operate, and easier to evolve.

---

*Working through a microservices architecture decision or a monolith migration? [I've been on both sides of this.](/contact)*
