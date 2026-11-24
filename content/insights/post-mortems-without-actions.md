---
title: "Postmortems: move from findings to verified improvements"
description: "Separate evidence, proposed changes and accepted risk, then test whether selected follow-ups alter the failure mechanism."
date: 2029-02-26
tags: ["Engineering Leadership", "Observability", "Resilience"]
format: article
derived: true
---

The post-mortem format exists to drive system improvement. A well-run post-mortem produces a clear understanding of what happened, why it happened, what made it worse, and — most importantly — what changes as a result. Shared understanding and verified improvements can both have lasting value.

A recurring failure mode is a thorough RCA, honest identification of contributing factors, and action items that are either generic ("improve monitoring") or assigned to nobody ("the team should consider..."). Two months later, the same class of incident recurs.

The action items that don't change anything:
- "Add more monitoring" without specifying what metric, what threshold, and who is building it
- "Update the runbook" without a specific gap the runbook will fill
- "Improve the architecture" without a concrete first step and an owner

The action items that do:
- "X will add an alert for Y metric crossing Z threshold, deployed by [date]"
- "X will update the runbook to include the rollback procedure that was unclear during this incident, by [date]"
- "X will schedule a 2-hour design session to address the cascading failure pattern identified in the RCA, this sprint"

The specificity isn't bureaucracy — it's the difference between an intention and a commitment. Post-mortems are worth the time they take only if the organization changes as a result. The action items are the mechanism for that change.

Every action item in a post-mortem needs an owner, a definition of done, and a due date. The review should also preserve useful learning and explicit decisions about remaining risk.

## Preserve the learning before selecting the change

A postmortem should explain the sequence of events, what responders could observe and why their actions made sense at the time. This understanding has value even before a code change is selected. Avoid compressing a complex incident into one person's mistake or one supposed root cause. Several conditions may have combined to make the failure possible or difficult to recover from.

After the review, distinguish findings from recommendations. A finding describes evidence. A recommendation proposes a way to change the system. The proposal may need further testing, and the team may decide that a different control is more effective. Keeping the distinction visible prevents an early suggestion from becoming a permanent commitment without evaluation.

## A fictional action-selection example

A review produces nine candidate improvements. The team identifies three that directly address the observed failure mechanism, two that improve diagnosis and four that are unrelated maintenance ideas. It funds the first five and moves the other four into ordinary prioritization. The chart compares five incident-related actions with four separate backlog ideas. This is a classification exercise, not a target number of actions per incident.

Record why an idea was deferred. It may be valuable but require a larger design decision, or it may address a risk that the incident did not demonstrate. An explicit choice is more honest than attaching every improvement idea to the postmortem and then leaving most of them unfinished. Ownership should follow the selected work, with the authority and capacity to coordinate it.

## Define verification before implementation

For each selected action, write the failure condition it addresses and the observation that will show success. A runbook change can be tested by a responder who did not write it. A retry change can be tested under partial failure and duplicate delivery. A monitoring change can be checked against both known incidents and healthy high-load periods.

Include the stop condition and rollback for the validation. Some failures should be rehearsed only in a test environment; others may be suitable for a carefully bounded production exercise. The incident's urgency does not remove the need to protect users while testing the fix. Capture the result and limitations beside the action so completion means more than a merged pull request.

## Review the remaining risk explicitly

A team may accept a residual risk because the mitigation cost is disproportionate, a dependency is being retired or another control already limits the impact. Record who can make that decision and what would reopen it. This is different from silently letting an action expire because feature work displaced it.

At the next relevant incident or exercise, return to the prior record. Did the expected mechanism recur? Did the mitigation work? Did the system change enough that the old analysis no longer applies? A postmortem becomes useful organizational memory when those questions can be answered. Action items support that memory, but a quota of tickets is neither necessary nor sufficient for learning.

## Sources and further reading

- [Google SRE · Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
- [Google SRE Workbook · Incident Response](https://sre.google/workbook/incident-response/)
