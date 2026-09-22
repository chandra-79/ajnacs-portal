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

**Runbooks for cloud-specific failure modes.** On-premises failure modes are hardware and network. Cloud failure modes include availability zone disruptions, managed service degradations, API rate limits, quota exhaustion, and cost runaway. None of these appear in the runbooks written for the old environment. They need to be written for the new one before the migration, not after the first incident.

**Cost monitoring before go-live.** The cloud bill in the first month after migration is always a surprise, and it is rarely a pleasant one. Implementing cost alerts, tagging everything correctly, and understanding the projected bill before go-live prevents the shock. Discovering a $40,000 overage in month two is not a learning experience; it is a crisis.

**Team knowledge transfer.** On-premises environments are often well-understood by a small group of long-tenured engineers. Cloud environments require the whole team to develop new operational knowledge — how to read CloudWatch or Azure Monitor, how to use the console for incident response, how managed services behave under failure. If this knowledge transfer does not happen before go-live, it happens during incidents.

**Rollback plan tested.** Every migration should have a rollback path that has been tested. Not documented. Tested. The ability to fail back to the known-working state within a defined time window is the most important risk control in a migration. If it has not been tested, it does not exist.

## The uncomfortable truth

A migration checklist that stops at technical completion is a completion document for the engineering team, not a readiness document for the operation. The two are different artifacts with different audiences. Write both.
