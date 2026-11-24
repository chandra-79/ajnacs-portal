---
title: "Platform Observability: Building the Visibility Layer Every Application Team Gets Automatically"
description: "How platform teams build and operate the metrics, logging, and tracing infrastructure that application teams consume without configuring — and what good platform observability coverage actually looks like."
date: 2026-09-16
tags: ["DevSecOps", "Architecture", "Fundamentals"]
series: "Platform Engineering: From Concept to Internal Developer Platform"
seriesOrder: 4
format: article
---

One of the highest-value things a platform team can provide: every service deployed through the platform is observable from day one without the developer writing a single line of observability configuration. Logs flow to the central system, RED metrics (rate, errors, duration) are collected and displayed, distributed traces connect requests across services, and default alerts fire before issues become incidents.

This is achievable. Here is how to build it.

## What to measure

**Availability measured by developer journeys.** Run synthetic scaffold, build and deploy tasks against the platform. If 4 of 800 attempts fail within the measurement window, journey success is 99.5%. Break failures down by identity, registry, runners and deployment target so owners can act.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [Google’s SRE Workbook, Implementing SLOs](https://sre.google/workbook/implementing-slos/).

## The Three Pillars and How to Automate Them

**Logs**: every application emits logs. The platform should collect them without requiring the developer to configure a logging agent.

In Kubernetes, the pattern: configure a DaemonSet running a log collector (Fluent Bit, Fluentd, Vector) on every node. The collector reads container logs from `/var/log/containers/` automatically, enriches them with Kubernetes metadata (namespace, pod name, deployment, team label), and ships them to the central log platform (Elasticsearch, Loki, CloudWatch Logs, Datadog).

```yaml
## FluentBit DaemonSet — collects logs from all containers automatically
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:2.2
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

The developer requirement: emit structured JSON logs to stdout. The platform handles everything else.

**Metrics**: the platform installs a Prometheus instance (or uses a managed equivalent) and scrapes metrics from all services automatically using Kubernetes service discovery.

Configure an OpenTelemetry Instrumentation resource and annotate the intended workloads. The Operator's injection behavior and the application signals available depend on the language and enabled instrumentation. Configure the Collector and infrastructure metrics separately.

```yaml
## Illustrative namespace preference for compatible Python workloads with an Instrumentation resource configured
apiVersion: v1
kind: Namespace
metadata:
  name: billing
  annotations:
    instrumentation.opentelemetry.io/inject-python: "true"
```

**Traces**: the same OpenTelemetry auto-instrumentation that collects metrics also injects distributed tracing. HTTP clients and servers, database drivers, and message queue clients are instrumented automatically. Traces flow to Jaeger, Tempo, or a managed tracing backend.

## The Default Dashboard

Every service deployed through the platform should have a working dashboard without the developer building one. The platform pre-builds dashboard templates for common service types:

- **API service dashboard**: request rate, error rate, p50/p95/p99 latency, pod count, CPU/memory usage, saturation indicators
- **Background worker dashboard**: job queue depth, job success/failure rates, processing latency, DLQ (dead letter queue) depth
- **Database dashboard**: connection count, query latency, replication lag, storage utilisation

```python
## Grafana dashboard provisioning via Terraform
resource "grafana_dashboard" "api_service_template" {
  for_each = var.api_services   # one dashboard per API service
  
  config_json = templatefile("templates/api-service-dashboard.json.tmpl", {
    service_name = each.key
    namespace    = each.value.namespace
    team         = each.value.team
  })
  
  folder = grafana_folder.teams[each.value.team].id
}
```

## Default Alerting Rules

Auto-provisioned alerting rules for every service:

```yaml
## Prometheus rules auto-applied to all services via the platform
groups:
- name: platform.service.defaults
  rules:
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m])) by (service, namespace)
      /
      sum(rate(http_requests_total[5m])) by (service, namespace)
      > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "{{ $labels.service }} error rate above 5%"
      runbook: "https://platform.internal/runbooks/high-error-rate"

  - alert: PodCrashLooping
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "{{ $labels.pod }} is crash looping"
```

Teams receive these default alerts automatically. They can override thresholds or add additional alerts specific to their service's business metrics.

## Observability SLOs at the Platform Layer

Beyond individual service alerts, the platform maintains SLOs for its own services — the CI/CD pipeline, the secrets manager, the service registry. Application teams depend on these; their reliability is the platform team's operational responsibility.

```yaml
## Platform team SLOs
- service: ci-pipeline
  slo: 99% of pipeline runs complete within 15 minutes
  error_budget_burn_alert: notify platform-oncall when 10% consumed in 1 hour

- service: secrets-manager
  slo: 99.9% availability for secret reads
  latency_slo: p99 secret read < 100ms

- service: artifact-registry  
  slo: 99.9% availability for image pulls
```

The platform team is on-call for its own infrastructure. Application team reliability cannot be bottlenecked by platform infrastructure that is not reliably operated.

## What Good Platform Observability Coverage Looks Like

A platform observability implementation is complete when:

1. Any service deployed through the platform has logs in the central log system within 60 seconds of deployment
2. RED metrics are visible in a pre-built dashboard within 5 minutes of the first request
3. Distributed traces connect at least 80% of cross-service requests
4. Default alerts fire within 5 minutes of a failure condition meeting the threshold
5. A new engineer joining a team can find their service's logs, metrics, and traces in under 10 minutes without assistance

If any of these are not true, the observability coverage has gaps. Measure them explicitly and close them.

## Specify the first request you expect to find

Take a service's initial smoke request as the acceptance test for platform observability. Give the synthetic caller a fresh request ID and note the deployment revision, service identity, environment, timestamp, route and expected status. Use an innocuous endpoint and synthetic values. After making the request, verify that an engineer can find the expected counter movement, a structured log from the expected revision and, if the request was sampled, a trace with the dependencies the test exercised.

| Layer | Evidence to record |
| --- | --- |
| Application | Received request and expected response, log and emitted signal inventory |
| Collector or scraper | Signal accepted and forwarded, or reason it was dropped |
| Backend | Searchable resource identity and reported delay |
| Developer view | Correct service and time window, authorized access, ownership link |

Before declaring a missing trace, check correlation and sampling. A trace may exist but use a different service name or time window. A sampled-out trace and failed export call for different responses. Keep one synthetic trace with a known sampling decision as a pipeline check. Also create a failed fixture, such as a missing test exporter route, and verify that telemetry health diagnostics reveal where collection stopped. Publish the join keys the platform supports and avoid placing request IDs or end-user identifiers in metric labels. [OpenTelemetry resource semantic conventions](https://opentelemetry.io/docs/specs/semconv/resource/) [Prometheus instrumentation practices](https://prometheus.io/docs/practices/instrumentation/)

## Measure collection delay separately from signal coverage

Keep two measures for each supported stack. Coverage asks whether the expected signal appeared. Delay asks when it became queryable after the actual event. For a synthetic deployment check across 24 service revisions, suppose 22 produce an expected metric within 90 seconds, one produces it after 140 seconds, and one never appears during a 10-minute cutoff. Report 91.7% within target and 95.8% eventual visibility within the test window. Include the cutoff, evaluation timestamp and late results in the evidence. Disable caching in the health query or record its refresh interval because it can shift observed visibility.

Check whether any failing services share a language, instrumentation mode or pipeline configuration. Java and Python auto-instrumentation, for example, use language-specific configuration and dependencies. OpenTelemetry's Operator activation path also depends on a configured Instrumentation resource and on how the workload is annotated. Some collectors, sidecars and application instrumentation are distinct parts of a deployment. Record the exact operator and runtime versions alongside the test. Add application-owned business metrics and custom spans where generic libraries have no way to infer the important event. [OpenTelemetry Operator instrumentation](https://opentelemetry.io/docs/platforms/kubernetes/operator/automatic/)

## Calculate a series budget before opening new labels

A common service name and bounded route template can support useful aggregation. A label containing raw URL paths, orders, users or request IDs can create more active series as traffic and customer counts grow. Estimate a ceiling for the combinations a change would introduce, then confirm what the backend actually sees. For an illustrative metric, eight routes, three methods, five response classes and twelve replicas give up to 1,440 combinations before a histogram's associated bucket series and other labels. Multiplying by ten bucket series and two summary series can give up to 17,280 series for a classic histogram under those inputs. Real combinations are usually sparse and histogram implementation details matter. Use the estimate to guide a representative staging test and inspect cardinality over a full deployment cycle. [Prometheus instrumentation practices](https://prometheus.io/docs/practices/instrumentation/)

Set an explicit owner for cardinality review, a per-signal retention expectation, and access policies for production data. Dropping labels can break dashboards and alerts. Before changing the shape of a series, query recent rules and views for label usage, run old and proposed configurations on test traffic, and compare signal counts and queries. Ensure redaction and payload handling preserve the troubleshooting information teams actually use. Reassess the budget when traffic, tenants, routes or replicas change materially.

## Verify that an alert gets a decision

Send each platform alert to a named owner and attach a procedure that starts from the observed condition. Separate receiver tests from alert condition tests. A known synthetic failure can establish whether the rule transitions, whether routing and escalation operate as configured, and how long acknowledgement actually takes. Test a small traffic window and input with absent data. An error ratio from one request is weak paging evidence for a busy on-call team even if it is arithmetically large.

Pair each important alert with a live service objective, a reasonable threshold, an urgent or routine interpretation, and a way to see whether users are affected. After a drill, review both the traffic symptom and receiver timing. Check for a scenario where telemetry delivery fails while the service remains healthy. Its platform owner needs evidence of missing telemetry, and its application owner needs an honest summary of the available signals. Repeat the journey after changing the default templates so a dashboard's existence is backed by a usable start-to-finish workflow. [Google SRE Workbook on alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
