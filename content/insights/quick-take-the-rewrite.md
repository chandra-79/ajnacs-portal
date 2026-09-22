---
title: "The Big Rewrite: Why It Takes Twice as Long and Delivers Half as Much"
description: "The impulse to rewrite a complex legacy system is understandable. The outcomes of big rewrites are predictable and almost universally disappointing. Here is the pattern and the alternative."
date: 2025-12-08
tags: ["Software Engineering", "Engineering Leadership"]
format: article
---

The codebase is a mess. The team knows it. Every change takes too long because of the accumulated complexity. The proposal emerges: rewrite it. Start fresh. Do it right this time.

The proposal is appealing. The outcome is predictable.

## Why rewrites take twice as long

The original system, no matter how messy, encodes a large number of decisions about edge cases, business rules, and user behavior. These decisions exist in the code, in the database schema, in the implicit behavior that users have adapted to, and in the institutional knowledge of the team.

A rewrite starts from documentation — which is incomplete — and requirements — which miss the edge cases — and assumptions about the current system's behavior — which are wrong in ways that will be discovered one by one in production.

Every time a rewrite encounters a behavior from the old system that was not anticipated, it either takes extra time to replicate it or ships without it and discovers the consequence when users complain. The edge cases accumulate. The scope grows. The timeline extends.

The classic formulation: the 6-month rewrite takes 18 months. The team is confident at 6 months that they are almost done. They are not almost done. They are halfway through discovering the complexity that was invisible from the outside.

## Why it delivers half as much

While the rewrite team is rebuilding what already exists, the features that were supposed to come after the rewrite are not being built. The business need that motivated the rewrite — faster feature velocity — is not being served during the rewrite period.

The team also learns, by the time the rewrite completes, that the new system has its own technical debt. The constraints and trade-offs that produced the mess in the original system — time pressure, incomplete requirements, changing business needs — apply to the rewrite too. The new system is cleaner at inception. It will not stay clean indefinitely.

## The alternative

Incremental improvement with strangler fig patterns: identify the highest-pain parts of the system, replace them incrementally while keeping the rest running, and migrate consumers to the new implementation gradually. This is slower to get started and faster to deliver value, because delivery is happening continuously rather than at the end of a long rewrite.

The rewrite is sometimes the right call — when the system is so coupled that incremental replacement is not practical, or when a complete technology change is required. In those cases, the timeline needs to account for the discovery cost honestly.

The rewrite that is sold as a 6-month project should be estimated as 18 months. Then it should be questioned whether the 18 months is a better investment than incremental improvement.
