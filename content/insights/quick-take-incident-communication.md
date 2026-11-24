---
title: "Incident Communication Is an Engineering Skill — Here Is How to Develop It"
description: "Most engineers receive no formal training in how to communicate during and after production incidents. The skill is teachable and has outsized impact on how incidents are perceived."
date: 2028-07-17
tags: ["Engineering Leadership", "DevSecOps"]
format: article
---

The incident is real. The systems are impacted. The engineers are working the problem. And meanwhile, every stakeholder who knows something is wrong is watching a status page that says "investigating" — which was last updated 45 minutes ago.

The engineering is going well. The communication is a disaster.

## Why incident communication is an engineering skill

Incident outcomes include service restoration, data integrity, user impact and the quality of coordination and communication.

A fast resolution with poor communication leaves customers feeling abandoned and confused. A slow resolution with excellent communication produces a different relationship with the incident — customers know someone is working on it, they know what is affected, they have enough information to make their own decisions.

Technical skill gets the resolution. Communication skill manages the impact.

## The structure that works

**Acknowledge immediately.** A team might set a five-to-ten-minute acknowledgment target for a particular incident class, even if the update is only "we are aware of an issue and are investigating." This communicates presence. The status page that sits on "all systems operational" for 30 minutes while an incident is in progress actively damages trust.

**Separate impact from cause.** Customers care primarily about impact: which systems are affected, what does not work, who is affected. Engineers care about cause. An update that spends three sentences on the root cause hypothesis and one sentence on impact is written for engineers, not customers. Invert the ratio in external communication.

**Update on a cadence, not just when you have news.** An update that says "we have not identified the cause yet and are continuing to investigate" is valuable because it communicates that the incident is still active and people are still working on it. Radio silence for 40 minutes communicates the opposite.

**Close with a summary.** When the incident is resolved, close it with: what was affected, what was the impact duration, what caused it, what was done to resolve it, and what is being done to prevent recurrence. The summary should distinguish confirmed findings from questions still under review.

## How to build the skill

Incident communication improves with deliberate practice, not just experience. After every incident, review the communication timeline: was the first acknowledgement fast enough? were the updates clear about impact? was the resolution summary complete? Identify the gaps. Address them in the next incident template.

The engineer who writes clear, timely, customer-focused incident communication is not just a technical asset. They are how the engineering team appears during the moments that matter most.

## Give the communicator an evidence boundary

A status update should distinguish observation, working hypothesis and confirmed cause. “Some checkout requests are timing out” describes impact. “The database is the cause” requires stronger evidence. During investigation, use language that preserves uncertainty and does not promise a recovery time the team cannot support. State the next update time even when the next technical result is uncertain.

Assign communication responsibility so the engineer running the mitigation is not simultaneously answering every stakeholder. The communicator needs access to the incident record and a way to confirm facts with the incident lead. External updates should avoid customer identifiers, secret configuration and unverified security conclusions. Use the organization's review process for sensitive disclosures while keeping useful service-impact information timely.

## A fictional update-cadence exercise

An incident is declared at 10:00. The first update is published at 10:08, the second at 10:23 and the third at 10:38. The intervals are eight minutes to acknowledgment, then 15 and 15 minutes between updates. The chart compares the eight-minute acknowledgment interval with a later 15-minute update interval. These are exercise inputs, not a universal service standard.

A cadence should reflect the service, audience and obligations. A minor internal issue may need a different communication pattern from a customer-facing outage. When there is no new finding, explain that investigation continues, restate the known impact and preserve the next update commitment. Do not manufacture progress to fill the scheduled message.

## Rehearse with incomplete and changing information

Give a participant a short fictional incident packet: affected user journey, uncertain scope, current mitigation and next diagnostic action. Ask for an internal update and a customer-facing update. Then provide a conflicting observation, such as successful requests from one region. The participant should revise the scope without implying that the earlier statement was more certain than it was.

Review whether the messages answer practical questions. Can a user tell whether to retry, wait or use a documented workaround? Can a support colleague explain which customers may be affected? Can a leader identify the next decision that needs help? Shorter messages are useful when they retain those facts; brevity alone is not the goal.

## Close with the evidence available

When service is restored, state the observed restoration condition and any continuing limitations. A queue may still be draining after new requests recover. A rollback may restore availability while leaving some transactions for reconciliation. Distinguish restoration from complete business recovery so customers can make informed decisions.

The final causal account may require further investigation. It is better to say that a review is underway than to publish a definitive root cause immediately and later discover it was incomplete. Link a later review when appropriate and explain material corrections. Communication supports coordination and trust, but it does not replace technical recovery, data reconciliation or the obligations associated with the incident. Treat it as an operational workstream with practice, ownership and evidence.

## Sources and further reading

- [Google SRE Workbook · Incident Response](https://sre.google/workbook/incident-response/)
- [Google SRE · Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
