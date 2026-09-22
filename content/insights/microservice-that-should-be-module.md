---
title: "Most microservices I've reviewed should have been modules in a monolith"
description: "Microservices solve genuine problems: independent deployability, technology heterogeneity, team autonomy at scale, and the ability to scale specific components independently."
date: 2025-12-29
tags: ["Software Engineering", "Distributed Systems", "Architecture"]
format: note
derived: true
---

Microservices solve genuine problems: independent deployability, technology heterogeneity, team autonomy at scale, and the ability to scale specific components independently. For organizations with large engineering teams where different services have genuinely different operational and technical requirements, the architecture makes sense.

The problem is that microservices get adopted not because those problems exist, but because microservices are what modern software looks like. The solution precedes the problem.

A service-per-entity architecture — User Service, Order Service, Inventory Service, Notification Service — deployed by a team of eight engineers, creates: network overhead for every operation that spans entities, distributed transaction complexity for operations that need to be atomic, N deployment pipelines to maintain, observability infrastructure to trace calls across service boundaries, and a local development environment that requires running six services simultaneously.

A well-factored modular monolith with clear internal boundaries solves the same domain decomposition problem with none of that overhead. You can separate modules into services later, when you have specific evidence that the separation is required — a team ownership boundary, a scaling requirement, a technology decision that genuinely diverges.

Conway's Law runs both ways. Microservices should reflect the organization's team structure. If you're organising your codebase into microservices before your team structure reflects that decomposition, you're borrowing complexity from the future without a clear purpose.

Start with a modular monolith. Extract services when you have a reason.
