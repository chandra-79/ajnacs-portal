---
title: "Reserved Instance Rationalisation: How to Commit to the Right Resources"
description: "Committed use discounts (Reserved Instances, Savings Plans, CUDs) are one of the highest-return FinOps actions — but committing to the wrong shape or term locks in waste. Here's the analysis process for getting it right."
date: 2025-05-14
tags: ["FinOps", "Cost Optimisation", "Cloud Architecture"]
series: "FinOps from Zero to Production"
seriesOrder: 2
format: article
---

Committed use discounts go by different names across cloud providers — Reserved Instances (AWS), Reserved VM Instances and Committed Use Discounts (GCP), Reserved VM Instances (Azure) — but they all work on the same principle: commit to a minimum spend level or specific resource configuration for 1 or 3 years, receive a discount compared to on-demand pricing.

On most instance types, the 1-year no-upfront Reserved Instance discount runs somewhere in the 35-40% range compared to on-demand. The 3-year equivalent often runs 55-65%. These are significant discounts for the right workloads.

The risk: commit to an EC2 instance type that you end up not using (because you migrated to containers, or the workload scaled differently than expected, or a newer instance type became available), and you're paying for something you've moved away from.

The analysis that makes the difference is identifying what's genuinely stable — and being honest about what isn't.

## The baseline analysis: what's actually steady-state?

Before committing to anything, run three months of historical usage data through your cloud cost management tool (AWS Cost Explorer, Azure Cost Management, GCP Cost Recommender) and answer three questions:

**1. Which instance families have been consistently running for the full 90 days?**

Not "we have a t3.large running", but "this t3.large has been running at > 80% of hours for the last 90 days". An instance that runs continuously is a commitment candidate. An instance that runs a few days a month is not.

**2. What's the minimum stable footprint?**

If you run between 5 and 12 m5.xlarge instances depending on load, the minimum stable footprint is 5 — commit to 5 Reserved Instances and run the variable portion on-demand or Spot. Never commit to the peak.

**3. Is this workload likely to change in the commitment period?**

Active migrations (from VMs to containers, from one instance family to another), planned growth that would require different instance sizes, and workloads being evaluated for decommissioning are all poor candidates for 3-year commitments. 1-year may still make sense; 3-year probably doesn't.

## Savings Plans vs Reserved Instances (AWS-specific)

AWS offers both Reserved Instances (tied to a specific instance type, region, OS, and tenancy) and Savings Plans (a commitment to hourly spend, flexible across instance types and services).

**Compute Savings Plans** apply to EC2, Lambda, and Fargate. They're the most flexible — a $5/hour commitment applies automatically to whatever compute you're running. This flexibility has value when you're migrating from EC2 to containers or when your instance type mix is likely to shift.

**EC2 Instance Savings Plans** apply to a specific instance family in a region (e.g., all m5 instances in us-east-1, any size, any OS). Less flexible than Compute Savings Plans, but deeper discounts.

**Reserved Instances** require specifying the exact instance type, region, OS, and tenancy. The deepest discount, the least flexibility. Right for stable workloads where you know exactly what you'll be running.

For most organizations that aren't in a static, fully-committed state, a mix works well: Compute Savings Plans for the baseline EC2/Lambda/Fargate spend, Reserved Instances for known stable configurations.

## The coverage vs utilization trade-off

There are two metrics that matter for committed use discount programs:

**Coverage**: what percentage of your on-demand spend is covered by commitments? Higher is better, but not at the cost of committing to things you won't use.

**Utilisation**: what percentage of your commitments are actually being used? An unutilised Reserved Instance is wasted money. 100% utilization means you're using everything you committed to.

The goal: high coverage on stable workloads, high utilization by not over-committing. These are in tension — pushing for higher coverage increases the risk of under-utilization.

A reasonable initial target: 70-80% RI/Savings Plan coverage of steady-state EC2 spend, with > 90% utilization. Increase coverage as you develop confidence in what's truly stable.

## The right cadence for reviewing commitments

Commitments should be reviewed quarterly:
- Are any 1-year commitments expiring in the next 90 days? Decide whether to renew.
- Has utilization dropped below 80% on any commitment? Investigate — workload may have migrated.
- Are there significant on-demand costs that have now stabilised enough to commit?
- Has the cloud provider released new instance types in the family that would suggest the current shape is being phased out?

The cloud providers' own tools (AWS Cost Explorer's RI recommendations, Azure Advisor's reservation recommendations) generate recommendations based on usage data. These are useful starting points, but review them with the context of your roadmap — the tools don't know you're planning to move the workload off EC2 next quarter.

## The AWS Marketplace for unwanted RIs

If you have Reserved Instances you're not using, AWS's Reserved Instance Marketplace allows you to sell them to other AWS customers. The discount from the original purchase may be partially recovered. This is worth knowing about before you commit to a 3-year Reserved Instance for a workload you're not fully confident about — an exit exists, but it's not guaranteed (demand in the marketplace varies by instance type and region).

*Building a commitment strategy for your cloud spend? The right cadence and analytical approach matter more than any individual tool. [Happy to think through your specific situation.](/contact)*
