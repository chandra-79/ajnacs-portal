---
title: "A cloud migration checklist that stops before operational readiness is half a checklist."
description: "Cloud migrations are consistently evaluated against infrastructure and application checklists. Compute is provisioned, application is running, data is migrated, traffic is routing."
date: 2026-03-30
tags: ["Cloud Architecture", "Engineering Leadership"]
format: article
derived: true
---

Cloud migrations are consistently evaluated against infrastructure and application checklists. Compute is provisioned, application is running, data is migrated, traffic is routing. These are correct criteria for measuring whether the migration technical work is complete. They are insufficient criteria for measuring whether the migration is done.

The gap appears in the first post-migration incident. An application that ran on-premises for seven years has operational knowledge embedded in the team's muscle memory — which log file to check, which process to restart, what a specific error message means and how to resolve it, which vendor to call at 2am. That knowledge is correct for the old environment. It does not transfer to a cloud environment with a different logging structure, a different instance type, a different networking model, and a different support tier.

Operational readiness for a cloud migration requires explicit work. Runbooks need to be rewritten for the new environment, not updated with addenda. Monitoring needs to be reconfigured for cloud-native metrics that did not exist in the on-premises environment. Backup procedures need to be tested in the new environment because the restore procedure in a cloud context has different mechanics. Access controls need to be reviewed because the IAM model in a cloud environment is different from Active Directory roles in a data centre, and the migration is an opportunity for privilege creep to go unexamined.

The test for operational readiness: can the current on-call engineer resolve a representative set of production incidents in the new environment without the original migration team in the call? If the answer is not clearly yes, the migration is not complete. The application may be running. The team is not yet prepared to operate it.
