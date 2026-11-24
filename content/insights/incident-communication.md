---
title: "Incident communication: make state, roles and uncertainty explicit"
description: "Use a shared incident record and audience-specific updates to support coordination without overstating what is known."
date: 2029-01-24
tags: ["Engineering Leadership", "DevSecOps"]
format: article
derived: true
---

The technical response to a production incident gets most of the engineering attention. Runbooks, incident tooling, on-call rotation design, escalation policies, chaos engineering — these are well-documented practices that most mature engineering organisations invest in. The communication dimension of incident response gets a fraction of that attention and causes a disproportionate fraction of the organisational damage when incidents occur.

During an active incident, poor communication creates secondary problems. Stakeholders who cannot get status updates from the status page or a designated incident channel start paging individual engineers directly, fragmenting attention during the period when focused technical work matters most. Incident channels without structure devolve into simultaneous commentary from observers, making it harder for responders to coordinate. The lack of a distinct incident commander role means the person driving the technical response is also managing communication, which degrades both.

The structural answer is role separation. An incident commander coordinates the response and may delegate updates, stakeholder briefings and drafting to a communication lead. Responders own technical resolution. The roles require different skills and should be trained separately.

The cadence principle for status updates: communicate on schedule, not only when there is new information. "We have no update on cause, the system is still degraded, our next update is in 30 minutes" is more useful to stakeholders than silence. Silence invites interruption.

Post-incident customer communication deserves its own practice. The language that feels accurate from an engineering perspective often reads as defensive or dismissive to customers. Direct, simple, non-technical language that acknowledges impact without over-explaining is a skill. It can be reviewed, edited, and improved before it goes out, even in a fast-moving incident.

## Define the roles before the incident

The incident lead coordinates decisions and priorities. A communication lead can manage stakeholder updates while an operations lead coordinates technical actions. Small incidents may combine roles, but the responsibilities should remain explicit. Assigning every message to the incident commander can overload that role during a larger event. Use the structure that fits the incident and record who currently holds each responsibility.

Create a shared state record with impact, timeline, actions, observations and the next decision. Separate an action being considered from one already executed. This prevents a new responder from repeating a risky step or assuming that a mitigation succeeded because it appeared in the chat. Keep the record concise enough to update during the response.

## A fictional handoff timing example

A responder joining an incident spends 20 minutes reconstructing state from an unstructured message history. In a rehearsal with a maintained state record, another responder needs six minutes to explain the current impact, mitigation and next step. The chart compares those fictional orientation times. Different responders and scenarios make this an illustration, not a measured causal effect of documentation.

Use the exercise to identify missing information. The record may contain every command but omit why the team rejected a rollback. It may state that service recovered while leaving reconciliation incomplete. The new responder should be able to identify both the current condition and the uncertainty that still matters.

## Practice two audiences separately

Give one participant the role of communicating to responders and another the role of updating affected users. The internal message can include technical evidence and coordination details. The external message should focus on known impact, supported workarounds, current status and the next update. Both should distinguish confirmed facts from hypotheses.

Introduce a change during the drill. Perhaps one region recovers while another remains degraded, or a suspected cause is disproved. Ask participants to revise the message without overstating certainty. This builds the habit of correcting scope transparently. An update that acknowledges new evidence is more useful than preserving an earlier claim for the appearance of confidence.

## Review communication as an operational artifact

After the drill or incident, compare the declared cadence with actual updates and inspect whether the messages enabled the intended decisions. Did support staff know what to tell users? Did responders know who could authorize the next action? Were sensitive details kept out of public channels? Use specific examples to improve the template.

Do not evaluate communication only by whether the incident looked calm. A polished status message can coexist with unresolved data loss or a poorly controlled mitigation. The message should accurately represent the operational state, including limits and uncertainty. Clear communication supports recovery by reducing avoidable confusion; it does not replace the technical and business work required to finish the incident.

## Sources and further reading

- [Google SRE Workbook · Incident Response](https://sre.google/workbook/incident-response/)
- [Google · Technical writing courses](https://developers.google.com/tech-writing/overview)
