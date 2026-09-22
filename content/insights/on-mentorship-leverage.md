---
title: "Mentorship is the highest-leverage activity an experienced engineer does. Most treat it as optional."
description: "The most experienced engineers in any organisation have accumulated something that is difficult to reproduce from documentation: the pattern recognition that comes from having been wrong…"
date: 2025-06-27
tags: ["Engineering Leadership"]
format: article
derived: true
---

The most experienced engineers in any organisation have accumulated something that is difficult to reproduce from documentation: the pattern recognition that comes from having been wrong in specific ways and corrected over time. They know why a particular architectural choice fails under a particular load pattern because they watched it fail. They know why a particular organisational intervention backfires because they tried it. That knowledge is the most valuable thing they can transmit.

Most of it never gets transmitted, because mentorship is not measured and individual output is. An engineer who ships a complex feature and an engineer who ships that same feature while also developing two junior engineers who will ship complex features independently in six months are indistinguishable by standard engineering metrics. The leverage of the second engineer is real but invisible.

The mentorship that compounds is specific rather than general. General encouragement — "you're doing great, keep learning" — is pleasant and does not transfer knowledge. Specific feedback transfers knowledge: "the decision to use a join here instead of a subquery is correct for this query volume, but at 10x traffic this specific part of the query plan changes, here's how to think about that threshold." The mentee who receives that feedback internalises a decision framework, not a single decision.

Making your own mistakes visible is an underused practice. Most experienced engineers present their conclusions as confident judgments. The reasoning that led to those conclusions, including the wrong turns, is more educational than the conclusion. A senior engineer who describes a design they were confident about, why they were wrong, and what the correcting signal looked like teaches the mentee how to be wrong productively.
