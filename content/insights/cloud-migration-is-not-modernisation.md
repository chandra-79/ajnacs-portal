---
title: "Lifting and shifting to the cloud is relocation, not modernisation"
description: "Lift-and-shift is a legitimate cloud migration strategy. But when organizations call it \"cloud transformation,\" they're setting expectations that a server relocation cannot meet."
date: 2029-04-09
tags: ["Cloud Architecture", "Infrastructure"]
format: note
derived: true
---

Lift-and-shift is a legitimate cloud migration strategy. But when organizations call it "cloud transformation," they're setting expectations that a server relocation cannot meet.

Moving a VM to Azure IaaS changes hardware responsibility and billing. Geographic redundancy requires an explicit multi-location design; it is not provided merely by relocating one VM. It does not give you: elastic scaling, managed service economics, modern observability, or the operational agility that cloud-native architectures enable.

Lift-and-shift has real use cases. Data centre exits with hard deadlines. Legacy applications where the refactoring risk exceeds the value of modernisation. A deliberate first step before a planned re-architecture. In these contexts it's the right call.

The problem is when it becomes the destination rather than a waypoint. A VM migration preserves many application characteristics while changing the infrastructure and operating context. Compare full costs and update procedures; a cost increase is not inevitable and owned hardware is not free to operate.

The modernisation work — infrastructure as code, shift to managed services, event-driven architecture, automated testing, observability — that's what changes how a team operates. That work doesn't happen automatically when you change where the server runs.

Cloud transformation includes operational and architectural changes. A physical infrastructure move may be one workstream, but is not a universal prerequisite for improving delivery or reliability.

## Use a two-stage scorecard for the same workload

A hypothetical migration moves 40 scheduled jobs to a new host without changing their logic. Thirty-eight finish correctly in the first rehearsal and two fail because of timezone assumptions. The relocation acceptance rate is 38/40 = 95%, so the cutover still needs correction. A later modernization replaces ten polling jobs with event-driven consumers; that is a different intervention with different tests.

For the worksheet, list each job's trigger, timezone, input boundary, completion evidence and downstream effects. Replay a daylight-saving transition or equivalent clock-boundary fixture where relevant. Compare business outputs rather than only exit codes. A successful process can still produce the wrong reporting period.

Keep the relocation gate focused on equivalent behavior, recoverability and the new operating procedures. Evaluate the event-driven change for delivery semantics, duplicate handling, ordering and operational cost per completed job. Moving a server does not automatically provide geographic redundancy or raise cost; both depend on the chosen design. Reporting the stages separately makes it possible to meet a facility-exit deadline while preserving an honest account of which product and engineering capabilities have actually improved.

| Observation | Value (jobs) |
| --- | ---: |
| Scheduled jobs | 40 |
| Correct outputs | 38 |
| Timezone failures | 2 |

**Figure method.** Synthetic rehearsal: 38 correct+2 failed=40 jobs; correctness rate=38/40=95%. Later redesign needs separate acceptance criteria.

## Further reading

- [Azure landing-zone architecture](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
