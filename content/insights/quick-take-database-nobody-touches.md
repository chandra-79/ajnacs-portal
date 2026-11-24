---
title: "The Database Nobody Touches Contains the Most Critical Data"
description: "Reduce uncertainty around a legacy database through ownership, dependency mapping, restore evidence and small reversible changes."
date: 2028-11-10
tags: ["Data Engineering", "Engineering Leadership"]
format: article
---

The database has been running in production for eight years. Nobody knows all the tables it contains. The original engineers have left. The schema has grown through 200 migrations, half of which were applied manually and not tracked. The application that uses it has been rewritten twice but the database was left alone because "it works and nobody wants to touch it."

This database contains the customer transaction history for the entire company. It is the most critical data the organization has. It is also the most fragile infrastructure it runs.

## Why critical databases become untouchable

The untouchable database is the product of compounding risk aversion. Each decision not to migrate, refactor, or document it was individually reasonable. Together they produce a system where the operational risk of leaving it unchanged is lower than the perceived risk of touching it — until it breaks.

**Knowledge concentration then departure.** The engineers who understood the database left. The database continued running without them because it was stable. The institutional knowledge was never transferred because there was no urgency.

**Accumulated undocumented behavior.** Over years of additions, some of the tables have undocumented behavior — foreign key constraints that are enforced in application code rather than the database, tables that are populated by scheduled jobs that nobody has reviewed in years, indexes that were added for performance and whose absence would cause dramatic slowdowns.

**Migration risk that compounds with time.** Every day the database runs in the current state, more application code accumulates that depends on the current schema. A migration that would have taken two weeks two years ago now takes two months because the dependencies are everywhere.

## The minimum viable investment

Full documentation requires understanding the database in depth, which requires time and expertise. The minimum viable investment:

**Entity-relationship documentation.** Tables, columns, data types, foreign keys, primary keys. This takes a day and prevents the most fundamental confusion.

**Query documentation.** Which tables are read by which application code paths. This takes a week and enables impact assessment for schema changes.

**Performance baseline.** Which queries consume the most resources. This takes an hour (pg_stat_statements or equivalent) and enables proactive intervention before a performance crisis.

**A named owner.** One person responsible for knowing the state of the database and coordinating any work on it.

The untouchable database does not need to be perfect. It needs to stop being undocumented. Documentation is the first step toward any other improvement.

## Make recovery an observable capability

A database can appear stable because nobody changes it, while credentials, dependencies and recovery assumptions quietly become obsolete. The first improvement should reduce uncertainty. Inventory access and rehearse recovery before attempting a broad redesign.

In a fictional restore exercise, retrieving the backup takes 15 minutes, restoring the database takes 35 minutes and application validation takes 20 minutes. The system becomes usable after 70 minutes. Reporting a 35-minute restore would omit half the actual service-recovery work. The chart separates the components and leaves the recovery objective to the application's requirements.

## Discover the consumers you would otherwise surprise

Collect permitted connection metadata over a representative business cycle. Include scheduled reports, integrations, batch jobs and administrative scripts. Match identities to owners and record whether each consumer reads, writes or changes schema. Avoid assuming that a quiet week reveals a monthly or quarterly dependency.

Inspect how credentials and schema knowledge are distributed. A shared account can conceal several consumers; rotating it safely may require first separating those identities. A stored procedure may be called by an external scheduler with no entry in the application repository. The inventory should capture evidence and unknowns instead of pretending the system is fully understood after a single scan.

## Rehearse a narrow change and its reversal

Choose one low-risk improvement with an identifiable consumer, such as documenting a scheduled job or replacing an unused index after a measured review. Test against an isolated copy with representative behavior. Compare the business outputs before and after the change, not only whether the application starts.

Record the reversal route and the point beyond which reversal needs data repair. A schema rollback does not automatically restore data transformed by a migration. Keep backup restoration and application validation as separate steps in the runbook, with the credentials and dependencies required for each. Test that someone other than the original author can follow it.

A useful ownership record names the service owner, technical custodian, backup operator and escalation route. It includes the last successful restore, the latest recoverable point and known dependency gaps. These are concrete capabilities that make future maintenance safer. A long document without tested recovery and current owners can leave the database just as untouchable as before.

### Figure methodology

Synthetic recovery exercise.15+35+20=70 minutes to usable service. Database restore time alone is 35 minutes. The example does not specify an RPO or establish a production recovery objective.

| Worked observation | minutes |
| --- | ---: |
| Retrieve backup | 15 |
| Restore database | 35 |
| Validate application | 20 |

## Primary references and further study

- [PostgreSQL backup and recovery](https://www.postgresql.org/docs/current/backup.html)
- [PostgreSQL locking and changes](https://www.postgresql.org/docs/current/explicit-locking.html)
