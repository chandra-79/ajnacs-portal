---
title: "The Big Rewrite: Estimate the Migration, Not Just the New Code"
description: "Account for hidden behaviours, coexistence, data migration, and retirement before committing to a replacement."
date: 2028-11-03
tags: ["Software Engineering", "Engineering Leadership"]
format: article
---

The codebase is a mess. The team knows it. Every change takes too long because of the accumulated complexity. The proposal emerges: rewrite it. Start fresh. Do it right this time.

The proposal is appealing. Its outcome depends on how much behaviour and migration work the team has identified.

## Why rewrite estimates can expand

The original system, no matter how messy, encodes a large number of decisions about edge cases, business rules, and user behavior. These decisions exist in the code, in the database schema, in the implicit behavior that users have adapted to, and in the institutional knowledge of the team.

A rewrite starts from documentation — which is incomplete — and requirements — which miss the edge cases — and assumptions about the current system's behavior — which are wrong in ways that will be discovered one by one in production.

Every time a rewrite encounters a behavior from the old system that was not anticipated, it either takes extra time to replicate it or ships without it and discovers the consequence when users complain. The edge cases accumulate. The scope grows. The timeline extends.

A plan that budgets only visible features can underestimate the work of discovering compatibility rules, moving data, and supporting both implementations.

## Why the opportunity cost matters

While the rewrite team is rebuilding what already exists, the features that were supposed to come after the rewrite are not being built. The business need that motivated the rewrite — faster feature velocity — is not being served during the rewrite period.

The team also learns, by the time the rewrite completes, that the new system has its own technical debt. The constraints and trade-offs that produced the mess in the original system — time pressure, incomplete requirements, changing business needs — apply to the rewrite too. The new system is cleaner at inception. It will not stay clean indefinitely.

## The alternative

Incremental improvement with strangler fig patterns: identify the highest-pain parts of the system, replace them incrementally while keeping the rest running, and migrate consumers to the new implementation gradually. This is slower to get started and faster to deliver value, because delivery is happening continuously rather than at the end of a long rewrite.

The rewrite is sometimes the right call — when the system is so coupled that incremental replacement is not practical, or when a complete technology change is required. In those cases, the timeline needs to account for the discovery cost honestly.

Compare a full replacement with incremental options using explicit discovery, coexistence, migration, and retirement work. Do not turn an anecdotal schedule multiplier into an estimate.

## Replace the multiplier with a discovery model

“Twice as long” is a warning about uncertainty, not an empirical law. A responsible estimate describes known migration work, uncertain behaviours, coexistence effort, and the evidence that could change the range. Multiplying every proposal by a fixed number is no substitute for understanding what the system actually does.

For a fictional invoice migration, an initial inventory contains 40 workflows. A review of support cases finds 12 exception paths and reconciliation reveals eight batch dependencies. There are now 60 identified behaviours, 50% more than the original 40. That does not automatically increase elapsed time by 50%: behaviours differ in complexity, some may be retired, and dependencies can affect sequencing. The chart records the inventory categories so the source of scope growth is visible.

Classify each behaviour as retain, change deliberately, or retire. A replacement should not reproduce an obsolete workaround just because it exists, but retirement needs an accountable business decision. Record which downstream consumers or regulatory obligations constrain the choice. Technical elegance does not determine whether an old rounding rule can be removed.

## Build one complete migration slice

Choose a small capability with observable inputs and outputs. Capture representative cases, including the awkward ones: duplicate requests, cancellation, partial failure, late updates, and historical records. Compare the old and new results in an isolated replay before allowing the new path to create real side effects. A test that sends the same charge through both implementations would create the very problem it is meant to detect.

Decide which system owns writes during coexistence. If both can write, explain conflict resolution and recovery after one side is unavailable. A routing layer alone does not solve dual-write consistency. Prefer one authoritative writer per record or capability while the migration proceeds, unless a more complex strategy has a tested justification.

Define the rollback boundary carefully. Reverting traffic is useful only if the old system can interpret data created by the new path, or if there is a reconciliation procedure. Rehearse the recovery with a small synthetic dataset and retain the evidence. A green deployment pipeline is not evidence that a data migration is reversible.

## Fund removal as part of the project

A migration is incomplete while the old path still carries unowned integrations, scheduled jobs, or credentials. Assign work for consumer cutover, data retention, archive access, and removal of unused infrastructure. Track the number of behaviours safely retired alongside the number implemented.

Use the first complete slice to revise the estimate for later slices. Identify which work was reusable and which was specific to that capability. If the pilot reveals no safe boundary, a larger replacement may be justified, but that conclusion now rests on tested constraints. The objective is a supported system that meets its obligations, not an impressive percentage of code rewritten.

## Further reading and source boundaries

- [Martin Fowler: Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
