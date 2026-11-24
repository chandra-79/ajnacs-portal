---
title: "Designing an Internal Developer Platform: Abstraction Layers, Golden Paths, and the Governance Balance"
description: "How to design the abstraction layer between your platform and your application teams — what to hide, what to expose, and how to build the golden paths that make good practices the easy practices."
date: 2026-05-19
tags: ["Engineering Leadership", "Architecture", "Fundamentals"]
series: "Platform Engineering: From Concept to Internal Developer Platform"
seriesOrder: 2
format: article
---

The design of a platform's abstraction layer determines whether developers adopt it or route around it. Abstract too much and developers cannot do what they need; developers write workarounds that bypass the platform. Abstract too little and the platform is just documentation — developers face the same complexity they had before. The right abstraction hides complexity developers should not need to manage and exposes control over the things that vary legitimately between services.

## What to measure

**Time to first compliant production deployment.** Take a cohort starting new services and measure elapsed time from repository creation to a successful, policy-compliant deployment. Report the median and p90, and track how many completed using the paved road without manual escalation.

*Illustrative measurement. Any numbers in this example are hypothetical.*

Further reading: [DORA’s software delivery performance metrics](https://dora.dev/guides/dora-metrics/).

## The Golden Path Concept

A golden path is an opinionated, supported route through the platform — the recommended way to deploy a service, set up monitoring, or manage a secret. It is not the only way, but it is the way that is documented, tested, and automatically compliant with security and operational standards.

The golden path removes decision fatigue from developers. Instead of evaluating 15 options for CI/CD configuration, the developer follows the golden path and gets a working, compliant pipeline. The platform team has made the decisions that are the same for every service; the developer makes the decisions that are specific to their service.

```
Golden path for deploying a service:
1. Run: platform service create my-service --template api-service
   → Creates repository with standard structure
   → Configures CI pipeline with security gates
   → Creates Kubernetes namespace with resource quotas
   → Sets up basic monitoring (RED metrics, logs, traces)
   → Registers service in the service catalogue

2. Write your application code
3. Push to main → automated deployment to staging
4. platform deploy my-service --env production → production deployment with approval gate
```

The developer writes application code. The platform handles infrastructure, compliance, and observability.

## What to Abstract vs What to Expose

A useful design heuristic: abstract whatever is the same for all services; expose control over whatever varies legitimately between services.

**Abstract** (same for all services, hide the complexity):
- Kubernetes deployment YAML structure
- Container registry authentication
- TLS certificate provisioning
- Default network policies
- Standard observability configuration (log format, metric endpoints)
- Security scanning in CI

**Expose** (legitimately varies between services, give developers control):
- Resource requests and limits (services have different load profiles)
- Scaling configuration (autoscaling thresholds differ by workload)
- Environment-specific configuration (connection strings, feature flags)
- Service dependencies (what services does this service depend on?)
- Custom alerting thresholds (what constitutes a problem for this service)

The platform interface should be simple enough that a new developer can deploy their first service within one day without reading infrastructure documentation. Every hour spent debugging platform configuration is an hour not spent on product work.

## The Escape Hatch Design Decision

Rigid platforms break when developers encounter legitimate requirements outside the golden path. Every platform needs escape hatches: defined ways to access the underlying infrastructure when the abstraction is insufficient.

**Tiered access model**:
- **Tier 1 (default)**: use the golden path. Fully managed, compliant, no infrastructure knowledge required.
- **Tier 2 (advanced)**: customise parameters within the golden path. Override specific resource limits, add custom health check paths, configure environment-specific variables.
- **Tier 3 (escape hatch)**: access the underlying infrastructure directly, with approval and documentation requirements. "I need a sidecar container for X reason" or "I need a custom network policy for Y integration."

Escape hatches prevent the platform from becoming an obstacle while keeping usage visible. If 30% of services are using Tier 3 regularly, that is a signal that the golden path does not cover a common requirement — time to add it to Tier 2.

## Service Catalogues: Making the Platform Discoverable

A service catalogue is the discovery layer for the platform. It answers: what services exist, who owns them, what do they depend on, and how do they behave?

Backstage (from Spotify, now a CNCF project) is the most widely adopted open-source service catalogue. It provides:
- A registry of all services with ownership, contact, and documentation
- Integration with CI/CD pipelines to show deployment status
- Plugin ecosystem for integrating monitoring, on-call schedules, and runbooks
- Software templates that generate new services from golden paths

```yaml
## backstage/catalog-info.yaml — registered with the catalogue
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: billing-service
  description: Processes billing events and generates invoices
  annotations:
    github.com/project-slug: org/billing-service
    pagerduty.com/integration-key: abc123
    grafana/dashboard-url: https://grafana.internal/d/billing
spec:
  type: service
  lifecycle: production
  owner: billing-team
  dependsOn:
    - component:payment-service
    - component:customer-service
    - resource:billing-database
```

## Policy as Code: Governance Without Bureaucracy

The platform enforces governance automatically, not through approval gates. Security, compliance, and operational standards are encoded as policies that evaluate every deployment:

```yaml
## OPA/Gatekeeper policy: no containers running as root
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sNoRoot
metadata:
  name: no-root-containers
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    namespaces: ["production", "staging"]
```

When a developer deploys a container configured to run as root, the deployment is rejected automatically with a clear error message: "Container 'my-api' is configured to run as root (uid 0). Use a non-root user. See platform documentation for the correct pattern."

The developer does not need to talk to a security team; the platform enforces the standard and explains how to comply. The security team focuses on defining policies, not enforcing them manually.

The right platform design produces the opposite of bureaucracy: developers move faster because they do not have to think about infrastructure, and governance is stronger because it is automated rather than manual.

## Define who owns the service after scaffolding

Write the developer-facing contract for one supported journey. For the first version, a team submits an application name, owning group, runtime family, and target environment. It gets a durable receipt, a repository, a pipeline status link, and an evidence record for the first qualifying deployment. State what the platform will maintain on the team's behalf, including shared pipeline updates and documentation. State what the service owner will maintain, such as application dependencies, service availability objectives, and any required data classification.

| Contract element | Platform team maintains | Application team maintains |
| --- | --- | --- |
| Delivery workflow | Supported runtime families, shared pipeline, rollout and policy checks | Code, tests, dependency upgrades outside the shared workflow |
| Service identity | Naming validation and approved identity creation mechanism | Owning group and declared services the application calls |
| Evidence | Deployment revision and policy outcome | Expected service-specific behavior and release approval where required |
| Support | Request status, failure guidance and platform on-call route | Service on-call route and defect triage |

Store this information where the team starts work. Catalog metadata can link an owning group, deployment and runbook. Backstage permits custom annotations, so publish which integrations consume their values and validate those values before presenting a completed entry. Store secret-bearing configuration in the appropriate secret store. A routine catalog review should compare a rotating sample against real pipeline records and ask a new engineer to reach the correct on-call route from an entry. [Backstage catalog descriptors](https://backstage.io/docs/features/software-catalog/descriptor-format/)

## Decide whether each feature is generated or maintained

A scaffold copies files into the new team's repository. Those copies then have separate histories. A reusable workflow or managed service can be updated centrally within its version contract, giving the platform an ongoing maintenance relationship. Design each part intentionally. A placeholder README may be a good copy because ownership transfers. A shared policy check is easier to maintain with a versioned, governed integration because its rules evolve across many teams.

For a fictional pilot, suppose 14 teams have copies of a deployment workflow. Moving the next baseline revision takes 15 minutes to apply and 25 minutes to test each copy. That totals 560 team minutes, or 9 hours and 20 minutes. If ten teams migrate to a common release contract, the remaining four copies represent 160 minutes of individual update work on the next change. The difference is a theoretical opportunity of 400 team minutes. Record shared workflow engineering, compatibility tests, support, and any mandatory team validation separately before estimating net savings.

An upgrade contract should identify supported versions, a changelog, an action deadline for security updates, and the rollback path for incompatible revisions. Test one representative repository per supported combination. Pin the old and new revisions in the test trace. Publish an example upgrade with a realistic service that confirms an application can still deploy, roll back, and exercise policy failure feedback.

## Keep the escape path measurable and reversible

Treat an escape hatch as an explicit capability boundary. Capture which supported parameter was insufficient, what the application needs, the requested scope and duration, and the owner's proposed verification. If request volume grows, group by missing capability before expanding the interface. Repeated requests for a different readiness endpoint are a different product signal from custom policy exceptions scattered across unrelated workloads.

In a fictional quarter, 12 of 40 eligible service onboarding attempts request an exemption. Seven need one supported health-check behavior, four involve a regulated integration, and one is an error caused by unclear documentation. Try the bounded health-check feature in staging first. Retest deployment, rollback, and incident discovery. If the support path can then handle those seven cases, assess the next onboarding cohort against the same eligibility rule and follow-up window. Treat four policy exceptions as their own design question. A platform with fewer exceptions but rising abandoned journeys may be measuring difficult work out of its cohort.

For a declared exception, include an expiry and how the service comes back to the supported path. Apply any break-glass procedure with its own authorization, logging, verification and follow-up. Version rule explanations alongside the proven policy examples, and tie each rejection to an actionable developer message.

## Turn a path document into a release checklist

Pilot one workload type and one test environment with teams that differ in their familiarity with the platform. Invite users who have not helped implement the templates. A platform engineer observing the exercise records where users pause, request missing permissions or abandon the guided path. Track intervention without silently fixing the underlying state so the team can reproduce the problem.

In an illustrative cohort of 20 teams followed for 10 business days, 13 self-serve their first compliant deployment, four do so with a platform engineer, and three remain incomplete when follow-up ends. Self-service completion is 65%. Overall completion is 85%. Add elapsed time among the 17 completions plus counts and observed wait times for the three unfinished journeys. Compare equal follow-up windows and the same definition of a compliant deployment across cohorts.

Exercise the failure side of the contract using safe fixtures. Test ambiguous owner input, a policy rejection, an unavailable deployment target, a known compatibility constraint, and retry after a transient failure. Keep request identifiers and status transitions in the checklist. Close a pilot by deciding which failure to fix, which to document as unsupported, and what will constitute a successful retest. Use the outcomes to prioritize the next increment, alongside the effort to maintain each abstraction. [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/) [DORA platform engineering guidance](https://dora.dev/capabilities/platform-engineering/)
