---
title: "MTTR: Read the Incident Distribution Before Changing the Team"
description: "Define recovery consistently, inspect outliers and use incident evidence to choose the next reliability improvement."
date: 2029-07-16
tags: ["Observability", "Engineering Leadership", "Resilience"]
format: note
derived: true
---

MTTR is affected by technical design and by the authority, access and coordination available to responders. A new observability tool can help identify a fault, while a missing emergency permission can still prevent mitigation. Leadership needs evidence about those constraints before attributing a rising average to staffing.

## Read the distribution behind the mean

Consider five hypothetical incidents with impact-to-recovery durations of 10, 15, 20, 25 and 130 minutes. Their sum is 200 minutes, so the mean is 40 minutes. The median is 20 minutes. Both are correct summaries, but neither explains why one incident lasted much longer. The chart retains all five observations rather than hiding the long event in a single score.

Suppose a review finds that the 130-minute incident included an unavailable restore credential. That finding supports fixing and rehearsing the access path. It does not prove that automation or a different staffing level would reduce every incident by a fixed percentage. These figures are synthetic; they are not an Ajna customer result.

## Build the review worksheet

Record impact start, detection, mitigation decision, execution and customer-visible recovery. Mark inferred timestamps and keep unresolved incidents visible. Group comparable incident types where possible, and record affected users or transactions so a short widespread outage is not automatically ranked below a long narrow one.

For a practical exercise, ask a responder who did not write the runbook to restore a disposable service using documented access. Observe waiting, escalation and validation. Fix one demonstrated obstacle, repeat the relevant step and retain the result. A rehearsal measures that procedure under its tested conditions; it is evidence for an improvement, not a universal recovery guarantee.

| Observation | Value (minutes) |
| --- | ---: |
| Incident A | 10 |
| Incident B | 15 |
| Incident C | 20 |
| Incident D | 25 |
| Incident E | 130 |

**Figure method.** Synthetic durations sum to 200 minutes; mean=200/5=40; median=20. Timing starts at customer impact and ends at verified recovery. Small illustrative sample, not a customer benchmark.

## Primary references

- [Google SRE incident response](https://sre.google/workbook/incident-response/)
- [Google SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
