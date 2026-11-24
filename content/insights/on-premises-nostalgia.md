---
title: "On-premises nostalgia is a real phenomenon and it is worth taking seriously."
description: "The senior infrastructure engineers who managed physical data centres for fifteen years have a specific set of experiences that shape how they evaluate cloud."
date: 2028-12-13
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
derived: true
---

The senior infrastructure engineers who managed physical data centres for fifteen years have a specific set of experiences that shape how they evaluate cloud. They knew their utilisation. They could walk to the rack. They could predict next quarter's hardware cost from current capacity planning. The change management process was slow, but a failed change had a bounded blast radius because the systems were not deeply interdependent.

Cloud introduces genuine new problems alongside its genuine advantages. Billing that requires active governance. Operational complexity that scales with service adoption. Security models that are flexible but require expertise to configure correctly. Failure modes that are distributed and difficult to diagnose without investment in observability tooling.

The engineers who express nostalgia for on-premises are not wrong about these trade-offs. They are often wrong about the conclusion — that on-premises was better — but they are right about the costs.

The appropriate response to on-premises nostalgia is not to dismiss it as resistance to change. It is to take the specific concerns seriously and address them directly. Cost unpredictability is a FinOps problem that has solutions. Operational opacity is an observability problem that has solutions. Blast radius expansion is an architecture problem that has solutions.

The data centre was not better. But it was different in ways that were comfortable to people who had mastered it. Cloud is genuinely better for most workloads, and it requires genuine investment to realise that advantage. The nostalgia is real signal about where that investment has not been made.

## Compare an actual service boundary, not a remembered bill

A historical server purchase is a sunk cost for a short-term operating decision, but replacement and opportunity cost matter over a longer planning horizon. Separate those questions. Include facilities, support, backup capacity, networking and staff effort on the same boundary as the cloud alternative. Do not assign every existing employee to one option while treating their time as free in the other.

Suppose a hypothetical on-premises workload needs 18,000 currency units annually in incremental operations and 12,000 in annualized replacement capacity. The comparable cloud estimate is 34,000, including support and backup. The model compares 30,000 with 34,000, a 4,000 or 13.3% difference. Looking only at the 18,000 operating line would exaggerate the gap. Conversely, if no replacement is needed during the decision period, including that amortization may not answer the immediate cash-flow question.

Build two worksheet views: next-year cash movement and long-run service cost. State utilization, growth, capacity reserve and the staff duties that change. Test a restore and a capacity increase in each environment; economic comparison without equivalent service requirements is incomplete. Keep regulatory and latency constraints separate from the arithmetic because a cheaper option may still be unsuitable.

| Observation | Value (currency units/year) |
| --- | ---: |
| Local operations | 18000 |
| Replacement allocation | 12000 |
| Cloud comparator | 34000 |

**Figure method.** Synthetic local total=18,000+12,000=30,000; cloud difference=4,000, or 13.3%. Replacement allocation answers long-run cost, not necessarily next-year cash flow.

## Further reading

- [NIST cloud definition](https://www.nist.gov/publications/nist-definition-cloud-computing)
- [AWS architectural trade-offs](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
