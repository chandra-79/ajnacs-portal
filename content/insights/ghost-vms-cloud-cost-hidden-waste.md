---
title: "Finding Unowned VMs: Investigate, Retire Safely and Verify Savings"
description: "Identify potentially unused virtual machines with multiple signals, verify ownership and recovery needs, and calculate a staged cost reduction example."
date: 2027-01-20
tags: ["FinOps", "Cloud Architecture"]
format: article
---

## How Ghost VMs Accumulate

One plausible pattern is: A project stands up infrastructure. The project finishes, pivots, or gets cancelled. The infrastructure doesn't get cleaned up because:

- The team that provisioned it disbanded
- Nobody has explicit decommission ownership
- The shutdown process requires approvals that feel harder than the monthly bill
- The VM is part of a shared account and nobody notices the orphan among hundreds

**Auto-scaling remnants** are a specific variant. A group scales out during a traffic event and scales in — but not all the way. One instance stays because the scale-in policy has a minimum of 1 and nobody revisited the minimum when traffic dropped permanently.

**Development environments** are another common source. A developer provisions a VM for local testing. The project ships. The VM stays because it costs $40/month and the developer doesn't think about it again. Multiply by 200 developers over three years.

## What Makes Ghost VMs Hard to Find

The challenge isn't that they're hidden. They're visible in your billing console. The challenge is distinguishing a genuinely idle VM from one that looks idle but serves a real function — a scheduled job that runs once a month, a cold standby that's never supposed to receive traffic, a compliance archive instance.

Naively filtering on CPU utilization will generate false positives. A database replica can be near-zero CPU for weeks and be genuinely necessary. A compliance logging instance might look like nothing is using it until the day you need it.

Candidate evidence can include configurable signals such as:
- **CPU utilization < 5% for 30+ days**
- **Network in/out < 1 GB over 30 days**
- **No inbound connections** from any external source in 30 days
- **No successful authentication** (last login > 60 days)
- **No attached workload tickets** in your ITSM

## Detection at Scale

**Cloud Custodian** is worth the investment if you're operating across multiple accounts or providers. Its policy DSL lets you express complex multi-signal conditions and route findings to a Slack channel, a ServiceNow ticket, or an automated stop action — without writing infrastructure code.

## The Remediation Process That Actually Works

Hard deletes without notice generate incident reports. A safe workflow needs investigation, authorization, a recoverable stop and verified retirement.

## The Governance Change That Prevents Recurrence

Detecting and remediating ghost VMs is a cleanup exercise. Preventing them requires a **decommission policy** built into your provisioning workflow.

Every VM provisioning request should include a **decommission date** or an **evergreen justification** (a reason the VM should exist indefinitely with a named team responsible for it). Set up an automated workflow that pings owners 30 days before the decommission date. If there is no response, escalate ownership and follow an approved change policy rather than treating silence as proof of safety.

This is harder to implement than it sounds — it requires buy-in from engineering teams who resent the administrative overhead. The argument that works: "This will prevent the cloud cost review where we ask you to explain $4,000 of infrastructure nobody recognises."

The ghost VMs aren't a technical problem. They're an organizational one that technology can surface and policy can prevent.

*Dealing with a ghost VM problem at your organization? Discuss a remediation workflow — [get in touch](/contact/).*

## Treat low utilization as a lead, not proof of waste

An idle virtual machine may be an abandoned experiment, a disaster-recovery dependency, a scheduled reporting host or a licensing endpoint used only during a rare workflow. Missing telemetry can also look like zero activity. Before ranking candidates, distinguish observed inactivity from an absent monitoring agent, a disconnected metric pipeline or a short retention window. A dashboard showing a flat line is not evidence that the workload has no purpose.

The investigation should record account, region, resource identifier, creation method, last known owner, attached disks, addresses, scheduled tasks, backup policy and dependencies. Compare inventory with infrastructure-as-code state and service ownership records. An unmanaged resource may still be important; a managed resource may still be unnecessary. Neither label replaces a dependency check.

Use utilization windows that cover the business cycle. A month-end job cannot be assessed from an ordinary weekday alone, and an annual recovery exercise may not appear in a thirty-day observation. Ask the service owner what event activates the resource and where that requirement is documented. If nobody can establish an owner, escalate ownership as an operational issue instead of automatically treating silence as authorization to delete.

### Hypothetical savings with residual costs

Suppose twenty candidate VMs each cost 100 currency units per month for compute and 20 for attached storage. Their combined monthly cost is 20 × 120 = 2,400. Investigation confirms that eight can be decommissioned, four must remain, and eight require more evidence. Stopping the confirmed eight saves 800 in monthly compute under the assumed billing model, but their 160 of storage charges remain. The modeled bill falls to 1,600, not 1,440.

If the approved retirement later removes those eight disks as well, the modeled total becomes 1,440. The chart displays the initial, compute-stopped and fully-retired states. These are invented prices and quantities. Real savings depend on billing rules, retained snapshots, public addresses, licensing and commitments. Stopping a VM may not reduce the organization's payable commitment during the current term, even when it reduces on-demand-equivalent consumption.

Publish both avoided usage and actual billed savings where they differ. A fixed commitment may be reused by another eligible workload, creating a benefit that is real but not equivalent to an immediate cash reduction. Record the relevant period so one-time cleanup costs are not confused with recurring savings.

## A reversible investigation workflow

First classify the candidate and collect dependency evidence. Then obtain the appropriate service-owner decision under the organization's change process. Communicate the planned action and rollback path to the people who operate dependent services. A fixed response window can be useful administratively, but elapsed time alone does not prove safety. High-criticality or ownerless resources may require escalation rather than an automatic stop.

For a planned stop, verify how to restart the workload, whether addresses can change, whether ephemeral disks contain required data and whether credentials or licenses survive the interruption. Preserve the infrastructure definition and required configuration securely. A snapshot of a disk does not guarantee an application-consistent backup, nor does it capture every external dependency. Test the restoration mechanism appropriate to the workload.

Observe the stop over a period that covers relevant scheduled activity. Check business outcomes and downstream errors, not just whether an infrastructure alarm fired. A missing report may be noticed days later; a recovery dependency may not be exercised until a failure. If uncertainty remains, document it and keep the candidate in review. “No incident reported” is one observation, not a guarantee that removal was harmless.

Only delete resources after the retention and recovery requirements are satisfied. Keep an inventory of what was removed, who approved it, the evidence used and the recovery deadline. Retained backups themselves require ownership, access controls and deletion policy. Otherwise a VM cleanup program can quietly become an unowned snapshot collection.

## Provider recommendations need local validation

Cloud advisory tools are useful discovery inputs, but recommendation criteria and product capabilities change. Inspect the current documented observation period and utilization signals for the relevant service. A recommendation generated from CPU alone may miss memory pressure, latency requirements or a bursty workload. Review eligibility and exclusions before presenting the recommendation as an engineering decision.

Normalize findings across providers by evidence fields, not by assuming similarly named recommendations have identical semantics. Capture the provider recommendation identifier, generation time and estimated savings basis. Recompute savings against the organization's actual billing arrangement when the advisory estimate uses list prices or excludes commitments.

Policy engines can automate discovery, tagging and ticket creation. Destructive actions need tighter predicates and a tested exception path. Start with report-only mode, inspect false positives and require a recoverable transition before permanent deletion. A policy should exclude protected recovery resources and record why an exception exists rather than leaving an unexplained permanent bypass.

### Lab: validate a candidate classifier

Create a small synthetic inventory with five resources: an abandoned development VM, a monthly batch host, a standby replica, a host with broken telemetry and a genuinely busy application server. Give each CPU and network observations plus explicit ownership and schedule metadata. Run the proposed detection rules and inspect which resources are classified as suspected waste.

The expected outcome is not that every low-CPU resource is stopped. The abandoned VM should become an investigation candidate; the batch host needs a full-cycle observation; the standby requires a recovery review; the telemetry failure needs monitoring repair; the busy application should not be flagged by an inactivity rule. Measure false positives against these known labels and add fixtures for the failures discovered in real reviews.

Extend the exercise with a stopped VM retaining expensive disks and an active commitment covering the compute. Ask the reviewer to calculate avoided usage, remaining resource cost and bill impact separately. This prevents an automation dashboard from reporting fictional savings whenever a resource state changes.

## Prevent recurrence with lifecycle ownership

A provisioning record should include an owning team, purpose, expected lifetime and review date. Long-lived services can have recurring review rather than an arbitrary deletion deadline. Temporary environments benefit from expiry reminders and an explicit extension process. The policy should preserve emergency operational access while making exceptions visible and time bounded.

Reconcile the inventory periodically with active projects and team ownership. Staff departures, reorganizations and canceled initiatives are common points where accountability is lost. Integrate ownership transfer into those workflows. A tag naming a person who left years ago is historical metadata, not an accountable owner.

Track candidate count, investigation age, false-positive rate, confirmed retirements, actual savings and recovery incidents. Do not reward the number of deleted VMs alone; that can encourage unsafe classification. A good program reduces unexplained resources while preserving service objectives and produces evidence that another reviewer can follow. The goal is a maintained estate with clear ownership, not the most aggressive deletion script.

### Figure methodology

Synthetic inventory:20 VMs×(100 compute+20 storage)=2,400/month. Stopping eight saves 8×100=800, leaving 1,600. Removing their storage saves 8×20=160 more, leaving 1,440. Assumes usage-based billing and excludes snapshots, addresses and commitment effects.

| Worked observation | currency units per month |
| --- | ---: |
| Initial inventory | 2400 |
| Eight VMs stopped | 1600 |
| Eight fully retired | 1440 |

## Primary references and further study

- [FinOps usage optimization](https://www.finops.org/framework/capabilities/usage-optimization/)
- [FinOps allocation and ownership](https://www.finops.org/framework/capabilities/allocation/)
- [FinOps rate optimization](https://www.finops.org/framework/capabilities/rate-optimization/)
