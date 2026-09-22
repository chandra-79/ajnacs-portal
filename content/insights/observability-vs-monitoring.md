---
title: "Monitoring tells you something is wrong. Observability tells you why."
description: "Monitoring tells you something is wrong. Observability tells you why."
date: 2029-02-16
tags: ["Observability", "Engineering Leadership", "Cloud Architecture"]
format: note
derived: true
---

Monitoring tells you something is wrong. Observability tells you why.

Most organizations have monitoring. Fewer have observability.

Monitoring: dashboards, alerts, the CPU graph that goes red at 3am.
Observability: the ability to ask arbitrary questions about your system's behavior without deploying new code.

The difference matters most when:
- The issue is intermittent and doesn't reproduce in staging
- The failure is in a dependency you don't own
- The system is behaving unexpectedly but no alerts fired

Investing in observability — structured logs, distributed tracing, high-cardinality metrics — pays back every time something goes wrong in a way nobody predicted.

Which is every interesting production incident.
