---
title: "An untested disaster recovery plan is a fiction document"
description: "Every DR plan has an RTO and an RPO. Most of them are estimates based on theory, not measurements based on practice."
date: 2029-04-11
tags: ["Cloud Architecture", "Disaster Recovery", "Resilience"]
format: note
derived: true
---

A DR plan should state recovery-time and recovery-point objectives and distinguish targets from demonstrated results. A documented objective remains unverified until the relevant recovery path is exercised under recorded conditions.

The last time most organizations actually tested their DR was either never, or during an initial setup exercise that predates the current architecture by several years. Since then: teams have changed, dependencies have been added, databases have grown, and the runbook has drifted from the system it describes.

An untested DR plan is a document that describes how you think the failover will go. It is not a DR plan. The difference matters enormously when you actually need it.

The tests most organizations avoid:
- **Full regional failover** with production traffic, not a test clone
- **Database restore from backup** — timed, with the current database size
- **DNS cutover** under monitoring, with rollback rehearsed
- **Incident response** with your current on-call team, not whoever wrote the runbook

The resistance is understandable. Planned failover exercises carry risk, require coordination, and consume engineering time. But the cost of a planned exercise is a maintenance window. The cost of discovering your DR assumptions are wrong during an actual incident is measured in hours of revenue loss, reputation damage, and very difficult conversations.

Test your DR. Document what breaks. Fix it before you need it.

## Test the restore chain without assuming the document is evidence

Begin with a controlled restore into an isolated destination. A full production failover is not the only useful exercise and may be inappropriate before smaller recovery steps are proven. Record prerequisites such as encryption keys, backup permissions, capacity and the artifacts needed to start the application. A backup that exists but cannot be decrypted is not a demonstrated recovery path.

In an illustrative drill, provisioning takes 12 minutes, data restoration takes 38 and validation takes ten. Sequential elapsed time is 60 minutes against a 75-minute objective, leaving 15 minutes of headroom. The result applies to that dataset, environment and procedure; larger data or unavailable control-plane access may change it.

The lab worksheet should record backup creation time, last verified business record, start and completion timestamps, integrity checks and manual interventions. Confirm the recovered application can perform the important transaction, not merely open a database connection. Have a responder unfamiliar with the original setup follow the instructions. Fix missing steps, repeat the failed portion and retain the evidence. An untested plan remains a plan with unverified assumptions; a successful drill strengthens specific claims without guaranteeing recovery in every incident.

| Observation | Value (minutes) |
| --- | ---: |
| Provision | 12 |
| Restore data | 38 |
| Validate | 10 |
| Objective headroom | 15 |

**Figure method.** Synthetic sequential drill=12+38+10=60 minutes; objective=75; headroom=15. Data size, prerequisites and application validation constrain generalization.

## Further reading

- [AWS disaster-recovery planning](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/plan-for-disaster-recovery-dr.html)
- [PostgreSQL recovery mechanics](https://www.postgresql.org/docs/current/continuous-archiving.html)
