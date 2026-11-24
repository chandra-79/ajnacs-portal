---
title: "A cloud migration checklist that stops before operational readiness is half a checklist."
description: "Cloud migrations are consistently evaluated against infrastructure and application checklists. Compute is provisioned, application is running, data is migrated, traffic is routing."
date: 2028-12-29
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
derived: true
---

Cloud migrations are consistently evaluated against infrastructure and application checklists. Compute is provisioned, application is running, data is migrated, traffic is routing. These are correct criteria for measuring whether the migration technical work is complete. They are insufficient criteria for measuring whether the migration is done.

The gap appears in the first post-migration incident. An application that ran on-premises for seven years has operational knowledge embedded in the team's muscle memory — which log file to check, which process to restart, what a specific error message means and how to resolve it, which vendor to call at 2am. That knowledge is correct for the old environment. It does not transfer to a cloud environment with a different logging structure, a different instance type, a different networking model, and a different support tier.

Operational readiness for a cloud migration requires explicit work. Runbooks need to be rewritten for the new environment, not updated with addenda. Monitoring needs to be reconfigured for cloud-native metrics that did not exist in the on-premises environment. Backup procedures need to be tested in the new environment because the restore procedure in a cloud context has different mechanics. Access controls need to be reviewed because the IAM model in a cloud environment is different from Active Directory roles in a data centre, and the migration is an opportunity for privilege creep to go unexamined.

The test for operational readiness: can the current on-call engineer resolve a representative set of production incidents in the new environment without the original migration team in the call? If the answer is not clearly yes, the migration is not complete. The application may be running. The team is not yet prepared to operate it.

## Have the receiving team prove the new incident path

A migration handover should transfer evidence and authority as well as documentation. An experienced responder may know the application's symptoms while needing different credentials, dashboards or support routes in the target environment. Preserve valid knowledge and test the changed boundaries explicitly rather than rewriting every procedure solely for the sake of migration.

In an illustrative rehearsal, a team resolves six of eight selected incidents without the migration engineers. One requires an undocumented permission and another depends on a missing dashboard. Independent completion is 75%, but the two gaps need individual severity assessment. A failure to restore data can block readiness even when a less important troubleshooting task succeeds quickly.

Create a worksheet with scenario, expected symptom, necessary access, diagnostic source, safe action and completion evidence. Choose incidents across identity, quota, dependency timeout and recovery rather than eight variations of the same simple restart. Use synthetic data and an isolated environment where feasible.

Ask a second responder to repeat the failed paths after corrections. Record which steps still require specialist assistance and who supplies it after handover. Include provider-support entitlement and contact procedures, because a support contract is useful only if the on-call team can invoke it. This makes operational readiness a specific capability test rather than an assertion that running successfully once means the migration is finished.

| Observation | Value (scenarios) |
| --- | ---: |
| Independent recovery | 6 |
| Permission gap | 1 |
| Dashboard gap | 1 |

**Figure method.** Synthetic eight-scenario rehearsal: 6/8=75% independent completion. Scenario criticality and representativeness limit interpretation of the aggregate.

## Further reading

- [Azure landing-zone architecture](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/landing-zone/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
