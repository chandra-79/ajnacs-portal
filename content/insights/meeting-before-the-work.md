---
title: "Keep the useful informal conversation—and record the decision"
description: "Preserve the speed of a small clarification while making its result discoverable to colleagues who were not in the room."
date: 2029-06-20
tags: ["Engineering Leadership"]
format: article
derived: true
---

Engineering process design focuses on the scheduled meetings because those are legible. Sprint planning has a defined agenda, a cadence, and measurable outputs. The daily standup has a format and a time limit. Design reviews have a template and participants. These are the meetings that appear in process documentation and team retrospectives.

The coordination that actually shapes what gets built is often the informal conversation that precedes and supplements the formal process. An engineer who has a three-minute conversation with a product manager about a requirement ambiguity before writing code avoids a direction change after two days of work. Two engineers who resolve a technical disagreement in a Slack thread before the design review arrives at the review with alignment rather than dispute. A senior engineer who asks a question about a proposed approach at lunch surfaces a constraint that the design did not account for.

Informal coordination can work in either co-located or distributed teams, but both need ways to make important decisions accessible beyond the original participants.

Distributed teams that acknowledge this loss design explicitly for informal coordination. Structured unstructured time — short optional video sessions without agendas, working sessions where engineers are present but not in a meeting, pair programming across time zones on specific problems. These are not perfect substitutes for organic co-location. They are better than letting the informal layer disappear entirely and discovering the cost in designs that missed critical context.

The formal process handles the work that can be planned. The informal coordination handles the work that cannot be fully planned but is essential. Optimising only the formal process is optimising the legible part of engineering coordination at the cost of the part that actually prevents the most expensive mistakes.

## Make an informal decision discoverable

A quick conversation can resolve an ambiguity, but colleagues who were absent still need the result. Capture the question, decision, reason and any remaining uncertainty in the work item or decision log. Do this while the context is fresh. The record does not need to reproduce the conversation; it needs to preserve the information someone else will require to implement or review the work.

Distributed teams can create useful informal contact without depending on everyone being available at once. A short question in a shared channel, an optional pairing session or a documented office-hour window can help. Keep the answer visible to the people who need it and avoid making private chats the only route to important decisions.

## A fictional clarification exercise

A team samples ten work items. Four contain a decision that was made in a private conversation but never recorded. Each requires an assumed 15 minutes of later clarification, totaling 60 minutes. After adding a short decision-note habit, only one sampled item needs that clarification, or 15 minutes under the same assumption. The chart compares the modeled clarification effort.

This is an illustrative audit, not proof that writing notes saves 45 minutes in every ten items. The sample may differ in complexity, and the original conversations also take time. The useful observation is whether a colleague can find the decision without locating the person who happened to be present.

## Test the record from an absent colleague's perspective

Choose a recent item and ask someone outside the discussion to explain what should be built and why. If they cannot distinguish a rejected option from the chosen one, improve the record. If the decision depends on a still-unconfirmed requirement, mark it as provisional and identify who will resolve it. Do not let a confident summary conceal an unresolved disagreement.

For cross-team work, include the interface consequence. A decision to change a field name, retry behavior or release sequence affects people beyond the original participants. Link the relevant owners and confirm that they can act on the record. An informal conversation is useful only if its result reaches the people whose work depends on it.

## Keep access to context equitable

Co-located teams can also lose information through corridor decisions, and distributed teams can build strong informal networks. Avoid assuming that proximity automatically produces good coordination. Ask whether new colleagues, people in other time zones and those with different communication preferences can obtain the same decision context.

Use live conversation when it helps resolve uncertainty, and written follow-through when it preserves the result. The two practices support each other. The objective is not to replace every spontaneous interaction with a process, nor to rely on spontaneous interaction as the process. It is to keep the useful speed of a small conversation while making the decision available to the wider team.

## Sources and further reading

- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
- [Google · Technical writing courses](https://developers.google.com/tech-writing/overview)
