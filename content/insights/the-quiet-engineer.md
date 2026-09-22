---
title: "The quiet engineer who fixes things before they break is underrated in every performance review."
description: "Engineering recognition systems have a structural bias toward reactive work."
date: 2025-08-26
tags: ["Engineering Leadership"]
format: article
---

Engineering recognition systems have a structural bias toward reactive work. An incident that causes customer impact, is resolved through skilled technical work, and results in a postmortem with action items is visible, measurable, and narratively compelling. The engineer who resolves it is named, thanked, and remembered.

The engineer who noticed three weeks earlier that a database index was missing on a query that would degrade severely under the traffic volumes the marketing team's upcoming campaign would generate, added the index, and prevented the incident entirely — that engineer is invisible. Their work appears nowhere in incident metrics, nowhere in on-call response records, nowhere in the systems that track engineering performance.

This asymmetry shapes behaviour over time. Engineers who are evaluated by visible impact learn that visible impact comes from resolving visible problems. Prevention work — careful observation, maintenance, proactive investment in system health — produces no narrative. The incentive structure creates the production environment it deserves.

Organisations that have genuinely addressed this make prevention work visible through explicit practice. They track leading indicators alongside lagging ones — deployment error rates, cache hit ratios, database query performance trends — and recognise engineers who move those indicators before they produce incidents. They give credit in public forums for the problems that didn't happen, which requires someone senior enough to trace the counterfactual. They evaluate the engineers who maintain critical shared systems with the same recognition as the engineers who build the new features that appear in product announcements.

The quiet engineer maintaining the platform that every other team depends on is doing work that is irreplaceable. The performance system that cannot see this is the one that will eventually lose them.
