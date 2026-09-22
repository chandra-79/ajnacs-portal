---
title: "MTTR is a leadership metric, not just an engineering metric."
description: "We reduced MTTR by 45% on a logistics platform — not by throwing more engineers at incidents, but by:"
date: 2026-04-02
tags: ["Observability", "Engineering Leadership", "Resilience"]
format: note
---

MTTR is a leadership metric, not just an engineering metric.

We reduced MTTR by 45% on a logistics platform — not by throwing more engineers at incidents, but by:

- Building AI-powered observability with Prometheus + OpenTelemetry
- Creating auto-remediation playbooks for the top 10 recurring issues
- Running monthly chaos engineering sessions so the team knew failure modes before production did

The technology was straightforward. The shift was getting leadership to invest in resilience engineering *before* the next P1 — not after.

If your MTTR is climbing, look at your observability stack and your on-call runbooks before you look at headcount.
