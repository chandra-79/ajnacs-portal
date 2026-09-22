---
title: "The Meeting Before the Work Is the Most Important Meeting Nobody Counts"
description: "The alignment conversation that happens before engineering starts determines how much of the engineering work is useful. Teams that skip it pay for it in rework."
date: 2026-01-12
tags: ["Engineering Leadership"]
format: article
---

Engineers are measured on what they build. The conversation that happens before the building — clarifying requirements, aligning on approach, surfacing assumptions, agreeing on what done looks like — produces no measurable output. It does not show up in velocity. It does not ship features.

It also determines whether the feature that gets built is the right one.

## The cost of skipping alignment

The engineering team gets a ticket. The ticket describes a feature. The team builds the feature. Three weeks later, the product team looks at the result and says: "this is not quite what we had in mind."

What happened? The ticket contained the product manager's understanding of the requirement. The engineers built based on their interpretation of the ticket. The interpretations diverged. The implementations are different things.

The divergence is not a failure of the ticket. It is a failure to find the divergence before the work started. A 45-minute conversation at the beginning would have found it. Three weeks of engineering work found it instead.

## What the alignment conversation covers

A useful pre-work alignment conversation has a short but specific scope:

**What problem are we solving?** The ticket describes a feature. The conversation uncovers the problem the feature is supposed to address. This distinction matters because engineers who understand the problem often see solutions the product manager did not consider, and sometimes those solutions are faster or better.

**What does a successful outcome look like?** Specifically. Not "users can do X" but "users can do X within two clicks from the dashboard, and the operation completes in under one second." If the product manager and engineer have different specific pictures of what success looks like, the work will diverge.

**What are we explicitly not building?** Scope boundaries prevent scope creep and clarify the minimum viable implementation. An engineer who does not know where the scope ends tends to be conservative and build less, or generous and build more.

**What assumptions are we making?** Dependencies on other teams, data that is assumed to exist, user behavior that is assumed to be consistent — surface the assumptions so they can be validated or challenged.

## Why it does not happen enough

The meeting before the work has no artifact. It does not produce a ticket update or a design document unless someone makes that happen deliberately. It is easy to skip because the work can begin without it. It is easy to rationalize as unnecessary because most of the time, the misalignment is discovered eventually.

The most productive engineering teams are not the ones that skip this conversation to start faster. They are the ones that treat it as part of the work.
