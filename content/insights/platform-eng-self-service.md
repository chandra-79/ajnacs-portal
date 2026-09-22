---
title: "Self-Service Infrastructure: How to Build It Without Losing Operational Control"
description: "Scaffolding tools, infrastructure templates, self-service portals, and the approval workflows that give developers autonomy without turning the platform into a liability."
date: 2026-05-07
tags: ["Engineering Leadership", "DevSecOps", "Fundamentals"]
series: "Platform Engineering: From Concept to Internal Developer Platform"
seriesOrder: 3
format: article
---

Self-service infrastructure is the mechanism that makes platform engineering scale. If every request for a new environment, a new database, or a new service requires a ticket to the platform team, the platform team is a bottleneck, not an accelerator. Self-service removes the bottleneck by giving developers the ability to provision approved infrastructure patterns without human approval from the platform team.

## What Self-Service Infrastructure Looks Like in Practice

The experience from the developer's perspective should be as simple as possible:

```bash
## Request a new PostgreSQL instance for a service
platform db create \
  --service billing-service \
  --engine postgres \
  --version 16 \
  --size small \
  --env staging

## Output:
## Creating PostgreSQL instance for billing-service in staging...
## ✓ Instance provisioned: billing-db-staging (10.0.1.45:5432)
## ✓ Connection string added to billing-service secrets
## ✓ Network policy created: billing-service → billing-db-staging
## ✓ Backup policy applied: daily, 14-day retention
## ✓ Monitoring dashboard created: grafana.internal/d/billing-db-staging
## # Your database is ready. Connection details available via:
## platform secret get billing-service/db-connection-string
```

Behind that command: the platform applies a Terraform module that provisions the database with the organisation's standard configuration — encryption at rest, automated backups, the correct network policies, monitoring setup, and secrets stored in the approved secrets manager. The developer gets a working database; the platform team gets consistent, policy-compliant infrastructure.

## Infrastructure Templates: The Technical Foundation

Terraform modules and Helm charts are the building blocks of self-service infrastructure. Each template encodes one approved pattern:

```hcl
## modules/postgresql/main.tf — approved PostgreSQL pattern

module "postgresql" {
  source = "../../modules/postgresql"

  name        = var.service_name
  environment = var.environment
  size        = var.size   # "small" | "medium" | "large"

  # These are not configurable by callers — enforced by the module:
  # - Encryption at rest enabled
  # - Automated backups enabled with 14-day retention
  # - Parameter group with security-hardened settings
  # - Enhanced monitoring enabled
  # - Multi-AZ for production environments
  # - Network policy restricts access to owning service only
}
```

The module exposes the parameters that legitimately vary (service name, size, environment). It enforces everything that should be the same for all instances. A developer invoking the module cannot accidentally create an unencrypted database or a database accessible from everywhere.

## Scaffolding New Services

New service creation is the highest-value self-service capability. A scaffolding tool generates everything a new service needs:

```bash
platform service create payment-processor \
  --type api \
  --language python \
  --owner payments-team

## Generates:
## payment-processor/
## ├── .github/workflows/
## │   ├── ci.yml              # Testing, linting, security scanning
## │   └── deploy.yml          # Staged deployment pipeline
## ├── kubernetes/
## │   ├── deployment.yaml     # Standard deployment template
## │   ├── service.yaml
## │   └── hpa.yaml            # Horizontal pod autoscaler
## ├── monitoring/
## │   └── alerts.yaml         # Default SLO-based alerts
## ├── src/
## │   └── main.py             # Application entrypoint with health check
## ├── tests/
## ├── Dockerfile              # Production-ready, non-root, multi-stage
## ├── catalog-info.yaml       # Backstage registration
## └── README.md               # Service documentation template
```

The generated service is immediately deployable, monitored, and compliant. The developer starts writing business logic immediately.

## Approval Workflows: When to Require Human Judgment

Not everything should be fully automated. Production database creation, external network exposure, and elevated IAM permissions benefit from a lightweight approval step — not as a bottleneck, but as a human review that catches mistakes.

The design principle: approvals should be fast (minutes, not days) and targeted (specific risk, specific reviewer, clear criteria for approval).

```yaml
## Self-service request requiring approval
request:
  type: external-endpoint
  service: billing-service
  description: "Expose billing API to payment processor partner"
  justification: "Partnership agreement signed, technical integration required"
  
auto-approval: false
reviewers:
  - security-team   # network exposure requires security review
  - billing-team-lead
approval-sla: 4 hours   # platform commitment to review time

## Approval criteria (shown to reviewers):
## 1. Is the exposed service the correct one for this use case?
## 2. Is TLS termination configured?
## 3. Is authentication documented in the request?
## 4. Has the external IP range been verified as the partner's?
```

The approval workflow should document what reviewers are checking so the review is consistent and not dependent on individual knowledge.

## Measuring Self-Service Adoption

Self-service success is measured by:

- **Time to first deployment**: how long from service creation request to first successful deployment in staging
- **Escape hatch rate**: what percentage of infrastructure is provisioned outside the platform's self-service interfaces
- **Ticket deflection**: how many infrastructure-related requests to the platform team are now handled by self-service
- **Developer satisfaction**: quarterly survey of application teams on platform usability

The escape hatch rate is the most honest signal. If 40% of new infrastructure is being created directly through the cloud console or raw Terraform, the self-service offering is not meeting developer needs. Understand why before building more features.
