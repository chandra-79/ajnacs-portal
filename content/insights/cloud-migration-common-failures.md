---
title: "Why Cloud Migrations Fail: The Pattern Behind the Common Failures"
description: "Cloud migrations that fail share recognisable patterns — lift-and-shift with no optimization, underestimated dependency complexity, inadequate cost modeling. Understanding these patterns before starting is preventable failure."
date: 2025-07-11
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
---

Cloud migration success rates are worse than most organizations expect. Projects run over budget, over time, and sometimes deliver infrastructure that is more expensive and less reliable than what was replaced. The causes are usually not technical failures — they are planning failures that the technology cannot compensate for.

The patterns behind failed migrations are well-documented at this point. Most of them are avoidable.

## Lift-and-shift with no optimization plan

The fastest path to cloud is lifting an on-premises workload and dropping it in a cloud VM with a similar specification. This works in the short term and almost always produces disappointing economics in the medium term.

On-premises workloads are designed around the economics of owned hardware: large, always-on, provisioned for peak load. Cloud economics reward elasticity, managed services, and right-sizing. A 16-core, 64GB VM running on-premises at 20% utilization costs roughly the same as running it in the cloud — but in the cloud you are also paying for the 80% you are not using, with no depreciation benefit.

Lift-and-shift is a migration phase, not a final state. Organizations that treat it as the end goal pay on-premises prices for cloud infrastructure without the reliability, flexibility, or managed service benefits that justify cloud investment.

The migration plans that succeed treat lift-and-shift as a transitional phase with a defined optimization roadmap: which services will be modernized to PaaS or SaaS, which will be right-sized, which will adopt cloud-native patterns, and on what timeline.

## Underestimating dependency complexity

Application dependencies are almost always more complex than the dependency map suggests. An application that appears to depend on three services in the migration assessment may actually depend on twelve services, some of which are undocumented, some of which are dependencies of dependencies.

Undiscovered dependencies surface during migration in the form of broken connectivity: the application is in the cloud and the dependency is not, and the application fails silently until an engineer investigates.

The dependency mapping investment before migration is undervalued. Automated discovery tools (AWS Migration Hub, Azure Migrate, third-party tools) can identify network-level dependencies that manual documentation misses. Thorough dependency mapping takes time and delays the start of migration; it almost always reduces the total time to completed migration by avoiding dependency-related incidents.

## Inadequate cost modeling

Cloud costs are genuinely hard to model accurately before migration, which leads to two failure modes: under-estimating costs and being surprised by the bill, or over-estimating costs and being unable to justify the migration business case.

The costs that are consistently underestimated:
- Data transfer: egress from cloud is charged per GB. High-egress workloads (data analytics, content delivery, applications with large response payloads) have significant transfer costs that don't have an on-premises equivalent.
- Licensing: bring-your-own-license costs, plus the licenses for cloud-native services that replace on-premises tooling.
- Operations tooling: monitoring, security, backup, and compliance tooling that was handled by on-premises infrastructure teams.

The correct approach: build a cloud cost model using the cloud provider's pricing calculator, add 20-30% for unmodeled costs, validate against a pilot workload, and use the pilot actuals to recalibrate the full migration estimate.

## Missing the security and compliance handoff

On-premises environments have accumulated security controls over years: network segmentation, access controls, patch management, monitoring. These controls are not automatically replicated when workloads move to cloud.

The failure mode: a migration that is technically successful (applications are running in cloud) but security controls are incomplete. The cloud environment has default security configurations rather than the controls required by compliance frameworks or security policy.

Security and compliance requirements for the cloud environment should be defined before the first workload migrates, not after. The cloud landing zone — the account structure, network architecture, identity configuration, logging, and monitoring baseline — must be established first. Workloads migrate into a secure environment, not one built concurrently with migration.

## Insufficient testing before cutover

Cutover is the moment of highest risk in any migration. The application is in the cloud; the on-premises system is decommissioned; user traffic is switching. If something is wrong, you are in an incident, not a deployment.

Migrations that are underprepared for cutover often have not tested the cloud environment under production-representative load, have not verified that monitoring and alerting are configured correctly, and have not tested the rollback procedure.

A cutover without a tested rollback is not a deployment — it is a bet. Rollback procedures are worth as much investment as the forward migration.

*Planning a cloud migration or troubleshooting one that is not going as expected? [Happy to share what the preparation phase should cover.](/contact)*
