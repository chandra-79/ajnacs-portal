---
title: "Replace single-person dependence with tested operational coverage"
description: "Separate access, knowledge and authority gaps, then rehearse the critical tasks with a supported backup."
date: 2028-11-27
tags: ["Engineering Leadership"]
format: article
---

Some teams develop a concentrated dependency of this kind. The engineer who knows where all the bodies are buried — the systems that only they understand, the decisions that only they can make, the incidents that require waking them up regardless of what time it is.

They are invaluable. They are also fragile. And the organization that has allowed this situation to develop has made a mistake, regardless of how good the engineer is.

## The risk to the system

A system that only one person can operate has a single point of failure. That person gets sick. They resign. They take a vacation. They get hit by a bus — the classic but irreplaceable morbid hypothetical in software architecture.

Any of these events produces an incident, a crisis, or a slow degradation of operational capability depending on how slowly the knowledge gap is discovered. The organization that treated this engineer's availability as infrastructure has no redundancy in that component.

## The risk to the engineer

Being the indispensable engineer is not the career win it appears. The engineer who is on-call for everything cannot take time off without being interrupted. They cannot advance into a role with different scope because the organization cannot afford to lose their operational knowledge. They are promoted into a form of captivity — valuable enough to keep, too depended-upon to develop.

Repeated unplanned escalation can create an unsustainable burden, regardless of an engineer's capability.

## How this situation develops

Good intentions in one direction. An engineer demonstrates they can handle complex problems. The organization routes complex problems to them. The routing produces more concentrated knowledge. The concentrated knowledge increases the routing. The feedback loop runs until the engineer is doing work for ten people and nobody else can do it.

This is not a promotion or a reward. It is organizational neglect dressed as recognition.

## The structural fix

Cross-training as an explicit practice, not something that happens when there is time. Incident response that involves pairing the expert with a less experienced engineer, rather than just calling the expert. Documentation of systems that is specific enough to enable someone else to operate them. Explicit conversations with the engineer about what a healthy scope looks like and how to achieve it.

The goal is enough practiced coverage for the service's obligations, with clear escalation for specialist work. Depth of expertise still exists. The single point of failure does not.

## Identify the dependency precisely

A team can depend on one person for access, technical understanding, approval authority or historical context. These dependencies require different remedies. Documentation cannot fix an account that only one person can authorize. A second administrator cannot replace an untested recovery procedure. Inventory the task and the specific reason others cannot perform it.

Prioritize by the service obligation. A rarely used migration tool may tolerate a longer escalation path than a daily settlement process. Define the required coverage and response window before deciding how many people need practice. Avoid the unrealistic goal that every team member must be able to operate every system equally well.

## A fictional coverage exercise

A service has ten important operational tasks. Four have a practiced backup, while six depend on one operator. After a focused transfer period, seven have a practiced backup and three remain single-covered. The chart compares the four and seven backed-up tasks. The inventory does not measure reliability directly, because tasks differ in importance and the quality of the rehearsal matters.

For each claimed backup, retain the date and scope of the last successful exercise. Access may expire, a dependency may change or a procedure may become obsolete. Coverage should be reviewed after material system changes and staffing changes rather than treated as a permanent badge earned once.

## Transfer a real task with a safe boundary

Have the specialist explain the goal, inputs, decision points and failure cases. Then let the backup perform a sandbox version while the specialist observes. Ask the backup to narrate why they choose each step. A person who can follow commands without understanding the stop condition may still need help when the real situation differs.

Repeat with a variation and reduce assistance. Update the instructions based on where the backup becomes uncertain. This creates both a better artifact and evidence about the learner's current capability. Keep the original expert available for escalation while transferring ordinary ownership, rather than abruptly removing support to prove independence.

## Change the incentives that concentrate the work

Reserve time for knowledge transfer and recognize the contribution in the same way as implementation. Adjust incoming work so the expert is not simultaneously expected to deliver at the old rate and teach everyone else. Give the backup meaningful opportunities to use the skill; otherwise practice decays while new work continues to route to the original specialist.

Discuss the expert's desired career direction and availability. Dependence is an organizational design problem, not a moral failure by the person who knows the system. The objective is a service that can be supported during normal absence and a team in which expertise can grow without becoming permanent captivity. Use the inventory and rehearsals to make that objective concrete.

## Sources and further reading

- [Google SRE · Accelerating SREs to On-Call and Beyond](https://sre.google/sre-book/accelerating-sre-on-call/)
- [Google SRE Workbook · On-Call](https://sre.google/workbook/on-call/)
