---
title: "API Gateway Patterns for Enterprise Microservices"
description: "API gateways are often treated as simple reverse proxies. At enterprise scale, they become the enforcement point for authentication, rate limiting, observability, and contract management. Here's what the design decisions look like."
date: 2026-08-19
tags: ["Cloud Architecture", "Architecture", "DevSecOps"]
format: article
---

An API gateway starts simple: a single entry point that routes requests to backend services. As the number of services grows, the gateway accumulates responsibility — authentication, rate limiting, request transformation, observability, circuit breaking, caching. At enterprise scale, the gateway is not just infrastructure; it is a policy enforcement layer that intersects with security, operations, and developer experience.

The design decisions made early in the gateway layer tend to be expensive to change later. Understanding the trade-offs before they are committed to is worthwhile.

## What belongs in the gateway

The honest answer: less than most teams put there.

**What clearly belongs**: authentication and authorization (token validation, API key management), TLS termination, rate limiting and throttling, request routing, basic observability (access logs, latency, status codes).

**What sometimes belongs**: request/response transformation, protocol translation (REST to gRPC), caching for idempotent GET requests, circuit breakers for unreliable backends.

**What probably does not belong**: business logic, complex authorization that requires database lookups, response aggregation that requires calling multiple backends in parallel, long-lived compute.

The boundary matters because gateways are in the request hot path. Logic in the gateway adds latency to every request. Logic that is complex, stateful, or can fail in interesting ways adds fragility to the single point of ingress. Gateway complexity also creates a deployment bottleneck — every policy change requires a gateway deployment.

## Authentication at the gateway vs. in services

Two models:

**Gateway-enforced authentication**: the gateway validates every incoming token before forwarding the request. Services receive requests with a validated identity header (e.g., `X-User-ID`) and trust it. Simpler service code; centralized enforcement; services cannot make independent auth decisions.

**Distributed authentication**: the gateway performs initial validation and may add identity context, but services perform their own authorization checks. More complex service code; supports fine-grained authorization that is context-specific; services can enforce tenant isolation, resource-level permissions, and domain-specific rules.

For most enterprise applications, a combination works: gateway handles token validation and rate limiting; services handle authorization against their specific resources. Pure gateway authentication is an acceptable starting point, but the limitations appear when services need to make authorization decisions that require business context (does this user own this resource? does this tenant have access to this feature?).

## Rate limiting design

Rate limiting at the gateway protects backends from traffic spikes and prevents individual consumers from monopolizing shared capacity. The decisions:

**Rate limit dimensions**: per API key, per user ID, per IP, per endpoint, or some combination. Per-API-key limiting is the most useful for external API consumers; per-user-ID is useful for user-facing applications where a single account should not consume unbounded resources.

**Limit storage**: rate limit counters need a shared store (Redis is standard) if the gateway runs across multiple instances. In-memory counters produce incorrect limits in distributed deployments.

**Limit responses**: return `429 Too Many Requests` with `Retry-After` headers. Well-behaved clients will back off; ill-behaved clients will retry immediately. The `Retry-After` header is the mechanism for communicating when the limit resets.

**Different limits for different tiers**: external partners, internal services, and premium consumers typically have different rate limit requirements. Model this as configurable per-key limits rather than a single global limit.

## Observability from the gateway layer

The gateway sees every request, which makes it a natural place to collect traffic metrics. At minimum:

- Request count by service, endpoint, status code
- Latency percentiles (p50, p95, p99) by service and endpoint
- Error rate by service (4xx and 5xx separately)
- Rate limit hits by consumer

These metrics identify backend services with elevated error rates or latency before users report issues and before backend teams have seen their own service metrics. The gateway view is often the first signal.

Trace context propagation matters here: the gateway should inject trace IDs into forwarded requests and log those trace IDs in its access logs. This connects gateway-level access logs to backend distributed traces.

## Handling backend failures

**Circuit breakers**: when a backend service fails repeatedly, a circuit breaker opens and stops forwarding requests to it for a period. This prevents cascading failures where slow or erroring backends exhaust gateway connection pools and degrade all traffic. The circuit breaker also gives the failing backend time to recover without being overwhelmed by retries.

**Retries with backoff**: for transient failures (network blip, momentary unavailability), retry with exponential backoff can improve success rate without developer intervention. Retry only idempotent requests (GET, DELETE) unless you have strong guarantees about backend idempotency for PUT/POST.

**Fallback responses**: for some endpoints, a cached or degraded response is preferable to an error. A product catalog endpoint can return a cached response if the upstream is temporarily unavailable; a payment endpoint should not.

## Self-service developer experience

In organizations with many internal service teams, the gateway's developer experience matters. If publishing a new API to the gateway requires a ticket to a central platform team, gateway policies become a bottleneck.

Better models:
- Declarative configuration via code (Kong's `deck` sync, AWS API Gateway via Terraform or CDK) so service teams can add APIs through a pull request
- Standardized API contract format (OpenAPI) as the canonical source, gateway config generated from it
- Developer portal (Kong DevPortal, AWS API Gateway with usage plans, or a custom tool) so consumers can discover and subscribe to APIs without manual coordination

The governance challenge: self-service gateway config without sufficient guardrails leads to inconsistent security policies, missing observability, and non-standard rate limit configurations. The balance is templates and validation (service teams use approved templates, violations fail CI) rather than manual approval of every change.

*Designing or migrating an API gateway layer for an enterprise microservices platform? The scope of responsibility assigned to the gateway has significant implications for operational complexity. [Happy to think through the trade-offs.](/contact)*
