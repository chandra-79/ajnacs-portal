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

A well-structured monolith has internal modules with clear interfaces. The user module. The payment module. The notification module. Each module has a defined API boundary — other modules cannot reach into its internals. They call its public functions.

This structure delivers many of the organisational benefits of microservices — clean boundaries, team ownership, independent evolution — without the distributed systems tax. The difference is that when you want to promote a module to an independent service later, you can. The interface already exists. The migration is an extraction, not a rewrite.

## The size heuristic

The question is not "should this be a microservice?" It is "does the operational complexity of a separate service deliver more value than the operational complexity costs?"

For a team under 8 engineers, the answer is usually no for all but the most clearly differentiated components. For a team of 30 across 5 teams, the answer is usually yes for the components where team ownership and independent deployment cadence are genuine requirements.

Build modularly. Extract services when the need is real.
