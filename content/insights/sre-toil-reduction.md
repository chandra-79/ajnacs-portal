---
title: "SRE Toil: How to Measure It and Decide What to Automate"
description: "Build a toil baseline, calculate automation payback, and check that the work actually went away."
date: 2026-10-09
tags: ["Engineering Leadership", "DevSecOps", "Cloud Architecture"]
format: article
---

On-call logs tell you where the team is spending time. They rarely tell you which work will keep coming back. Start with a recurring task the team can name, such as reprocessing a batch after a known timeout. Record the hands-on effort, identify why it recurs, and decide whether to remove the trigger, improve the procedure, or automate it.

## What to measure

Count hands-on time spent on manual, repeatable operational tasks that could be automated and produce little enduring improvement. A routine replay can meet that definition. Diagnosing a new data-loss mechanism or engineering a permanent fix belongs in a different category. Google’s published 50% target covers operational work more broadly. Set a local budget based on the team’s obligations and capacity.

Create one row per occurrence with date, service, trigger, active minutes, number of operators and outcome. Add person-minutes if several people work simultaneously. Record time spent waiting separately when it delays recovery. Divide toil hours by available engineering hours for the same team and window. Document the handling of leave, holidays, and overlapping incidents so later windows use the same rules.

## Run a small pilot

1. Baseline at least one complete on-call rotation. Reconcile tickets, paging and deployment records with the operators who did the work. Record the workload and incident severity so the follow-up can account for unusual weeks.
2. Rank repeat tasks by hands-on hours, frequency and operational risk. Investigate the trigger first. If the batch replay is caused by a stale timeout, fixing the timeout might save more than writing a replay bot.
3. Pilot the smallest safe change. For a replay, use idempotency where the system supports it, show the planned scope, reject ambiguous requests, and record what ran. Keep a manual recovery path and test partial failure before rollout.
4. Re-measure with the same team and scope. Count manual exceptions, upkeep, failures and operator time transferred to another team. Compare service objectives and error rates before calling the savings durable.

## Use the worksheet to decide

Enter equal windows and the one-time implementation effort. The calculator reports baseline and follow-up toil as a share of capacity, ongoing hours released and simple payback. Follow-up upkeep is included in the savings calculation and tracked separately from manual toil. A payback in weeks reflects team capacity and assumes the observed weekly release continues. Rate savings and service risk separately before making a larger investment.

**Illustrative measurement.** The worked data below is synthetic. Use your own windows and leave any field with missing evidence out of your decision until you can measure it. Review [platform onboarding](/insights/platform-engineering-idp-2026/) if the work occurs when developers create a service.

## References

- [Google SRE Book · Eliminating Toil](https://sre.google/sre-book/eliminating-toil/)
- [Google SRE Workbook · Identifying and Tracking Toil Using SRE Principles](https://sre.google/workbook/eliminating-toil/)
