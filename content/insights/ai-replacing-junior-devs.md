---
title: "Developing junior engineers alongside AI coding tools"
description: "Teach engineers to explain, test, review, and maintain assisted changes while measuring the whole delivery effort."
date: 2029-04-02
tags: ["AI & MLOps", "Engineering Leadership"]
format: note
derived: true
---

AI coding tools change the work available to a junior engineer, but they do not settle the staffing question. The effect depends on the task, the codebase, the tool, and the support around the engineer. A claim that every junior can now produce the output of an experienced developer confuses generated text with maintained software. It also ignores how experience is acquired.

## Teach the reviewable change

A useful early assignment has a bounded requirement, an existing test harness, and a reviewer who can explain the relevant failure modes. The engineer may use an assistant to explore an implementation, but should be able to explain the data flow, identify assumptions, and demonstrate the tests without relying on the generated explanation.

Ask for a short change note: what behavior changes, which inputs exercise it, and how failure appears. For an API pagination fix, that means empty pages, duplicate records, unstable ordering, and a next-page token that belongs to another query. The learning objective is to connect the implementation to observable behavior, not to memorize a preferred syntax.

## Count the complete effort

The chart is a fictional comparison of two equally scoped changes. The manual path takes 90 minutes to implement, 30 to review, and 20 to correct: 140 minutes total. The assisted path takes 50 minutes to implement, 50 to review, and 30 to correct: 130 minutes total. Implementation is 40 minutes faster, but the team releases only ten minutes after downstream work is included.

This example does not show that assistants usually help or usually hurt. It shows why the measurement boundary matters. A reviewer may be doing valuable teaching, and that investment can pay off in later tasks. Conversely, a change that passes review quickly may still create maintenance costs that the first-day measurement misses.

## Preserve the opportunity to learn

Alternate assisted and unassisted exercises deliberately. Have the engineer predict the outcome of a test before running it, investigate a seeded bug, and explain why one apparently plausible fix is wrong. When an assistant proposes a dependency, require a reason it is needed and a check of its documented behavior. When it proposes a security-sensitive change, route it through the same specialist review as human-written code.

For a four-task worksheet, record implementation, review, correction, and follow-up time. Add whether the engineer can independently explain the merged change a week later. Keep these records for coaching and process improvement rather than ranking individuals by typing speed. Team context and task difficulty strongly affect the observations.

Research results need the same care. A study of experienced developers in familiar repositories is not a direct estimate for new hires learning a codebase. A short benchmark task is not a complete delivery lifecycle. Read the study setting, allocation method, and outcome definition before applying its result to a hiring policy. The practical decision is which forms of assistance improve both the current change and the engineer's ability to handle the next one.

## Sources and further study

- [Becker et al. — Early-2025 AI and experienced developer productivity](https://arxiv.org/abs/2507.09089)
- [DORA — 2024 research report and methodology](https://dora.dev/research/2024/dora-report/)
