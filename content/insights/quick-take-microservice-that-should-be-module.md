---
title: "The Microservice That Should Have Been a Module"
description: "Decomposing a system into microservices is the right call at certain scale thresholds with certain team structures. Doing it earlier than that produces distributed systems complexity without the distributed systems benefits."
date: 2028-05-08
tags: ["Software Engineering", "Distributed Systems", "Architecture"]
format: article
---

The codebase was a monolith. It worked. Then the team decided to modernise it. They split it into eight services. Now it takes three engineers to make a change that used to take one, deployment failures cascade across services that used to deploy together, and the latency on user requests has increased because what used to be a function call is now four network hops.

This is not a microservices problem. It is a premature microservices problem. There is a difference.

## What microservices actually trade

Microservices decompose a system into independently deployable services. Each service can be deployed, scaled, and developed by a small team independently. This is a real benefit when:

- Teams are large enough that coordination between teams on a shared codebase creates bottlenecks
- Services have genuinely different scaling profiles (the image processing service needs 10x the CPU of the user authentication service)
- Different parts of the system have different release cadences or uptime requirements
- You need to allow different technology stacks for different components

The cost: every function call that was previously in-process becomes a network call. Network calls fail in ways that function calls do not — timeouts, partial failures, retries, distributed transaction problems. Every service needs its own deployment pipeline, its own monitoring, its own operational runbook.

## The module alternative

A well-structured monolith has internal modules with clear interfaces. The user module. The payment module. The notification module. Each module has a defined public API. Enforce the boundary with the language or module system where possible and with dependency checks where needed; a folder convention alone cannot prevent imports of internals.

This structure delivers many of the organisational benefits of microservices — clean boundaries, team ownership, independent evolution — without the distributed systems tax. The difference is that when you want to promote a module to an independent service later, you can. The interface already exists. The interface can simplify extraction, although data ownership and failure semantics still require migration work.

## The size heuristic

The question is not "should this be a microservice?" It is "does the operational complexity of a separate service deliver more value than the operational complexity costs?"

There is no universal headcount cutoff. Assess independent release needs, security isolation, scaling differences, support capacity, and data ownership together.

Build modularly. Extract services when the need is real.

## Use the boundary to expose the real cost

The number of engineers is not a reliable threshold for choosing services. Security isolation, independently scaled workloads, and ownership can justify a separate process in a small team. Conversely, a larger organisation can retain a modular application if release tooling and ownership work well. The question is whether a process boundary buys a property the system actually needs.

Take a hypothetical price lookup used by checkout. As an internal module it makes one indexed query. The proposed remote service adds a request, authentication, serialization, a deadline, and a failure outcome. None of those additions is automatically wrong. They are obligations the proposal must now fund. Ask whether pricing needs independent deployment or isolation, rather than treating network separation as proof of clean design.

In a simple illustrative latency budget, checkout has 400 ms available. Existing work consumes 250 ms, leaving 150 ms for pricing and response handling. If pricing is allocated 80 ms, only 70 ms remains for other unallocated work and margin. Two 80 ms pricing attempts cannot fit inside that remaining 150 ms even before backoff. The chart shows budget allocation, not measured percentile latency; adding component percentiles would not establish an end-to-end percentile.

## Prove the extraction contract

Before splitting, require callers to use the module's public interface. Identify any database reads that bypass it and move them behind an owned operation. Write compatibility tests for the contract, including missing optional data, an invalid identifier, and an unsupported currency. These tests help preserve behaviour whether the implementation stays local or becomes remote.

Then implement a remote adapter in a disposable environment. Delay it beyond the deadline and observe whether checkout fails predictably. Interrupt a response after the server has completed work. Decide whether a retry is safe and whether the operation needs an idempotency key. Avoid presenting an ambiguous result as a confirmed failure if a side effect might already have happened.

Finally, rehearse deployment with old and new callers running together. If every change requires a coordinated rollout, independent deployment remains an aspiration. That may be acceptable during migration, but it must be in the cost estimate. Keep the local implementation until the compatibility and recovery tests justify removal. A module boundary can be a deliberate final design, as well as a useful step toward extraction.

## Further reading and source boundaries

- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
- [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)
