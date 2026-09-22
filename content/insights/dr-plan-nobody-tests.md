---
title: "An untested disaster recovery plan is a fiction document"
description: "Every DR plan has an RTO and an RPO. Most of them are estimates based on theory, not measurements based on practice."
date: 2029-04-11
tags: ["Cloud Architecture", "Disaster Recovery", "Resilience"]
format: note
derived: true
---

Every DR plan has an RTO and an RPO. Most of them are estimates based on theory, not measurements based on practice.

The last time most organizations actually tested their DR was either never, or during an initial setup exercise that predates the current architecture by several years. Since then: teams have changed, dependencies have been added, databases have grown, and the runbook has drifted from the system it describes.

An untested DR plan is a document that describes how you think the failover will go. It is not a DR plan. The difference matters enormously when you actually need it.

The tests most organizations avoid:
- **Full regional failover** with production traffic, not a test clone
- **Database restore from backup** — timed, with the current database size
- **DNS cutover** under monitoring, with rollback rehearsed
- **Incident response** with your current on-call team, not whoever wrote the runbook

The resistance is understandable. Planned failover exercises carry risk, require coordination, and consume engineering time. But the cost of a planned exercise is a maintenance window. The cost of discovering your DR assumptions are wrong during an actual incident is measured in hours of revenue loss, reputation damage, and very difficult conversations.

Test your DR. Document what breaks. Fix it before you need it.
