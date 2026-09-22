---
title: "Observability in Distributed Systems: Logs, Metrics, and Traces Are Not Interchangeable"
description: "Logs, metrics, and traces each answer different questions about a distributed system. Understanding the distinction matters when something breaks at 2am and you need to find the cause quickly."
date: 2026-12-02
tags: ["Cloud Architecture", "DevSecOps", "Engineering Leadership"]
format: article
---

Observability has become a marketing term, which means it has also become a confused one. Vendors describe their log aggregation platform as an "observability solution." Teams install Prometheus and believe they have observability. Organizations ingest everything into a SIEM and think they have covered it.

Logs, metrics, and traces are distinct data types that answer different questions. Using them interchangeably — or assuming that having all three in some form means the system is observable — leads to situations where an incident is happening, the three data sources all show data, and the team still cannot explain why.

## What each signal type answers

**Metrics** answer *how much* and *how fast*: request rate, error rate, latency percentiles, queue depth, CPU utilization, memory consumption. Metrics are time-series data — values at consistent intervals. They are efficient to store and cheap to query at scale. They are excellent for knowing that something is wrong (error rate spiked, latency degraded) and for alerting. They are poor for explaining why something is wrong.

**Logs** answer *what happened*: structured records of discrete events — a request received, an exception thrown, a database query executed, a payment processed. Good logs have context (request ID, user ID, service name, environment) and tell you the sequence of events that led to an outcome. They are expensive to store at scale and slow to query across large volumes, but irreplaceable for root cause investigation.

**Traces** answer *where time went* across a distributed request: how a single request moved through multiple services, how long each hop took, where errors originated. A trace connects a user request through frontend, API gateway, multiple microservices, and database calls into a single timeline. Without distributed tracing, a slow request in a microservices architecture is nearly impossible to diagnose — you know latency increased, you can see logs from individual services, but you cannot see the full picture.

## The common gaps

**Metrics without logs**: you know error rate is 5% but cannot tell what is erroring, why, or which users are affected. The alert fired; the investigation is stuck.

**Logs without correlation**: millions of log lines from dozens of services with no request ID threading them together. Finding the logs from a specific failed request means matching timestamps across services and hoping nothing was out of sync.

**Traces without context**: traces show that Service B took 800ms but do not show what database query it was executing or what the input was. The latency is measured; the cause is opaque.

**All three with no unified view**: logs in Splunk, metrics in Datadog, traces in Jaeger. Every incident requires switching between three tools, re-entering context, and manually correlating data that should be connectable automatically.

## Designing for investigability

The goal is not coverage — it is the ability to answer specific questions quickly during an incident. Design backwards from the questions:

*Question: is the system healthy right now?* → metrics with alerting (Prometheus + Alertmanager, or a hosted equivalent)

*Question: which users are experiencing errors in the last 15 minutes?* → structured logs with indexed fields, filtered by time window and error status

*Question: why is this specific request slow?* → distributed traces with span-level timing and context propagation

*Question: what changed just before this started?* → deployment events, feature flag changes, and configuration changes as structured events or annotations on your metrics time series

For each question, the system needs to have the right data, in a queryable form, with enough context to be interpretable.

## Instrumentation that actually works

**Structured logs, not free text**: log JSON rather than prose. `{"level":"error","request_id":"abc123","user_id":"456","service":"order-service","error":"payment gateway timeout","duration_ms":5023}` is parseable. "ERROR: payment gateway timeout after 5023ms for user 456" requires regex to query.

**Trace context propagation**: every incoming request gets a trace ID. Every outbound call carries that trace ID in headers (W3C `traceparent` is the standard). Every log entry includes the trace ID. This connects your three data sources — you can go from a metric spike to the traces active during that spike to the logs for a specific trace.

**Consistent service naming**: service names, environment tags, and version labels that are consistent across all instrumentation. When the same service is called `order-svc` in metrics and `order_service` in traces and `OrderService` in logs, correlation becomes manual.

**SLO-aligned alerting**: alert on user-facing symptoms (request success rate, latency at the 95th percentile) rather than infrastructure metrics (CPU, memory). CPU at 80% is not always a problem; 5% of requests returning errors is always a problem.

## The OpenTelemetry investment

OpenTelemetry has become the standard for instrumentation. The SDK covers traces, metrics, and logs with a vendor-neutral API. Instrumentation code is written once; the exporter configuration determines where the data goes (Jaeger, Honeycomb, Datadog, Azure Monitor, any OTLP-compatible backend).

The benefit: switching observability backends does not require reinstrumentation. The signal format is portable even if the storage is not.

For new services, defaulting to OpenTelemetry instrumentation is a reasonable choice. For existing services with vendor-specific SDKs, the migration cost depends on how deeply embedded the vendor SDK is — evaluate incrementally rather than all at once.

*Building out observability for a distributed system or evaluating tooling options? The architectural decisions (storage, query patterns, retention) matter as much as the instrumentation. [Happy to compare notes.](/contact)*
