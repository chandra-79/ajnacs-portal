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

## Classify the work before timing it

Review ten recent tickets with the people who handled them. Ask two reviewers to classify each ticket independently, then compare judgments against a short definition. A repeated account unlock under a validated procedure is likely toil. The first investigation of a new authentication failure is diagnosis. Changing the service so the failure cannot recur is engineering. A single ticket can contain all three. Record time by activity when the distinction changes what you would automate.

Use a lightweight capture method. For each selected task, record a trigger, a start and stop for hands-on work, the result, and whether the procedure diverged. Cross-check against a small sample of incident and deployment records without treating timestamp gaps as work. Interruptions and calendar waiting can matter greatly for incident recovery. Keep their duration separate so a bot that closes tickets faster does not appear to save operator time it never required.

## Compare removing the trigger with automating the response

Consider a fictional batch replay. It occurs 18 times per week and takes 12 hands-on minutes each time. That is 216 minutes, or 3.6 hours weekly. A guided replay tool could reduce the common case to two minutes for 15 events, while three exceptions still take 12 minutes each. Add 24 minutes of weekly upkeep. Total follow-up effort is 90 minutes. The expected weekly release is 126 minutes, or 2.1 hours. A 14-hour implementation would recover that time in about 6.7 weeks, if the event mix and maintenance burden hold.

Now compare a fix to the upstream timeout. Suppose the fix takes 20 hours and reduces the relevant trigger to three events a week at 12 minutes each. With 15 minutes of extra weekly checks, expected effort is 51 minutes, so about 2.75 hours are released per week. Payback is about 7.3 weeks. The fix may still be preferable because fewer batches fail in the first place. Record both operational effect and payback so the choice does not depend on one rounded number.

## Decide whether the release is safe and durable

Start a trial with a bounded set of jobs and record the job identity, prior state, requested action, and resulting state. Reject work you cannot identify unambiguously. Check a duplicate trigger, a failure before the replay starts, a failure after a side effect, and a partial result. Keep the current procedure available to the on-call engineer until they can complete all of those cases without guessing which work ran.

Compare operator effort per occurrence and occurrences per eligible batch in the follow-up. A quieter release week can lower hours even if the procedure is unchanged. Account for work shifted to another team, additional review minutes, and time spent supporting automation. Look again after the next rotation rather than reporting the first low week as permanent. Close the pilot when the new path has a named owner, a supported recovery route, and evidence that it released time without weakening service objectives. The [Google SRE Workbook](https://sre.google/workbook/eliminating-toil/) provides examples for finding and prioritizing operational work.

## References

- [Google SRE Book · Eliminating Toil](https://sre.google/sre-book/eliminating-toil/)
- [Google SRE Workbook · Identifying and Tracking Toil Using SRE Principles](https://sre.google/workbook/eliminating-toil/)
