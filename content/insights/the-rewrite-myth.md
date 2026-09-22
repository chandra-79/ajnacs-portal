---
title: "The big rewrite will take twice as long and deliver half as much as projected"
description: "The pattern is consistent enough that I now treat \"we should rewrite this properly\" as a proposal that requires significant justification before any planning begins."
date: 2029-05-25
tags: ["Software Engineering", "Engineering Leadership"]
format: article
derived: true
---

The pattern is consistent enough that I now treat "we should rewrite this properly" as a proposal that requires significant justification before any planning begins.

The reasoning that usually accompanies the rewrite proposal is seductive: the current system is hard to modify, the architecture is compromised, new engineers struggle to understand it, and a clean rewrite would allow us to do it correctly. All of these observations may be accurate. None of them necessarily justify a full rewrite.

What happens: the team starts with enthusiasm and a clean architecture. The first months are productive — they're building foundational components that are genuinely cleaner than their predecessors. Then they encounter the edge cases. The business logic that lives in deeply nested conditional blocks because that's how the rules actually work. The integration behaviors that downstream systems depend on and that weren't documented anywhere. The performance optimisations that look like unnecessary complexity until you remove them and the system slows down.

These things are in the original system because the domain is complex. The rewrite rediscovers the complexity. The timeline expands. Feature parity takes longer than the original build did. The "last 20%" expands.

The alternative that usually works better: identify the specific capabilities the current system cannot support, and modernise the parts that prevent those capabilities. This is slower and less satisfying than a clean slate. It also delivers working software throughout, rather than maintaining two systems while the rewrite catches up.

Rewrite when you have an explicit list of things the current system genuinely cannot do. Modernise incrementally when the problems are complexity and maintainability.
