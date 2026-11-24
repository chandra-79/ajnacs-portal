---
title: "Recognizing preventive engineering with evidence"
description: "Make maintenance and risk reduction visible without inventing the outages, revenue losses or incidents they supposedly prevented."
date: 2029-06-08
tags: ["Engineering Leadership"]
format: article
derived: true
---

Engineering recognition systems have a structural bias toward reactive work. An incident that causes customer impact, is resolved through skilled technical work, and results in a postmortem with action items is visible, measurable, and narratively compelling. The engineer who resolves it is named, thanked, and remembered.

The engineer who noticed three weeks earlier that a database index was missing on a query that would degrade severely under the traffic volumes the marketing team's upcoming campaign would generate, added the index, and prevented the incident entirely — that engineer is invisible. Their work appears nowhere in incident metrics, nowhere in on-call response records, nowhere in the systems that track engineering performance.

This asymmetry shapes behaviour over time. Engineers who are evaluated by visible impact learn that visible impact comes from resolving visible problems. Prevention work — careful observation, maintenance, proactive investment in system health — produces no narrative. The incentive structure creates the production environment it deserves.

Organisations that have genuinely addressed this make prevention work visible through explicit practice. They track leading indicators alongside lagging ones — deployment error rates, cache hit ratios, database query performance trends — and recognise engineers who move those indicators before they produce incidents. They give credit for tested risk-reduction mechanisms while being explicit that avoided incidents cannot usually be observed directly. They evaluate the engineers who maintain critical shared systems with the same recognition as the engineers who build the new features that appear in product announcements.

The quiet engineer maintaining the platform that every other team depends on is doing work that is irreplaceable. The performance system that cannot see this is the one that will eventually lose them.

## Describe the risk without inventing the avoided outage

Prevention work often produces evidence about a mechanism rather than an event that definitely would have occurred. An engineer can show that a query no longer scans an entire table under a tested data distribution. That does not establish that an outage was inevitable next Tuesday. Record the observed weakness, the change and the conditions of the validation. Credit the contribution without attaching an imaginary incident count or revenue saving.

Useful evidence includes a reproducible load test, a restored backup, a retired dependency or a reduced set of privileged identities. Explain what changed for the service and who helped validate it. Maintenance work is often collaborative. Recognizing only the person who wrote the final patch can erase the operator who identified the symptom or the reviewer who found the unsafe migration path.

## A hypothetical prevention record

A fictional service test takes 18 minutes to rebuild its search index before a deployment and seven minutes after incremental indexing is introduced. The observed reduction is 11 minutes, or about 61.1% of the baseline test duration. The chart compares these two test results. It does not show production outage time avoided, nor does it establish that every dataset will behave the same way.

Attach the dataset size, machine configuration, software version and exact start and stop events. Repeat the test and record variation before turning the result into a service-level promise. Check that the faster path produces the same index contents and handles interrupted runs. A performance improvement that silently omits records is not a successful prevention change.

## Make maintenance evidence visible in ordinary work

Use a short contribution note rather than a separate heroic narrative. State the service constraint, the work performed, the validation and the remaining limitation. Link the supporting test or decision record. Include the contribution in the same planning and review system used for features, so maintenance does not depend on a manager remembering a hallway conversation months later.

During a performance discussion, ask which recurring risks the engineer reduced, which colleagues became more effective and which decisions became easier to make. Combine this with evidence about outcomes, collaboration and the person's responsibilities. A single dashboard metric cannot fairly capture all engineering work. Avoid ranking people by the number of incidents they handled or the number of preventative tickets they closed.

## Do not turn quietness into a job requirement

The relevant distinction is the contribution, not the engineer's personality. A person can be vocal and excellent at prevention, or quiet and need support making their work visible. Managers should provide more than one way to describe impact: written examples, demonstrations and conversations with collaborators. The burden should not fall entirely on individuals to market work that the team already agreed was important.

Finally, protect the capacity that makes prevention possible. Praising maintenance while removing its time from every plan sends a contradictory signal. Select a small set of service risks, assign explicit ownership and review the evidence when the work is complete. Recognition then follows a visible engineering decision rather than an unverifiable claim about a disaster that never happened.

## Sources and further reading

- [Microsoft Research · The SPACE of Developer Productivity](https://www.microsoft.com/en-us/research/publication/the-space-of-developer-productivity-theres-more-to-it-than-you-think/)
- [Google SRE · Postmortem Culture](https://sre.google/sre-book/postmortem-culture/)
