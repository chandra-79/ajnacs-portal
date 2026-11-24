---
title: "The Meeting Before the Work Is the Most Important Meeting Nobody Counts"
description: "The alignment conversation that happens before engineering starts determines how much of the engineering work is useful. Teams that skip it pay for it in rework."
date: 2029-01-08
tags: ["Engineering Leadership"]
format: article
---

Engineers are measured on what they build. The conversation that happens before the building — clarifying requirements, aligning on approach, surfacing assumptions, agreeing on what done looks like — produces no measurable output. It does not show up in velocity. It does not ship features.

It also determines whether the feature that gets built is the right one.

## The cost of skipping alignment

The engineering team gets a ticket. The ticket describes a feature. The team builds the feature. Three weeks later, the product team looks at the result and says: "this is not quite what we had in mind."

What happened? The ticket contained the product manager's understanding of the requirement. The engineers built based on their interpretation of the ticket. The interpretations diverged. The implementations are different things.

The divergence is not a failure of the ticket. It is a failure to find the divergence before the work started. A focused conversation might have exposed the disagreement earlier. The example illustrates the risk rather than proving that a particular meeting duration would have prevented it.

## What the alignment conversation covers

A useful pre-work alignment conversation has a short but specific scope:

**What problem are we solving?** The ticket describes a feature. The conversation uncovers the problem the feature is supposed to address. This distinction matters because engineers who understand the problem often see solutions the product manager did not consider, and sometimes those solutions are faster or better.

**What does a successful outcome look like?** Specifically. Not "users can do X" but "users can do X within two clicks from the dashboard, and the operation completes in under one second." If the product manager and engineer have different specific pictures of what success looks like, the work will diverge.

**What are we explicitly not building?** Scope boundaries prevent scope creep and clarify the minimum viable implementation. An engineer who does not know where the scope ends tends to be conservative and build less, or generous and build more.

**What assumptions are we making?** Dependencies on other teams, data that is assumed to exist, user behavior that is assumed to be consistent — surface the assumptions so they can be validated or challenged.

## Why it does not happen enough

The meeting before the work has no artifact. It does not produce a ticket update or a design document unless someone makes that happen deliberately. It is easy to skip because the work can begin without it. It is easy to rationalize as unnecessary because most of the time, the misalignment is discovered eventually.

The most productive engineering teams are not the ones that skip this conversation to start faster. They are the ones that treat it as part of the work.

## Use a concrete example to find disagreement

Start with one user action and follow it to its observable result. For an export feature, ask which records are included, which permissions apply, how long the user may wait and what happens if the request is repeated. Two people can agree on the phrase “download a report” while imagining different data, timing and failure behavior. A small example exposes those differences before a detailed implementation hides them.

Write down the unresolved choices rather than forcing instant consensus. Some questions require user research, a security review or a prototype. Assign the next evidence-gathering step and decide which work can proceed safely while the answer is pending. Pre-work alignment is useful when it reduces uncertainty; it becomes a gate when it demands certainty that the team cannot yet obtain.

## Account for person-time honestly

A fictional 30-minute discussion with four participants consumes two person-hours. If it identifies an incompatible interface assumption that would otherwise require eight person-hours of rework, the scenario's net difference is six person-hours. The chart compares the two-hour discussion with the assumed eight-hour rework. The avoided rework is hypothetical and cannot be claimed as a measured saving merely because the meeting occurred.

The comparison is useful for examining the decision, not proving that every meeting pays back. A conversation with the wrong participants or no concrete example may consume time without resolving anything. An asynchronous exchange can sometimes produce the same evidence with less coordination cost. Choose the format based on the uncertainty and urgency, rather than requiring a meeting for every ticket.

## Produce a small implementation contract

At the end, capture the user problem, one accepted example, an important failure case, the scope boundary and the person who can resolve the remaining question. Put this information in the work item or linked design note where implementers and reviewers will find it. A recording of the meeting is not a substitute for a concise decision that can be searched and maintained.

For the export example, the contract might state that only authorized records from a defined snapshot are included, that large exports are asynchronous and that a repeated request returns the same job identity during a specified window. These are illustrative choices. The team should derive its actual contract from user needs and system constraints, then test it.

## Revisit the agreement when evidence changes

The initial conversation does not freeze the requirements forever. A prototype may reveal that the proposed interaction is confusing or that the data is more expensive to assemble than expected. Record the new observation and update the contract with the relevant participants. Silent divergence creates the same rework risk as an ambiguous starting point.

Review a completed item by comparing the delivered behavior with the agreed example and the later decisions. Ask which ambiguity was found early and which reached implementation. That gives the team evidence about where a pre-work conversation helps. The aim is a shorter path to a shared, testable understanding, not a larger meeting calendar or a promise that one conversation will prevent every misunderstanding.

## Sources and further reading

- [Architectural Decision Records · Motivation and definitions](https://adr.github.io/)
- [Schwaber and Sutherland · Scrum Guide](https://scrumguides.org/scrum-guide.html)
