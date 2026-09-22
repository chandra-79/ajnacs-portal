---
title: "Post-mortems without action items are just storytelling with extra steps"
description: "The post-mortem format exists to drive system improvement."
date: 2026-01-22
tags: ["Engineering Leadership", "Observability", "Resilience"]
format: article
---

The post-mortem format exists to drive system improvement. A well-run post-mortem produces a clear understanding of what happened, why it happened, what made it worse, and — most importantly — what changes as a result. The last item is the only one with lasting value.

The failure mode I see most often: a thorough RCA, honest identification of contributing factors, and action items that are either generic ("improve monitoring") or assigned to nobody ("the team should consider..."). Two months later, the same class of incident recurs.

The action items that don't change anything:
- "Add more monitoring" without specifying what metric, what threshold, and who is building it
- "Update the runbook" without a specific gap the runbook will fill
- "Improve the architecture" without a concrete first step and an owner

The action items that do:
- "X will add an alert for Y metric crossing Z threshold, deployed by [date]"
- "X will update the runbook to include the rollback procedure that was unclear during this incident, by [date]"
- "X will schedule a 2-hour design session to address the cascading failure pattern identified in the RCA, this sprint"

The specificity isn't bureaucracy — it's the difference between an intention and a commitment. Post-mortems are worth the time they take only if the organization changes as a result. The action items are the mechanism for that change.

Every action item in a post-mortem needs an owner, a definition of done, and a due date. Everything else is storytelling.
