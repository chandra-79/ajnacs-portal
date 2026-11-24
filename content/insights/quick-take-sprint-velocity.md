---
title: "A practical flow review beyond sprint velocity"
description: "Use clear clocks, unfinished-work age and outcome evidence to improve planning without turning story points into a ranking."
date: 2029-01-22
tags: ["Engineering Leadership"]
format: article
---

Sprint velocity is a familiar planning measure, but its meaning is limited by local estimation rules.

Velocity measures how many story points a team completes in a sprint. It is useful for one specific purpose: predicting how much work a team can complete in a future sprint, given similar scope and similar team composition. For that purpose, it is reasonably effective.

For any other purpose — measuring productivity, comparing teams, setting targets, evaluating performance — it is actively harmful.

## Why velocity is misleading as a productivity metric

**Story points are relative and local.** A 5-point story on one team is not the same as a 5-point story on another team. Teams calibrate their own scales independently. Comparing velocity across teams compares apples and the concept of fruit.

**Velocity is gameable.** When velocity becomes a target rather than a measurement, teams estimate higher. This inflates velocity numbers while leaving actual throughput unchanged. The team that has a 40-point velocity after six months of pressure is likely not delivering twice as much value as when their velocity was 20. A change in calibration is one possible explanation that should be checked.

**Velocity measures completion, not value.** A team that completes 50 points of work that turns out to be unnecessary features has high velocity and zero business value. A team that spends a sprint doing discovery and retiring 20 bad ideas has low velocity and enormous value.

**Velocity hides technical debt accumulation.** A team can maintain high velocity by cutting corners on testing, documentation, and architecture. The velocity stays high. The codebase degrades. Eventually the debt comes due, velocity collapses, and everyone is surprised.

## What to measure instead

**End-to-end lead time:** time from an agreed request event to production. Keep this separate from DORA change lead time, which starts at a code commit.

**Deployment frequency:** how often the team deploys to production. High deployment frequency with acceptable change failure rate indicates a healthy, confident team.

**Change failure rate:** what percentage of deployments require a hotfix or rollback. A proxy for code quality and testing effectiveness.

**Cycle time per work item type:** how long do bugs take to resolve? How long do features take from development start to production?

These measure the delivery system, not the team's willingness to point stories high.

## Separate forecasting from performance evaluation

A team may retain a local point-based forecast while refusing to use points to rank people or compare teams. The forecast answers a narrow question about work under similar conditions. Performance evaluation asks about outcomes, quality, collaboration and responsibilities. Combining those questions creates pressure to change the scale rather than improve the work.

Start a review by naming the unit and the clock. End-to-end lead time might begin when a request is accepted. DORA change lead time begins at a code commit and ends in production. Cycle time may begin when active work starts. All can be useful, but they describe different intervals. A dashboard should state the definition rather than relying on the word “lead” to explain itself.

## Examine the work that points can hide

Consider a fictional team completing ten items in each of two periods. The first period's items have total active work of 40 hours and total waiting time of 60 hours. The second has the same 40 active hours and 30 waiting hours. The chart compares waiting time because the improvement hypothesis concerns coordination, not coding speed. End-to-end summed item time falls from 100 to 70 hours under the simplified accounting.

These totals assume each item's active and waiting intervals are distinct. They are not calendar duration for the whole team, since work may overlap. They also do not establish equal complexity or equal value between periods. Keep item-level observations and segment work types before drawing conclusions. A few large blocked items can be more important than a favorable average.

## Run a flow review with real decisions

List the oldest unfinished items and identify the next decision needed for each. Is the team waiting for access, review, product clarification or an external dependency? Select a constraint that can be changed within the next planning window. Record the intervention and what result would justify keeping it. The action might be assigning a backup reviewer or clarifying an acceptance test before development begins.

When an item is split, preserve its relationship to the original user outcome. Otherwise a dashboard can show more completed tickets while the customer still waits for the same capability. Likewise, counting deployments without their scope and failure outcomes can encourage trivial releases. Metrics are observations of a system under incentives, not tamper-proof facts about value.

## Keep the conversation about uncertainty

Use historical observations to discuss a range of possible completion dates and the assumptions behind it. If staffing, dependencies or work type changes, explain why the old range may no longer apply. A wider honest range can support a better decision than a precise commitment built on unrelated history.

Review whether the measurement changed behavior usefully. Did the team reduce a wait, clarify a requirement or identify that a feature was unnecessary? If the answer is only that the chart became greener, reconsider the metric. Velocity can remain a small local planning aid. It should not crowd out evidence about the service delivered, the people doing the work and the work still waiting to finish.

## Sources and further reading

- [DORA · Software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
- [Schwaber and Sutherland · Scrum Guide](https://scrumguides.org/scrum-guide.html)
- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
