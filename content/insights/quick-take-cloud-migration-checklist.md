---
title: "What a Cloud Migration Checklist Misses: Operational Readiness"
description: "Most cloud migration checklists stop at technical completion — services moved, databases replicated, DNS cut over. Operational readiness is the part nobody puts on the checklist."
date: 2028-08-09
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
---

A cloud migration checklist has a natural finish line: the application is running in the cloud, the on-premises instances are off, the data is migrated, the traffic is routing correctly. Check every box. Migration complete.

Six months later, the team is fighting incidents they cannot diagnose, spending three times the projected cloud budget, and wishing they were back on-premises.

The technical migration worked. The operational readiness was not on the checklist.

## What operational readiness actually covers

**Observability in the new environment.** On-premises, teams often have institutional knowledge of what normal looks like. They know the baseline CPU, the expected query times, the traffic patterns. In the cloud environment, that knowledge does not exist yet. Before migrating traffic, you need baselines, dashboards, and alerts tuned to the new environment. Not copy-pasted from the old environment — tuned to the new one.

**Runbooks for cloud-specific failure modes.** On-premises systems also have software, identity, capacity and dependency failure modes. Cloud failure modes include availability zone disruptions, managed service degradations, API rate limits, quota exhaustion, and cost runaway. Some require new procedures, while others adapt existing operational controls. They need to be written for the new one before the migration, not after the first incident.

**Cost monitoring before go-live.** The first cloud bills should be reconciled against the forecast, with known overlap, usage and pricing assumptions visible. Implementing cost alerts, tagging everything correctly, and understanding the projected bill before go-live prevents the shock. Discovering a $40,000 overage in month two is not a learning experience; it is a crisis.

**Team knowledge transfer.** On-premises environments are often well-understood by a small group of long-tenured engineers. Cloud environments require the whole team to develop new operational knowledge — how to read CloudWatch or Azure Monitor, how to use the console for incident response, how managed services behave under failure. If this knowledge transfer does not happen before go-live, it happens during incidents.

**Rollback plan tested.** Every migration should have a rollback path that has been tested. Not documented. Tested. The ability to fail back to the known-working state within a defined time window is the most important risk control in a migration. If it has not been tested, its effectiveness remains unverified; record that uncertainty explicitly.

## The uncomfortable truth

A migration checklist that stops at technical completion is a completion document for the engineering team, not a readiness document for the operation. The two are different artifacts with different audiences. Write both.

## Make readiness a handover exercise with observable outcomes

A migration checklist should identify the person who will operate each new boundary after the migration team leaves. That includes provider support, identity administration, cost attribution, backup recovery and deployment control. Some existing runbooks will remain useful; validate and adapt them rather than assuming every old procedure is either obsolete or automatically transferable.

For a hypothetical service, define twelve representative operating tasks. The receiving team completes eight independently, two with help from the migration team and two not at all. Independent completion is 8/12 = 66.7%. That ratio is a handover signal, not a reliability score. One uncompleted restore task can block readiness even if eleven less consequential tasks pass.

Use the worksheet to record the task, its failure symptom, expected evidence, permitted action, owner and escalation route. Include reading an unfamiliar error, rolling back a deployment, restoring data into an isolated destination, rotating an application credential and investigating a cost increase. Ask the current on-call engineer to perform the task using documented access rather than borrowing the migration lead's credentials.

## Separate cutover from the point of no return

A rollback plan must describe what happens to writes accepted after traffic moves. If the old and new databases diverge, reversing DNS may create lost or conflicting work. Define a write freeze, replication strategy or reconciliation procedure appropriate to the application. Mark the moment when a simple reversal ceases to be safe and requires a different recovery decision.

In the rehearsal, use synthetic transaction IDs and compare the accepted set with the committed set after each transition. Test both an early abort and a later failure after new writes exist. Record elapsed recovery time, missing prerequisites and residual manual work. A rollback described in a document remains an assumption until the relevant path has been exercised; even a successful rehearsal has limits when production volume or external dependencies differ.

Finally, reconcile the target bill against the model using the same service boundary and activity volume. Cost alerts warn about selected thresholds; they do not guarantee that a bill will match the forecast or stop every runaway workload. Keep a defined stabilization period with owners for unresolved issues, and close the migration only when the receiving team can demonstrate the agreed operating responsibilities. That turns a handover meeting into evidence that the service can be sustained.

| Observation | Value (tasks) |
| --- | ---: |
| Independent | 8 |
| With help | 2 |
| Not completed | 2 |

**Figure method.** Synthetic twelve-task rehearsal: 8/12=66.7% independent completion. Tasks differ in criticality; a ratio cannot override a failed safety or recovery requirement.

## Further reading

- [Azure landing-zone architecture](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
