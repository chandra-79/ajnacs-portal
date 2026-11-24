---
title: "Reduce dependence on a single engineer through practiced coverage"
description: "Map critical tasks, protect transfer time and verify that another operator can act safely with the documented support."
date: 2029-08-01
tags: ["Engineering Leadership"]
format: note
derived: true
---

The most dangerous kind of technical dependency in an organization isn't a legacy system or an undocumented API. It's the engineer who is the only person who understands the legacy system, wrote the undocumented API, and gets paged for every incident in their domain because they're the only one who can resolve it reliably.

This engineer is genuinely exceptional. They're also a catastrophic risk that the organization has created by rewarding output over knowledge transfer, and by consistently treating documentation and teaching as lower priority than delivery.

The pattern reinforces itself. The engineer solves every hard problem quickly. This makes them more indispensable. More things get routed to them. Their unique knowledge grows faster than their ability to share it. Eventually, their absence for a week creates a crisis.

The structural fixes:
- **Deliberate pairing** on specialist areas — not to shadow, but to co-own, with the knowledge-transfer as the explicit goal
- **Non-negotiable documentation time** that doesn't get deferred when the next incident arrives
- **Distributed on-call** for systems they own, even if the rotation is less efficient initially
- **Knowledge transfer as a measured output** in performance conversations, not just as a stated value

The measure of a senior engineer's contribution should include how capable the team is after them, not just what they delivered while they were there. An engineer who made themselves irreplaceable has created a dependency; an engineer who made themselves replaceable has built a platform.

## Map capabilities rather than counting documents

List the operational tasks that depend on one person: diagnosing a failure, approving a schema change, restoring data or renewing a critical credential. For each, distinguish who has access, who understands the procedure and who has successfully practiced it. A second name in an ownership file does not provide coverage if that person cannot act under the required conditions.

Start with the tasks whose delay would have the largest consequence. It may be unnecessary for every engineer to understand every component equally. A supported service needs enough capable coverage for its obligations, plus a clear escalation path. The aim is resilience of the team, not elimination of specialization.

## A fictional coverage inventory

Suppose a service has eight critical operational tasks. Three have two practiced operators and five have only one. The chart compares those coverage categories. It does not measure the chance of an incident or the competence of the sole operator. The inventory simply identifies where absence or concurrent demand could leave the team without a practiced response.

Select one single-covered task for a transfer exercise. Record its prerequisite access, the decision points and the expected result. Ask a second engineer to execute a safe version while the specialist observes without taking over. Then repeat with a different case. Documentation supports the transfer, but the independent attempt provides evidence that the task is becoming shared capability.

## Protect the expert from being the permanent fallback

Reserve time for the transfer and reduce competing work during it. If the specialist must answer every interruption while teaching, the organization is asking them to solve the concentration problem without changing the conditions that created it. Give the learner meaningful ownership of the next suitable task, with review and escalation available.

Make absence a normal planning condition. Rehearse a period in which routine questions go to the documented owner or backup rather than directly to the expert. Keep emergency access to help, but record where the plan still depended on private knowledge. The exercise should reveal process gaps, not punish people for asking questions.

## Evaluate the shared capability honestly

Track practiced coverage for the selected tasks, the quality of handoff records and the number of exceptions that still require the specialist. A fall in escalations can indicate better capability, but it can also indicate that people stopped asking for help. Review examples of decisions and outcomes rather than using escalation count alone.

Do not blame the expert for being indispensable. Concentrated knowledge often follows staffing, incentives and repeated delivery pressure. The organization owns the work of distributing access, time and responsibility. Recognize the specialist for helping others develop judgment, while preserving a career path that does not depend on remaining permanently available for the same system.

## Sources and further reading

- [Google SRE · Accelerating SREs to On-Call and Beyond](https://sre.google/sre-book/accelerating-sre-on-call/)
- [Google SRE Workbook · On-Call](https://sre.google/workbook/on-call/)
