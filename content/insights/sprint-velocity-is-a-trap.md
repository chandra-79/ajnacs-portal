---
title: "Using velocity without turning it into a performance target"
description: "Keep story-point calibration local, examine unfinished work, and pair delivery flow with evidence that the outcome matters."
date: 2029-02-12
tags: ["Engineering Leadership"]
format: article
derived: true
---

Sprint velocity became ubiquitous in software engineering planning because it answered a real question — how much can this team deliver in a sprint — with a number that could be plotted over time. The appeal is legitimate. Planning requires some model of throughput. The problem is that velocity measures what teams do, not what teams achieve, and the difference matters enormously.

A team that inflates story point estimates improves velocity without improving output. This is a rational response to being measured by velocity: the easiest way to improve the metric is to control the inputs to the metric. Story point estimation is subjective enough that calibration drift is difficult to detect from the outside. The team's velocity goes up. The actual value delivered is unchanged.

A team that tackles high-value architectural work that has low story point count — restructuring a data model to enable a class of product features, replacing a fragile integration with a more reliable pattern, improving the observability of a system that regularly causes incident confusion — reduces their velocity while increasing their future delivery capacity. From a velocity perspective, this looks like a bad sprint.

The alternatives to velocity as a planning and performance metric are not revolutionary: cycle time, which measures how long items take from start to done; lead time, which measures how long from request to delivery; business metrics tied to engineering work, which measure whether the delivered software produced the intended outcome. These metrics are harder to game because they are not controlled by the team's estimation decisions. They are also harder to collect and harder to aggregate, which is why velocity persisted despite its limitations.

The engineering leader who stops measuring velocity should replace it with something specific, not with nothing. "We don't measure velocity" and "we have no throughput model" are not the same thing, but they are easy to conflate.

## Keep the unit stable enough to interpret

Story points describe a team's local estimate of work. They are not hours, money or a standard unit shared across teams. Even within one team, changing the definition of done or splitting stories differently can alter the series. If velocity is used for planning, record those changes alongside the numbers. A trend without its measurement rules can look precise while describing several different processes.

A useful planning conversation asks what work was actually completed, which items remain unfinished and what changed in the team's capacity. Count only work meeting the agreed completion condition. Do not hide partially completed items by repeatedly moving them to the next sprint without examining age and dependencies. An item that remains blocked for several iterations deserves attention even when the completed-point total looks healthy.

## A fictional calibration example

A team completes the same eight comparable items in each of two iterations. In the first, it assigns three points per item, producing 24 points. In the second, it changes the calibration to five points per item, producing 40 points. The point total rises by 16, or about 66.7%, while completed-item count remains eight. The chart shows the two point totals and the method states the unchanged item count.

This example demonstrates a measurement property. It does not establish that a real increase in velocity is caused by inflation. Work may genuinely become easier, the team may remove a bottleneck, or the mix may change. Inspect the items and their outcomes before selecting an explanation. Similarly, replacing points with ticket counts does not remove incentives to split work into smaller units solely to improve a chart.

## Create a small planning worksheet

For the last six iterations, record completed items, item type, age at completion, available capacity and any major interruption. Keep the original point values if they were used. Look for periods that are reasonably comparable before forecasting. If the next iteration contains a migration that differs sharply from the historical work, a precise point-based forecast is not justified by the series.

Write a range and the assumptions behind it. Identify the dependency most likely to invalidate the range and the earliest observation that would reveal the problem. A forecast is useful when it supports a decision, such as reducing scope or reserving specialist review time. It should not become a personal promise that prevents the team from reporting new information.

## Pair flow with evidence of value

A shorter cycle time can be helpful, but it does not show that the delivered change solved a user problem. Select an outcome associated with the work: successful task completion, fewer failed transactions or less support effort for a defined cohort. Keep the outcome's denominator and observation window visible. A small release may need time before its effect is measurable.

Use delivery measures to examine the system of work, and use outcome measures to examine the result. Neither should be used alone to rank engineers. The current DORA definitions also distinguish change lead time from an end-to-end product lead time. Name your clocks precisely so the team does not compare a commit-to-production interval with a request-to-validated-outcome interval and call the difference an improvement.

## Sources and further reading

- [Schwaber and Sutherland · Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [DORA · Software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
