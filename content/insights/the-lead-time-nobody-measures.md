---
title: "Measure the path from an accepted need to a verified outcome"
description: "Keep deployment, exposure and outcome evidence separate so lead-time discussions identify the interval that actually needs attention."
date: 2028-12-15
tags: ["Engineering Leadership", "Architecture"]
format: article
derived: true
---

DORA metrics provided the engineering industry with a credible, research-backed set of measures for delivery performance. DORA delivery measures are useful when their current definitions and service scope are recorded. They describe software-delivery throughput and instability, including production recovery and rework; they do not directly establish whether a delivered feature created the intended business value.

A team with excellent DORA metrics can be consistently delivering software that does not solve user problems. They ship frequently, with low failure rates, and recover quickly from incidents. The features they ship are not adopted, the metrics they were designed to move do not move, and the business outcomes they were supposed to enable do not materialise. From a DORA perspective, this team is high-performing. From a product perspective, they are efficient waste producers.

The full lead time includes everything from problem identification to validated outcome: the time a user need exists before it is translated into a product requirement, the time requirements spend in backlog before they enter development, the time in development before deployment, and the time post-deployment before the team knows whether the feature achieved its intended effect.

Teams that engineer the full lead time make different decisions. They invest in feature flags and experimentation infrastructure because controlled experiments can help distinguish a change's effect from other influences when the setting supports them. They track adoption metrics alongside deployment metrics because deployment is not the finish line. They treat the discovery phase as a process with a duration, not a precondition that happens at indeterminate speed before "real work" begins.

The DORA metrics are worth tracking. They become more valuable when paired with outcome metrics that validate the business effect of what was delivered. Efficiency without effectiveness is a fast path to delivering the wrong thing well.

## Define the event that means the need was addressed

A release timestamp is observable, but it may precede the user's ability to use the feature. A flag can remain off, a migration can still be running, or support staff may need a new procedure. Define the end event in terms of the problem being solved. For a self-service export, it might be a qualifying user successfully completing the export without manual assistance. Keep deployment, exposure and verified use as separate events.

Define the beginning with equal care. An idea first mentioned in a meeting is different from an accepted problem with enough evidence to justify work. Select a start event that can be recorded consistently and explain what it excludes. There is no single universal time-to-value metric that fits every product, so comparisons should stay within a stable definition.

## A fictional timeline makes the hidden intervals visible

Suppose a request spends eight days in discovery,12 days awaiting prioritization, five days in implementation and review, one day in deployment and rollout, and four days before the team can verify the intended outcome. Total elapsed time is 30 days. The chart compares the 20 days before implementation with the ten days from implementation through verification. It does not imply that all discovery or waiting time is waste.

Some waiting may be deliberate: another dependency must be ready, a customer cohort is not yet available, or the decision requires evidence from a full business cycle. Label the reason rather than simply demanding a shorter total. The useful intervention is the one that reduces avoidable delay without weakening the decision or the service.

## Trace one outcome through the work system

Choose a recently delivered capability and reconstruct its event history from existing records. Identify the request, acceptance, start, code commit, deployment, exposure and validation events. Record missing timestamps as missing rather than inferring them from convenient ticket transitions. A workflow status may reflect administrative cleanup days after the actual event.

Draw the intervals and ask the responsible people whether the interpretation is correct. A code change may represent only one part of a larger customer outcome, or one deployment may serve several outcomes. Preserve these relationships instead of forcing every outcome into a one-ticket, one-release model. The worksheet should help the team reason about the path, not impose a false simplicity on it.

## Decide what to improve next

Select the longest avoidable interval that the team has some ability to change. If work waits for a decision, define who can decide and what evidence they need. If it waits for customer validation, arrange the validation before implementation finishes. If exposure is delayed by a migration, make that migration part of the delivery plan rather than a surprise after the code is merged.

Keep the delivery metrics as well. Fast, reliable deployment is useful even when discovery takes longer. The current DORA model separates throughput and instability and uses failed deployment recovery time rather than treating all incident recovery as one interchangeable MTTR measure. Pair those definitions with a locally defined outcome timeline. The combined view can reveal whether the next improvement belongs in engineering execution, cross-team coordination or the product decision itself.

## Sources and further reading

- [DORA · Software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
- [Schwaber and Sutherland · Scrum Guide](https://scrumguides.org/scrum-guide.html)
