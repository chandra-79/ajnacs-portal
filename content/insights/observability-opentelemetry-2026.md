---
title: "Observability with OpenTelemetry: Getting the Three Pillars Working Together"
description: "Metrics, logs, and traces are only useful when they're correlated. OpenTelemetry provides the standard for instrumenting your services — here's how to implement it, connect the signals, and build the observability that actually reduces diagnosis time."
date: 2024-12-31
tags: ["Observability", "Cloud Architecture", "DevSecOps"]
format: article
---

Observability is one of those terms that means different things to different people. For some teams it means dashboards. For others it means alerts. The technical definition — the ability to understand the internal state of a system from its external outputs — is more specific, and more useful.

A fully observable system is one where, given a symptom (high error rate, slow P99 latency, increased database connections), you can determine the cause without needing to access the system directly. That requires three types of signal: metrics, logs, and traces. More importantly, it requires them to be correlated.

OpenTelemetry has become the standard for generating, collecting, and exporting these signals. Here's how to get it working.

## What to measure

**Coverage for buffered versus dropped telemetry.** If 980,000 of 1,000,000 eligible spans reach storage, observed delivery is 98%. Keep sampled-out events separate from collector drops, label delayed arrivals, and test that a collector outage does not breach request latency objectives.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## OpenTelemetry: what it is and what it isn't

OpenTelemetry (OTel) is an observability framework: a vendor-neutral standard for instrumenting applications to produce traces, metrics, and logs, and for collecting and exporting that telemetry to any backend.

What OTel is **not**: a storage backend, a query engine, or a dashboarding tool. It's the instrumentation and collection layer. You still need something to store and query the data (Jaeger, Tempo, Prometheus, Loki, Grafana, Datadog, Honeycomb, etc.).

The value proposition: instrument your application once with OTel, and change your observability backend without re-instrumenting. In practice, vendor lock-in on instrumentation is real — if you've instrumented everything with a vendor's proprietary library, migrating means re-instrumenting. OTel breaks that dependency.

## Traces: the most valuable signal for distributed systems

A trace represents a single request's journey through your system. Each service that processes the request contributes a span — a timed unit of work with attributes (tags), events, and status. The spans are linked by a trace ID propagated through the request context.

**Why traces matter more than logs for distributed systems**: when a request fails in a microservice architecture, the error often manifests in service A but the cause is in service B. Logs from service A show the error; logs from service B show the upstream cause. Without traces, correlating these requires knowing which request ID ties the two together and manually searching logs. With distributed tracing, one query shows the full path, every span's timing, and where things went wrong.

**Implementing OTel tracing in Java:**

```java
// Add to pom.xml:
// opentelemetry-api, opentelemetry-sdk, opentelemetry-exporter-otlp

@RestController
public class OrderController {
    private final Tracer tracer = GlobalOpenTelemetry.getTracer("order-service");

    @PostMapping("/orders")
    public ResponseEntity<Order> createOrder(@RequestBody OrderRequest request) {
        Span span = tracer.spanBuilder("createOrder")
            .setAttribute("customer.id", request.getCustomerId())
            .setAttribute("order.items", request.getItems().size())
            .startSpan();
        
        try (Scope scope = span.makeCurrent()) {
            Order order = orderService.create(request);
            span.setAttribute("order.id", order.getId());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            span.recordException(e);
            span.setStatus(StatusCode.ERROR);
            throw e;
        } finally {
            span.end();
        }
    }
}
```

For most frameworks (Spring Boot, Quarkus, Micronaut), the OTel Java agent auto-instruments HTTP, database, and messaging operations without code changes. Add the agent at JVM startup:

```
-javaagent:/path/to/opentelemetry-javaagent.jar
```

**Context propagation**: for traces to work across service boundaries, the trace context (trace ID and span ID) must be propagated in request headers. OTel auto-instruments HTTP clients to inject W3C TraceContext headers. Ensure your services don't strip these headers.

## Metrics: the right signals to alert on

Metrics are numerical measurements at points in time — request rate, error rate, latency percentiles, resource utilization. OTel defines a metrics API that produces these measurements; the standard export format is OTLP to a Prometheus-compatible backend.

**The USE method** (Utilisation, Saturation, Errors) for infrastructure resources: measure each resource's utilization (how busy), saturation (how much it's queuing work), and errors.

**The RED method** (Rate, Errors, Duration) for services: every service should have metrics for request rate, error rate, and request duration percentiles (P50, P95, P99).

Report tail latency alongside the average. An average of 100 ms and a p99 of 2 seconds can describe the same sample. A p99 near 2 seconds puts the slowest portion of requests near or beyond that threshold, depending on sample size and the quantile implementation. For services at any meaningful scale, 1% is a lot of users.

```java
// OTel metrics
Meter meter = GlobalOpenTelemetry.getMeter("order-service");

LongCounter requestCounter = meter.counterBuilder("http.server.requests")
    .setDescription("Total HTTP requests")
    .build();

DoubleHistogram latencyHistogram = meter.histogramBuilder("http.server.request.duration")
    .setDescription("HTTP request duration")
    .setUnit("s")
    .build();
```

## Logs: structured, correlated with trace IDs

Logs are the most familiar signal but the least actionable when not correlated with other signals. A log line that says "ORDER_FAILED: payment rejected" tells you something failed; a log line that includes the trace ID tells you which request, which user, and which span in the distributed trace the failure belongs to.

**Structured logging**: logs should be JSON, not formatted strings. A structured log can be queried on any field — `level`, `service`, `trace_id`, `user_id`. A formatted string requires regex parsing.

```java
// With logback and logstash-logback-encoder:
{
  "timestamp": "2026-06-07T14:23:01Z",
  "level": "ERROR",
  "service": "order-service",
  "trace_id": "a3b4c5d6e7f8a9b0b1c2d3e4f5a6b7c8",
  "span_id": "1234567890abcdef",
  "message": "Payment processing failed",
  "error.type": "PaymentDeclinedException",
  "order.id": "ord-789",
  "customer.id": "cust-456"
}
```

The `trace_id` field connects the log entry to the distributed trace. In Grafana (with Loki for logs and Tempo for traces), clicking the trace ID in a log entry opens the full trace.

## The OTel Collector: centralise your pipeline

The OTel Collector is a standalone process that receives telemetry from your services, processes it, and exports it to your backends. Running a Collector means your services send to a local endpoint rather than directly to Datadog, Prometheus, Jaeger, etc.

Benefits:
- Change observability backends without re-deploying services
- Add sampling, filtering, and enrichment in one place
- Reduce the number of connections each service needs to maintain

For an isolated development environment, this Collector runs on the same host as the demo clients. Use only the intended network interface and authenticated, encrypted connections when traffic crosses a trust boundary. Use a Collector distribution that includes each selected receiver and exporter. Record the histogram in seconds and carry the HTTP attributes required for your analysis.

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 127.0.0.1:4317
      http:
        endpoint: 127.0.0.1:4318

processors:
  batch:
  resource:
    attributes:
      - key: deployment.environment.name
        value: development
        action: upsert

exporters:
  prometheus:
    endpoint: "127.0.0.1:8889"
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true
  otlphttp/loki:
    endpoint: http://loki:3100/otlp

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [otlphttp/loki]
```

## The Grafana stack as a starting point

For teams starting from scratch: Prometheus (metrics) + Tempo (traces) + Loki (logs) + Grafana (dashboards and querying) is a cohesive, open-source observability stack that receives OTel signals natively.

Grafana's Explore view allows correlating all three signals: start with a metric anomaly, link to logs, link to a trace. This is the workflow that compresses diagnosis time.

For teams at scale or with managed service requirements: Datadog, Honeycomb, and Grafana Cloud all support OTel natively — instrument once, use managed infrastructure.

*Building observability for a new system or migrating from a vendor-specific instrumentation library? [Happy to compare approaches.](/contact/)*

## Follow one known request across all three signals

Pick a route with a controlled slow or failed request in a test environment. Mark each run with a synthetic identifier and use a known sampling policy. Begin with a service metric grouped by the low-cardinality route template and outcome. From that dashboard, open a trace for the same interval and identify the expensive span. Open log records for that trace and verify that their service identity, timestamps and span identifiers match. Repeat across an asynchronous worker so the exercise includes context propagation across a queue. A clean chart gives little assurance when it cannot be connected to an actual operation.

Keep the stable resource attributes consistent across SDKs and collectors. Set a service identity that distinguishes the owning service and deployment environment. Keep raw resource identifiers and full request paths out of metric dimensions. If a route template can represent the request, use the template. OpenTelemetry’s HTTP metric conventions specify `http.server.request.duration` in seconds. Track the SDK and instrumentation version when changing conventions so older and newer names or units cannot silently change an alert. [OpenTelemetry HTTP metric conventions](https://opentelemetry.io/docs/specs/semconv/http/http-metrics/)

Exemplars can associate selected metric observations with trace context while keeping trace identifiers outside the series key. Test that the backend displays exemplars and that their referenced traces survive the selected sampler and retention period. A usable link requires compatible configuration in the metric producer, storage and tracing backend. Record the fallback query if an exemplar is absent. Logs and traces should use the agreed retention and redaction policies even during test runs. [OpenTelemetry metrics data model](https://opentelemetry.io/docs/specs/otel/metrics/data-model/)

## Check units, cardinality and sampling before dashboards

Choose histogram buckets around the service objective. If the objective is 300 ms, include or derive a boundary appropriate to the metric system and make sure every instance exports a compatible unit and histogram scheme. Compare aggregate population latency from the histogram. Averaging pod-level p99 values does not produce the fleet’s p99, and leaving slow failed requests out can flatter the result. Keep success and error populations visible and attach the number of observations when reviewing a low-traffic route.

Estimate series growth before deploying a new attribute combination. In an illustrative upper-bound sketch, 40 routes, six outcomes and 12 instances can create up to 2,880 combinations for one instrument when all combinations are observed and the backend retains instance identity. Adding 500 customer identifiers would multiply that bound to 1.44 million even before histogram bucket representation. Actual cardinality depends on which combinations occur and how the backend stores them. Remove customer IDs from the metric key and use approved trace or log attributes for individual investigations.

If tail sampling keeps all errors and a small fraction of normal traces, a trace-store error percentage measures the retained sample. Build the service error-rate objective from a representative metric population instead. Set separate controls for fidelity and cost. For example, keep enough normal traffic to observe route diversity, and verify that latency or errors still get captured when cardinality is high. A published sampling policy should identify what is systematically underrepresented, including events where the route was never recognised.

## Measure buffering and loss at each boundary

Write down the expected failure behaviour for the SDK, collector, exporter and backend. At ingress, count data accepted and refused. Between processors, check whether filters and samplers remove data intentionally. At egress, check queue pressure, retryable exporter failures and records ultimately sent or lost. Choose per-signal units such as spans, metric points or log records. OTLP requests can contain batches, so a request count does not necessarily describe the volume affected. [Collector internal telemetry](https://opentelemetry.io/docs/collector/internal-telemetry/)

Consider an illustrative exporter receiving 4,000 kept spans per second. A 90-second backend pause creates 360,000 spans waiting to export when no traffic drains. At 700 encoded bytes per span, that is around 252 MB of payload in decimal units. This leaves out batch headers, compression, queue indexes and in-memory representation. Once the backend can accept 6,000 spans per second and arrivals continue at 4,000, clearing the illustrative backlog takes about three minutes. Verify actual disk or memory use, exporter limits and queue units with the specific build and workload. [Collector resiliency](https://opentelemetry.io/docs/collector/resiliency/)

Persistent queue storage can help a collector survive a restart, depending on configuration and data already accepted. Test the cases it leaves open, including filled storage, lost volumes, export retries that expire and a collector that never receives the span. Plot delay and loss separately. Alerting based on the eventual historical arrival of telemetry cannot restore an incident page that should have appeared minutes earlier. Where response time matters, report the service outcome during collector disconnection and ensure exports cannot dominate the application’s critical path.

## Treat configuration as a versioned operating artifact

Pin the collector build and distributions used by the test and production environments. Validate that configured components exist in that build and that the rendered configuration uses intended settings for transport and resource attributes. Keep an integration test that submits a synthetic metric, log and span via the normal SDK path, then queries the actual backend. For Loki, current guidance uses its OTLP ingestion path and an OTLP HTTP exporter. Check the receiving system’s documentation while replacing older exporter examples and validate attribute handling in the storage query. [Loki OTLP ingestion](https://grafana.com/docs/loki/latest/send-data/otel/)

Use separate credentials and restricted endpoints for ingestion and queries, and verify that redaction happens before export to a shared backend. Test with invented payment and identity markers, then query storage to confirm the approved attributes survived and the markers did not. Record the reason for each filter. An overly broad rule can make a critical outage appear healthy because all failed requests were removed at collection.

## Run a diagnosis exercise before declaring success

Invite someone who did not build the instrumentation to diagnose a simulated slow dependency. Give them the customer-visible symptom, approximate time and environment. Measure how long they take to identify the affected group, locate a representative trace, confirm the dependency and find a person who can act. Keep short notes on broken links and decisions requiring code access. Repeat after a collector change, deploy and mitigation drill. A working telemetry pipeline should help the next person answer the next question without relying on the authors’ memory of the configuration.

Compare time to diagnosis with the previous instrumentation under the same exercise. Record which actions depended on logs, whether the trace crossed the complete application flow and which links were available from the alert itself. Keep high-volume maintenance traffic and synthetic traffic visibly distinguishable. When exporting to a second backend during a migration, compare signal units and route groupings, delivery totals, log-field masking and a handful of selected trace IDs. Dual export can raise collector load, so record resource use and repeat the failure exercise at anticipated volume before removing the original backend.
