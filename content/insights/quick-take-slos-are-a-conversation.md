---
title: "SLOs Are a Conversation Between Engineering and the Business, Not a Monitoring Config"
description: "Service Level Objectives express what reliability means for your users. Setting them correctly requires understanding the business impact of downtime — which is a business conversation, not a technical one."
date: 2028-07-10
tags: ["DevSecOps", "Observability", "Engineering Leadership"]
format: article
---

SLO stands for Service Level Objective. The common mistake is treating it as a technical decision: look at the historical metrics, set a target, configure the alert. If availability has been 99.7%, set the SLO to 99.5% to give some headroom.

This produces an SLO that is a monitoring threshold. It does not produce an SLO that reflects what reliability means for the people who use the service.

## What an SLO is supposed to express

An SLO expresses the reliability level at which users are satisfied with the service. Below this level, users are experiencing unacceptable degradation. Above this level, you may be investing more in reliability than users require.

This is not a technical statement. It is a statement about user experience, business impact, and economic trade-offs.

**The right questions for an SLO conversation:**

- What does downtime cost users? Revenue-generating systems have different downtime costs than internal tools.
- Is downtime a linear cost, or are there specific windows where it is catastrophic?
- What is the user's alternative when the service is unavailable? If there is no alternative (a payment system), reliability requirements are higher than if there is a manual fallback.
- What does the business value more: higher reliability (expensive) or more features faster (lower reliability budget means more deployment frequency)?

The last question is the most important and the most avoided. Reliability investment is a trade-off. Engineering time spent preventing failures is engineering time not spent building features. The business decides which is more valuable in different contexts. Engineers execute against the decision.

## The error budget

The error budget is what makes SLOs operationally useful rather than just aspirational targets. If the SLO is 99.9% availability (approximately 8.7 hours of allowable downtime per year), the error budget is 8.7 hours. Burn the error budget faster than the quarterly allocation? Slow down deployments and fix reliability. Have budget remaining? Deploy more aggressively.

The error budget makes the reliability-velocity trade-off explicit and gives teams a shared framework for making decisions about both.

## Who needs to be in the room

An SLO that is set by engineering without business input is a technical target. An SLO set without engineering input may be technically impossible or economically unreasonable. The right process involves engineering, product, and the business stakeholders who understand the cost of unreliability.

SLOs are where the technical and business sides of reliability meet. They are effective when both sides have been in the conversation.

## Agree the denominator before negotiating the target

A request-based SLO measures eligible events, while a time-based availability objective measures intervals. Converting a percentage directly into hours is appropriate only for the stated time-based model. A batch service may instead need an objective for completion before a deadline, and a low-traffic endpoint may need explicit treatment of empty intervals. Select a measure that represents the user's experience.

Consider an illustrative request-based objective of 99.5% over a rolling window containing 200,000 eligible requests. The allowed bad-event budget is 0.005 × 200,000 = 1,000 requests. If 650 have already failed under the agreed definition, 350 remain. This does not mean the team may deliberately fail 350 requests; it is a planning and alerting model with an agreed response policy. Future traffic changes the denominator in a rolling window.

The worksheet should state the eligible operation, good-event criteria, exclusions, measurement source, window and target. If client errors are excluded, explain which errors and why. Excluding every unsuccessful request because it is inconvenient would make the indicator meaningless. Include correctness or durability when a technically successful response can still harm the user.

## Connect the budget to a decision the team can execute

Agree the action for rapid consumption before the alert fires. It may be pausing risky releases, narrowing a rollout, fixing a dependency or obtaining explicit risk acceptance. An error-budget policy should allow necessary security and recovery changes rather than imposing an indiscriminate freeze that makes the service less safe.

For a lab, generate a synthetic event ledger with success, timeout and invalid-input outcomes. Compute the indicator from the documented rules, then have a second person reproduce it independently. Change one exclusion and quantify its effect so stakeholders can see how definitions influence the result. Plot budget consumption over the same window and avoid mixing a monthly objective with a yearly downtime conversion.

Finally, review whether users recognize the measured failure as meaningful. A payment authorization and a background recommendation have different consequences even if both return HTTP responses. Product input defines acceptable experience, and engineering establishes feasible measurement and response. Revisit the objective when the service or user journey changes, retaining the old definition so historical comparisons remain interpretable.

| Observation | Value (requests) |
| --- | ---: |
| Allowed bad events | 1000 |
| Already consumed | 650 |
| Remaining | 350 |

**Figure method.** Synthetic request SLO: (1−0.995)×200,000=1,000 allowed bad events; 1,000−650=350 remaining. A rolling window changes with future traffic; not a time-based downtime allowance.

## Further reading

- [Google SRE SLO alerting](https://sre.google/workbook/alerting-on-slos/)
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
