---
title: "A Rewrite Needs a Migration Plan, Not a Schedule Multiplier"
description: "Compare full replacement and incremental modernisation using explicit business and operational obligations."
date: 2029-05-25
tags: ["Software Engineering", "Engineering Leadership"]
format: article
derived: true
---

A proposal to rewrite a working system needs explicit justification, including the migration and operational obligations that a clean-code demonstration does not show.

The reasoning that usually accompanies the rewrite proposal is seductive: the current system is hard to modify, the architecture is compromised, new engineers struggle to understand it, and a clean rewrite would allow us to do it correctly. All of these observations may be accurate. None of them necessarily justify a full rewrite.

What happens: the team starts with enthusiasm and a clean architecture. The first months are productive — they're building foundational components that are genuinely cleaner than their predecessors. Then they encounter the edge cases. The business logic that lives in deeply nested conditional blocks because that's how the rules actually work. The integration behaviors that downstream systems depend on and that weren't documented anywhere. The performance optimisations that look like unnecessary complexity until you remove them and the system slows down.

These things are in the original system because the domain is complex. The rewrite rediscovers the complexity. The timeline expands. Feature parity takes longer than the original build did. The "last 20%" expands.

The alternative that usually works better: identify the specific capabilities the current system cannot support, and modernise the parts that prevent those capabilities. This is slower and less satisfying than a clean slate. It also delivers working software throughout, rather than maintaining two systems while the rewrite catches up.

Rewrite when you have an explicit list of things the current system genuinely cannot do. Modernise incrementally when the problems are complexity and maintainability.

## Count migration obligations before estimating time

A rewrite does not necessarily take a fixed multiple of its estimate. The useful question is which obligations the estimate includes. Besides feature implementation, count data conversion, integration compatibility, coexistence, rollback, support training, and retirement of the old path. These can dominate the project even when the new code is easier to write.

A fictional migration plan lists 30 user-facing capabilities and initially omits ten scheduled jobs. Adding the jobs increases the inventory from 30 to 40, or one-third. That does not establish a one-third schedule increase: a job might be trivial or might contain the most difficult reconciliation rule. The chart shows the missing category so it can be estimated deliberately.

Choose one capability and complete its migration before claiming that the new platform is ready. Reproduce representative inputs, compare outputs without duplicating real side effects, cut over one bounded consumer, and demonstrate recovery. Include the work required to stop the old route and remove its credentials.

Use that slice to revise assumptions about later slices. Record which tooling is reusable and which behaviours remain uncertain. A clean codebase is useful, but the project is successful only when the required business behaviour has a supported owner and a safe operating path. That is the outcome against which a full rewrite and incremental modernisation should be compared. Keep the inventory versioned so newly discovered obligations are visible to the people making budget and sequencing decisions.

## Further reading and source boundaries

- [Martin Fowler: Strangler Fig](https://martinfowler.com/bliki/StranglerFigApplication.html)
- [Michael Nygard: Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
