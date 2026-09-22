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

The P99 latency matters more than the average. An average response time of 100ms can hide a P99 of 2 seconds — 1% of requests taking 20x longer than typical. For services at any meaningful scale, 1% is a lot of users.

```java
// OTel metrics
Meter meter = GlobalOpenTelemetry.getMeter("order-service");

LongCounter requestCounter = meter.counterBuilder("http.server.requests")
    .setDescription("Total HTTP requests")
    .build();

DoubleHistogram latencyHistogram = meter.histogramBuilder("http.server.duration")
    .setDescription("HTTP request duration")
    .setUnit("ms")
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
  "trace_id": "a3b4c5d6e7f8a9b0",
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

Collector configuration:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
  resource:
    attributes:
      - key: deployment.environment
        value: production
        action: upsert

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

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
      exporters: [loki]
```

## The Grafana stack as a starting point

For teams starting from scratch: Prometheus (metrics) + Tempo (traces) + Loki (logs) + Grafana (dashboards and querying) is a cohesive, open-source observability stack that receives OTel signals natively.

Grafana's Explore view allows correlating all three signals: start with a metric anomaly, link to logs, link to a trace. This is the workflow that compresses diagnosis time.

For teams at scale or with managed service requirements: Datadog, Honeycomb, and Grafana Cloud all support OTel natively — instrument once, use managed infrastructure.

*Building observability for a new system or migrating from a vendor-specific instrumentation library? [Happy to compare approaches.](/contact)*
