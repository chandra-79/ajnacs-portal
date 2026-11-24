---
title: "Why an AI feature can work and still go unused"
description: "Measure eligibility, workflow effort, correction costs, and repeat use before deciding why an AI feature is underused."
date: 2029-02-05
tags: ["Enterprise AI", "Engineering Leadership"]
format: note
derived: true
---

An AI feature can work in a demonstration and still offer little value in a real workflow. Its model may be capable, but users also experience discovery, setup, waiting, checking, correction, and transfer of the result into their actual task. Adoption is a property of that complete experience. A low usage rate is a reason to investigate those steps, not proof that users resist change.

## Start with the denominator

A hypothetical organization has 1,000 employees, but only 200 prepare the weekly report supported by its new assistant. Forty employees try the feature and 24 use it again in the next comparable reporting cycle. Usage is 4% of all employees, 20% of eligible employees, and 60% retention among the initial users. Each number answers a different question. Reporting only 4% conceals whether the feature is poorly targeted, poorly discovered, or disappointing after use.

The chart uses those fictional counts. It is not an industry adoption benchmark. Eligibility should be defined before the rollout, and the repeat-use window should match the actual task. A quarterly reporting tool cannot reasonably be judged by daily active use.

## Observe the entire job

Watch a willing participant complete the report with the existing process and with the assistant. Record where they leave the tool, verify a number, or ask someone for missing context. Avoid treating every pause as confusion; some pauses are necessary judgment. Ask what they would do if the assistant were unavailable and what they would have to check before sharing its answer.

Suppose manual preparation takes 15 minutes. The assistant produces a draft in two minutes, but copying data into it takes four minutes, reviewing takes six, and formatting the result takes three. Total effort remains 15 minutes. Faster generation has not improved the job. Integrating approved inputs and preserving the output format may matter more than changing models.

## Design for correction and return

Make the feature's supported scope visible beside the input. Show the data period and source records behind important claims. Preserve a user's edits rather than regenerating over them. Offer a useful manual route when the source is missing or the answer fails validation. These details let users recover from ordinary failures without starting the task again.

For a two-cycle trial, track eligible users, first use, completed tasks, corrections, and repeat use. Add a short reason code for abandonment, but avoid mandatory surveys that make the tool more burdensome. Interview users who tried it once as well as enthusiastic adopters. The latter group alone gives an incomplete account of the friction.

The decision worksheet has five columns: task, eligible cohort, current effort, assisted effort including checking, and reason to continue. Choose one observable outcome, such as a correctly reconciled report, and keep its quality standard constant. Review the findings with the people responsible for the existing workflow. A useful outcome may be a narrower feature, a simpler form, or removal of an unnecessary reporting step; adding more generative capability is only one possible response.

## Sources and further study

- [DORA — 2024 research report and methodology](https://dora.dev/research/2024/dora-report/)
- [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
