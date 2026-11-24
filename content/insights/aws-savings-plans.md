---
title: "AWS Savings Plans vs Reserved Instances: Making the Commitment Decision"
description: "Savings Plans replaced most Reserved Instance use cases but not all of them. Understanding the difference determines whether you leave money on the table or over-commit to an inflexible discount structure."
date: 2025-05-27
tags: ["FinOps", "Cloud Architecture"]
format: article
---

AWS introduced Savings Plans in 2019 as a more flexible alternative to EC2 Reserved Instances. For most workloads, they are now the better choice. For some specific workloads, Reserved Instances still offer a price advantage. Understanding when each applies is the core FinOps decision for reducing AWS compute costs.

## What to measure

**Coverage, utilisation and effective savings.** Record eligible usage covered by commitments and the share of committed spend actually used. If $80 of a $100 hourly commitment is used, utilisation is 80%. Calculate effective savings against an equivalent on-demand workload after accounting for the unused commitment.

*Illustrative measurement. Any numbers in this example are hypothetical.*

## How Savings Plans work

Savings Plans commit to a consistent hourly spend (e.g., $10/hour) in exchange for a discount on eligible charges. The discount applies automatically to matching usage as it occurs — you don't allocate a Savings Plan to a specific instance type.

Three types:

**Compute Savings Plans**: apply to EC2, Fargate, and Lambda. No restrictions on instance family, size, region, OS, or tenancy. The most flexible type. Discount: up to 66% vs. on-demand.

**EC2 Instance Savings Plans**: apply to EC2 in a specific instance family within a specific region (e.g., M5 in us-east-1). Higher discount than Compute Savings Plans (up to 72%) in exchange for the commitment to a specific instance family and region.

**SageMaker Savings Plans**: apply to SageMaker instance usage. Relevant if SageMaker is a significant cost driver.

## How Reserved Instances work

Regional EC2 Reserved Instances provide a billing discount without reserving capacity. Zonal EC2 Reserved Instances reserve capacity in a specific Availability Zone. Standard and Convertible terms differ: inspect matching requirements, exchanges and the effective rate for your actual usage.

**Where RIs still have an advantage**:

- **Capacity reservation**: Zonal Reserved Instances and [EC2 On-Demand Capacity Reservations](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-capacity-reservations.html) are capacity mechanisms subject to their terms. A Savings Plan applies a billing discount. A matching Capacity Reservation can be considered separately.

- **RDS, Redshift, ElastiCache, OpenSearch**: Savings Plans do not cover these services. Review each managed service’s current purchase options and eligibility separately.

- **Specific instance family + region commitment with maximum discount**: EC2 Instance Savings Plans and Standard RIs offer similar discounts for committed usage in a specific family/region, but RIs are slightly more flexible in instance size flexibility within the family.

## The analysis workflow

Before purchasing, analyze the past 3-6 months of compute usage:

1. Pull EC2, Fargate, and Lambda usage from AWS Cost Explorer, filtered to on-demand (exclude already-discounted usage)
2. Identify the consistent baseline: the minimum hourly usage that is present every day and every hour. This is your safe commitment amount.
3. Separate baseline into the portion that is flexible (can tolerate instance type changes) vs. committed to a specific instance family and region
4. Apply Compute Savings Plans to the flexible baseline; consider EC2 Instance Savings Plans or RIs for the committed portion

**The floor principle**: commit to the amount you are confident you will use every hour for the term. Unused Savings Plans commitment is wasted. Better to under-commit initially, verify usage, and purchase more.

## Term length: 1-year vs. 3-year

1-year term: 30-40% discount depending on payment option. Lower commitment risk; good for workloads with uncertain future trajectory.

3-year term: 50-66% discount. Better economics for stable, long-running workloads. Higher commitment risk — technology changes; workloads migrate; the AWS pricing landscape evolves.

The 3-year term makes most sense for: core infrastructure workloads that have been running for 2+ years without significant change, workloads anchored to a specific cloud provider for regulatory or architectural reasons, and instance types that are unlikely to be displaced by a new generation within the term.

## Payment options

- **No upfront**: no upfront cost; monthly charges at discounted rate. No cash flow impact; slightly lower discount.
- **Partial upfront**: upfront payment for some of the term; monthly charges for the remainder. Better discount.
- **All upfront**: full payment for the term upfront. Compare the quoted rate with other payment options for the same commitment and term. Include the cost of tying up cash in your comparison.

Most organizations use no-upfront or partial-upfront Savings Plans. The all-upfront discount rarely justifies the cash commitment for a 1-year term; it is more compelling for a 3-year term at scale.

*Modeling Savings Plans or RI purchases for a significant AWS spend? The commitment analysis requires a solid understanding of your usage patterns over time. [Happy to walk through the approach.](/contact/)*

## Replay the plan one hour at a time

Build a small simulation from an hourly cost export for the accounts and usage families the purchase could cover. Keep eligible demand at its On-Demand equivalent and convert each applicable line to plan-rate dollars before consuming the commitment. That conversion matters because a dollar of hourly commitment can cover more than a dollar of On-Demand spend. Keep the rest of the bill out of the simulation, then add it back unchanged when comparing whole-account totals.

Put benefits you already own into the replay once. If an instance is still covered by a Reserved Instance for the simulated period, do not count that usage as demand for a new commitment. Model the covered line when its RI expires as well. Use the payer's current sharing settings. Different account sharing can change which usage receives the benefit. Reserve a test month at the end of the export so your assumptions face an interval you did not use to pick the purchase size.

## Price a low hour and a busy hour separately

Use fictional rates to see what the simulation should calculate. Suppose comparable compute would cost $0.10 per unit-hour On-Demand. The plan rate for this example is $0.07. Set an hourly commitment of $3.50, which covers up to 50 eligible units an hour at that rate. During an hour with 65 units, the first 50 use the full $3.50 and the extra 15 cost $1.50. The total is $5.00 instead of $6.50. The commitment is fully used and roughly 77% of the eligible On-Demand-equivalent usage is covered.

Now replay a quiet hour with 25 units. Only $1.75 of the commitment finds eligible usage. The hour still costs $3.50, versus $2.50 On-Demand. That hour looks fully covered because every eligible unit receives a benefit. It only uses half the commitment and loses $1 against On-Demand. Combined across the two illustrative hours, the commitment costs $8.50 and On-Demand costs $9.00. A dashboard that shows only coverage would hide the loss in the quiet period. Consult the [Cost Explorer coverage metric definitions](https://docs.aws.amazon.com/savingsplans/latest/userguide/ce-sp-cr-metrics.html) when comparing the simulation with AWS reports.

## Put flexibility and capacity in separate decisions

A service may need both a billing discount and the ability to launch in a particular Availability Zone when another part of the system fails. Write those as separate requirements. A flexible billing plan can meet one without reserving the capacity required by the other. A zonal purchase, or an appropriately configured capacity reservation, must match the tenancy, platform, instance shape, and location that the recovery procedure actually uses. Run the recovery exercise using the architecture that will use the reservation.

For billing flexibility, test a workload mix change. Keep the same overall usage in a scenario that moves eligible compute from one EC2 family to another. Compare a family-and-region plan with a broader compute commitment under that scenario and under the existing estate. A deeper listed discount can lose in the migration case if too few eligible hours remain. Capture enough detail to show whether that loss comes from underuse or from paying On-Demand for newly ineligible work.

## Make a purchase decision the next reviewer can redo

Give the approver a short record with the export window, eligibility assumptions, existing commitments, sharing configuration, candidate purchases, and the On-Demand comparison. Include one low-demand forecast and one planned architecture change. Show the worst period of unused commitment alongside the median. A low monthly average can hide repeat waste every night or weekend.

Separate the payment schedule from expected economic cost. An all-upfront quote includes an immediate cash outlay. Show that event and the per-period cost in different columns. Compare it with the no-upfront and partial-upfront alternatives using the same dates and term. End with a renewal owner, notice date, and a condition that would stop renewal. After purchase, use the observed benefit allocation in [Cost Explorer Savings Plans reporting](https://docs.aws.amazon.com/savingsplans/latest/userguide/ce-sp-usingSP.html) to check whether it follows the simulation. A mismatch is a reason to inspect eligibility, sharing and rate assumptions before increasing the commitment. Compare unblended cash charges and unused commitments as separate rows so the explanation stays reproducible even if the finance report uses different amortisation dates.

Review one hourly record where the model predicts both unused commitment and uncovered spend. That combination can be legitimate if the uncovered service or rate is ineligible. A simultaneous surplus and shortfall on genuinely matching usage usually indicates that a rate, account boundary, or sharing preference was applied incorrectly. Trace the record from the underlying usage to the commitment and invoice, then turn that example into a reusable check for each future purchase.
