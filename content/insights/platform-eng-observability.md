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

Auto-instrumented metrics using OpenTelemetry operators: install the OpenTelemetry Operator in the cluster, annotate workloads for auto-instrumentation, and the operator injects the OpenTelemetry agent as a sidecar — collecting HTTP request metrics, runtime metrics, and infrastructure metrics without application code changes.

```yaml
## Namespace annotation enables auto-instrumentation for all pods
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
