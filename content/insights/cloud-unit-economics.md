---
title: "Cloud Unit Economics: The Metric That Makes Cloud Spend Conversations Productive"
description: "Talking about cloud spend in absolute dollars rarely leads anywhere useful. Unit economics — cost per transaction, cost per user, cost per GB processed — creates the context that turns 'we spend too much on cloud' into an actionable conversation."
date: 2025-06-04
tags: ["FinOps", "Cost Optimisation", "Engineering Leadership"]
series: "FinOps from Zero to Production"
seriesOrder: 3
format: article
---

Most cloud cost conversations go in circles because they're comparing the wrong things. "Our AWS bill went up 20% this quarter" is a statement that could mean we're growing efficiently, we're scaling poorly, or someone left a cluster running — and you can't tell which from the number alone.

Unit economics cuts through this. Cost per unit of business output — per active user, per transaction, per API call, per GB of data processed — contextualises spend against the business it's supporting.

## Why absolute spend is the wrong metric

An engineering team that grew its AWS bill from $50k to $100k over a year might have:
- Doubled their user base at constant efficiency (good)
- Maintained their user base but halved their efficiency (bad)
- Grown their user base by 10x while doubling their bill (excellent)

The absolute number doesn't tell you which scenario you're in. The unit cost does.

Unit economics doesn't make the cost conversation easier — it makes it more honest. When a business leader asks "why is our cloud bill so high?", the unit cost answer is either: "it isn't, we're running at $0.003 per transaction and the market rate is $0.005" or "you're right, our cost per user has increased since Q3 and here's why." Both answers are useful. "Our bill is $200k a month" isn't.

## Defining the right unit

The unit should be something the business already tracks and cares about. Common options:

- **SaaS products**: cost per monthly active user (MAU)
- **Transaction systems**: cost per transaction (order, payment, booking)
- **Data platforms**: cost per GB ingested, cost per GB processed, cost per query
- **APIs**: cost per 1,000 API calls
- **Streaming**: cost per event processed

The unit has to be consistent — use the same definition across teams and time periods. If "transaction" means one thing to the payments team and another to the analytics team, the comparisons won't be useful.

For complex products that do many different things, start with the unit that most directly connects cloud spend to revenue. Optimise for clarity first.

## How to calculate it

Unit cost calculation:
```
unit_cost = total_infrastructure_cost / unit_count
```

Where `total_infrastructure_cost` includes all cloud spend attributable to the workload: compute, storage, networking, database, managed services. The tagging taxonomy your team maintains is what makes this possible — if your resources aren't tagged by application, you're allocating costs by estimation.

For a microservice architecture, cost attribution often requires allocating shared infrastructure (Kubernetes cluster overhead, shared load balancers, monitoring) proportionally. Common approaches:
- **Resource-proportional**: allocate shared costs based on CPU/memory consumption share
- **Transaction-proportional**: allocate based on request volume share
- **Flat allocation**: divide shared infrastructure equally across workloads

Each approach is a simplification. The goal is consistent, good-enough allocation rather than perfect attribution.

## Benchmarks and thresholds

Unit costs become most useful when you have a target to compare against.

Setting targets:
- **Baseline from current performance**: your current unit cost is the baseline. Track improvement (or degradation) over time.
- **Architecture exercises**: when planning a major architectural change, estimate the expected unit cost. Compare to actuals after deployment.
- **Industry context**: broad industry benchmarks exist for some workload types (SaaS infrastructure spend as a percentage of revenue is a common one; 8-12% is a rough marker, though it varies widely by stage). These are signals, not targets.

Threshold alerts: if unit cost increases by more than X% quarter-over-quarter without a corresponding product change or growth inflection, that's a signal to investigate. Growth in spend is expected; disproportionate growth in unit cost is an efficiency signal.

## The conversation unit economics enables

With unit economics, the cloud spend conversation becomes:

"Our cost per MAU has stayed flat at $0.42 despite 30% user growth, which tells us our architecture is scaling efficiently. However, the data processing cost per GB has increased from $0.18 to $0.31 — that's the area worth investigating before we grow the data pipeline further."

This is the conversation FinOps aims to enable: context-rich, actionable, connected to the business. It requires the underlying data (tagging, cost allocation, unit tracking) to be in good shape, which is the infrastructure that takes time to build.

The return on that investment is conversations like the one above, instead of conversations about whether $200k is too much.

*Working toward this kind of visibility in your organization? The data infrastructure that supports unit economics is worth building. [Happy to compare approaches.](/contact)*
