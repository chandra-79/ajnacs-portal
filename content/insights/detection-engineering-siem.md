---
title: "Detection Engineering: Treating Security Alerts Like Software, Because They Are"
description: "The SOC's alert rules are the security program's actual product — and most estates run them as an unversioned pile of vendor defaults. Detections-as-code, the ATT&CK-mapped coverage inventory, testing detections against simulated attacks, and the alert-quality economics."
date: 2029-06-22
tags: ["Security", "Detection Engineering", "Reliability", "Observability", "Platform Engineering"]
format: note
---

Somewhere between the security tooling budget and the breach report sits an unglamorous artifact that determines which one wins: the detection estate — the rules, queries, and analytics that convert the telemetry firehose (the audit logs, the IAM anomalies, the endpoint and network signals this series has been wiring up chapter by chapter) into the alerts a human investigates. And in most organizations it's run the way application code was run in 2005: vendor defaults plus accumulated one-off rules, unversioned, untested, owned by whoever wrote each one, with quality measured — if at all — by volume. **Detection engineering** is the correction: the discipline that treats detections as software, with the full SDLC this series keeps applying to everything else, because the failure modes are identical — silent breakage, untested logic, alert fatigue as the trust-decay spiral, and coverage nobody can state.

## Detections-as-code: the SDLC arrives at the SOC

The structural move: **detection rules live in version control** — expressed in the portable formats where possible (Sigma-class rule specifications compiling to your SIEM's dialect — the vendor-decoupling that makes the rules an asset rather than a platform hostage) — and flow through a
