---
title: "Measure AI productivity across the whole change lifecycle"
description: "The productivity claims for AI coding tools are plausible but routinely measured at the wrong scope."
date: 2028-12-18
tags: ["AI & MLOps", "Enterprise AI", "Engineering Leadership"]
format: article
derived: true
---

A productivity claim needs a defined unit of work, a comparison, and a boundary around the effort being counted. An assistant can shorten implementation while increasing review, or improve exploration without changing deployment time. Those outcomes are compatible. The measurement problem is to identify which outcome matters for the team's decision.

## Choose a task and keep its acceptance criteria fixed

For a hypothetical engineering trial, use bounded repository tasks with an observable definition of completion: the change meets the requirement, passes the relevant checks, and receives normal review. Record the assignment method before the trial. If enthusiasts choose the assistant for easy tasks while avoiding it for difficult ones, a simple average will mix tool effect with task selection.

Random allocation can improve the comparison when it is practical and acceptable. Pairing similar tasks or comparing repeated work can also help, but the limitations should remain visible. Engineers learn during the trial, repositories change, and tool versions may change. Record those conditions rather than assuming that two calendar weeks are interchangeable.

## Count effort where it moves

The chart shows a fictional workload of ten accepted changes. Without assistance, implementation consumes 30 hours, review eight, and rework four: 42 hours total. With assistance, implementation consumes 22 hours, review 12, and rework five: 39 hours. The eight-hour implementation reduction becomes a three-hour reduction in total observed effort, about 7.1% of the baseline.

These inputs are invented to explain the arithmetic. They are not an Ajna delivery result or a forecast. The trial should also record escaped defects, changes abandoned before acceptance, and work shifted to a different team. Excluding unsuccessful attempts makes both assisted and manual workflows look better than the experience of the people doing the work.

## Use more than one outcome

Elapsed lead time and person-hours answer different questions. A change can wait two days for review while requiring only one hour of reviewer effort. Reducing that wait improves delivery time without necessarily releasing much labor. Conversely, reducing repetitive implementation effort can improve capacity without moving a release date constrained by a weekly deployment window.

Record developer experience separately from delivery performance. A tool that makes unfamiliar code easier to understand may be valuable even when the first measured task is not faster. A tool that feels faster may still create hidden checking work. Neither satisfaction nor throughput should silently stand in for the other.

## Publish a measurement contract

Use a worksheet containing task ID, task class, allocation, tool and model version, implementation effort, review effort, correction effort, elapsed completion time, and acceptance outcome. Agree on how interruptions, assistance from colleagues, and incomplete tasks are recorded. Review the definitions with participants so that the study does not become a time-tracking exercise with inconsistent rules.

Report the sample size and distribution, not just one mean. Inspect difficult tasks and outliers rather than deleting them automatically. Do not convert a small pilot's percentage directly into an organization-wide headcount saving. Released time becomes business value only when the organization can use it effectively and the quality standard remains acceptable.

Published studies demonstrate why context matters. Results from experienced maintainers working in familiar open-source repositories answer a different question from results on short isolated programming exercises. DORA's observational research answers another set of organizational questions. Read the method and setting before adopting a headline number. A useful local trial ends with a bounded recommendation about task types, controls, and the next measurement period.

## Sources and further study

- [Becker et al. — Early-2025 AI and experienced developer productivity](https://arxiv.org/abs/2507.09089)
- [DORA — 2024 research report and methodology](https://dora.dev/research/2024/dora-report/)
