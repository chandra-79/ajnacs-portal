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

**Severity definition**: not all incidents are equal. A severity classification (P0 = immediate customer impact; P1 = degraded but functional; P2 = minor issue) helps calibrate the depth of investigation and the expected response time.

## The environment that makes blameless possible

Blameless post-mortems require psychological safety. Engineers must believe that reporting honestly about what happened — including their own errors — will not result in punitive consequences. If the last engineer who wrote a candid post-mortem was informally penalized, the next post-mortem will be sanitized.

The signals that indicate psychological safety exists:
- Engineers voluntarily report near-misses that had no customer impact
- Post-mortems include honest accounts of decisions that turned out to be wrong
- Action items call out organizational processes (not just individual behavior) as contributing factors
- Senior engineers are willing to have their decisions examined in post-mortems

The signals that indicate it doesn't:
- Post-mortems consistently conclude with recommendations for "better testing" or "more careful review" rather than systemic changes
- Engineers are reluctant to be named in post-mortems even in neutral contexts
- Incidents in certain teams or involving certain systems are not post-mortemed

## The operational cadence

**Hold the post-mortem while the memory is fresh**: 24-72 hours after resolution for significant incidents. Longer delays degrade the quality of the timeline and the specificity of contributing factor analysis.

**Separate the incident review from the action item review**: the post-mortem meeting is for understanding what happened. A follow-up meeting (2-4 weeks later) reviews whether action items were completed. Conflating these creates long, unfocused meetings.

**Make post-mortems searchable**: a post-mortem archive is an organizational memory for failure modes. Before implementing a new system or process, search the post-mortem archive. Many failure modes recur; previous incidents can inform current design decisions.

*Building or improving an incident response culture? The process design is less important than whether the environment supports honest review. [Happy to share what works and what doesn't.](/contact)*
