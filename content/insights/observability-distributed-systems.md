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

**Metrics** answer *how much* and *how fast*: request rate, error rate, latency percentiles, queue depth, CPU utilization, memory consumption. Metrics represent measured quantities, often aggregated or sampled over time. They are efficient to store and cheap to query at scale. They are excellent for knowing that something is wrong (error rate spiked, latency degraded) and for alerting. They are poor for explaining why something is wrong.

**Logs** answer *what happened*: structured records of discrete events — a request received, an exception thrown, a database query executed, a payment processed. Good logs have context (request ID, user ID, service name, environment) and tell you the sequence of events that led to an outcome. They are expensive to store at scale and slow to query across large volumes, but irreplaceable for root cause investigation.

**Traces** answer *where time went* across a distributed request: how a single request moved through multiple services, how long each hop took, where errors originated. A trace connects a user request through frontend, API gateway, multiple microservices, and database calls into a single timeline. Without distributed tracing, a slow request in a microservices architecture is harder to diagnose from correlated timing evidence — you know latency increased, you can see logs from individual services, but you cannot see the full picture.

## The common gaps

**Insufficient dimensions**: a single aggregate error rate can conceal the affected operation or cohort. Suitable metrics, structured events or traces may supply the missing distinction. Logs are one source of evidence, not a mandatory prerequisite for every diagnosis; choose the signal that answers the specific question without unnecessary sensitive identifiers.

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

**Trace context propagation**: create or validate context at a trusted entry boundary and propagate it through supported downstream operations. W3C `traceparent` provides an interoperable HTTP format; message systems need their supported carrier and asynchronous relationship semantics. Include trace identifiers in relevant logs where available. Sampling, absent instrumentation and deliberate trust boundaries mean not every request or log will have a retained trace.

**Consistent service naming**: service names, environment tags, and version labels that are consistent across all instrumentation. When the same service is called `order-svc` in metrics and `order_service` in traces and `OrderService` in logs, correlation becomes manual.

**SLO-aligned alerting**: alert on user-facing symptoms (request success rate, latency at the 95th percentile) rather than infrastructure metrics (CPU, memory). CPU at 80% is not always a problem; a sustained error rate above the agreed objective requires investigation, with the affected operation and denominator made explicit.

## The OpenTelemetry investment

OpenTelemetry has become the standard for instrumentation. The SDK covers traces, metrics, and logs with a vendor-neutral API. Instrumentation code is written once; the exporter configuration determines where the data goes (Jaeger, Honeycomb, Datadog, Azure Monitor, any OTLP-compatible backend).

A vendor-neutral instrumentation path can reduce reinstrumentation work, while backend changes may still require query, dashboard, alert, attribute and feature migration. Validate the signals and workflows actually used.

For new services, defaulting to OpenTelemetry instrumentation is a reasonable choice. For existing services with vendor-specific SDKs, the migration cost depends on how deeply embedded the vendor SDK is — evaluate incrementally rather than all at once.

*Building out observability for a distributed system or evaluating tooling options? The architectural decisions (storage, query patterns, retention) matter as much as the instrumentation. [Happy to compare notes.](/contact)*

## Begin with a customer-visible event and its accounting

Define the operation whose behavior needs explanation: a completed checkout, an accepted message or a report available before its deadline. Then identify how that event is represented across the client, gateway, services and asynchronous workers. Telemetry is useful when it preserves enough context to connect these observations without exposing unnecessary personal or secret data.

Metrics, logs and traces have overlapping uses. A metric with appropriate dimensions can help explain a failure; logs can contain timing; traces can support aggregate views. Their cost and query performance depend on implementation, cardinality and retention. Avoid treating any one signal as universally cheap, slow or incapable of diagnosis. Start from the question and choose evidence with an explicit scope.

## Explain an asynchronous timeline without double-counting

In a hypothetical job, the producer accepts work at time zero. The job waits 700 ms in a queue, runs for 200 ms and spends another 100 ms publishing its result. End-to-end completion time is 1,000 ms. A worker span covering only execution would report 200 ms and miss most of the user's wait. The chart partitions the timeline into nonoverlapping intervals so the sum is meaningful.

If result publication overlaps processing, those durations cannot simply be added. Likewise, nested trace spans overlap their parents. Summing every span duration can exceed request elapsed time without indicating an error. Use the critical path and event boundaries appropriate to the question, and note clock uncertainty when comparing timestamps from different hosts.

Create a worksheet with acceptance, enqueue, dequeue, processing start, processing end and result-available events. Identify which component records each timestamp and whether it uses a monotonic duration or wall-clock time. Include a correlation identifier that survives retries while distinguishing individual attempts. Do not use a customer identifier as an unrestricted metric label merely to make correlation convenient.

## Propagate context across the actual boundaries

For synchronous HTTP, follow W3C Trace Context rules rather than treating a trace ID as an arbitrary header. Validate incoming context, preserve or restart it according to the trust boundary and propagate supported fields appropriately. A trace identifier is not an authorization token. Do not trust caller-provided sampling flags to dictate unbounded telemetry cost.

For messages, determine how context is attached and whether parent-child relationships or span links best represent the operation. A batch consuming many messages may not have one natural parent. A retry should remain distinguishable from the original attempt so repeated work is not mistaken for one long operation.

In a disposable lab, send a synthetic request through a service and a queue, then retrieve the resulting evidence. Introduce one delayed worker and verify that the recorded timeline attributes delay to waiting rather than execution. Ask a colleague to explain the cause using the available signals, including a plausible alternative such as a slow database call. Record what cannot be established.

## Quantify what the telemetry pipeline omits

A sampled trace population is not automatically representative of all requests. Head sampling makes an early decision; tail sampling can use later information but needs buffering and its own capacity. Errors and rare slow paths may be retained at different rates. Compare selected traces with independent counters before using them to estimate production error frequency.

Track collector drops, export failures, queue saturation and stale scrapes. A quiet dashboard can mean the service is healthy or that evidence stopped arriving. Include a known synthetic observation or another appropriate health check for the collection path. Protect that test from generating real business side effects.

The worksheet should record sampling policy, retention, attribute allowlist and access controls. Querying raw data may require more privilege than viewing an aggregate dashboard. Log redaction must happen before sensitive data reaches a broad archive where deletion is difficult. Review exception handlers and debug modes as well as normal instrumentation.

## Make alerts lead to a useful investigation

Align urgent alerts with user impact and the agreed objective, while retaining infrastructure signals for diagnosis and capacity planning. A CPU threshold can be useful in context; an error percentage is meaningful only with its operation, denominator and window. Distinguish a low-volume single failure from a sustained high-volume burn without dismissing either automatically.

For each alert, provide the affected journey, recent changes, a relevant query and the first safe diagnostic step. Run a tabletop using a planted synthetic regression. Observe whether the responder can reach the relevant evidence and whether names, environments and versions line up across tools. One unified product is not mandatory if the correlation contract works; three products do not guarantee it.

OpenTelemetry can reduce instrumentation coupling, but changing backends may still require changes to queries, dashboards, alerts and unsupported attributes or features. Test the signals and workflows that matter before switching. The success criterion is a reproducible explanation of a service behavior with known limits, not maximum ingestion or a checklist that all telemetry types are present.

| Observation | Value (ms) |
| --- | ---: |
| Queue waiting | 700 |
| Worker execution | 200 |
| Result publication | 100 |

**Figure method.** Synthetic nonoverlapping timeline: 700+200+100=1,000 ms. Worker execution alone is 20% of total; nested or overlapping spans must not be summed the same way.

## Further reading

- [OpenTelemetry traces](https://opentelemetry.io/docs/concepts/signals/traces/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Google SRE SLO alerting](https://sre.google/workbook/alerting-on-slos/)
