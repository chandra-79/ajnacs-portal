---
title: "Private cloud economics only work when someone actually does the accounting"
description: "Private cloud cost justifications usually compare hardware acquisition cost plus data centre expenses against public cloud on-demand pricing."
date: 2029-02-19
tags: ["Cloud Architecture", "FinOps", "Infrastructure"]
format: note
derived: true
---

Private cloud cost justifications usually compare hardware acquisition cost plus data centre expenses against public cloud on-demand pricing. This comparison consistently underestimates the total cost of private cloud and overestimates the savings.

The costs that appear in the business case: hardware, rack space, power, network infrastructure, and perhaps an initial licensing cost for the hypervisor.

The costs that don't appear: the engineering capacity required to build, maintain and support the platform under its actual service requirements, the operational overhead of patching, capacity planning, hardware failure management, and upgrades. The opportunity cost of those engineers not building product or improving reliability elsewhere. The support contracts that accumulate over a 5-year hardware lifecycle. The cost of incidents that a managed service would have prevented or handled without engineering escalation.

When these costs are included, private cloud frequently exceeds public cloud for workloads with variable demand, and breaks even only for steady-state, high-utilisation workloads at scale — exactly the scenario where private cloud's economics are legitimately favourable.

Private cloud CAN be the cheaper option, for the right workloads, at the right scale, with a well-run platform team. But "it'll be cheaper than cloud" as an assumption rather than a calculated result, with all costs included, is an assumption that turns into a surprise over a three-year budget cycle.

Do the accounting before committing the capital.

## Price the reserve that makes the service recoverable

An economic comparison must keep recovery requirements equal. Suppose a hypothetical private fleet provides 500 units of installed capacity. Maintenance and failure reserve consume 100 units, leaving 400 for normal commitments. An annual service cost of 800,000 currency units divided by installed capacity appears to be 1,600 per unit; divided by usable committed capacity it is 2,000. The reserve changes the denominator, not the invoice.

The worksheet should state what reserve protects against, whether it is already included in utilization and which costs are shared. Avoid subtracting the same reserve twice or assuming every unused machine is waste. Compare the public-cloud alternative with the same availability and recovery constraints, including support, backup, transfer and staff responsibilities.

Run a sensitivity exercise at 300, 350 and 400 committed units and document the demand forecast behind each case. Staff costs and hardware lifecycle vary by organization; a fixed engineer count or universal refresh period is not reliable evidence. Separate next-year cash flow from long-run replacement cost so a decision to use existing capacity is not confused with a decision to build a new platform.

| Observation | Value (currency units/year/unit) |
| --- | ---: |
| Installed denominator | 1600 |
| Usable denominator | 2000 |

**Figure method.** Synthetic annual cost 800,000; installed 500 units gives 1,600/unit; usable 500−100=400 gives 2,000/unit. Reserve is counted once; workload equivalence remains required.

## Further reading

- [NIST cloud definition](https://www.nist.gov/publications/nist-definition-cloud-computing)
- [AWS architectural trade-offs](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
