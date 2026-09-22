---
title: "SRE Toil: What It Is, How to Measure It, and How to Reduce It"
description: "Toil is the manual, repetitive, automatable work that keeps systems running without actually improving them. SRE practice says: measure toil, set a ceiling, and invest engineering effort in eliminating it."
date: 2026-10-09
tags: ["Engineering Leadership", "DevSecOps", "Cloud Architecture"]
format: article
---

Google's SRE book introduced the concept of toil as a specific category of work worth tracking and actively reducing. The definition is precise: toil is work that is manual, repetitive, automatable, tactical (it doesn't produce lasting value), and that scales linearly with service growth.

The reason to track it separately from other work: teams that spend too much time on toil have no capacity for the reliability improvements that would eliminate toil. They are on a treadmill. The SRE principle is a ceiling on toil — no more than 50% of an SRE's time — with explicit investment in automation to reduce it.

## Recognizing toil

The examples are recognizable to anyone who has operated production infrastructure:

- Manually responding to pager alerts that could be handled by an automated recovery script
- Running a database query by hand to answer a recurring business question that could be a scheduled report
- Manually approving deployments that could be automated with sufficient testing
- Manually copying data between systems that could be connected with a pipeline
- Restarting a service on a schedule because it has a known memory leak (the leak is tech debt; the restart is toil)
- Manually granting access to a system for new team members who always need the same access (an automation problem, not a policy problem)

The common thread: someone doing this work is doing it because no automation exists, not because human judgment is required.

## Measuring toil

You cannot reduce what you do not measure. Toil measurement approaches:

**Incident-linked toil**: when responding to a PagerDuty/OpsGenie alert, mark whether the response was manual and repetitive (toil) or required investigation and judgment (not toil). Over time, you can see the toil fraction of on-call work.

**Time tracking for ops work**: a week-long exercise where the team tracks their time in categories: toil, project work, meetings, unplanned work. The granularity doesn't need to be high — 30-minute buckets are sufficient. This produces a surprisingly clear picture of where time actually goes.

**Ticket analysis**: tag support and operational tickets as toil vs. not. Review the toil tickets monthly. What categories of toil appear repeatedly? These are the automation candidates.

A team discovering that 40% of their time is toil is not discovering a problem unique to them — it is discovering a baseline that exists broadly. The question is what to do about it.

## Prioritizing what to automate

Not all toil is equally worth automating. The priority framework:

**High-frequency + manual + high-consequence**: a manual step in a deployment that is done 20 times per week and occasionally causes incidents is the highest priority for automation. The frequency means the automation saves significant time; the incident rate means it reduces risk.

**On-call toil**: manual alert responses that happen at 2am have both a reliability cost (delayed response) and a human cost (degraded sleep, on-call burnout). Automating these has disproportionate value compared to the time saved during business hours.

**Toil that blocks other teams**: a manual approval step that other teams wait on for hours each time is a bottleneck. Automating it removes a dependency.

**Scaling toil**: work that increases linearly with service growth will eventually consume the team. Automating it before it reaches that point is cheaper than automating under pressure.

## The investment conversation

Reducing toil requires trading short-term capacity for long-term capacity. The team needs to spend time building automation instead of doing the manual work. This is a conversation with leadership: we are spending 35% of our engineering capacity on work that doesn't improve the system, and we need 2 sprints to build automation that will reduce this to 15%.

The ROI argument helps: if 2 engineers spend 1 sprint building an automation that saves 4 hours per week across 3 engineers, the payback is within 2 months. The argument is more convincing with actual measurements than with intuitions.

*Working through a toil reduction initiative for an operations or SRE team? The measurement step is often the most revealing part. [Happy to compare approaches.](/contact)*
