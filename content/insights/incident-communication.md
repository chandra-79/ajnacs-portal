---
title: "Incident communication is an engineering skill and most engineers are not taught it."
description: "The technical response to a production incident gets most of the engineering attention."
date: 2026-04-13
tags: ["Engineering Leadership", "DevSecOps"]
format: article
---

The technical response to a production incident gets most of the engineering attention. Runbooks, incident tooling, on-call rotation design, escalation policies, chaos engineering — these are well-documented practices that most mature engineering organisations invest in. The communication dimension of incident response gets a fraction of that attention and causes a disproportionate fraction of the organisational damage when incidents occur.

During an active incident, poor communication creates secondary problems. Stakeholders who cannot get status updates from the status page or a designated incident channel start paging individual engineers directly, fragmenting attention during the period when focused technical work matters most. Incident channels without structure devolve into simultaneous commentary from observers, making it harder for responders to coordinate. The lack of a distinct incident commander role means the person driving the technical response is also managing communication, which degrades both.

The structural answer is role separation. An incident commander owns communication — internal updates on a defined cadence, external status page updates, stakeholder briefings, and post-incident communication drafting. Responders own technical resolution. The roles require different skills and should be trained separately.

The cadence principle for status updates: communicate on schedule, not only when there is new information. "We have no update on cause, the system is still degraded, our next update is in 30 minutes" is more useful to stakeholders than silence. Silence invites interruption.

Post-incident customer communication deserves its own practice. The language that feels accurate from an engineering perspective often reads as defensive or dismissive to customers. Direct, simple, non-technical language that acknowledges impact without over-explaining is a skill. It can be reviewed, edited, and improved before it goes out, even in a fast-moving incident.
