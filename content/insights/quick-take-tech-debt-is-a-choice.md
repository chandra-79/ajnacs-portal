---
title: "Technical debt decisions: record the trade-off and test repayment"
description: "Make constraints, recurring cost and review triggers explicit without assuming every debt was deliberate or every refactor pays back."
date: 2028-11-29
tags: ["Engineering Leadership", "Software Engineering", "Career"]
format: article
---

Technical debt is often described as something that accumulates accidentally, through poor practices, through moving too fast. Some debt is deliberate; some becomes visible only after requirements or understanding change.

The deliberate skip of unit tests because the launch deadline is in two days. The simplified data model because the full one would take three extra weeks. The copy-pasted code because refactoring the shared component would require coordination with two other teams.

These can be deliberate trade-offs. Whether they were justified depends on the constraints and risks at the time.

## Why the choice framing matters

When technical debt is framed as accidental — the inevitable result of moving fast — there is no accountability for it and no mechanism to address it. It just accumulates.

When technical debt is framed as a choice — a deliberate trade of future engineering cost for present delivery speed — several things become possible:

**The debt can be documented.** "We chose not to write tests for this component because of the launch deadline. The risk is X. The remediation would take Y days." This is not a confession. It is an engineering record.

**The debt can be managed.** A documented technical debt backlog is a managed backlog. Items can be prioritized, estimated, and scheduled. The undocumented debt backlog grows until it becomes a crisis.

**The cost can be communicated.** When the business asks why a feature that should take two weeks is taking six, the answer is often the accumulated cost of previous choices. That conversation is more productive when the debt is documented and the choices are explicit.

## The debt that actually causes problems

The debt that creates real problems is not the debt that was deliberately chosen under constraint. It is the debt that was:

- Chosen without being acknowledged (the team does not know the trade-off was made)
- Chosen and forgotten (the trade-off was explicit but never documented)
- Accumulated through genuinely poor practices rather than deliberate decisions
- Never scheduled for remediation despite being documented

The last category is the most insidious. A team that documents technical debt but never allocates time to address it is building a debt registry that creates an illusion of management without the substance of it.

## The sustainable practice

Make the choice explicit. Document what was deferred, why, and what the remediation would require. Treat debt items as first-class backlog items that compete with features for sprint capacity. Reserve capacity based on the observed risk and cost of the debt, and review that allocation as conditions change.

The teams that manage technical debt well are not the ones who never incur it. They are the ones who incur it deliberately and pay it down systematically.

## Record the constraint and the expiry condition

A useful debt record identifies the shortcut, the reason it was acceptable at the time, the cost of continuing with it and the signal that should trigger reconsideration. “Clean up the payment module” gives little basis for prioritization. “The module duplicates tax rules in three paths; the next jurisdiction change requires three coordinated edits” identifies a concrete source of future work.

Not all debt was knowingly chosen. Teams discover new requirements, learn that an earlier model was wrong, or inherit a system whose original constraints are unavailable. Avoid using the language of choice to blame the people who made a decision with less information. The present task is to understand the consequence and decide what to do next.

## Calculate a limited repayment case

Suppose a fictional duplicated validation rule causes four changes per month to take an extra three hours each. The observed recurring effort is 12 hours monthly. Consolidating the rule is estimated at 30 hours, followed by two hours of monthly upkeep. If the change frequency and effort remain stable, the net ongoing release is 10 hours per month and simple payback is three months. The chart compares 12 hours of duplication overhead with two hours of upkeep after consolidation.

This is a capacity model, not a financial return calculation. It excludes the implementation risk, the value of alternative work and any defects that the duplication might cause. If the module is about to be retired, a three-month recovery period may be irrelevant. If it controls a critical correctness property, risk reduction may justify the work even when time alone does not. State those factors separately instead of hiding them inside an impressive savings number.

## Test the refactor's behavior before moving the rule

Create a list of inputs whose handling must remain unchanged. Include ordinary valid input, boundary values, missing data and the historical exceptions that caused the duplication. Capture the expected result from an agreed specification rather than assuming the existing implementation is always correct. Run the same cases against the old paths and the proposed shared implementation.

Plan how to introduce the shared rule without forcing all consumers to migrate simultaneously. An adapter or compatibility layer can make the transition safer, but it also has a retirement cost. Identify the final consumer, the evidence that the old path is unused and the cleanup owner. Otherwise a refactor intended to remove duplication can temporarily create a third permanent implementation.

## Prioritize against actual alternatives

Compare the debt item with the work it would displace. A fixed percentage of capacity can protect improvement time, but no universal 15–20% allocation is justified for every team. A service with an imminent support deadline may need concentrated remediation; a stable system with little planned change may need less. Use the observed cost, risk and expected future use to make the allocation explicit.

Close the item only after verifying the intended effect. Check the next relevant change to see whether it actually avoided the duplicated edits. If the work moved to a different team or created a new review bottleneck, update the cost model. The goal is a better system of work, not a smaller debt register achieved by changing ticket labels.

## Sources and further reading

- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
