---
title: "MTTR Is a Leadership Metric Before It Is an Engineering Metric"
description: "Mean time to recovery is shaped as much by organizational factors — who can make deployment decisions at 2am, how escalations work, what authority the on-call engineer has — as by technical ones."
date: 2028-10-11
tags: ["Observability", "Engineering Leadership", "Resilience"]
format: article
---

MTTR (Mean Time to Recovery) measures how long it takes to restore a system from the moment an incident starts. It is one of the four DORA metrics and a standard measure of operational health.

It is also a metric where the limiting factor is often not the technology.

## The technical contributors to MTTR

Observability quality — can the on-call engineer quickly understand what is wrong? Deployment speed — how fast can a fix be deployed once identified? Blast radius — are there circuit breakers, feature flags, or canary deployments that limit the scope of a failure? These are engineering problems with engineering solutions.

Good observability, fast deployments, and limited blast radius compress MTTR in the pure technical case.

## The organizational contributors

**Escalation friction.** The on-call engineer identifies the problem and knows the fix. The fix requires a database schema change. The DBA team is asleep. The engineer does not have the access to make the change. The incident continues.

Escalation paths that require waking up a specific person to make a change — because only that person has the authority or the access — add directly to MTTR. Every escalation step is 10–30 minutes of investigation, communication, and handoff.

**Decision authority on-call.** The on-call engineer can see the problem and knows that the fastest fix is to roll back the last deployment. Do they have the authority to roll back without approval? If the answer is no, or if the answer is "yes but I would want to check with the team lead first," then MTTR includes the time to reach the team lead at 3am.

**Runbook quality.** The on-call engineer encounters an incident type that has happened before. Is there a runbook? Is the runbook current? Is the runbook specific enough to be actionable without prior knowledge of the system? Runbooks that say "investigate and escalate as appropriate" are not runbooks. They are acknowledgements that a runbook should exist.

**Post-incident follow-through.** MTTR for recurring incident types does not improve unless recurring incidents are addressed at the root cause level. Post-mortems that produce action items that are then deprioritized produce systems that recover at the same speed from the same failures indefinitely.

## The leadership response

If MTTR is consistently above target, look at the organizational factors before assuming the technical ones are the constraint. Who has authority to take what actions at what hours? Are the runbooks real? Are post-mortem actions getting resolved?

The engineering team that builds excellent observability but operates under decision latency and escalation friction will have poor MTTR. The technology is not the bottleneck.
