---
title: "On-Call Workload: Reviewing Interruptions, Coverage, and Recovery"
description: "Review paging, escalation concentration and recovery arrangements as operational conditions, without diagnosing people from incident metrics."
date: 2028-09-29
tags: ["Engineering Leadership", "Observability"]
format: article
---

On-call workload deserves explicit measurement and discussion, including work outside the official rotation.

In a hypothetical rotation, an engineer receives a page at 3 a.m. and spends twenty minutes resolving it. Similar interruptions recur on later nights. Record the actual incident work, interrupted nights, backup coverage, and next-day commitments. Those observations can reveal an unsustainable schedule without inventing the person's symptoms, intentions, or health status.

Ask what support and changes are needed instead of waiting for a performance or retention signal to trigger the conversation.

## Operating conditions to investigate

**Alert noise.** Alerts that fire frequently but resolve themselves, alerts that fire for situations that do not require immediate human intervention, alerts that are too sensitive and produce false positives — these can consume attention and interrupt rest without enabling a useful immediate action. Review detection quality and response evidence before changing the rules.

**Recurring incidents.** Repeated incident types are a reason to review the mechanism, existing mitigations and follow-up decisions. Somebody is getting paged for a problem that has been fixed once at the symptom level but never at the root cause level. Each recurrence warrants investigation of its timing, response effort, mechanism, and prior follow-up; not every recurrence has the same cause or consequence.

**Unclear incident scope.** The engineer is paged but the runbook is incomplete, the system is not observable enough to diagnose the problem quickly, and the action they need to take requires waking up a second person. Long incidents with unclear authority can increase response effort and uncertainty. Duration alone cannot establish how an individual experiences the work; review the circumstances and available support.

**Lack of post-incident investment.** If post-mortems produce no change in the system, the on-call engineer sees incidents repeating and has no evidence that the system is improving. Discuss whether follow-up priorities provide a credible route to improvement rather than assigning motives or feelings to the organization or responder.

## What actually helps

**Treat alert noise reduction as production work.** Review repeated nonactionable pages against their intended failure coverage. Adjust urgency, grouping, duration conditions, or automation where evidence supports it; no universal weekly count determines deletion. Check that important failures remain visible.

**Block time to fix recurring incidents.** The team that handles on-call should have dedicated time each sprint to address the root causes of the highest-frequency incidents. Allocate this work alongside staffing, escalation, and recovery improvements; no single intervention accounts for the entire on-call experience.

**Invest in runbooks before the incident.** A runbook that walks an on-call engineer through diagnosis and resolution in 20 minutes is worth more than excellent documentation that nobody reads.

Meaningful pages, reliable recovery and visible improvements support a more sustainable rotation, alongside staffing and recovery arrangements.

## Separate service workload from a health conclusion

Operational records can show frequent interrupted nights, long incidents and uneven escalation. They cannot diagnose burnout or prove that one practice will prevent it. Use the evidence to improve working conditions and provide a credible way for people to raise concerns. The World Health Organization's description of burnout concerns chronic workplace stress; it should not be reduced to a count of alerts or a label applied by a manager.

Define the workload observations with the team. Pages per shift, distinct incidents, active response time, interrupted nights and follow-up work answer different questions. A single incident can generate many duplicate pages, while one page can require hours of coordination. Review the distribution and circumstances rather than rewarding the lowest total.

## A fictional rotation-load worksheet

Over a four-week window, one engineer handles six after-hours incidents and another handles two. If each incident requires an assumed 45 minutes of active response, the modeled totals are 270 and 90 minutes. The chart compares those active minutes. It does not estimate sleep loss, health effects or the full burden of being available. Incident duration and severity may differ, so the assumption must be checked before using the comparison to redesign a rota.

Record escalations outside the official schedule. An expert who is not formally on call may still be contacted repeatedly. If that work is missing, the roster can look balanced while the actual burden remains concentrated. Include recovery time and the next day's responsibilities in planning rather than treating the overnight response as free capacity.

## Review alerts without deleting the evidence

For each recurring page, identify the user impact, expected responder action and urgency. If the response is to wait, determine whether the condition should use a duration threshold, a lower-urgency route or a different signal. Test the revised behavior against known failures and healthy peaks. A lower page count is useful only if important failures still reach someone able to act.

Keep a record of why the alert changed and how to restore the previous behavior if the new rule misses a significant case. Check for work transferred into another team's queue. Suppressing one team's pages while creating repeated support escalations elsewhere is a redistribution, not a reduction in operational demand.

## Make relief possible during a difficult shift

Define a backup role, the information needed for a handoff and the authority to bring in help. A responder should not have to prove personal endurance before receiving support. Rehearse handing over an active incident using a short state document: impact, timeline, current hypothesis, actions attempted, next step and unresolved risk.

Review the rotation after staffing changes, major releases and repeated exceptional shifts. Improve runbooks and remove recurring triggers, but also inspect scheduling, recovery arrangements and management expectations. No single engineering change guarantees a healthy on-call experience. Sustainable operations require attention to both service design and the conditions under which people are expected to support it.

## Sources and further reading

- [Google SRE Workbook · On-Call](https://sre.google/workbook/on-call/)
- [WHO · Burnout as an occupational phenomenon](https://www.who.int/news/item/28-05-2019-burn-out-an-occupational-phenomenon-international-classification-of-diseases)
