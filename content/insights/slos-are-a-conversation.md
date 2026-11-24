---
title: "SLOs: Agree on the User Outcome and the Response Policy"
description: "Define the population, deadline and failure consequences before turning a reliability objective into monitoring configuration."
date: 2029-06-01
tags: ["DevSecOps", "Observability", "Engineering Leadership"]
format: note
derived: true
---

An SLO is useful when people agree on the experience it represents and the action taken when that experience deteriorates. Product and business stakeholders explain the consequences of failure; engineers establish what can be measured and operated. A percentage without those definitions is difficult to use during a release decision or incident.

A time-based availability objective can be translated into an allowed duration for its stated window. A request-based objective instead uses eligible events. A batch workflow may need completion before a deadline. Do not convert every 99.9% target into a yearly downtime allowance regardless of the service or measurement window.

## Define a deadline-based indicator

Consider a hypothetical morning reporting service with 500 eligible reports. A report is good only if it contains the required data and is available by 09:00 in the agreed timezone. Of the 500, 475 meet the deadline, twenty arrive late and five fail completely. Good-event performance is 475/500 = 95%.

If the objective for this observation window is 98%, the bad-event allowance is 2% of 500, or ten reports. Twenty-five are bad under the definition, exceeding that allowance by fifteen. A late report counts as bad even if it eventually succeeds, because the customer needed it before the meeting. These numbers are synthetic and do not prescribe the appropriate target for a real reporting product.

## Write the indicator worksheet

Record the eligible report population, required content checks, timezone, cutoff, measurement source and exclusions. Define what happens when a customer cancels a report or its required input is missing. Exclusions need a documented reason rather than a retrospective attempt to improve the score. Keep the original ledger so another person can reproduce the calculation.

For an exercise, create synthetic report events containing on-time completion, late completion, missing output and an incorrect result. Have two reviewers classify them using the written rules. Resolve disagreements before building the dashboard. This exposes ambiguous requirements that a monitoring query cannot decide on its own.

## Agree what changes when the budget is consumed

An error-budget policy needs an owner and a concrete response. The reporting team might pause a risky scheduler migration, investigate the dominant missed-deadline cause and restrict the next rollout until the evidence improves. Necessary security and recovery work may still proceed under an explicit exception. A blanket freeze can make an unhealthy system harder to repair.

Review the objective when user expectations, delivery schedules or workload mix change. Preserve earlier definitions so historical comparisons remain interpretable. The goal is a shared operating decision grounded in user impact, with monitoring implementing that agreement rather than inventing it.

| Observation | Value (reports) |
| --- | ---: |
| On time and correct | 475 |
| Late | 20 |
| Failed | 5 |

**Figure method.** Synthetic 500-report window: good=475/500=95%. At 98% objective, bad allowance=(1−0.98)×500=10; actual bad=20+5=25, exceeding by 15. Deadline and content criteria are explicit.

## Primary references

- [Google SRE SLO alerting](https://sre.google/workbook/alerting-on-slos/)
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
