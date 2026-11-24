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

## What to measure

**Completion without a help ticket.** If 84 of 100 eligible provisioning attempts complete with no platform-team interaction and 10 require a ticket, self-service completion is 84%. Classify the remaining six as abandoned or failed, and compare wait times with the old process.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [DORA’s software delivery performance metrics](https://dora.dev/guides/dora-metrics/).

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

## Give a request a durable lifecycle

A provision command may return when the platform accepts the work, minutes before the underlying resource is useful. Return a durable request ID and make status available from the interface the caller used. The state transitions should distinguish validation, authorization, provisioning, verification and completion. Report which check failed and who owns the next action. If the operation uses credentials, expose a reference through the approved secret mechanism and avoid printing secret material into build and support logs.

In a fictional development environment workflow, a request has the service identity, environment, module version and caller-generated retry key. The platform validates ownership and inputs, records the desired change, and assigns a provisioning runner identity. A worker can safely restart after a timeout because it can look up the existing request and reconcile its recorded state. A repeated request with the same key can return the original receipt. A different payload with that key signals a caller error requiring resolution. Capture concurrent requests for the same target in the test suite even if their keys differ. State locking can protect operations on a shared Terraform state where the backend supports it. The request lifecycle still needs rules for duplicate requests and for resources that already exist. [Terraform state locking](https://developer.hashicorp.com/terraform/language/state/locking)

## Prove that provisioned means usable

Define completion from the application team's perspective. A resource ID alone leaves open whether the intended workload can reach it, whether backup is enabled and whether access is limited as designed. Add one automated check for each guarantee the platform exposes. Record outcomes alongside the requester, module version, policy version, and owner. Keep evidence that can be shared separate from any configuration values that carry credentials.

| Promise | Verification in a safe test environment |
| --- | --- |
| Resource exists at approved scope | Query the expected resource by the assigned identifier |
| Workload can reach it | Run a bounded application-level health check using its test identity |
| Ownership and cost allocation are visible | Compare the registered owner and allocation fields against inventory |
| Workload can recover | Verify the backup schedule and run a separate restore rehearsal against synthetic data |
| Resource will be reclaimed | Review the expiry and exercise cleanup for a disposable instance |

Start with a resource type that has an easy cleanup path and no real data. Test a failure after provisioning and before verification. The status should acknowledge that something exists even though the request failed. For a new empty sandbox, automatic cleanup may suit the contract. For a resource that might already contain data, route to its owner with the recorded resource status. Test whether the next attempt attaches to the surviving resource safely rather than allocating another.

## Measure where the work went

A lower help-ticket count can hide repeated retries or higher platform maintenance. For an illustrative cohort of 50 eligible requests, 36 complete within the target time without assistance, five complete late without assistance, four complete with help, and five fail or remain incomplete. Report 72% timely self-service completion and 82% overall self-service completion, with a denominator of all 50. Record the disposition of the other nine requests and report the follow-up cutoff. A request that eventually succeeds can still represent a missed target.

Review retry counts and queue wait alongside tickets. If eight individuals retry a failed page several times, group events by operation ID and keep event volume as a secondary measure. Compare the flow against the prior process for the same request types and risk tier. Record how much time the service owner spends verifying the resource and how much time platform staff spends maintaining and repairing the workflow. A shorter wait can improve the user experience even while the team is still learning whether total staff time fell.

## Design for the lifecycle after creation

Every template needs a documented path to change ownership, move to a supported version and retire its resources. Add a visible expiry and reminder policy to short-lived environments. Give long-lived production resources a separate review and state ownership. When a request creates artifacts in several systems, the service record should link the repository, pipeline, cloud resource and backup owner or provide a way to locate them. Run periodic inventory checks for resources whose owner is gone or whose lifecycle no longer matches the approved configuration.

Pilot version updates with a small group and verify an older supported workload. The platform should show who must act when a version is retired and what action they need to take. Confirm that an engineer can export or recover business data before scheduling a destructive change. Document the outcome of the pilot and update the template documentation when a request fails in a way that will affect the next team. [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/)
