---
title: "Why Data Ownership Is the Hardest Part of Data Governance"
description: "Every data governance framework names data owners. Almost none of them explain what ownership actually means in practice — or what happens when the named owner changes roles."
date: 2028-07-07
tags: ["Data Engineering", "Engineering Leadership"]
format: article
---

The data governance framework is published. Every dataset has a named owner. The catalog is populated. The documentation is written. The project is considered complete.

Eighteen months later, the named owner has changed roles, nobody has maintained the documentation, and when the next major data quality issue surfaces, the answer to "who owns this data?" produces a room full of people pointing at each other.

## What data ownership actually requires

Ownership of a dataset is not a title on a spreadsheet. It is an operational commitment that includes:

**Fitness for purpose.** The owner understands what this data is used for, by whom, and in what systems. They are responsible for ensuring it remains fit for those uses — that quality standards are maintained, that schema changes do not silently break downstream consumers.

**Quality accountability.** When data quality degrades, the owner is the first call. Not because they caused the problem, but because they are responsible for diagnosis and resolution — whether that means fixing the source system, communicating to consumers, or establishing a remediation timeline.

**Access governance.** The owner approves or delegates the approval of access requests to the data. This requires knowing the sensitivity of the data and having a clear policy for who should have access under what conditions.

**Lifecycle decisions.** The owner decides when data is archived, when it is deleted, and what retention policy applies. This requires understanding both the business need for the data and the legal/compliance requirements around it.

These are not administrative tasks. They are ongoing operational responsibilities. Assigning them to a person who does not have the time, context, or authority to fulfill them produces nominal ownership with no practical accountability.

## The rotation problem

Data ownership tied to individuals rather than to roles fails whenever the individual changes positions. The institutional knowledge that made the person a sensible owner — knowing why the data model was designed the way it was, knowing which consumers are sensitive to changes — does not automatically transfer to the new owner.

The governance framework that survives personnel changes is built around role-based ownership with documented context rather than person-based ownership with tacit knowledge. The documentation carries what the owner carries, and the documentation outlasts the owner.

## The honest starting point

Most organizations do not have the capacity to implement full data ownership across every dataset simultaneously. The honest approach is to start with the data that causes the most pain when it is wrong — the revenue-affecting datasets, the compliance-sensitive data, the tables that three teams depend on — and build ownership practices there first.

Governance that covers 20% of the data with genuine accountability is more valuable than governance that nominally covers 100% with none.
