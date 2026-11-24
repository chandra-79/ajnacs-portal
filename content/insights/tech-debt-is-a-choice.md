---
title: "Technical debt: make the trade-off reviewable"
description: "Record the constraint, recurring cost and review trigger, then verify whether repayment changes the work."
date: 2029-08-03
tags: ["Engineering Leadership", "Software Engineering", "Career"]
format: note
derived: true
---

Technical debt can be deliberate, accidental or newly visible after requirements change. The useful question is what continuing with the current design costs and what would justify changing it. Calling every shortcut irresponsible ignores real constraints; calling every shortcut a strategic choice can excuse risks that nobody evaluated.

## Write a decision that can be revisited

Record the constraint, the deferred work, the expected consequence and the review trigger. For example, a team might keep two validation paths separate for a release because consolidating them would require a risky migration. The record should say which future changes will require duplicate edits and what evidence would make consolidation worthwhile.

A ticket alone does not manage the debt. Someone must compare it with other work, reserve capacity when justified and update the decision if the component is retired or its use changes. Keep the original reasoning so later engineers can distinguish a conscious trade-off from an unexplained defect.

## A fictional repayment calculation

Suppose duplicated configuration requires five extra hours of maintenance each month. A consolidation is estimated at 18 hours and would leave two hours of monthly upkeep. The modeled net release is three hours monthly, giving a simple payback of six months. The chart compares the five-hour baseline with two hours of upkeep. These are synthetic inputs, not a customer result or a general estimate for refactoring.

Ask whether the component will still be used over that period and whether the estimate includes migration and verification. A planned retirement in three months could make the work unnecessary. A correctness or security risk could justify it for reasons that the time model does not capture. Keep those reasons separate so the arithmetic does not pretend to decide everything.

## Test the result of repayment

Before consolidating behavior, identify the inputs and outputs that must remain compatible. Include the exceptions that caused the duplication. Run a representative change through the new path and compare the effort and error opportunities with the previous process. Check whether work was removed or merely transferred to another team.

Close the decision with the evidence, remaining limitations and ownership of the new implementation. If the expected saving does not appear, revise the model rather than declaring success because the code looks cleaner. Debt management is a continuing decision about risk and future work. It is more useful when its assumptions are explicit than when it becomes a fixed percentage of every sprint or a promise to fix everything later.

## Sources and further reading

- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
