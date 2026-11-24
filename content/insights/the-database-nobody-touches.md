---
title: "Make an Untouchable Database Understandable and Recoverable"
description: "Plan a legacy-database assessment through dependency evidence, restoration drills and staged changes, without relying on undocumented confidence."
date: 2029-03-02
tags: ["Data Engineering", "Engineering Leadership"]
format: article
derived: true
---

Consider a hypothetical legacy database that a team is reluctant to modify. It's old. It has stored procedures that reach into systems whose original developers have long since moved on. The schema has no documentation, or documentation that was accurate in 2017 and hasn't been touched since. It runs on hardware that's been in "extended support" for years.

And it contains the most business-critical data in the organization. Naturally.

The risk compounds every year it stays in this state. New code gets written that depends on it. More stored procedures accumulate. The engineers who held its history in their heads leave, taking the tribal knowledge with them. The migration gets scheduled and descoped and rescheduled and descoped again, because the risk is always too high when the moment arrives.

The way out is not a big-bang migration — that's exactly the kind of project that gets cancelled. It's an incremental strangler:

First, document what you know. Even incomplete documentation of the access patterns, the key stored procedures, and the integration points is more than you have now. Second, instrument it. You need to understand actual query patterns before you can migrate anything safely. Third, stop adding to it. New features get built on a new data store, even if migration of existing data takes years. Fourth, migrate in seams — identify the most self-contained parts and migrate those first, building confidence and methodology before touching the critical core.

The cost of leaving it alone is not zero. It defers and compounds.

## Establish a reversible first change

A poorly understood database should be approached through evidence about its dependencies and recovery path. A large rewrite can combine too many unknowns: hidden jobs, undocumented consumers, inconsistent data and a backup process nobody has exercised. Start with a change small enough to learn from without changing business meaning.

In a fictional assessment, 40 application or reporting connections appear in a sampled week. Owners can explain 28; 12 remain unverified. That is 70% owner coverage within the observed sample, not proof that all consumers have been discovered. Month-end jobs and dormant recovery paths may be absent. The figure keeps verified and unresolved connections separate so the discovery work does not disappear behind an average.

## Use a discovery and recovery worksheet

Record each connection identity, access pattern, operational owner, expected frequency and authentication method. Correlate the observation with application inventories and scheduled jobs. Classify writes separately from reads. Ask what happens if a credential is rotated, a table changes or the database becomes unavailable. Avoid collecting query parameters containing personal or confidential values when aggregate metadata is sufficient.

Restore a permitted backup into an isolated test environment using a documented procedure. Measure the time to a usable application and verify selected business invariants, not merely whether the database process starts. Record the latest recoverable transaction and what input would be required to repair the remaining gap. A backup file without a successful restore test is an untested recovery assumption.

Only then choose a narrow maintenance action such as documenting one scheduled job, replacing one obsolete credential or adding one validated index. Preserve its rollback path and monitor the known consumers. The project can expand after each step produces new evidence. The aim is to make ownership and recovery ordinary enough that the next necessary change does not become another exceptional event.

### Figure methodology

Synthetic one-week inventory of 40 observed connections. 28/40 = 70% verified ownership in the sample. Periodic and dormant consumers may be missing; the result is not a complete estate inventory.

| Worked observation | connections |
| --- | ---: |
| Owner verified | 28 |
| Owner unresolved | 12 |

## Primary references and further study

- [PostgreSQL backup and recovery](https://www.postgresql.org/docs/current/backup.html)
- [PostgreSQL locking behavior](https://www.postgresql.org/docs/current/explicit-locking.html)
