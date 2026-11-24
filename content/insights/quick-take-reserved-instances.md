---
title: "Reserved Instances Are Commitments, Not Discounts — and That Distinction Changes Every Decision"
description: "Compare eligible usage with commitment cost, calculate a synthetic break-even point, and account for scope and demand risk."
date: 2028-02-23
tags: ["FinOps"]
format: article
---

An EC2 Reserved Instance provides a billing benefit for matching usage in exchange for a term commitment. The effective saving depends on the actual offer, payment choice, matching rules and utilization. A displayed rate reduction is not a guaranteed return: compare the full obligation with the cost of the usage that would otherwise occur.

The framing matters. The discount is real but secondary. The primary decision is the financial commitment. Understanding this changes how RI decisions should be made.

## What you are actually committing to

An EC2 RI is a billing construct, not a physical instance. Its benefit applies under matching attributes and the selected scope and offering rules; payment obligations remain when eligible use stops. In a hypothetical migration after four months of a one-year term, assess the remaining obligation and whether other eligible usage or permitted modification, exchange or resale can use it. Do not assume that moving a database automatically transfers its EC2 commitment benefit.

Savings Plans commit an hourly spend amount, with flexibility that depends on plan type. Compute Savings Plans can apply across EC2 families and Regions and to eligible Fargate and Lambda usage. EC2 Instance Savings Plans have a selected family and Region scope. Verify the actual program instead of applying one flexibility rule to every plan.

The discount is not free. It is the return on a usage commitment. The commitment has risk.

## The decision framework

**Identify a defensible baseline.** Examine the eligible hourly usage distribution, planned shutdowns and migration dates. An average of fifty servers and a peak of one hundred do not reveal the minimum recurring demand or justify a purchase of forty. Model several usage paths and include existing commitments before selecting an additional amount. Interruption-tolerant work may suit Spot, but that is a separate availability and operating decision.

**Match term to uncertainty.** Compare shorter and longer obligations against product plans, expected retirements and the program’s flexibility. Past stability does not guarantee future demand, and an unchanged instance configuration is not the only way some plans can remain utilized. Include the value of keeping purchasing options open rather than selecting the longest term solely from its displayed rate.

**Compare the applicable purchasing options.** Compute Savings Plans support eligible usage across Regions rather than being restricted to one Region. Compare current quotations, scope, payment terms and expected utilization with EC2 RIs and other appropriate options. There is no fixed fraction of an RI discount that establishes the winning choice for every workload.

**Buy RIs for current state, not projected state.** Future growth that justifies additional RIs should be purchased as growth materializes, not in advance. The cost of unused RIs is certain. The cost of running on-demand until growth is confirmed is an opportunity cost, not a commitment.

RI strategy is a FinOps discipline, not a one-time purchase decision. Review it quarterly, align it with product roadmaps, and treat unused RIs as a signal to improve the purchase process.

## Separate coverage from utilization

Coverage measures how much eligible usage receives a commitment benefit. Utilization measures how much of the purchased commitment is actually used. A purchase can increase coverage and simultaneously create unused obligation. The two measures need the same clearly stated billing scope but different denominators.

In a synthetic one-month model, a team buys 1,000 commitment-hours at $0.60 each. Eligible workloads use 750 of them. The purchase costs $600. At an assumed on-demand rate of $1 per hour, the used workload would cost $750, yielding a $150 modeled benefit. The nominal rate reduction is 40%, but the realized benefit relative to that $750 alternative is 20%. Utilization is 75%. These are teaching rates, not an offer from any provider.

If eligible usage falls to 500 hours, on-demand cost would be $500 while the commitment still costs $600. The model now has a $100 disadvantage. A discount percentage on a purchase screen cannot answer whether the workload will use the obligation. Compare plausible demand scenarios, planned migrations, shutdowns and coverage constraints before buying.

## Put a workload owner beside each forecast

For every candidate, identify the service, eligible configuration, expected stable usage and earliest plausible retirement date. Ask the service owner about releases that may change architecture or placement. Procurement can explain contract rights; engineering must explain whether the forecast fits the workload. A centralized recommendation without either conversation can optimize yesterday's estate.

Represent uncertainty explicitly. Use a conservative baseline for the portion likely to persist, keep variable peaks outside that baseline and review existing unused coverage before adding more. Evaluate flexibility provisions in the actual program rather than assuming they remove demand risk. Exchanges, scope changes and resale options can have conditions that matter to the comparison.

## Review the decision after purchase

Track utilization, coverage, effective benefit and unused cost using a consistent cost basis. State how upfront payments and credits are recognized when comparing periods. A cash payment in one month and amortized usage in another are different views; switching between them can manufacture a saving or an anomaly.

Give the commitment a named owner and a renewal review date. Show unused cost in the reporting model rather than distributing it invisibly to unrelated teams. The review should improve the next forecast and reveal architecture changes that threaten the remaining term. A commitment is successful when its observed use and service constraints support the original decision, not merely when its nominal discount looks large.

### Figure methodology

Synthetic 1,000-hour commitment at $0.60/hour versus $1/hour on demand. At 750 used hours benefit is $150; at 500 it is a $100 disadvantage. Excludes financing, taxes and program-specific conditions.

| Worked observation | USD/month |
| --- | ---: |
| Commitment obligation | 600 |
| 750h on demand | 750 |
| 500h on demand | 500 |

## Primary references and further study

- [FinOps rate optimization](https://www.finops.org/framework/capabilities/rate-optimization/)
- [AWS Savings Plans types and scope](https://docs.aws.amazon.com/savingsplans/latest/userguide/plan-types.html)
- [AWS EC2 Reserved Instances overview](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html)
