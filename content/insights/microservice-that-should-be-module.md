---
title: "When a Microservice Should Remain a Module"
description: "Test ownership, isolation, and failure semantics before turning an internal module into a remote service."
date: 2029-04-25
tags: ["Software Engineering", "Distributed Systems", "Architecture"]
format: note
derived: true
---

Microservices solve genuine problems: independent deployability, technology heterogeneity, team autonomy at scale, and the ability to scale specific components independently. For organizations with large engineering teams where different services have genuinely different operational and technical requirements, the architecture makes sense.

The problem is that microservices get adopted not because those problems exist, but because microservices are what modern software looks like. The solution precedes the problem.

A service-per-entity architecture — User Service, Order Service, Inventory Service, Notification Service — deployed by a team of eight engineers, creates: network overhead for every operation that spans entities, distributed transaction complexity for operations that need to be atomic, N deployment pipelines to maintain, observability infrastructure to trace calls across service boundaries, and a local development environment that requires running six services simultaneously.

A well-factored modular monolith with clear internal boundaries can address domain decomposition without remote-call overhead, although it still needs strong module and data boundaries. You can separate modules into services later, when you have specific evidence that the separation is required — a team ownership boundary, a scaling requirement, a technology decision that genuinely diverges.

Conway's Law runs both ways. Microservices should reflect the organization's team structure. If you're organising your codebase into microservices before your team structure reflects that decomposition, you're borrowing complexity from the future without a clear purpose.

Start with a modular monolith. Extract services when you have a reason.

## Look for an invariant that crosses the proposed boundary

Suppose a fictional checkout operation must create an order and reserve stock together. Inside one database transaction, either both changes commit or neither does. Splitting them across separately owned databases requires a different protocol and explicit handling of intermediate states. A service boundary can still be appropriate, but the business must define what happens while an order exists without a completed reservation.

For an exercise, draw four states: requested, reservation pending, confirmed, and rejected. Take ten synthetic orders, let eight reservations succeed, and let two fail. The chart reports eight confirmed and two rejected outcomes. Then interrupt one request after reservation succeeds but before the order receives confirmation. The important question is how the system discovers that outcome without reserving twice.

A module version of this exercise should test transaction rollback. A service version should test message deduplication, recovery of an unknown result, and compensation if reservation cannot be retained. Compare the work required to preserve the same business rule in both designs.

Use the result in the extraction decision. If independent ownership, capacity, or isolation justifies the additional protocol, document it. If the proposal creates a remote call solely to make the diagram look modular, establish an internal interface first. A clear package boundary can improve code organisation without pretending that in-process and distributed failure semantics are equivalent.

## Further reading and source boundaries

- [Martin Fowler: Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html)
- [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)
