---
title: "On-Call Burnout: How It Accumulates and What Organizations Can Actually Do"
description: "On-call burnout is not solved by rotating schedules or paying people more. It is solved by reducing alert noise, fixing recurring incidents, and treating on-call engineering as a system design problem."
date: 2028-09-29
tags: ["Engineering Leadership", "Observability"]
format: article
---

On-call burnout does not announce itself. It accumulates.

The engineer on call wakes up at 3am for a page. They resolve the incident in 20 minutes. They go back to sleep. Three nights later, the same alert fires for the same reason. A week later, a different alert that has fired three times this month fires again. After three months of this rotation, the engineer is exhausted, irritable, and quietly updating their resume.

By the time the burnout is visible, it has already affected performance, retention risk, and the quality of incident response.

## What drives on-call burnout

**Alert noise.** Alerts that fire frequently but resolve themselves, alerts that fire for situations that do not require immediate human intervention, alerts that are too sensitive and produce false positives — all of these train engineers to ignore pages, which means they also ignore real ones, and they also guarantee sleep disruption even on nights when nothing needs human attention.

**Recurring incidents.** The same incident type firing repeatedly is a post-mortem failure. Somebody is getting paged for a problem that has been fixed once at the symptom level but never at the root cause level. Each recurrence is a direct cost in engineer sleep and a signal that the on-call system is not producing durable fixes.

**Unclear incident scope.** The engineer is paged but the runbook is incomplete, the system is not observable enough to diagnose the problem quickly, and the action they need to take requires waking up a second person. Incidents that take three hours to resolve because of poor observability and unclear authority are more damaging to the on-call engineer than incidents that take 20 minutes because the system is well-understood.

**Lack of post-incident investment.** If post-mortems produce no change in the system, the on-call engineer sees incidents repeating and has no evidence that the system is improving. This is demoralizing in a specific way — it suggests the organization does not value their pain.

## What actually helps

**Treat alert noise reduction as production work.** Every alert that fires more than twice a week without resulting in a real intervention is a candidate for deletion, adjustment, or automation. Reducing alert volume directly reduces on-call burden.

**Block time to fix recurring incidents.** The team that handles on-call should have dedicated time each sprint to address the root causes of the highest-frequency incidents. This is not optional. The on-call experience only improves if root cause work gets done.

**Invest in runbooks before the incident.** A runbook that walks an on-call engineer through diagnosis and resolution in 20 minutes is worth more than excellent documentation that nobody reads.

The on-call rotation that burns nobody out is the one where pages are meaningful, incidents are resolved not just contained, and the system visibly improves over time.
