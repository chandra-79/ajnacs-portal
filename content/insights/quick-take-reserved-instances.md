---
title: "Reserved Instances Are Commitments, Not Discounts — and That Distinction Changes Every Decision"
description: "Reserved instances and savings plans reduce cloud costs by 30–70%. The cost is a financial commitment that persists even if your usage decreases. Here is how to make RI decisions well."
date: 2028-02-23
tags: ["FinOps"]
format: article
---

The reserved instance pitch is compelling: commit to using a specific instance type for one or three years, and receive a 30–70% discount versus on-demand pricing. For workloads with stable compute requirements, this is an excellent return.

The framing matters. The discount is real but secondary. The primary decision is the financial commitment. Understanding this changes how RI decisions should be made.

## What you are actually committing to

A 1-year EC2 Reserved Instance commits you to pay for that instance type in that region for 12 months, regardless of whether you use it. If you purchase 10 r5.2xlarge RIs for your database tier and then migrate to Aurora Serverless 4 months later, you are paying for 8 unused months on 10 instances.

Savings Plans are more flexible (they apply to any instance type within a family), but they are still commitments — you are committing to a minimum hourly spend, not to specific instances.

The discount is not free. It is the return on a usage commitment. The commitment has risk.

## The decision framework

**Identify the stable base.** The right RI coverage is the compute you are certain to use throughout the commitment period, not the peak you expect at some point in the future. The difference is meaningful. If you run 50 application servers on average but peak at 100, purchasing 100 RIs is overcommitting by 50. Purchase 40 and cover the rest with on-demand or Spot.

**Match commitment to certainty.** 1-year commitments for stable infrastructure you have run for more than a year without significant changes. 3-year commitments only for infrastructure you are confident will be unchanged at the end of three years — this rules out most application infrastructure but may apply to a stable database tier.

**Evaluate Compute Savings Plans before instance-specific RIs.** AWS Compute Savings Plans apply across instance families and sizes within a region. They provide 60–66% of the RI discount with much more flexibility. For most organizations, Compute Savings Plans are the better choice over specific EC2 RIs.

**Buy RIs for current state, not projected state.** Future growth that justifies additional RIs should be purchased as growth materializes, not in advance. The cost of unused RIs is certain. The cost of running on-demand until growth is confirmed is an opportunity cost, not a commitment.

RI strategy is a FinOps discipline, not a one-time purchase decision. Review it quarterly, align it with product roadmaps, and treat unused RIs as a signal to improve the purchase process.
