---
title: "Ghost VMs: The Invisible Waste Sitting Inside Every Enterprise Cloud Estate"
description: "Every cloud estate has virtual machines that nobody claims — still running, still billing, with no owner, no traffic, and no purpose. Finding and eliminating them is the fastest FinOps win most organizations haven't taken seriously."
date: 2026-09-04
tags: ["FinOps", "Cloud Architecture"]
format: article
---

Every cloud estate I've worked in has them. Virtual machines that nobody claims. Running continuously, billing hourly, showing up in cost reports as line items that pass the eye test — until you ask the owner and find out the owner left the company eighteen months ago, or the project they supported was cancelled, or someone created them for a proof-of-concept that became permanent by accident.

These are **ghost VMs**. Not a formal category in any cloud provider's taxonomy, but a real and measurable problem. In mature enterprise cloud estates, orphaned and underutilised compute is consistently one of the largest cost categories in cloud audits I've seen — often rivalling licences and networking combined.

## How Ghost VMs Accumulate

The pattern is almost always the same. A project stands up infrastructure. The project finishes, pivots, or gets cancelled. The infrastructure doesn't get cleaned up because:

- The team that provisioned it disbanded
- Nobody has explicit decommission ownership
- The shutdown process requires approvals that feel harder than the monthly bill
- The VM is part of a shared account and nobody notices the orphan among hundreds

**Auto-scaling remnants** are a specific variant. A group scales out during a traffic event and scales in — but not all the way. One instance stays because the scale-in policy has a minimum of 1 and nobody revisited the minimum when traffic dropped permanently.

**Development environments** are another common source. A developer provisions a VM for local testing. The project ships. The VM stays because it costs $40/month and the developer doesn't think about it again. Multiply by 200 developers over three years.

## What Makes Ghost VMs Hard to Find

The challenge isn't that they're hidden. They're visible in your billing console. The challenge is distinguishing a genuinely idle VM from one that looks idle but serves a real function — a scheduled job that runs once a month, a cold standby that's never supposed to receive traffic, a compliance archive instance.

Naively filtering on CPU utilization will generate false positives. A database replica can be near-zero CPU for weeks and be genuinely necessary. A compliance logging instance might look like nothing is using it until the day you need it.

The right signal set combines:
- **CPU utilization < 5% for 30+ days**
- **Network in/out < 1 GB over 30 days**
- **No inbound connections** from any external source in 30 days
- **No successful authentication** (last login > 60 days)
- **No attached workload tickets** in your ITSM

When all five are true, you almost certainly have a ghost. When only two or three are true, you need a human to verify.

## Detection at Scale

**Azure** surfaces this via Advisor recommendations under the "Cost" category. Advisor's low-utilization flagging is conservative by default — it'll only flag VMs below 5% CPU for more than 95% of a 30-day window. That threshold misses a lot of zombies, but it's a starting point.

For deeper detection, **Azure Monitor Workbooks** let you build custom queries. A KQL query joining VM metrics with sign-in logs and network flow logs gets you to the multi-signal picture above in a single view.

**AWS** surfaces underutilised instances through Cost Explorer and Trusted Advisor. The same caveats apply — the default thresholds are conservative. **AWS Instance Scheduler** can be repurposed to identify instances that have never had their schedule defined, a strong proxy for orphan status.

**Cloud Custodian** is worth the investment if you're operating across multiple accounts or providers. Its policy DSL lets you express complex multi-signal conditions and route findings to a Slack channel, a ServiceNow ticket, or an automated stop action — without writing infrastructure code.

## The Remediation Process That Actually Works

Hard deletes without notice generate incident reports. The right workflow is:

1. **Tag the suspected ghost** with `ghost-candidate: true` and an investigation date
2. **Notify the last-known owner** via automated email with a 14-day response window
3. **If no response**: stop the VM (not delete) and wait another 7 days
4. **If no incident**: delete with a snapshot retained for 30 days

This process takes 51 days end-to-end, which sounds slow. It is slow. It also means you will never receive an incident report saying you deleted a production system. The 30-day snapshot retention is insurance. Use it generously.

## The Governance Change That Prevents Recurrence

Detecting and remediating ghost VMs is a cleanup exercise. Preventing them requires a **decommission policy** built into your provisioning workflow.

Every VM provisioning request should include a **decommission date** or an **evergreen justification** (a reason the VM should exist indefinitely with a named team responsible for it). Set up an automated workflow that pings owners 30 days before the decommission date. If no response, auto-stop.

This is harder to implement than it sounds — it requires buy-in from engineering teams who resent the administrative overhead. The argument that works: "This will prevent the cloud cost review where we ask you to explain $4,000 of infrastructure nobody recognises."

The ghost VMs aren't a technical problem. They're an organizational one that technology can surface and policy can prevent.

*Dealing with a ghost VM problem at your organization? I've helped several teams build remediation workflows — [get in touch](/contact).*
