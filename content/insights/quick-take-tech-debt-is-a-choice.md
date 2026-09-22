---
title: "Technical Debt Is a Choice — Usually the Right One, Until It Isn't"
description: "Most technical debt is not the result of bad engineering. It is the result of deliberate trade-offs made under constraint. The problem is not making the choice — it is forgetting that you made it."
date: 2025-10-30
tags: ["Engineering Leadership", "Software Engineering", "Career"]
format: article
---

Technical debt is often described as something that accumulates accidentally, through poor practices, through moving too fast. Some of it does. Most of it is chosen.

The deliberate skip of unit tests because the launch deadline is in two days. The simplified data model because the full one would take three extra weeks. The copy-pasted code because refactoring the shared component would require coordination with two other teams.

These are choices. Under the constraints, they were often the right choices.

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

Make the choice explicit. Document what was deferred, why, and what the remediation would require. Treat debt items as first-class backlog items that compete with features for sprint capacity. Allocate a percentage of capacity — 15–20% is common — for debt remediation every sprint.

The teams that manage technical debt well are not the ones who never incur it. They are the ones who incur it deliberately and pay it down systematically.
