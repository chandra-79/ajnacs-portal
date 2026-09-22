---
title: "On-call rotations burn engineers out quietly, and by the time it's visible it's already too late"
description: "On-call burnout has a specific texture."
date: 2029-02-21
tags: ["Engineering Leadership", "Observability"]
format: article
derived: true
---

On-call burnout has a specific texture. It doesn't arrive as a dramatic crisis — it accumulates in the gap between the sleep that was interrupted and the work that still starts at the same time the next morning. Engineers carry it quietly, and by the time it's visible in attrition or performance, the erosion has been happening for months.

The signals that tend to go unmeasured:
- **Alert volume per engineer**: more than one or two actionable pages per on-call shift indicates the system is too noisy. Noisy alerting trains engineers to acknowledge without investigating — which means the alert that matters gets the same treatment as the fifty that didn't.
- **Hero concentration**: two or three engineers who always handle the complex incidents because they're the only ones who understand the system deeply. This is a bus factor problem and a burnout risk simultaneously.
- **Rotation equity**: if the same engineers end up on-call over every holiday weekend because they're the "reliable" ones, the informal cost of reliability is not being shared.

The practices that help:
- Measure and review on-call load as a team metric, not just a scheduling function
- Require that every alert has a defined action — if it fires and the response is "ignore unless it persists," delete it
- Post-mortems that result in changed alert thresholds and runbook improvements, not just root cause analysis
- Make on-call fatigue a topic in 1-1s, not something engineers are expected to absorb silently

The on-call experience is a joint signal about system reliability and engineering culture. Treat it as both.
