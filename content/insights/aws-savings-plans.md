---
title: "AWS Savings Plans vs Reserved Instances: Making the Commitment Decision"
description: "Savings Plans replaced most Reserved Instance use cases but not all of them. Understanding the difference determines whether you leave money on the table or over-commit to an inflexible discount structure."
date: 2025-06-26
tags: ["FinOps", "Cloud Architecture"]
format: article
---

AWS introduced Savings Plans in 2019 as a more flexible alternative to EC2 Reserved Instances. For most workloads, they are now the better choice. For some specific workloads, Reserved Instances still offer a price advantage. Understanding when each applies is the core FinOps decision for reducing AWS compute costs.

## How Savings Plans work

Savings Plans commit to a consistent hourly spend (e.g., $10/hour) in exchange for a discount on eligible charges. The discount applies automatically to matching usage as it occurs — you don't allocate a Savings Plan to a specific instance type.

Three types:

**Compute Savings Plans**: apply to EC2, Fargate, and Lambda. No restrictions on instance family, size, region, OS, or tenancy. The most flexible type. Discount: up to 66% vs. on-demand.

**EC2 Instance Savings Plans**: apply to EC2 in a specific instance family within a specific region (e.g., M5 in us-east-1). Higher discount than Compute Savings Plans (up to 72%) in exchange for the commitment to a specific instance family and region.

**SageMaker Savings Plans**: apply to SageMaker instance usage. Relevant if SageMaker is a significant cost driver.

## How Reserved Instances work

Reserved Instances reserve capacity for a specific instance type in a specific region (or Availability Zone). Standard RIs offer up to 72% off on-demand; Convertible RIs offer up to 66% with the ability to change instance type within the RI term.

**Where RIs still have an advantage**:

- **Capacity reservation**: Standard RIs in a specific AZ guarantee that capacity. Savings Plans and Compute RIs do not reserve capacity — they only discount it. For workloads that need guaranteed capacity on specific instance types (large ML training instances, specialized compute), Standard RIs with capacity reservation are the only option that guarantees you will be able to launch when needed.

- **RDS, Redshift, ElastiCache, OpenSearch**: Savings Plans do not cover these services. Reserved Instances for managed database services are the only commitment discount available.

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
- **All upfront**: full payment for the term upfront. Maximum discount (typically 5-7% better than no-upfront). Opportunity cost on the cash; appropriate for organizations with favorable cost of capital.

Most organizations use no-upfront or partial-upfront Savings Plans. The all-upfront discount rarely justifies the cash commitment for a 1-year term; it is more compelling for a 3-year term at scale.

*Modeling Savings Plans or RI purchases for a significant AWS spend? The commitment analysis requires a solid understanding of your usage patterns over time. [Happy to walk through the approach.](/contact)*
