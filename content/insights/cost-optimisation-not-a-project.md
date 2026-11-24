---
title: "Cloud cost optimisation is not a project with an end date — it's a continuous practice"
description: "Build a continuing cost-review practice that distinguishes total spend, unit cost and service quality, with a synthetic comparison."
date: 2029-05-23
tags: ["FinOps", "Engineering Leadership"]
format: note
derived: true
---

Consider this hypothetical cloud-cost scenario: the bill gets uncomfortably large, leadership forms a taskforce, the taskforce has a productive three months, the illustrative bill drops 30%, the taskforce celebrates and disbands. Eighteen months later, the bill is approaching its previous level and leadership is forming another taskforce.

The costs grew back because the behavior didn't change. The taskforce optimised the existing state. It didn't change how new infrastructure gets provisioned, how teams think about cost when making architectural decisions, or how cost performance is evaluated alongside feature delivery.

Cost optimisation as a one-time exercise is archaeology: you go through what exists and make it more efficient. Cost discipline as a continuous practice is different: it embeds cost awareness into the engineering workflow so that new work doesn't accumulate the same waste.

The structural changes that prevent costs from growing back:
- Cost visibility in the team's day-to-day tooling, not a separate FinOps dashboard nobody opens
- RI purchasing reviewed on a schedule tied to workload planning, not on reaction to the bill
- Engineering teams held accountable for cost efficiency as a quality metric alongside reliability and performance
- Architecture reviews that include cost modelling as a standard input

You wouldn't run a single security audit and declare the organization secure. Cloud cost efficiency is the same: it requires continuous practice, not periodic rescue operations.

## Separate a one-time correction from a maintained improvement

A one-time cleanup can be useful. The mistake is treating the initial reduction as evidence that the same waste cannot return. A maintained practice records why the waste existed and changes the provisioning, retirement or review behavior that recreates it.

Imagine a fictional team that removes $800 of idle monthly capacity. The next month introduces $250 of similar idle capacity through new test environments. Without prevention, the observed reduction is only $550 against the original baseline. If an expiry policy prevents $200 of that recurrence, the reduction becomes $750. The figure compares those modeled outcomes. It does not claim that expiry policies universally save a particular percentage or that every idle resource is safe to remove.

## Use a recurrence worksheet

For each action, record the resource population, cost basis, owner, intervention date and expected duration of benefit. Add a cause: forgotten experiment, oversized default, missing retirement step or legitimate reserve. Check the same cause in the next review window. Counting closed tickets alone cannot distinguish a permanent correction from repeatedly deleting the same kind of resource.

Test an expiry policy with resources that are safe to interrupt. Notify the owner before expiry, allow a documented extension, and record resources deliberately exempted for recovery or periodic workloads. Use the actual calendar of work: a month-end reporting host can appear idle for most of the month while still being necessary. Evidence of no recent CPU demand is not evidence of no business purpose.

Keep service outcomes beside the financial result. A lower capacity bill accompanied by queue growth, missed recovery objectives or excessive engineering upkeep can be a poor trade. Make the review a place to retain useful capacity as well as remove waste. The practice is successful when decisions remain explainable after demand, staffing and architecture change.

### Figure methodology

Synthetic baseline comparison: $800 initial reduction minus $250 recurring waste equals $550. Preventing $200 of recurrence yields $750 reduction. Excludes implementation effort and changes in legitimate demand.

| Worked observation | USD/month |
| --- | ---: |
| Initial cleanup | 800 |
| After recurrence | 550 |
| With prevention | 750 |

## Primary references and further study

- [FinOps usage optimization](https://www.finops.org/framework/capabilities/usage-optimization/)
- [FinOps unit economics](https://www.finops.org/framework/capabilities/unit-economics/)
