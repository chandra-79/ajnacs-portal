---
title: "Cloud Cost per Unit: Calculate What It Costs to Deliver an Order"
description: "Reconcile effective cloud cost, allocate shared services, and compare spend per completed business unit using a repeatable worksheet."
date: 2025-10-15
tags: ["FinOps", "Cost Optimisation", "Engineering Leadership"]
series: "FinOps from Zero to Production"
seriesOrder: 3
format: article
---

A cloud bill can rise while the cost of delivering each order falls. To tell which happened, join an accounting numerator to a business denominator. The numerator answers what the service cost during a period. The denominator answers how many useful units it delivered during the same period. Decide both definitions before looking at the result.

## What to measure

For an order pipeline, use unique completed orders. Count a retry as part of the cost of delivering the order. Deduplicate by a stable order identifier and decide how to handle cancellations, refunds and late completions. For another service, choose a meaningful output that stays interpretable over time, such as settled transfers or successfully processed gigabytes. Document the exact event and cutoff.

Add directly attributable effective cost to the allocated share of common services. Use the same currency and cost basis in both periods. Reconcile to the billing export after accounting for excluded costs. Document treatments of credits, taxes, commitments and amortisation. Effective cost is a defined cost basis in FOCUS. The mapping still depends on the billing export and the cost scope you choose.

## Build a traceable cost model

1. Tag or otherwise map billing line items to a stable service owner and cost scope. Classify charges as direct, shared, or excluded. Track unmapped costs where reviewers can see them.
2. Choose a measurable shared-cost driver, such as request share for an API gateway. Calculate the starting pool once. Check that allocated and unallocated portions reconcile to the pool and that direct items were excluded from it.
3. Join the effective-cost aggregate and deduplicated completion aggregate using consistent time boundaries and service scope. Sum costs and units before dividing across services or periods with different volumes. Mark zero-volume periods as unavailable for the rate.
4. Compare total cost, completed units, rate, and reliability together. Investigate changes in traffic mix, retry volume, success rate and latency. Rerun the calculation once with an alternative shared-cost driver to see whether that decision affects the conclusion.

## Use the worksheet to explain a change

Enter direct and allocated costs and the completed units for each period. In the worked example, spend rises from $240 to $280 while completed orders rise from 1,200 to 2,000. The resulting cost falls from $0.20 to $0.14 per order. A rate change alone cannot tell you whether an engineering change caused the improvement. For a real comparison, review your reconciliation and reliability evidence before attributing the difference.

**Illustrative measurement.** The worked data below is synthetic. See the [platform onboarding guide](/insights/platform-engineering-idp-2026/) if cost attribution needs to be consistent at service creation.

## References

- [FinOps Foundation · Unit Economics](https://www.finops.org/framework/capabilities/unit-economics/)
- [FinOps Foundation · FOCUS specification](https://focus.finops.org/focus-specification/)
