---
title: "Model Commitment Utilization Before Buying Cloud Discounts"
description: "Evaluate cloud commitments as obligations tied to eligible demand, with explicit break-even arithmetic and a scenario review."
date: 2029-01-29
tags: ["FinOps"]
format: note
derived: true
---

The "discount" framing for reserved instances creates bad purchasing decisions. A discount is unambiguously good — you pay less for the same thing. A commitment is different: it requires that the thing you're committing to remains stable for the duration of the commitment.

An RI for a workload that gets decommissioned in eight months isn't a 40% discount. It's paying for compute you no longer need. The right question isn't "what discount does an RI give us?" It's "what percentage of our compute spend is stable enough over 12–36 months to justify a financial commitment?"

The analysis that produces better RI decisions:
- **Historical instance stability**: what churn rate do you have on this instance family and size?
- **Workload roadmap**: is this workload likely to change architecture, scale significantly up or down, or be decommissioned in the commitment window?
- **Instance flexibility**: do you have the flexibility to use Convertible RIs that allow instance family changes?
- **Coverage target**: the goal is not 100% RI coverage — it's matching RI coverage to your stable baseline, leaving variable capacity on-demand or Spot.

The organizations that mismanage RIs tend to buy them opportunistically — "these instances are running and there's a discount available" — rather than strategically, based on workload analysis. The result is good coverage numbers that don't reflect the actual utilisation of the commitments.

Treat RI purchasing as a financial planning exercise, not a purchasing optimisation.

## Price the unused portion explicitly

A commitment can lower the effective price of predictable usage, but the effective saving depends on whether eligible consumption actually uses it. Provider programs differ in scope, exchange rights, payment options and cancellation rules. Read the exact offer instead of assuming that every reservation behaves like every savings plan.

Use a fictional one-hour decision unit. On-demand usage costs $1 per hour, while a fixed eligible commitment costs $0.70 per hour whether it is used or not. At 100% utilization, the modeled reduction is $0.30 per committed hour. At 80% utilization, buying the used hours on demand would cost $0.80, so the saving is only $0.10. At 60%, on-demand cost would be $0.60 and the commitment costs $0.10 more. The break-even utilization is 0.70/1.00 = 70%, ignoring financing and all other fees.

## Build the purchase worksheet from workload evidence

Separate a stable baseline from peaks, experiments and workloads scheduled for migration. Record eligible usage by the same billing dimension that the commitment covers. Test a conservative demand scenario alongside the central forecast. Then review resource flexibility and region constraints; utilization can fall even when total company demand rises if growth moves outside the offer's coverage.

Assign an owner to the commitment through its entire term. Track utilization and coverage as different measures: utilization asks how much purchased benefit is used; coverage asks how much eligible demand is covered. A high coverage target can encourage overbuying if utilization is ignored. Review upcoming expiries and planned shutdowns before renewing automatically.

The decision record should preserve the rate assumptions, eligible scope, conservative consumption, term, payment schedule and alternatives considered. It also needs an explicit treatment of unused cost in showback. Hiding unused commitments in a central pool may make product teams appear efficient while the company remains obligated to pay.

### Figure methodology

Synthetic fixed-rate example, not provider pricing. Commitment $0.70/hour versus $1/hour on demand. The last bar is additional cost, not saving: $0.70 minus $0.60. Break-even utilization is 70%.

| Worked observation | USD/hour |
| --- | ---: |
| 100% utilization saving | 0.3 |
| 80% utilization saving | 0.1 |
| 60% utilization added cost | 0.1 |

## Primary references and further study

- [FinOps rate optimization](https://www.finops.org/framework/capabilities/rate-optimization/)
- [FinOps cost allocation](https://www.finops.org/framework/capabilities/allocation/)
