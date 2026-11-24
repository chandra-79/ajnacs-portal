---
title: "Why Cloud Migrations Fail: The Pattern Behind the Common Failures"
description: "Cloud migrations that fail share recognisable patterns — lift-and-shift with no optimization, underestimated dependency complexity, inadequate cost modeling. Understanding these patterns before starting is preventable failure."
date: 2025-07-11
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
---

Cloud migration success rates are worse than most organizations expect. Projects run over budget, over time, and sometimes deliver infrastructure that is more expensive and less reliable than what was replaced. The causes are usually not technical failures — they are planning failures that the technology cannot compensate for.

The patterns behind failed migrations are well-documented at this point. Most of them are avoidable.

## What to measure

**Traffic shifted with measurable rollback time.** During a trial cutover, migrate 5,000 of 100,000 requests and time rollback from the decision to the first clean measurement window. Track data reconciliation lag separately so traffic reversal does not mask leftover writes.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## Lift-and-shift with no optimization plan

The fastest path to cloud is lifting an on-premises workload and dropping it in a cloud VM with a similar specification. This works in the short term and almost always produces disappointing economics in the medium term.

On-premises workloads are designed around the economics of owned hardware: large, always-on, provisioned for peak load. Cloud economics reward elasticity, managed services, and right-sizing. A VM sized for on-premises peaks can carry idle capacity into cloud billing. Compare equivalent service outcomes, demand, allocated infrastructure cost, licensing, support and contract terms.

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

The correct approach: build a cloud cost model using the cloud provider's pricing calculator, show ranges for uncertain items such as transfer, temporary duplication and support, then recalibrate each estimate with pilot costs, validate against a pilot workload, and use the pilot actuals to recalibrate the full migration estimate.

## Missing the security and compliance handoff

On-premises environments have accumulated security controls over years: network segmentation, access controls, patch management, monitoring. These controls are not automatically replicated when workloads move to cloud.

The failure mode: a migration that is technically successful (applications are running in cloud) but security controls are incomplete. The cloud environment has default security configurations rather than the controls required by compliance frameworks or security policy.

Security and compliance requirements for the cloud environment should be defined before the first workload migrates, not after. The cloud landing zone — the account structure, network architecture, identity configuration, logging, and monitoring baseline — must be established first. Workloads migrate into a secure environment, not one built concurrently with migration.

## Insufficient testing before cutover

Cutover is the moment of highest risk in any migration. The application is in the cloud; the on-premises system is decommissioned; user traffic is switching. If something is wrong, you are in an incident, not a deployment.

Migrations that are underprepared for cutover often have not tested the cloud environment under production-representative load, have not verified that monitoring and alerting are configured correctly, and have not tested the rollback procedure.

A cutover without a tested rollback is not a deployment — it is a bet. Rollback procedures are worth as much investment as the forward migration.

*Planning a cloud migration or troubleshooting one that is not going as expected? [Happy to share what the preparation phase should cover.](/contact/)*

## Classify dependencies by when they matter

A service list is a starting point. For each confirmed dependency, add the direction of traffic, systems and service accounts involved, data classification, business consequence, and time pattern. A reporting job that runs at midnight and an authorization check in the purchase path should have separate entries even if they reach the same database. Capture their owners and observability signals. Record unknowns with a person and date for resolution. Service graphs gathered from one quiet period will miss dormant integrations. Compare flow evidence with firewall records, scheduled jobs, and an interview with the team that actually receives the results.

Use dependencies to choose the smallest meaningful wave. In a fictional migration, the primary API calls a search service on every request and sends statements through a monthly process. If the search path cannot tolerate added latency, either migrate it with the API or validate its temporary cross-environment route under peak load. If statement generation can stay behind for a wave, prove that it will still receive the run input and that the recipient can reconcile its results. A completed health check at the new API is not evidence that either dependency works. [AWS wave planning guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/application-portfolio-assessment-guide/wave-planning.html) covers grouping workloads and planning dependency-aware cutovers.

## Build the business case from units of work

Use a baseline interval that includes both ordinary and exceptional demand. Separate fixed spend, costs that change with volume, and one-time transition expenses. In an illustrative workload, 600 jobs per day each transfer 80 MB to a destination billed at a hypothetical $0.08 per decimal GB. Thirty days produce 1,440 GB and $115.20 in transfer charges before any other network fees. A second output of the same size copied to another billed destination doubles the modeled transfer volume. The dollar figure in this example has no relevance to the actual region or contract. The useful part is the count of transfers that the model must account for.

Compare costs at equivalent service outcomes. Keep request success, recovery time, and storage retention in the worksheet beside dollars. Include the period when both estates run, along with the people and tooling needed to support them. If a pilot appears cheaper because the new environment retains logs for seven days instead of 30, restore the original requirement before calling the difference a saving. Record which discounts are already contracted, which are optional, and who absorbs unused commitments. After the pilot, compare invoiced totals with the predicted inputs. Investigate large differences by service and invoice dimension. Avoid converting a pilot difference into a markup for every migration wave.

## Walk the cutover through observable checkpoints

Start with an explicit checkpoint where the old environment is still authoritative. Pause new writes only if the business has agreed to that constraint and knows how requests will be handled. Confirm that all relevant changes have reached the target, compare an agreed control total, and document whether the old path remains available for immediate reversal. The first successful write into the new environment may change the kind of recovery possible. Decide how to capture, replay, or reconcile later writes before sending any production traffic.

In an illustrative rehearsal, the database catches up in 16 minutes, the control totals are verified in seven minutes, and a traffic switch plus a request test takes five minutes. The timeline totals 28 minutes if those stages cannot overlap. If the business allows 40 minutes, the remaining 12 minutes have to cover decision latency and an actual reverse transition, not just a switch command. Observe both the forward and reverse run from the client side. Use the measured timings to place a deadline before the latest moment when a safe reversal can still fit. The [AWS pre-cutover guide](https://docs.aws.amazon.com/prescriptive-guidance/latest/best-practices-migration-cutover/pre-cutover-stage.html) outlines the dependencies, test plans, sequence, and ownership needed in a runbook.

## Make acceptance a handoff with accountable owners

Define enough checks for the application owner, operations owner, and compliance owner to make independent acceptance decisions. Test one representative read and one synthetic write through the normal user route, and reconcile what arrived at the system of record. Restore a test asset from the new backup so the team can verify access, content, and elapsed recovery. Open a controlled incident to exercise alert routing and how the owner establishes whether users are affected. The test should go to the same team expected to respond after the project closes.

Record anything provisional at acceptance, including temporary network paths, additional on-call staffing, compatibility components, and manually monitored reconciliation jobs. Give each an owner and a reason it can be removed. Charge prolonged dual operation to the migration program until agreed exit criteria have passed. Keep the prior environment only as long as recovery, retention, and compliance requirements specify. A wave that is technically cut over but still relies on old operational personnel is not ready for closure. Confirm on the next business cycle that the new owners can carry the workload without the project team.
