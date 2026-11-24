---
title: "On-call workload: notice strain early and change the operating conditions"
description: "Review paging, interrupted nights, escalation concentration and recovery arrangements without treating a workload metric as a health diagnosis."
date: 2029-02-21
tags: ["Engineering Leadership", "Observability"]
format: article
derived: true
---

Repeated after-hours interruptions and unchanged daytime commitments are operating conditions worth reviewing. People experience and report strain differently; a leader should not infer a health condition or its duration from paging history, performance, or attrition. Discuss workload, access to backup, recovery arrangements, and concerns directly with the people doing the work.

The signals that tend to go unmeasured:
- **Alert volume per engineer**: review actionable pages alongside shift length, incident duration and interrupted nights; no single count is a universal threshold. Repeated nonactionable notifications can make urgent signals harder to distinguish; inspect actual response behavior rather than assuming every engineer reacts the same way.
- **Hero concentration**: two or three engineers who always handle the complex incidents because they're the only ones who understand the system deeply. This is a bus factor problem and a burnout risk simultaneously.
- **Rotation equity**: if the same engineers end up on-call over every holiday weekend because they're the "reliable" ones, the informal cost of reliability is not being shared.

The practices that help:
- Measure and review on-call load as a team metric, not just a scheduling function
- Require that every alert has a defined action — if persistence matters, review the duration condition and whether paging or a ticket is the right route
- Post-mortems that result in changed alert thresholds and runbook improvements, not just root cause analysis
- Make workload and recovery arrangements a topic in one-to-one conversations, not something engineers are expected to absorb silently

The on-call experience is a joint signal about system reliability and engineering culture. Treat it as both.

## Treat workload signals as evidence to investigate

Paging counts, interrupted nights and repeated escalations describe the operating environment. They do not diagnose burnout in an individual. The World Health Organization describes burnout as an occupational phenomenon associated with chronic workplace stress that has not been successfully managed. Engineering leaders should improve the work system and provide appropriate support without inferring a person's health from a dashboard.

Record the number of pages, actionable incidents, distinct interrupted nights and hands-on response time for a defined rotation. Keep nonurgent tickets separate. A burst of related pages can represent one incident; one page can require several hours of difficult work. The distribution matters as much as the total. Discuss the data with the people carrying the rotation and respect their privacy.

## A fictional paging audit

Over two comparable weeks, a fictional rotation receives 18 pages in the first window and ten in the second. In the first, six pages require an immediate operator action; in the second, the same six do. The chart compares total pages, while the worksheet preserves the unchanged actionable count. The reduction comes from eliminating or rerouting eight nonurgent notifications in the scenario, not from ignoring real incidents.

Check user-impact detection and missed escalations after changing an alert. A lower count is not inherently better if the team loses visibility into important failures. Review an alert's purpose, the action it enables, its urgency and the evidence needed to tune it. An alert that should wait for persistence may need a duration condition or a ticket route; it should not automatically be deleted.

## Make recovery and backup part of the plan

Agree how the team handles an interrupted night, an extended incident and an engineer who cannot safely continue. Provide a backup who has access and context. Do not depend on an informal promise that the same expert will always answer. The plan should make it possible to hand over a live incident with a concise state record and clear ownership.

Review rotation distribution over a meaningful period, including holidays and swaps. Equal counts of shifts can still produce unequal burden if one person repeatedly covers the busiest release windows. Record voluntary preferences without turning them into permanent assumptions about availability. Revisit the arrangement as staffing and personal circumstances change.

## Turn recurring work into engineering priorities

Select one repeated incident class and identify a bounded improvement: remove its trigger, make recovery safer or reduce diagnostic ambiguity. Allocate time in the delivery plan and verify the result in a controlled scenario. A promise to fix everything later is less useful than one completed change whose effect the team can observe.

The aim is sustainable coverage, reliable service and a credible route for raising concerns early. No rotation design can guarantee that nobody experiences burnout, and a page-count threshold is not a universal safety limit. Use operational observations to support a conversation about workload and resources, then act on the constraints the team can change.

## Sources and further reading

- [Google SRE Workbook · On-Call](https://sre.google/workbook/on-call/)
- [WHO · Burnout as an occupational phenomenon](https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases)
