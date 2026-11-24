---
title: "Incident Culture: What Blameless Post-Mortems Actually Require"
description: "Blameless post-mortems are widely advocated and inconsistently practiced. The gap between the stated ideal and the actual culture is usually visible in how post-mortems are conducted and what happens to the action items."
date: 2027-12-31
tags: ["Engineering Leadership", "DevSecOps"]
format: article
---

The blameless post-mortem is one of the most cited practices in reliability engineering. The idea: when something goes wrong, the goal is to understand contributing factors in the system, not to identify the individual who caused the failure. People make errors in complex systems; those errors reveal systemic weaknesses. Focus on the system.

This is widely agreed upon. It is also, in practice, inconsistently applied. The gap between the espoused principle and the actual culture shows up in subtle ways: who is asked to present at the post-mortem, what language is used in the write-up, whether the same action items reappear across multiple incidents without resolution, and whether engineers are genuinely willing to report near-misses.

## What blameless actually means

Blameless does not mean consequence-free. It means that the investigation focuses on systemic factors rather than individual fault. An engineer who deletes a production database is not absolved of professional responsibility — but the post-mortem asks why it was possible to delete a production database with a single command rather than focusing on the individual who did it.

The useful question is: what would have to be true for another engineer, with different experience or context, to make the same mistake? If the answer is "very easily true," the system has a problem that transcends the individual.

The failure mode is when "blameless" becomes "nobody is accountable for anything." Good incident culture distinguishes between systemic accountability (the organization is responsible for the conditions that allowed the failure) and individual accountability (engineers are responsible for their professional competence and conduct). Both can be true.

## The post-mortem structure that works

**Timeline reconstruction**: a factual, chronological record of what happened — not who did what, but what the system and the people did. Key events, decisions made with available information at the time, detection, response, resolution. The timeline is the foundation everything else builds on.

**Contributing factors**: what conditions made the incident possible or made it worse? Monitoring that didn't fire, documentation that was wrong, a deployment process without a canary phase, a manual step that was easy to skip. Multiple contributing factors are almost always present; single-root-cause analyses are rarely complete.

**What went well**: what worked as intended? Detection mechanisms that fired correctly, runbooks that were accurate, on-call engineers who escalated appropriately. Reinforcing what works is as important as fixing what doesn't.

**Action items with owners and deadlines**: the most common way post-mortems fail is that the action items are never completed. Each action item needs a single named owner (not "the platform team"), a realistic deadline, and a tracking mechanism. Action items that appear in three consecutive post-mortems without resolution are a signal about organizational priorities.

**Severity definition**: not all incidents are equal. An organization-specific severity classification based on customer impact and urgency helps calibrate the depth of investigation and the expected response time.

## The environment that makes blameless possible

Blameless post-mortems require psychological safety. Engineers must believe that reporting honestly about what happened — including their own errors — will not result in punitive consequences. If the last engineer who wrote a candid post-mortem was informally penalized, the next post-mortem will be sanitized.

Signals worth examining when discussing psychological safety:
- Engineers voluntarily report near-misses that had no customer impact
- Post-mortems include honest accounts of decisions that turned out to be wrong
- Action items call out organizational processes (not just individual behavior) as contributing factors
- Senior engineers are willing to have their decisions examined in post-mortems

Patterns that may warrant further investigation:
- Post-mortems consistently conclude with recommendations for "better testing" or "more careful review" rather than systemic changes
- Engineers are reluctant to be named in post-mortems even in neutral contexts
- Incidents in certain teams or involving certain systems are not post-mortemed

## The operational cadence

**Hold the post-mortem while the memory is fresh**: as soon as practical after significant incidents, allowing for responder recovery and evidence collection. Longer delays degrade the quality of the timeline and the specificity of contributing factor analysis.

**Separate the incident review from the action item review**: the post-mortem meeting is for understanding what happened. A follow-up meeting (2-4 weeks later) reviews whether action items were completed. Conflating these creates long, unfocused meetings.

**Make post-mortems searchable**: a post-mortem archive is an organizational memory for failure modes. Before implementing a new system or process, search the post-mortem archive. Many failure modes recur; previous incidents can inform current design decisions.

*Building or improving an incident response culture? The process design is less important than whether the environment supports honest review. [Happy to share what works and what doesn't.](/contact)*

## Reconstruct what was knowable at the time

An incident review should distinguish the information available during the event from information discovered afterward. A failed deployment may look obviously dangerous once its consequence is known, while the operator saw a green check and an apparently routine change. Record what the interface showed, which alerts had fired, and what the runbook said. This does not excuse every action; it makes the investigation capable of explaining behavior rather than merely judging it with hindsight.

Preserve evidence early, including timestamps, configuration versions, relevant logs, and the incident communication record. Keep sensitive data in approved locations and redact it from broadly shared reports. A timeline can include uncertainty: an event may be known to have occurred within a window rather than at an exact second. Do not invent precision to make the narrative look complete.

Ask participants to review the factual account. They may correct a timestamp, explain a misleading signal, or identify a decision that the log cannot capture. Separate that fact-checking from a debate about which action item is most attractive. Understanding the incident and choosing investments are related activities with different questions.

## Worked example: distinguish detection from restoration

Consider a hypothetical incident beginning at 10:00. Monitoring detects the problem at 10:08, responders mitigate customer impact at 10:35, and the service returns to its normal configuration at 11:00. Time to detection is eight minutes. Time from detection to mitigation is twenty-seven minutes. The remaining restoration phase is twenty-five minutes. The three intervals sum to sixty minutes from onset to normal operation.

The chart shows those distinct intervals. It does not label all sixty minutes as a single universal “recovery time,” because organizations define incident and deployment recovery metrics differently. The example is synthetic and excludes uncertainty about the true onset. In a real report, define each timestamp and the evidence supporting it. Customer impact may also vary during the event, so duration alone does not describe severity.

Suppose a proposed alert change reduces detection from eight minutes to two in a rehearsal. That is evidence about detection in the tested scenario, not proof that the entire incident would have ended six minutes sooner. Responders may have needed additional diagnostic information or a dependency may still have been unavailable. Keep the causal claim as narrow as the experiment supports.

## Turn contributing factors into testable improvements

A finding such as “the operator selected the wrong environment” is a starting observation. Examine why the environment was hard to distinguish, what permissions allowed the action, what confirmation existed, and whether a safer workflow was available. Several improvements may be possible: clearer context, scoped credentials, a reversible operation, or an automated precondition check. Choose based on the mechanism and the cost, not on a desire to produce a long list.

For each action, state the condition it is intended to change and how the team will verify that change. “Improve monitoring” is not testable. “Trigger the queue-age alert in a controlled test and verify that the on-call route receives it within the agreed window” is more concrete. An action can fail its verification even after the implementation ticket is closed.

Some findings justify further investigation rather than immediate code. Others may lead to an explicit risk acceptance when mitigation is disproportionate or creates a worse failure mode. Record the reasoning and revisit trigger. A review can produce valuable learning without creating a mandatory quota of tickets.

## Separate learning from personnel processes

A learning review should not become an improvised disciplinary hearing. If an organization has a concern about misconduct or a serious breach of an established duty, use the appropriate separate process with qualified people and fair procedures. Mixing those purposes without warning can make participants reluctant to provide the operational detail needed for learning.

Managers should demonstrate the behavior they expect by acknowledging uncertainty and examining organizational decisions, including staffing, deadlines, and tooling. Avoid demanding that the least powerful participant explain the whole incident alone. A facilitator can keep the discussion focused on mechanisms and ensure that quieter participants have a route to contribute.

The presence or absence of a single behavior does not diagnose psychological safety. Near-miss reporting, candid discussion, and willingness to ask for help are useful signals, but they depend on context and reporting mechanisms. Ask participants how the process worked for them and look for recurring patterns rather than assigning a cultural score from one meeting.

## A review worksheet and follow-up cadence

Prepare a concise record containing impact, timeline, evidence links, contributing conditions, successful adaptations, unresolved questions, and proposed actions. Define the incident severity using the organization's own criteria; labels such as P0 or P1 are not standardized across companies. State whether the report is a draft, fact-checked, or finalized, and keep later corrections visible.

Choose a review time that preserves useful memory while respecting responder recovery and evidence collection. A rigid deadline can be counterproductive after an exhausting event. Follow up on actions according to their risk and dependencies. The person accountable for progress may coordinate several contributors; ownership should clarify responsibility without implying that one person must do every task.

Search prior reviews for the same mechanism, then ask whether previous actions addressed it, were never completed, or were bypassed by a new path. Repeated incidents do not automatically mean people ignored the lesson. They may reveal that the original model was incomplete. The goal is a learning system that changes its explanations when new evidence arrives and verifies whether chosen improvements actually work.

## Sources and further reading

- [Google SRE · Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Workbook · Incident Response](https://sre.google/workbook/incident-response/)
- [Google SRE Workbook · On-Call](https://sre.google/workbook/on-call/)
