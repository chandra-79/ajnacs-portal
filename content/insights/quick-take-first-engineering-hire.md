---
title: "The first engineering hire: build something others can inherit"
description: "Assess judgment, handoff quality and operating expectations while keeping the role aligned with the company’s current stage."
date: 2028-11-22
tags: ["Engineering Leadership"]
format: article
---

Every hire matters. The first engineering hire matters differently.

The first engineer is not just a resource. They are a template. The way they write code sets the initial bar for code quality. The way they communicate sets the initial bar for technical communication. The way they handle production incidents sets the initial bar for operational culture. Later engineers inherit parts of this baseline and can also change it deliberately.

## The compounding effect

First principles in culture are persistent. A team of five engineers has an established culture by the time the sixth joins. A team of twenty has a culture that is genuinely hard to change without significant leadership intention.

The culture that a first engineering hire establishes — around quality, around ownership, around how disagreements are handled, around what level of production incidents is acceptable — propagates through every subsequent hire. The first engineer teaches the second. The second and third together establish the norms that the fourth, fifth, and sixth join.

This is why founding teams that compromise on the first engineering hire often spend years correcting for it.

## What to actually evaluate

**Do they have deep ownership instincts?** The first engineer may coordinate a broad technical scope for a while — not just the systems they build, but the operations, the documentation, the oncall, the infrastructure. Someone who is high-output but hands-off is a problem in a small team.

**Do they write for the next person?** Code and systems in a startup get revisited, modified, and extended constantly. An engineer who writes clear, understandable code that is easy to modify is worth significantly more than one who writes clever code that only they can navigate.

**Do they communicate clearly about technical decisions?** The first engineer will be explaining technical decisions to non-technical founders, to early customers, and later to new hires. The ability to communicate clearly about trade-offs is a first-engineer skill, not a senior-engineer-at-a-large-company skill.

**Would you want them to hire the second engineer?** At some point, the first engineer will have significant influence over subsequent hires. Do you trust their judgment about what good engineering looks like?

The first engineering hire is not the most experienced engineer you can afford. It is the engineer who can establish the standards you want to scale.

## Evaluate the next hire's ability to inherit the work

An early system should be understandable by someone who did not create it. Ask a candidate how they would make deployment, configuration and recovery discoverable. The answer does not need to be a large platform. A small documented release path, tests for the critical behavior and a clear ownership record may be enough for the current product. The important question is whether a second engineer can contribute without depending on undocumented memory.

Use a realistic scenario with incomplete requirements. Ask the candidate to identify the questions that must be answered before a production commitment. A strong discussion can include deliberate deferral: a complex abstraction may be unnecessary until a second use case exists. It can also identify work that should not be deferred, such as protecting secrets or knowing how customer data can be recovered.

## A fictional handoff exercise

Imagine a prototype with six operational tasks: deploy, roll back, rotate a test credential, inspect logs, restore a test backup and remove the test environment. Initially, only two can be completed from the documentation by another engineer. After a focused handoff, five can; the sixth requires a specialist review. The chart compares independent task completion, not the skill of the person attempting the tasks or the production safety of the system.

The remaining specialist boundary may be appropriate. The objective is not to make every person do everything. It is to make supportable tasks repeatable and to make escalation explicit for the rest. Record the prerequisites, permissions and stop conditions so a successful demonstration does not depend on an administrator silently fixing the environment.

## Agree on operating expectations before hiring

Discuss working hours, emergency coverage, review support and the authority to delay an unsafe release. The first engineer should not discover after joining that they are expected to provide continuous support without backup. If the business cannot yet staff a particular service commitment, adjust the commitment or obtain appropriate support. A person's willingness to work hard is not a resilience strategy.

Make the founder's responsibilities equally clear. Product priority, customer promises and spending decisions need an available owner. The engineer can explain technical consequences, but should not be forced to infer business intent from a sequence of urgent requests. A simple decision log can preserve the trade-offs and reduce repeated disagreement.

## Reassess the role as the company changes

After the first release, list the work that is recurring and the work that remains uncertain. The second hire may need to share operations, deepen a specialty or create a separate product capability. Avoid hiring a copy of the first engineer solely because the first arrangement worked during a different phase.

Early norms are influential, but they are not immutable. Teams can improve review practices, replace unsafe shortcuts and redistribute ownership. Evaluate the first hire for the ability to make those changes with others, not for an imagined power to set every future cultural outcome. The useful standard is thoughtful ownership combined with a system that other people can understand and improve.

## Sources and further reading

- [US OPM · Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/)
- [Google SRE · Accelerating SREs to On-Call and Beyond](https://sre.google/sre-book/accelerating-sre-on-call/)
