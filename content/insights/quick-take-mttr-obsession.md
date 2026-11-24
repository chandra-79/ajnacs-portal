---
title: "MTTR Is a Leadership Metric Before It Is an Engineering Metric"
description: "Mean time to recovery is shaped as much by organizational factors — who can make deployment decisions at 2am, how escalations work, what authority the on-call engineer has — as by technical ones."
date: 2028-10-11
tags: ["Observability", "Engineering Leadership", "Resilience"]
format: article
---

MTTR (Mean Time to Recovery) measures how long it takes to restore a system from the moment an incident starts. Related recovery metrics appear in software-delivery measurement frameworks, but their scope and definitions differ. Define the population and timing boundaries before comparing results.

It is also a metric where the limiting factor is often not the technology.

## The technical contributors to MTTR

Observability quality — can the on-call engineer quickly understand what is wrong? Deployment speed — how fast can a fix be deployed once identified? Blast radius — are there circuit breakers, feature flags, or canary deployments that limit the scope of a failure? These are engineering problems with engineering solutions.

Good observability, fast deployments, and limited blast radius compress MTTR in the pure technical case.

## The organizational contributors

**Escalation friction.** The on-call engineer identifies the problem and knows the fix. The fix requires a database schema change. The DBA team is asleep. The engineer does not have the access to make the change. The incident continues.

Escalation paths that require waking up a specific person to make a change — because only that person has the authority or the access — add directly to MTTR. Each escalation can add investigation, communication and handoff delay; measure that delay from the actual incident timeline.

**Decision authority on-call.** The on-call engineer can see the problem and knows that the fastest fix is to roll back the last deployment. Do they have the authority to roll back without approval? If the answer is no, or if the answer is "yes but I would want to check with the team lead first," then MTTR includes the time to reach the team lead at 3am.

**Runbook quality.** The on-call engineer encounters an incident type that has happened before. Is there a runbook? Is the runbook current? Is the runbook specific enough to be actionable without prior knowledge of the system? Runbooks that say "investigate and escalate as appropriate" are not runbooks. They are acknowledgements that a runbook should exist.

**Post-incident follow-through.** MTTR for recurring incident types does not improve unless recurring incidents are addressed at the root cause level. Post-mortems that produce action items that are then deprioritized produce systems that recover at the same speed from the same failures indefinitely.

## The leadership response

If MTTR is consistently above target, look at the organizational factors before assuming the technical ones are the constraint. Who has authority to take what actions at what hours? Are the runbooks real? Are post-mortem actions getting resolved?

The engineering team that builds excellent observability but operates under decision latency and escalation friction will have poor MTTR. The technology is not the bottleneck.

## Separate elapsed recovery from the work inside it

“MTTR” is used for several different measures, including repair, recovery and resolution. State the start and end events before comparing teams or quarters. A deployment recovery measure is narrower than recovery from every kind of incident. Treat the acronym as a prompt to define the measurement, not as a universal standard that makes unlike incidents comparable.

Use an illustrative incident timeline: customer impact begins at 10:00, detection occurs at 10:06, the responder identifies a reversible mitigation at 10:14, authorization arrives at 10:32, and service validation finishes at 10:40. Impact-to-recovery is 40 minutes. Its components are six minutes to detection, eight to diagnosis, eighteen waiting for authorization and eight for execution plus validation. The chart preserves those boundaries rather than labeling all 40 minutes “engineering response.”

The most obvious intervention is not necessarily removing approval. If the action can delete data or violate an external obligation, a second check may be justified. Instead, pre-authorize a bounded rollback where prerequisites are satisfied, document who can approve an exception and make emergency access available through an audited process. That turns ambiguous authority into an explicit control.

## Review a distribution, not a hero story

Build a worksheet for the last set of comparable incidents with impact start, detection, mitigation decision, action and validation timestamps. Mark inferred timestamps separately from recorded ones. Include ongoing incidents in the report rather than quietly excluding them because their end time is unavailable. Report sample size and a distribution or ordered list alongside an average; a few rare long incidents can dominate a mean.

Rehearse the example with an on-call colleague who did not write the runbook. Give them the documented symptom and require them to identify whether rollback is safe with the current schema. Observe elapsed waiting, handoffs and unavailable credentials. Stop the exercise if it approaches real customer impact; a tabletop can reveal authority problems before a production drill is appropriate.

Finally, track the action that removes the delay and repeat the same bounded scenario. A shorter exercise is evidence about that procedure, not proof that all future incidents will recover faster. Preserve incident severity and affected-user duration so pressure to improve a single metric does not encourage premature closure or hide a wider outage.

| Observation | Value (minutes) |
| --- | ---: |
| Detection | 6 |
| Diagnosis | 8 |
| Authorization | 18 |
| Action and validation | 8 |

**Figure method.** Synthetic timeline from 10:00 to 10:40: 6+8+18+8=40 minutes. Boundaries must be recorded consistently; one exercise cannot predict all incident recovery times.

## Further reading

- [Google SRE incident response](https://sre.google/workbook/incident-response/)
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
